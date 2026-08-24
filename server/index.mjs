import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const RENDER_API_KEY = process.env.RENDER_API_KEY || "PLACEHOLDER_KEY";

const app = express();
app.use(express.json({ limit: "48mb" })); // room for audio base64

let serveUrlPromise = null;
const getServeUrl = () => {
  if (!serveUrlPromise) serveUrlPromise = bundle({ entryPoint: ENTRY });
  return serveUrlPromise;
};

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", args, { encoding: "buffer", maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error("ffmpeg failed: " + (r.stderr ? r.stderr.toString().slice(-800) : "unknown"));
}

function beatsToManifest(video_id, fps, beats, captions = []) {
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
  return { video_id, fps, width: 1080, height: 1920, timeline, audio: [], captions };
}

// Render the (silent) visuals, then mux the chapter MP3s on with ffmpeg.
async function renderManifest(manifest, audioB64 = []) {
  const serveUrl = await getServeUrl();
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "axv-"));
  const silent = path.join(work, "silent.mp4");
  const composition = await selectComposition({ serveUrl, id: "AmpCoreX", inputProps: { manifest } });
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: silent, inputProps: { manifest } });

  let finalPath = silent;
  const clips = (audioB64 || []).filter((b) => typeof b === "string" && b.length > 100);
  if (clips.length > 0) {
    const listLines = [];
    clips.forEach((b, i) => {
      const p = path.join(work, `ch_${i}.mp3`);
      fs.writeFileSync(p, Buffer.from(b, "base64"));
      listLines.push(`file '${p}'`);
    });
    fs.writeFileSync(path.join(work, "list.txt"), listLines.join("\n"));
    const allAudio = path.join(work, "all.mp3");
    ffmpeg(["-f", "concat", "-safe", "0", "-i", path.join(work, "list.txt"), "-c", "copy", allAudio, "-y"]);
    const muxed = path.join(work, "final.mp4");
    ffmpeg(["-i", silent, "-i", allAudio, "-c:v", "copy", "-c:a", "aac", "-shortest", muxed, "-y"]);
    finalPath = muxed;
  }

  const b64 = fs.readFileSync(finalPath).toString("base64");
  return { filename: `${manifest.video_id || "video"}_FINAL.mp4`, file_base64: b64, hasAudio: clips.length > 0 };
}

const auth = (req) => req.headers["x-api-key"] === RENDER_API_KEY;

app.get("/", (_req, res) => res.json({ status: "ok", service: "ax-video-render", audio: true }));

app.post("/render-video", async (req, res) => {
  if (!auth(req)) return res.status(401).json({ error: "bad api key" });
  const manifest = req.body?.manifest ?? req.body;
  if (!manifest || !Array.isArray(manifest.timeline)) return res.status(400).json({ error: "need manifest.timeline[]" });
  try { const out = await renderManifest(manifest, req.body?.audio || manifest.audioB64 || []); return res.json({ status: "ok", ...out }); }
  catch (e) { console.error(e); return res.status(500).json({ error: String(e?.stack || e) }); }
});

app.post("/build-and-render", async (req, res) => {
  if (!auth(req)) return res.status(401).json({ error: "bad api key" });
  const { video_id, fps = 30, beats, audio = [], captions = [] } = req.body || {};
  if (!Array.isArray(beats) || beats.length === 0) return res.status(400).json({ error: "need non-empty beats[]" });
  try {
    const manifest = beatsToManifest(video_id || "video", Number(fps) || 30, beats, captions);
    const out = await renderManifest(manifest, audio);
    return res.json({ status: "ok", beats: manifest.timeline.length, ...out });
  } catch (e) { console.error(e); return res.status(500).json({ error: String(e?.stack || e) }); }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`ax-video-render listening on ${PORT}`));
