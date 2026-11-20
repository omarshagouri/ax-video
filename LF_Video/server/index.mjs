// Long Form — independent Remotion chapter renderer.
// Native canvas: 1920x1080. This service never calls or modifies Shorts services.
import express from "express";
import fs from "fs";
import { randomUUID,createHash } from "node:crypto";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia, renderStill } from "@remotion/renderer";
import { GoogleAuth } from "google-auth-library";
import { uploadFinalAssemblyToGCS } from "./assembly_gcs.mjs";
import { prepareChapterSidecar, buildFinalSrt } from "./subtitles.mjs";
import { generateSegmentedChapter } from "./segmented_tts.mjs";
import { makeVisualTimingContext } from "./visual_timing_context.mjs";
import { parseRenderDelivery, assertRenderDeliveryReady, deliverRenderedMp4 } from "./render_delivery.mjs";
import { assertChapterTimelineMatchesAudio } from "./chapter_timing.mjs";
import { chooseSplitFrame, makeSilentPartManifest, makeAudioPartManifest, validatePairedJoin } from "./paired_chapter.mjs";
import { CLIP_ID, readLiveClipCatalog, selectClip, resolveExplicitClip, assertClipFitsBeat } from "./clip_catalog.mjs";
import { parseBuffer } from "music-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const API_KEY = process.env.LONGFORM_RENDER_API_KEY || "PLACEHOLDER_KEY";
const PORT = process.env.PORT || 8080;
const BASE = `http://127.0.0.1:${PORT}`;
const ASSETS = "/tmp/axlf-assets";
const WIDTH = 1920;
const HEIGHT = 1080;
fs.mkdirSync(ASSETS, { recursive: true });

const app = express();
app.use(express.json({ limit: "32mb" }));
app.use("/assets", express.static(ASSETS));

let serveUrlPromise = null;
const getServeUrl = () => {
  if (!serveUrlPromise) serveUrlPromise = bundle({ entryPoint: ENTRY });
  return serveUrlPromise;
};

let authClientPromise = null;
const getAuthClient = () => {
  if (!authClientPromise) {
    authClientPromise = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets.readonly"] }).getClient();
  }
  return authClientPromise;
};

async function driveDownload(fileId, destNoExt) {
  const client = await getAuthClient();
  const res = await client.request({
    url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    responseType: "arraybuffer",
  });
  const buf = Buffer.from(res.data);
  const ct = String(res.headers?.["content-type"] || "");
  const ext = ct.includes("png") ? ".png" : ct.includes("jpeg") || ct.includes("jpg") ? ".jpg"
    : ct.includes("mp4") || ct.includes("video") ? ".mp4" : ct.includes("mpeg") || ct.includes("audio") ? ".mp3" : "";
  const dest = destNoExt + ext;
  fs.writeFileSync(dest, buf);
  return { buf, name: path.basename(dest) };
}

async function durationSec(buf) {
  const meta = await parseBuffer(buf);
  const dur = Number(meta.format.duration);
  if (!Number.isFinite(dur) || dur <= 0) throw new Error("Narration audio duration is missing or invalid; cannot synchronize visuals");
  return dur;
}

function parseBeat(b, i, fps, cursor) {
  const durSec = Number(b.duration);
  if (!Number.isFinite(durSec) || durSec <= 0) {
    throw new Error(`beat ${i + 1}: duration must be a positive number of seconds`);
  }
  const durationFrames = Math.max(1, Math.round(durSec * fps));
  const beat = Number(b.beat) || i + 1;
  const id = String(b.card_id || b.visual_id || "").trim();
  if (id === "VC-LF-016") throw new Error("AX card VC-LF-016 was permanently retired and cannot be used.");
  const isCard = id.startsWith("VC-LF-");
  const isAnimation = id.startsWith("VA-LF-");
  const isClip = CLIP_ID.test(id) || /^VV-LF-\d{3,}\.mp4$/i.test(id);
  if (!isCard && !isAnimation && !isClip) {
    throw new Error(`beat ${beat}: unsupported visual ${id}; use a catalog Ready VC-LF, VA-LF or VV-LF entry`);
  }
  let props = {};
  const v = b.values;
  if (typeof v === "string") {
    try { props = JSON.parse(v || "{}"); }
    catch { throw new Error(`beat ${beat}: values is not valid JSON for ${id}`); }
  } else if (v && typeof v === "object") {
    props = v;
  }
  return {
    beat,
    track: isClip ? "clip" : (isAnimation ? "anim" : "card"),
    component: id,
    props,
    startFrame: cursor,
    durationFrames,
  };
}

