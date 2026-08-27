// AmpCoreX assembly + render service (Cloud Run). ONE pass produces the finished
// video: Hook card + card beats + narration -> end clip (own audio). No intro still.
//   POST /render-video     {manifest}
//   POST /build-and-render {video_id, fps, beats[], audio_file_ids[], end_clip_id}
// Drive reads use the Cloud Run service account (read-only ADC), like ax-render.
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { GoogleAuth } from "google-auth-library";
import { parseBuffer } from "music-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const RENDER_API_KEY = process.env.RENDER_API_KEY || "PLACEHOLDER_KEY";
const PORT = process.env.PORT || 8080;
const BASE = `http://127.0.0.1:${PORT}`;
const ASSETS = "/tmp/axassets";
fs.mkdirSync(ASSETS, { recursive: true });

const app = express();
app.use(express.json({ limit: "16mb" }));
app.use("/assets", express.static(ASSETS));

let serveUrlPromise = null;
const getServeUrl = () => {
  if (!serveUrlPromise) serveUrlPromise = bundle({ entryPoint: ENTRY });
  return serveUrlPromise;
};

// ---- Drive read-only via ADC (Cloud Run service account) ----
let authClientPromise = null;
const getAuthClient = () => {
  if (!authClientPromise) {
    authClientPromise = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    }).getClient();
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
  try { return (await parseBuffer(buf)).format.duration || 0; } catch { return 0; }
}

// VV- = B-roll clip, VA- = animation. Both are non-card assets that need a real
// video FILE. The beat can carry one as clip_url / values.CLIP_URL / values.SRC.
const CLIP_RE = /^V[VA]-/i;

// --- clips folder resolution (same convention as ax-render) ---
// Every mid-roll B-roll clip is a .mp4 in the clips Drive folder, named by its id
// (exact "VV-SF-016.mp4" preferred, else any .mp4 whose name CONTAINS the id).
const CLIPS_FOLDER_ID = process.env.CLIPS_FOLDER_ID || "1ygVMe7TpyR8zFugivTvY6Lrkthah3owo";
let _clipsIndex = null; // { NAME.MP4(upper): fileId }
async function buildClipsIndex() {
  const client = await getAuthClient();
  const index = {};
  let pageToken;
  do {
    const res = await client.request({
      url: "https://www.googleapis.com/drive/v3/files",
      params: {
        q: `'${CLIPS_FOLDER_ID}' in parents and trashed = false`,
        fields: "nextPageToken, files(id,name)",
        pageSize: 1000, pageToken,
        supportsAllDrives: true, includeItemsFromAllDrives: true,
      },
    });
    for (const f of res.data.files || []) {
      if (String(f.name).toLowerCase().endsWith(".mp4")) index[String(f.name).toUpperCase()] = f.id;
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return index;
}
async function resolveClipFileId(clipId) {
  const cid = String(clipId).toUpperCase();
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!_clipsIndex || attempt === 1) _clipsIndex = await buildClipsIndex();
    if (_clipsIndex[cid + ".MP4"]) return _clipsIndex[cid + ".MP4"];
    for (const [name, fid] of Object.entries(_clipsIndex)) {
      if (name.includes(cid)) return fid;
    }
  }
  return null; // no match -> caller holds the previous card
}

function parseBeat(b, i, fps, cursor) {
  const durSec = parseFloat(String(b.duration)) || 3;
  const durationFrames = Math.max(1, Math.round(durSec * fps));
  const beat = Number(b.beat) || i + 1;
  const id = String(b.card_id || "").trim();
  let props = {};
  const v = b.values;
  if (typeof v === "string") { try { props = JSON.parse(v || "{}"); } catch { props = {}; } }
  else if (v && typeof v === "object") { props = v; }
  return { beat, track: "card", component: id, props, startFrame: cursor, durationFrames };
}

// Merge consecutive beats that are the SAME render (same track/component/src/props
// AND truly adjacent) into one span. This is the fix for a held card re-playing its
// intro on every beat: one mount, one continuous clock -> intro once, then hold.
function coalesce(timeline) {
  const out = [];
  for (const item of timeline) {
    const prev = out[out.length - 1];
    const same =
      prev &&
      prev.track === item.track &&
      prev.component === item.component &&
      (prev.src || "") === (item.src || "") &&
      JSON.stringify(prev.props || {}) === JSON.stringify(item.props || {}) &&
      prev.startFrame + prev.durationFrames === item.startFrame;
    if (same) prev.durationFrames += item.durationFrames;
    else out.push({ ...item });
  }
  return out;
}

