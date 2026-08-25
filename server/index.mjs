// AmpCoreX render service (Cloud Run).
//   POST /render-video     {manifest}
//   POST /build-and-render {video_id, fps, beats[], audio_file_ids?[]}
// audio_file_ids are Drive file IDs (chapter order). The service downloads them
// with the Cloud Run service account (same read-only ADC the old ax-render used),
// measures each clip, lays them gapless under the video, and Remotion muxes them.
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
const AUDIO_DIR = "/tmp/axaudio";
fs.mkdirSync(AUDIO_DIR, { recursive: true });

const app = express();
app.use(express.json({ limit: "16mb" }));
app.use("/audio", express.static(AUDIO_DIR));

let serveUrlPromise = null;
const getServeUrl = () => {
  if (!serveUrlPromise) serveUrlPromise = bundle({ entryPoint: ENTRY });
  return serveUrlPromise;
};

// ---- Drive read-only via ADC (Cloud Run service account) ----
let authClientPromise = null;
const getAuthClient = () => {
  if (!authClientPromise) {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    authClientPromise = auth.getClient();
  }
  return authClientPromise;
};

async function downloadDriveFile(fileId, destPath) {
  const client = await getAuthClient();
  const res = await client.request({
    url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    responseType: "arraybuffer",
  });
  const buf = Buffer.from(res.data);
  fs.writeFileSync(destPath, buf);
  return buf;
}

async function audioDurationSec(buf) {
  try {
    const meta = await parseBuffer(buf, "audio/mpeg");
    return meta.format.duration || 0;
  } catch {
    return 0;
  }
}

function beatsToTimeline(fps, beats) {
  let cursor = 0;
  const timeline = beats.map((b, i) => {
    const durSec = parseFloat(String(b.duration)) || 3;
    const durationFrames = Math.max(1, Math.round(durSec * fps));
    let props = {};
    const v = b.values;
    if (typeof v === "string") { try { props = JSON.parse(v || "{}"); } catch { props = {}; } }
    else if (v && typeof v === "object") { props = v; }
    const item = { beat: Number(b.beat) || i + 1, component: String(b.card_id || "").trim(), props, startFrame: cursor, durationFrames, track: "card" };
    cursor += durationFrames;
    return item;
  });
  return timeline;
}

// Download each chapter mp3, lay them gapless from frame 0.
async function buildAudioTracks(video_id, fps, fileIds) {
  const audio = [];
  let cursor = 0;
  for (let i = 0; i < fileIds.length; i++) {
    const id = String(fileIds[i]).trim();
    if (!id) continue;
    const name = `${(video_id || "v").replace(/[^A-Za-z0-9_-]/g, "")}_${i + 1}.mp3`;
    const dest = path.join(AUDIO_DIR, name);
    const buf = await downloadDriveFile(id, dest);
    const durSec = await audioDurationSec(buf);
    const durationFrames = Math.max(1, Math.round(durSec * fps));
    audio.push({ chapter: i + 1, src: `http://127.0.0.1:${PORT}/audio/${name}`, startFrame: cursor, durationFrames });
    cursor += durationFrames;
  }
  return audio;
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

const auth = (req) => req.headers["x-api-key"] === RENDER_API_KEY;

app.get("/", (_req, res) => res.json({ status: "ok", service: "ax-video-render" }));

app.post("/render-video", async (req, res) => {
  if (!auth(req)) return res.status(401).json({ error: "bad api key" });
  const manifest = req.body?.manifest ?? req.body;
  if (!manifest || !Array.isArray(manifest.timeline)) return res.status(400).json({ error: "need manifest.timeline[]" });
  try { const out = await renderManifest(manifest); return res.json({ status: "ok", ...out }); }
  catch (e) { console.error(e); return res.status(500).json({ error: String(e?.stack || e) }); }
});

app.post("/build-and-render", async (req, res) => {
  if (!auth(req)) return res.status(401).json({ error: "bad api key" });
  const { video_id, fps = 30, beats, audio_file_ids = [] } = req.body || {};
  if (!Array.isArray(beats) || beats.length === 0) return res.status(400).json({ error: "need non-empty beats[]" });
  try {
    const F = Number(fps) || 30;
    const timeline = beatsToTimeline(F, beats);
    let audio = [];
    if (Array.isArray(audio_file_ids) && audio_file_ids.length) {
      audio = await buildAudioTracks(video_id || "video", F, audio_file_ids);
    }
    const manifest = { video_id: video_id || "video", fps: F, width: 1080, height: 1920, timeline, audio, captions: [] };
    const out = await renderManifest(manifest);
    return res.json({ status: "ok", beats: timeline.length, audio_tracks: audio.length, ...out });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.stack || e) });
  }
});

app.listen(PORT, () => console.log(`ax-video-render listening on ${PORT}`));