function coalesce(timeline) {
  const out = [];
  for (const item of timeline) {
    const prev = out[out.length - 1];
    const same = prev && prev.track === item.track && prev.component === item.component &&
      JSON.stringify(prev.props || {}) === JSON.stringify(item.props || {}) &&
      prev.startFrame + prev.durationFrames === item.startFrame;
    if (same) prev.durationFrames += item.durationFrames;
    else out.push({ ...item });
  }
  return out;
}

async function buildChapter(video_id, fps, beats, audioIds) {
  const safe = (video_id || "chapter").replace(/[^A-Za-z0-9_-]/g, "");
  let timeline = [];
  const audio = [];
  let cursor = 0;
  let liveClips = null;
  for (let i = 0; i < beats.length; i++) {
    const item = parseBeat(beats[i], i, fps, cursor);

    if (item.track === "clip") {
      // Prefer the exact Drive File_ID copied from the catalog into Visual_Plan values.
      // If absent, look up the current LIVE Clips tab by Visual_id / Clip_name.
      let clip = resolveExplicitClip(item.component, item.props);
      if (!clip) {
        if (!liveClips) liveClips = await readLiveClipCatalog(await getAuthClient());
        clip = selectClip(liveClips, item.component);
      }
      const raw = await driveDownload(clip.fileId, path.join(ASSETS, `${safe}_clip_${item.beat}`));
      const actual = path.join(ASSETS, raw.name);
      const clipPath = actual.endsWith(".mp4") ? actual : actual + ".mp4";
      if (clipPath !== actual) fs.renameSync(actual, clipPath);
      const probe = spawnSync("ffprobe", ["-v","error","-show_entries","format=duration:stream=codec_type,width,height","-of","json",clipPath],{encoding:"utf8",maxBuffer:1024*1024});
      if (probe.status !== 0) throw new Error("ffprobe failed for catalog clip "+item.component);
      const media = JSON.parse(probe.stdout||"{}");
      const video = media.streams?.find(x=>x.codec_type==="video");
      if (!video || video.width < 1 || video.height < 1) throw new Error("Drive clip is not a valid MP4 video: "+item.component);
      assertClipFitsBeat({beatFrames:item.durationFrames,fps,mediaSeconds:Number(media.format?.duration),catalogSeconds:clip.duration,id:item.component});
      item.src = `${BASE}/assets/${path.basename(clipPath)}`;
      item.props = {fit:Math.abs(video.width/video.height - 16/9)<.015?"cover":"contain"};
    }

    // Optional per-animation background image from Drive.
    // Visual Plan may pass values.backgroundFileId and backgroundOpacity.
    if (item.track === "anim" && item.component !== "VA-LF-014" && item.props && item.props.backgroundFileId) {
      const bgId = String(item.props.backgroundFileId || "").trim();
      if (bgId) {
        const { name } = await driveDownload(bgId, path.join(ASSETS, `${safe}_bg_${item.beat}`));
        item.props = { ...item.props, backgroundSrc: `${BASE}/assets/${name}` };
      }
    }

    timeline.push(item);
    cursor += item.durationFrames;
  }
  // Do not merge equal adjacent beats: combining them bypasses per-asset caps.
  if (!timeline.some(x=>x.track==="clip") || !timeline.some(x=>x.track==="anim")) throw new Error("chapter requires at least one relevant VV-LF clip and one VA-LF animation");


  let acur = 0;
  for (let i = 0; i < (audioIds || []).length; i++) {
    const id = String(audioIds[i] || "").trim();
    if (!id) continue;
    const { buf, name } = await driveDownload(id, path.join(ASSETS, `${safe}_aud_${i + 1}`));
    const df = Math.max(1, Math.round((await durationSec(buf)) * fps));
    audio.push({ chapter: i + 1, src: `${BASE}/assets/${name}`, startFrame: acur, durationFrames: df });
    acur += df;
  }

  const timing = assertChapterTimelineMatchesAudio({ timeline, audio, fps });
  console.log(`Chapter timing validated: video=${video_id} visual=${timing.visual_seconds.toFixed(2)}s audio=${timing.audio_seconds.toFixed(2)}s`);
  return { video_id: video_id || "chapter", fps, width: WIDTH, height: HEIGHT, timeline, audio };
}

