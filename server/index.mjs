// AmpCoreX render service (Cloud Run).
//  POST /render-video     -> body {manifest}                : render a full manifest
//  POST /build-and-render -> body {video_id, fps, beats[]}  : lay beats on a timeline, then render
// Both return base64 MP4. Same x-api-key contract as the old ax-render.
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const RENDER_API_KEY = process.env.RENDER_API_KEY || "PLACEHOLDER_KEY";

const app = express();
app.use(express.json({ limit: "16mb" }));

// Bundle once, reuse.
let serveUrlPromise = null;
const getServeUrl = () => {
  if (!serveUrlPromise) serveUrlPromise = bundle({ entryPoint: ENTRY });
  return serveUrlPromise;
};

// Turn Agent-6-style beats into a timeline manifest.
// Each beat: { beat, card_id, values (JSON string or object), duration ("2.6s" or 2.6) }
function beatsToManifest(video_id, fps, beats, audio = [], captions = []) {
  let cursor = 0;
  const timeline = beats.map((b, i) => {
    const durSec = parseFloat(String(b.duration)) || 3; // "2.619s" -> 2.619
    const durationFrames = Math.max(1, Math.round(durSec * fps));
    let props = {};
    const v = b.values;
    if (typeof v === "string") {
      try { props = JSON.parse(v || "{}"); } catch { props = {}; }
    } else if (v && typeof v === "object") {
      props = v;
    }
    const item = {
      beat: Number(b.beat) || i + 1,
      component: String(b.card_id || "").trim(),
      props,
      startFrame: cursor,
      durationFrames,
      track: "card",
    };
    cursor += durationFrames;
    return item;
  });
  return { video_id, fps, width: 1080, height: 1920, timeline, audio, captions };
}

async function renderManifest(manifest) {
  const serveUrl = await getServeUrl();
  const out = path.join("/tmp", `${manifest.video_id || "video"}_FINAL.mp4`);
  const composition = await selectComposition({
    serveUrl,
    id: "AmpCoreX",
    inputProps: { manifest },
  });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: out,
    inputProps: { manifest },
  });
  const b64 = fs.readFileSync(out).toString("base64");
  fs.unlinkSync(out);
  return { filename: `${manifest.video_id || "video"}_FINAL.mp4`, file_base64: b64 };
}

const auth = (req) => req.headers["x-api-key"] === RENDER_API_KEY;

app.get("/", (_req, res) =>
  res.json({ status: "ok", service: "ax-video-render" })
);

app.post("/render-video", async (req, res) => {
  if (!auth(req)) return res.status(401).json({ error: "bad api key" });
  const manifest = req.body?.manifest ?? req.body;
  if (!manifest || !Array.isArray(manifest.timeline)) {
    return res.status(400).json({ error: "body must contain a manifest with a timeline[]" });
  }
  try {
    const out = await renderManifest(manifest);
    return res.json({ status: "ok", ...out });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.stack || e) });
  }
});

app.post("/build-and-render", async (req, res) => {
  if (!auth(req)) return res.status(401).json({ error: "bad api key" });
  const { video_id, fps = 30, beats, audio = [], captions = [] } = req.body || {};
  if (!Array.isArray(beats) || beats.length === 0) {
    return res.status(400).json({ error: "body must contain a non-empty beats[]" });
  }
  try {
    const manifest = beatsToManifest(video_id || "video", Number(fps) || 30, beats, audio, captions);
    const out = await renderManifest(manifest);
    return res.json({ status: "ok", beats: manifest.timeline.length, ...out });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.stack || e) });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`ax-video-render listening on ${PORT}`));