async function assemble(video_id, fps, beats, audioIds, endClipId) {
  const safe = (video_id || "v").replace(/[^A-Za-z0-9_-]/g, "");
  let timeline = [];
  const audio = [];

  // The video's first frame IS the Hook card (beat 1). The Agent-5 thumbnail is a
  // separate poster used at publish time, NOT prepended here.
  // Build the beat timeline. Card beats parse directly; VV-/VA- clip beats resolve
  // a real .mp4 from the clips folder by id (download + serve). If no clip file is
  // found, HOLD the previous card across the beat instead of rendering blank.
  let cursor = 0;
  let resolvedClips = 0;
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const id = String(b.card_id || "").trim();
    const durSec = parseFloat(String(b.duration)) || 3;
    const durationFrames = Math.max(1, Math.round(durSec * fps));
    const beatNo = Number(b.beat) || i + 1;

    if (CLIP_RE.test(id)) {
      let props = {};
      const v = b.values;
      if (typeof v === "string") { try { props = JSON.parse(v || "{}"); } catch { props = {}; } }
      else if (v && typeof v === "object") { props = v; }
      // explicit src on the beat wins; otherwise resolve by clip id from the folder
      let src = b.clip_url || props.CLIP_URL || props.SRC || props.src || "";
      if (!src) {
        const fid = await resolveClipFileId(id); // returns null on no match
        if (fid) {
          const { name } = await driveDownload(fid, path.join(ASSETS, `${safe}_clip_${beatNo}`));
          src = `${BASE}/assets/${name}`;
        }
      }
      if (!src) {
        // FAIL LOUD: a clip beat with no resolvable file is an error, not a silent hold.
        throw new Error(`beat ${beatNo}: clip "${id}" has no .mp4 in clips folder ${CLIPS_FOLDER_ID} (and no clip_url/CLIP_URL on the beat)`);
      }
      timeline.push({ beat: beatNo, track: "clip", src, muted: true, props: {}, startFrame: cursor, durationFrames });
      cursor += durationFrames; resolvedClips++;
      continue; // a clip is not a "previous card" to hold
    }

    const item = parseBeat(b, i, fps, cursor);
    timeline.push(item);
    cursor += item.durationFrames;
  }
  const cardsEnd = cursor;

  // Merge held/repeated identical beats so a card mounts once (no re-fade).
  const rawBeatCount = timeline.length;
  timeline = coalesce(timeline);
  const mergedBeatCount = timeline.length;

  // narration: chapter mp3s, gapless, under the cards from frame 0
  let acur = 0;
  for (let i = 0; i < (audioIds || []).length; i++) {
    const id = String(audioIds[i] || "").trim();
    if (!id) continue;
    const { buf, name } = await driveDownload(id, path.join(ASSETS, `${safe}_aud_${i + 1}`));
    const df = Math.max(1, Math.round((await durationSec(buf)) * fps));
    audio.push({ chapter: i + 1, src: `${BASE}/assets/${name}`, startFrame: acur, durationFrames: df });
    acur += df;
  }

  // outro end clip (keeps its own audio), appended after the cards
  if (endClipId) {
    const { buf, name } = await driveDownload(endClipId, path.join(ASSETS, `${safe}_outro`));
    const df = Math.max(1, Math.round((await durationSec(buf)) * fps)) || fps * 3;
    timeline.push({ beat: 9999, track: "clip", src: `${BASE}/assets/${name}`, startFrame: cardsEnd, durationFrames: df, props: {}, muted: false });
  }

  return { video_id: video_id || "video", fps, width: 1080, height: 1920, timeline, audio, captions: [], _rawBeats: rawBeatCount, _mergedBeats: mergedBeatCount, _resolvedClips: resolvedClips };
}

async function renderManifest(manifest) {
  const serveUrl = await getServeUrl();
  const out = path.join("/tmp", `${manifest.video_id || "video"}_FINAL.mp4`);
  const composition = await selectComposition({ serveUrl, id: "AmpCoreX", inputProps: { manifest } });
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, inputProps: { manifest } });
  const b64 = fs.readFileSync(out).toString("base64");
  fs.unlinkSync(out);
  return { filename: `${manifest.video_id || "video"}_FINAL.mp4`, file_base64: b64 };
}

const ok = (req) => req.headers["x-api-key"] === RENDER_API_KEY;

app.get("/", (_req, res) => res.json({ status: "ok", service: "ax-video-render" }));

app.post("/render-video", async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  const manifest = req.body?.manifest ?? req.body;
  if (!manifest || !Array.isArray(manifest.timeline)) return res.status(400).json({ error: "need manifest.timeline[]" });
  try { return res.json({ status: "ok", ...(await renderManifest(manifest)) }); }
  catch (e) { console.error(e); return res.status(500).json({ error: String(e?.stack || e) }); }
});

app.post("/build-and-render", async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  const { video_id, fps = 30, beats, audio_file_ids = [], end_clip_id = "" } = req.body || {};
  if (!Array.isArray(beats) || beats.length === 0) return res.status(400).json({ error: "need non-empty beats[]" });
  try {
    const F = Number(fps) || 30;
    const manifest = await assemble(video_id, F, beats, audio_file_ids, String(end_clip_id).trim());
    const out = await renderManifest(manifest);
    return res.json({
      status: "ok",
      raw_beats: manifest._rawBeats,          // beats received
      merged_beats: manifest._mergedBeats,    // after coalescing repeats (should be <=)
      resolved_clips: manifest._resolvedClips,
      card_beats: manifest.timeline.filter((t) => t.track === "card").length,
      audio_tracks: manifest.audio.length,
      has_outro: manifest.timeline.some((t) => t.track === "clip"),
      ...out,
    });
  } catch (e) { console.error(e); return res.status(500).json({ error: String(e?.stack || e) }); }
});

app.listen(PORT, () => console.log(`ax-video-render listening on ${PORT}`));