async function renderThumbnail({ background_base64, headline, subhead = "", series = "BATTERY INTELLIGENCE", logo_file_id = "", output_name = "thumbnail.png" }) {
  if (!background_base64) throw new Error("background_base64 is required");
  if (!headline) throw new Error("headline is required");

  const safe = String(output_name || "thumbnail.png").replace(/[^A-Za-z0-9._-]/g, "_");
  const bgName = `thumb_bg_${Date.now()}.png`;
  const bgPath = path.join(ASSETS, bgName);
  fs.writeFileSync(bgPath, Buffer.from(background_base64, "base64"));

  let logoSrc = "";
  const logoId = String(logo_file_id || "").trim();
  if (logoId) {
    const { name } = await driveDownload(logoId, path.join(ASSETS, `thumb_logo_${Date.now()}`));
    logoSrc = `${BASE}/assets/${name}`;
  }

  const serveUrl = await getServeUrl();
  const inputProps = {
    backgroundSrc: `${BASE}/assets/${bgName}`,
    logoSrc,
    series,
    headline,
    subhead,
  };
  const composition = await selectComposition({ serveUrl, id: "AXThumbnail", inputProps });
  const out = path.join("/tmp", safe.endsWith(".png") ? safe : `${safe}.png`);
  await renderStill({ composition, serveUrl, output: out, inputProps, imageFormat: "png" });

  const b64 = fs.readFileSync(out).toString("base64");
  fs.unlinkSync(out);
  try { fs.unlinkSync(bgPath); } catch {}
  return { filename: path.basename(out), file_base64: b64, width: 1280, height: 720 };
}

/** The request returns only after rendering AND private GCS upload have succeeded.
 * Log structured lifecycle events so a Make error can be correlated with Cloud Run.
 * Unique temp filenames prevent two concurrent requests from overwriting each other.
 */
async function renderManifest(manifest,{delivery="inline",jobId=randomUUID()}={}) {
  const mode=parseRenderDelivery(delivery);
  assertRenderDeliveryReady(mode);
  const safe=String(manifest.video_id||"chapter").replace(/[^A-Za-z0-9_-]/g,"");
  const filename=safe+".mp4";
  const out=path.join("/tmp",safe+"-"+jobId+".mp4");
  const log=(phase,extras={})=>console.log(JSON.stringify({event:"lf_render",job_id:jobId,video_id:safe,phase,delivery:mode,...extras}));
  log("preparing");
  try{
    const serveUrl=await getServeUrl();
    const inputProps={manifest};
    const composition=await selectComposition({serveUrl,id:"AXLongForm",inputProps});
    log("rendering",{total_frames:composition.durationInFrames});
    let lastQuarter=-1;
    await renderMedia({composition,serveUrl,codec:"h264",outputLocation:out,inputProps,
      onProgress:({progress})=>{
        const quarter=Math.floor(progress*4);
        if(quarter>lastQuarter){lastQuarter=quarter;log("render_progress",{percent:Math.min(100,quarter*25)});}
      },
    });
    log("uploading",{size_bytes:fs.statSync(out).size});
    const result=await deliverRenderedMp4({filePath:out,filename,videoId:safe,delivery:mode});
    log("completed",{size_bytes:result.size_bytes,storage_object:result.storage_object||null});
    return {job_id:jobId,phase:"completed",...result};
  }catch(error){
    log("failed",{message:String(error?.message||error).slice(0,500)});
    throw error;
  }finally{
    fs.rmSync(out,{force:true});
  }
}

