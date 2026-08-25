// AmpCoreX assembly + render service (Cloud Run). ONE pass produces the finished
// video: intro thumbnail still -> card beats + narration -> end clip (own audio).
//   POST /render-video     {manifest}
//   POST /build-and-render {video_id, fps, beats[], audio_file_ids[], thumbnail_id, end_clip_id}
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
const INTRO_SEC = Number(process.env.INTRO_SEC || 1.0); // silent thumbnail still
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

function parseBeat(b, i, fps, cursor) {
  const durSec = parseFloat(String(b.duration)) || 3;
  const durationFrames = Math.max(1, Math.round(durSec * fps));
  let props = {};
  const v = b.values;
  if (typeof v === "string") { try { props = JSON.parse(v || "{}"); } catch { props = {}; } }
  else if (v && typeof v === "object") { props = v; }
  return { beat: Number(b.beat) || i + 1, track: "card", component: String(b.card_id || "").trim(), props, startFrame: cursor, durationFrames };
}

async function assemble(video_id, fps, beats, audioIds, thumbId, endClipId) {
  const safe = (video_id || "v").replace(/[^A-Za-z0-9_-]/g, "");
  const INTRO = Math.max(0, Math.round(INTRO_SEC * fps));
  const timeline = [];
  const audio = [];

  // intro thumbnail still (silent)
  if (thumbId) {
    const { name } = await driveDownload(thumbId, path.join(ASSETS, `${safe}_intro`));
    timeline.push({ beat: 0, track: "image", src: `${BASE}/assets/${name}`, startFrame: 0, durationFrames: INTRO, props: {} });
  }

  // card beats (offset by the intro)
  let cursor = INTRO;
  beats.forEach((b, i) => { const item = parseBeat(b, i, fps, cursor); timeline.push(item); cursor += item.durationFrames; });
  const cardsEnd = cursor;

  // narration: chapter mp3s, gapless, starting when cards start
  let acur = INTRO;
  for (let i = 0; i < (audioIds || []).length; i++) {
    const id = String(audioIds[i] || "").trim();
    if (!id) continue;
    const { buf, name } = await driveDownload(id, path.join(ASSETS, `${safe}_aud_${i + 1}`));
    const df = Math.max(1, Math.round((await durationSec(buf)) * fps));
    audio.push({ chapter: i + 1, src: `${BASE}/assets/${name}`, startFrame: acur, durationFrames: df });
    acur += df;
  }

  // outro end clip (keeps its own audio), after the cards
  if (endClipId) {
    const { buf, name } = await driveDownload(endClipId, path.join(ASSETS, `${safe}_outro`));
    const df = Math.max(1, Math.round((await durationSec(buf)) * fps)) || fps * 3;
    timeline.push({ beat: 9999, track: "clip", src: `${BASE}/assets/${name}`, startFrame: cardsEnd, durationFrames: df, props: {} });
  }

  return { video_id: video_id || "video", fps, width: 1080, height: 1920, timeline, audio, captions: [] };
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
  const { video_id, fps = 30, beats, audio_file_ids = [], thumbnail_id = "", end_clip_id = "" } = req.body || {};
  if (!Array.isArray(beats) || beats.length === 0) return res.status(400).json({ error: "need non-empty beats[]" });
  try {
    const F = Number(fps) || 30;
    const manifest = await assemble(video_id, F, beats, audio_file_ids, String(thumbnail_id).trim(), String(end_clip_id).trim());
    const out = await renderManifest(manifest);
    return res.json({
      status: "ok",
      beats: manifest.timeline.filter((t) => t.track === "card").length,
      audio_tracks: manifest.audio.length,
      has_intro: manifest.timeline.some((t) => t.track === "image"),
      has_outro: manifest.timeline.some((t) => t.track === "clip"),
      ...out,
    });
  } catch (e) { console.error(e); return res.status(500).json({ error: String(e?.stack || e) }); }
});

app.listen(PORT, () => console.log(`ax-video-render listening on ${PORT}`));