async function assembleApprovedChapters(video_id, chapters, endClipId, thumbnailFileId = "", folderId = "") {
  const safe = String(video_id || "video").replace(/[^A-Za-z0-9_-]/g, "");
  const normalized = [...chapters].map((x, i) => ({
    chapter: Number(x?.chapter) || i + 1,
    file_id: String(x?.file_id || "").trim(),
    review_status: String(x?.review_status || "").trim(),
    subtitle_alignment_file_id: String(x?.subtitle_alignment_file_id || "").trim(),
  }));
  if (!normalized.length) throw new Error("need at least one approved chapter");
  const blocked = normalized.filter((x) => x.review_status !== "Approved");
  if (blocked.length) {
    throw new Error(`assembly blocked: every chapter must be Approved (blocked chapters: ${blocked.map((x) => x.chapter).join(", ")})`);
  }
  const missing = normalized.filter((x) => !x.file_id);
  if (missing.length) {
    throw new Error(`assembly blocked: missing chapter video file IDs (chapters: ${missing.map((x) => x.chapter).join(", ")})`);
  }
  const ordered = normalized.sort((a, b) => a.chapter - b.chapter);
  const chapterNums = ordered.map((x) => x.chapter);
  if (new Set(chapterNums).size !== chapterNums.length) {
    throw new Error("assembly blocked: duplicate chapter numbers found");
  }

  // Every narrative chapter must carry its measured ElevenLabs word timing.
  // One sidecar belongs to the full chapter, not independently to P1 and P2.
  const chaptersExpected = [...new Set(ordered.map(x => Math.floor(x.chapter)))];
  const subtitleFileIds = new Map();
  for (const item of ordered) {
    if (!item.subtitle_alignment_file_id) continue;
    const chapter = Math.floor(item.chapter);
    const previous = subtitleFileIds.get(chapter);
    if (previous && previous !== item.subtitle_alignment_file_id)
      throw new Error("Conflicting subtitle alignments for chapter " + chapter);
    subtitleFileIds.set(chapter, item.subtitle_alignment_file_id);
  }
  if (subtitleFileIds.size !== chaptersExpected.length)
    throw new Error("Missing chapter word-timing JSON; rerun/backfill LF Audio Agent for chapters: " +
      chaptersExpected.filter(n => !subtitleFileIds.has(n)).join(", "));
  const subtitleSidecars = new Map();
  for (const [chapter, fileId] of subtitleFileIds) {
    const { buf } = await driveDownload(fileId, path.join(ASSETS, safe + "_subtitle_ch" + chapter));
    let sidecar;
    try { sidecar = JSON.parse(buf.toString("utf8")); }
    catch { throw new Error("Word-timing JSON file is not valid for chapter " + chapter); }
    subtitleSidecars.set(chapter, sidecar);
  }
  const partDurations = [];
  const inputs = [];
  const thumbId = String(thumbnailFileId || "").trim();
  // A one-second 1920x1080 silent intro. We encode an AAC silence track so that
  // the following chapters' audio begins at t=1s during MP4 concatenation.
  if (thumbId) {
    const { name } = await driveDownload(thumbId, path.join(ASSETS, `${safe}_assembly_thumbnail`));
    const thumbPath = path.join(ASSETS, name);
    const introPath = path.join("/tmp", `${safe}_thumbnail_intro.mp4`);
    const intro = spawnSync("ffmpeg", [
      "-y", "-loop", "1", "-framerate", "30", "-i", thumbPath,
      "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
      "-t", "1", "-map", "0:v:0", "-map", "1:a:0",
      "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
      "-r", "30", "-c:v", "libx264", "-preset", "fast", "-crf", "18",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
      "-movflags", "+faststart", "-shortest", introPath
    ], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
    if (intro.status !== 0 || !fs.existsSync(introPath)) {
      throw new Error(`thumbnail intro generation failed: ${intro.stderr || intro.stdout || "unknown error"}`);
    }
    inputs.push(introPath);
  }
  for (let i = 0; i < ordered.length; i++) {
    const { name } = await driveDownload(
      ordered[i].file_id,
      path.join(ASSETS, `${safe}_assembly_ch_${String(ordered[i].chapter).padStart(2, "0")}_${i + 1}`)
    );
    const filename = path.join(ASSETS, name);
    inputs.push(filename);
    const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries",
      "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filename],
      { encoding: "utf8", maxBuffer: 1024 * 1024 });
    const seconds = Number(String(probe.stdout || "").trim());
    if (probe.status !== 0 || !Number.isFinite(seconds) || seconds <= 0)
      throw new Error("Cannot determine rendered part duration for chapter " + ordered[i].chapter);
    partDurations.push({chapter:ordered[i].chapter,duration:seconds});
  }
  const finalSubtitles = buildFinalSrt({video_id,parts:partDurations,
    sidecars:subtitleSidecars,thumbnail_intro_seconds:thumbId?1:0});
  const srtFilename = safe + "_FINAL.srt";

  const endId = String(endClipId || "").trim();
  if (endId) {
    const { name } = await driveDownload(endId, path.join(ASSETS, `${safe}_assembly_endclip`));
    inputs.push(path.join(ASSETS, name));
  }

  const listPath = path.join("/tmp", `${safe}_concat.txt`);
  const out = path.join("/tmp", `${safe}_FINAL.mp4`);
  const listBody = inputs
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join("\n");
  fs.writeFileSync(listPath, listBody);

  let ff = spawnSync("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0", "-i", listPath,
    "-c", "copy", "-movflags", "+faststart", out
  ], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });

  if (ff.status !== 0 || !fs.existsSync(out)) {
    ff = spawnSync("ffmpeg", [
      "-y", "-f", "concat", "-safe", "0", "-i", listPath,
      "-c:v", "libx264", "-preset", "fast", "-crf", "18",
      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out
    ], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  }

  try { fs.unlinkSync(listPath); } catch {}
  if (ff.status !== 0 || !fs.existsSync(out)) {
    throw new Error(`ffmpeg assembly failed: ${ff.stderr || ff.stdout || "unknown error"}`);
  }

  try {
    const uploaded = await uploadFinalAssemblyToGCS(out, `${safe}_FINAL.mp4`, video_id);
    return {
      ...uploaded,
      chapter_count: ordered.length,
      end_clip_included: Boolean(endId),
      thumbnail_intro_included: Boolean(thumbId),
      thumbnail_intro_seconds: thumbId ? 1 : 0,
      srt_filename: srtFilename,
      srt_base64: Buffer.from(finalSubtitles.text, "utf8").toString("base64"),
      subtitle_caption_count: finalSubtitles.caption_count,
      subtitle_chapter_count: finalSubtitles.chapter_count,
    };
  } finally {
    try { fs.unlinkSync(out); } catch {}
  }
}

const ok = (req) => req.headers["x-api-key"] === API_KEY;

app.get("/", (_req, res) => res.json({ status: "ok", service: "ax-longform-video", width: WIDTH, height: HEIGHT, fps: 30 }));

app.post("/render-video", async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  const manifest = req.body?.manifest ?? req.body;
  if (!manifest || !Array.isArray(manifest.timeline)) return res.status(400).json({ error: "need manifest.timeline[]" });
  manifest.width = WIDTH;
  manifest.height = HEIGHT;
  const jobId=randomUUID();
  try {
    const delivery=parseRenderDelivery(req.body?.delivery ?? manifest.delivery);
    assertRenderDeliveryReady(delivery);
    return res.json({status:"ok",...(await renderManifest(manifest,{delivery,jobId}))});
  }catch(e){
    console.error("render-video failed",jobId,e?.message);
    return res.status(e?.statusCode||500).json({status:"error",phase:"failed",job_id:jobId,error:String(e?.message||e)});
  }
});

app.post(["/build-and-render", "/render-chapter"], async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  const { video_id, fps = 30, beats, audio_file_ids = [], delivery: requestedDelivery } = req.body || {};
  const jobId=randomUUID();
  if (!Array.isArray(beats) || beats.length === 0) return res.status(400).json({ error: "need non-empty beats[]" });
  try {
    const delivery=parseRenderDelivery(requestedDelivery);
    assertRenderDeliveryReady(delivery);
    const F = Number(fps) || 30;
    const manifest = await buildChapter(video_id, F, beats, audio_file_ids);
    return res.json({
      status: "ok",
      visual_beats: manifest.timeline.length,
      card_beats: manifest.timeline.filter((x) => x.track === "card").length,
      animation_beats: manifest.timeline.filter((x) => x.track === "anim").length,
      audio_tracks: manifest.audio.length,
      ...(await renderManifest(manifest,{delivery,jobId})),
    });
  } catch (e) { console.error("render-chapter failed",jobId,e?.message); return res.status(e?.statusCode||500).json({status:"error",phase:"failed",job_id:jobId,error:String(e?.message||e)}); }
});

// Paired narrative chapters: never split speech or insert artificial chapter opens.
app.post("/render-chapter-part", async(req,res)=>{
  if(!ok(req))return res.status(401).json({error:"bad api key"});
  const {video_id,part,fps=30,beats,audio_file_ids=[],audio_mode="silent",delivery:requestedDelivery}=req.body||{};
  const jobId=randomUUID();
  if(!/^[A-Za-z0-9_-]{3,90}$/.test(String(video_id||""))||![1,2].includes(part)||Number(fps)!==30||!Array.isArray(beats)||beats.length<2||!Array.isArray(audio_file_ids)||audio_file_ids.length!==1||!/^[A-Za-z0-9_-]{12,}$/.test(String(audio_file_ids[0]||""))||!["silent","segment"].includes(audio_mode))return res.status(400).json({error:"invalid paired render request"});
  try{
    const delivery=parseRenderDelivery(requestedDelivery);
    assertRenderDeliveryReady(delivery);
    const full=await buildChapter(video_id,30,beats,audio_file_ids);
    if(full.timeline.filter(x=>x.track==="clip").length!==2)throw new Error("each coherent narrative chapter must have exactly two catalog footage clips");
    const split=chooseSplitFrame(full.timeline,{requireClipPerPart:true});
    const output=audio_mode==="segment"?makeAudioPartManifest(full,part,split):makeSilentPartManifest(full,part,split);
    return res.json({status:"ok",video_id,part,audio_mode,split_frame:split.splitFrame,total_frames:split.totalFrames,part_frames:part===1?split.part1Frames:split.part2Frames,...(await renderManifest(output,{delivery,jobId}))});
  }catch(e){console.error("paired render error",jobId,e?.message);return res.status(e?.statusCode||422).json({status:"error",phase:"failed",job_id:jobId,video_id,part,error:String(e?.message||e)});}
});
function probePairedPart(file){
  const p=spawnSync("ffprobe",["-v","error","-count_frames","-select_streams","v:0","-show_entries","stream=nb_read_frames,r_frame_rate,width,height,codec_name","-of","json",file],{encoding:"utf8",maxBuffer:1024*1024});
  if(p.status!==0)throw new Error("ffprobe failed on chapter part");
  const v=JSON.parse(p.stdout||"{}").streams?.[0]||{};
  const frames=Number(v.nb_read_frames);
  if(!Number.isInteger(frames)||frames<1||v.width!==1920||v.height!==1080||v.codec_name!=="h264"||v.r_frame_rate!=="30/1")throw new Error("invalid 1080p 30fps H264 part");
  return frames;
}
app.post("/join-chapter",async(req,res)=>{
 if(!ok(req))return res.status(401).json({error:"bad api key"});
 const {video_id,part1_file_id,part2_file_id,audio_file_id,split_frame,total_frames,delivery:requestedDelivery}=req.body||{};
 const jobId=randomUUID();
 if(!/^[A-Za-z0-9_-]{3,90}$/.test(String(video_id||""))||![part1_file_id,part2_file_id,audio_file_id].every(x=>/^[A-Za-z0-9_-]{12,}$/.test(String(x||"")))||!Number.isInteger(split_frame)||!Number.isInteger(total_frames))return res.status(400).json({error:"invalid paired join request"});
 const safe=String(video_id).replace(/[^A-Za-z0-9_-]/g,"");
 let delivery;
 try{delivery=parseRenderDelivery(requestedDelivery);assertRenderDeliveryReady(delivery);}
 catch(e){return res.status(e?.statusCode||422).json({status:"error",phase:"failed",job_id:jobId,error:String(e?.message||e)});}
 const work=fs.mkdtempSync(path.join("/tmp","axlf-paired-"+safe+"-"));
 try{
  const [a,b,c]=await Promise.all([driveDownload(part1_file_id,path.join(work,"part1")),driveDownload(part2_file_id,path.join(work,"part2")),driveDownload(audio_file_id,path.join(work,"audio"))]);
  const aPath=path.join(work,a.name),bPath=path.join(work,b.name);
  const frames1=probePairedPart(aPath),frames2=probePairedPart(bPath);
  const check=validatePairedJoin({part1Frames:frames1,part2Frames:frames2,splitFrame:split_frame,totalFrames:total_frames,audioDurationSec:await durationSec(c.buf)});
  const list=path.join(work,"list.txt");
  fs.writeFileSync(list,[aPath,bPath].map(f=>"file '"+f.replaceAll("'","'\\''")+"'").join("\n")+"\n");
  const silent=path.join(work,"silent.mp4");
  const cat=spawnSync("ffmpeg",["-v","error","-y","-f","concat","-safe","0","-i",list,"-map","0:v:0","-c:v","copy",silent],{encoding:"utf8",maxBuffer:1048576});
  if(cat.status!==0)throw new Error("silent concat failed");
  if(probePairedPart(silent)!==total_frames)throw new Error("concat frame count mismatch");
  const out=path.join(work,safe+".mp4");
  const mux=spawnSync("ffmpeg",["-v","error","-y","-i",silent,"-i",path.join(work,c.name),"-map","0:v:0","-map","1:a:0","-c:v","copy","-c:a","aac","-b:a","192k","-af","apad=whole_dur="+check.duration_seconds,"-t",String(check.duration_seconds),"-movflags","+faststart",out],{encoding:"utf8",maxBuffer:1048576});
  if(mux.status!==0)throw new Error("chapter audio mux failed");
  if(probePairedPart(out)!==total_frames||fs.statSync(out).size<10000)throw new Error("invalid joined chapter");
  const file=await deliverRenderedMp4({filePath:out,filename:safe+".mp4",videoId:safe,delivery});
  return res.json({status:"ok",phase:"completed",job_id:jobId,frames:total_frames,duration_seconds:check.duration_seconds,...file});
 }catch(e){console.error("paired join error",jobId,e?.message);return res.status(e?.statusCode||422).json({status:"error",phase:"failed",job_id:jobId,error:String(e?.message||e)});}
 finally{fs.rmSync(work,{recursive:true,force:true});}
});

// Small, authenticated duration probe for the Visual Plan Agent. It returns
// no audio bytes, so Make can map the measured duration before calling Claude.
app.post("/probe-audio", async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  const fileId = String(req.body?.audio_file_id || "").trim();
  if (!fileId || !/^[A-Za-z0-9_-]{12,}$/.test(fileId)) {
    return res.status(400).json({ error: "audio_file_id must be a Google Drive file ID" });
  }
  try {
    const { buf, name } = await driveDownload(fileId, path.join(ASSETS, `probe_${Date.now()}`));
    let duration;
    try { duration = await durationSec(buf); }
    finally { try { fs.unlinkSync(path.join(ASSETS, name)); } catch {} }
    return res.json({ status: "ok", audio_file_id: fileId, duration_seconds: Math.round(duration * 1000) / 1000 });
  } catch (e) {
    console.error("Audio duration probe failed:", e?.message || e);
    return res.status(422).json({ error: String(e?.message || e) });
  }
});

app.post("/thumbnail", async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  try {
    return res.json({ status: "ok", ...(await renderThumbnail(req.body || {})) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.stack || e) });
  }
});


// Isolated visual preview. The branded image is kept outside the public repository.
// Standalone slot preview. The dashboard PNG is bundled into the Remotion build.
app.post("/render-dashboard", async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  const {
    title, subtitle = "", mainValue = "", mainUnit = "",
    progress, detail = "", status = "", duration_sec = 6,
  } = req.body || {};
  const fields = [[title, 22, true], [subtitle, 36], [mainValue, 12],
    [mainUnit, 10], [detail, 38], [status, 24]];
  if (fields.some(([v, max, required]) =>
    typeof v !== "string" || v.length > max || (required && !v.trim()))) {
    return res.status(400).json({ error: "invalid text slot (type, required title or length)" });
  }
  if (progress !== undefined && (typeof progress !== "number" || !Number.isFinite(progress))) {
    return res.status(400).json({ error: "progress must be a number from 0 to 100" });
  }
  const frames = Math.round(Number(duration_sec) * 30);
  if (!Number.isFinite(frames) || frames < 90 || frames > 450) {
    return res.status(400).json({ error: "duration_sec must be from 3 to 15 seconds" });
  }
  const job = randomUUID();
  const outPath = path.join("/tmp", "dashboard-" + job + ".mp4");
  try {
    // Intentionally use the bundled PNG. Legacy background_file_id fields are ignored.
    const normalizedProgress = progress === undefined ? undefined : Math.max(0, Math.min(100, progress));
    const inputProps = { title, subtitle, mainValue, mainUnit, progress: normalizedProgress,
      detail, status, __holdFrames: frames };
    const serveUrl = await getServeUrl();
    const comp = await selectComposition({ serveUrl, id: "AXDashboardPreview", inputProps });
    await renderMedia({ composition: comp, serveUrl, codec: "h264",
      outputLocation: outPath, inputProps });
    const encoded = fs.readFileSync(outPath).toString("base64");
    return res.json({ status: "ok", template_id: "VA-LF-014",
      filename: "dashboard-preview.mp4", file_base64: encoded,
      duration_frames: frames, fps: 30, width: WIDTH, height: HEIGHT });
  } catch (e) {
    console.error("Dashboard preview failed:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  } finally {
    try { fs.unlinkSync(outPath); } catch {}
  }
});

// Visual planning receives actual sentence timestamps from uploaded WordTimings JSON.
app.post("/visual/timing-context",async(req,res)=>{
  if(!ok(req))return res.status(401).json({error:"bad api key"});
  try{
    const {video_id,chapter,narration,subtitle_alignment_file_id}=req.body||{};
    const id=String(subtitle_alignment_file_id||"").trim();
    if(!/^[a-zA-Z0-9_-]{15,256}$/.test(id))return res.status(400).json({error:"Valid chapter WordTimings Drive file ID is required"});
    const {buf}=await driveDownload(id,path.join(ASSETS,"visual_timing_"+randomUUID()));
    if(buf.length>1000000)throw Error("Word-timing sidecar exceeds 1 MB");
    const sidecar=JSON.parse(buf.toString("utf8"));
    return res.json({status:"ok",...makeVisualTimingContext({sidecar,video_id,chapter,narration})});
  }catch(error){return res.status(422).json({status:"error",error:String(error?.message||error)});}
});

// One approved chapter narration -> short TTS generations -> one stitched MP3 and
// measured word timing JSON. Protects the original Make one-MP3-per-chapter contract.
app.post("/audio/generate-chapter",async(req,res)=>{
  if(!ok(req))return res.status(401).json({error:"bad api key"});
  try{
    const {text,video_id,chapter,voice_id,model_id,voice_settings}=req.body||{};
    const generated=await generateSegmentedChapter({text,video_id,chapter,voice_id,
      model_id,voice_settings,apiKey:String(req.headers["xi-api-key"]||"")});
    return res.json(generated);
  }catch(error){
    console.error("segmented LF audio failed:",String(error?.message||error));
    return res.status(422).json({status:"error",error:String(error?.message||error)});
  }
});

// Prepare compact timing JSON for Drive; never store or echo the MP3 base64.
app.post("/subtitle/prepare-chapter", (req,res) => {
  if (!ok(req)) return res.status(401).json({error:"bad api key"});
  try {
    const { video_id, chapter, narration, audio_file_id, elevenlabs_response, prepared_sidecar_base64 } = req.body || {};
    let sidecar;
    if (prepared_sidecar_base64) {
      if(typeof prepared_sidecar_base64!=="string"||prepared_sidecar_base64.length>2000000)
        throw Error("Prepared subtitle timing is invalid or too large");
      try { sidecar=JSON.parse(Buffer.from(prepared_sidecar_base64,"base64").toString("utf8")); }
      catch {throw Error("Prepared word timings JSON cannot be decoded");}
      if(sidecar?.schema!=="ax.lf.word-timing.v1" || sidecar.video_id!==video_id ||
        sidecar.chapter!==Number(chapter) || !Array.isArray(sidecar.words) || !sidecar.words.length)
        throw Error("Prepared timestamps do not match video and chapter");
      const expected=createHash("sha256").update(String(narration||"").replace(/\s+/g," ").trim()).digest("hex");
      if(sidecar.narration_sha256!==expected)throw Error("Prepared timestamp narration does not match approved narration");
      sidecar.audio_file_id=String(audio_file_id||"").trim();
      if(!sidecar.audio_file_id)throw Error("Uploaded MP3 Drive file ID required");
    }else{
      if (!elevenlabs_response || typeof elevenlabs_response !== "object")
        return res.status(400).json({error:"ElevenLabs raw response is required"});
      sidecar=prepareChapterSidecar({video_id,chapter,narration,tts:elevenlabs_response,audio_file_id});
    }
    const filename = String(video_id).replace(/[^A-Za-z0-9_-]/g,"") +
      "_CH" + String(sidecar.chapter).padStart(2,"0") + "_WordTimings.json";
    return res.json({status:"ok",sidecar_filename:filename,
      sidecar_base64:Buffer.from(JSON.stringify(sidecar),"utf8").toString("base64"),
      word_count:sidecar.words.length,duration_seconds:sidecar.duration_seconds});
  } catch(error) { return res.status(422).json({status:"error",error:String(error?.message||error)}); }
});

app.post("/assemble-video", async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  const { video_id, chapters = [], end_clip_file_id = "", thumbnail_file_id = "", folder_id = "" } = req.body || {};
  if (!Array.isArray(chapters) || chapters.length === 0) {
    return res.status(400).json({ error: "need non-empty chapters[]" });
  }
  if (!String(folder_id).trim()) return res.status(400).json({ error: "folder_id is required" });
  // Prevent unnecessary chapter downloads when the dedicated staging bucket is absent.
  if (!process.env.AXLF_ASSEMBLY_GCS_BUCKET) {
    return res.status(503).json({ error: "AXLF_ASSEMBLY_GCS_BUCKET is not configured" });
  }
  try {
    return res.json({
      status: "ok",
      ...(await assembleApprovedChapters(video_id, chapters, end_clip_file_id, thumbnail_file_id, folder_id)),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.stack || e) });
  }
});

app.listen(PORT, () => console.log(`ax-longform-video listening on ${PORT}`));