import { VideoManifest, Caption } from "./manifest";
import { validateTimeline } from "./registry";

/**
 * PHASE 2 STUB — the "new Agent 6" output builder.
 *
 * This is where the manifest gets assembled deterministically. It is NOT wired
 * up yet; it documents the shape so the next step is mechanical.
 *
 * Inputs (all already exist in your pipeline):
 *   - cadence cells from /plan-cadence  (beat, chapter, duration, sentence)
 *   - the card_id + props chosen per cell (the LLM's only job)
 *   - ElevenLabs `with-timestamps` output per chapter (char/word start-end secs)
 *
 * Output: a VideoManifest whose frames are locked to real audio. No re-timing
 * happens anywhere downstream — this is the single source of truth.
 */

type Cell = {
  beat: number;
  chapter: number;
  card_id: string;
  props: Record<string, unknown>;
  durationSec: number;
};

type ChapterAudio = {
  chapter: number;
  src: string;
  durationSec: number;
  words: { word: string; startSec: number; endSec: number }[]; // from ElevenLabs
};

export function buildManifest(
  video_id: string,
  cells: Cell[],
  chapters: ChapterAudio[],
  fps = 30
): VideoManifest {
  const sec2f = (s: number) => Math.round(s * fps);

  // 1) lay beats on the timeline in order (frames from real durations)
  let cursor = 0;
  const timeline = cells.map((c) => {
    const startFrame = cursor;
    const durationFrames = sec2f(c.durationSec);
    cursor += durationFrames;
    return {
      beat: c.beat,
      component: c.card_id,
      props: c.props,
      startFrame,
      durationFrames,
      track: "card" as const,
    };
  });

  // 2) place each chapter's audio at the first frame of its first beat
  const audio = chapters.map((ch) => {
    const first = cells.find((c) => c.chapter === ch.chapter);
    const firstBeatIdx = first ? cells.indexOf(first) : 0;
    const startFrame = timeline[firstBeatIdx]?.startFrame ?? 0;
    return {
      chapter: ch.chapter,
      src: ch.src,
      startFrame,
      durationFrames: sec2f(ch.durationSec),
    };
  });

  // 3) captions: word timings offset by their chapter's audio start (frames)
  const captions: Caption[] = [];
  for (const ch of chapters) {
    const base = audio.find((a) => a.chapter === ch.chapter)?.startFrame ?? 0;
    for (const w of ch.words) {
      captions.push({
        word: w.word,
        startFrame: base + sec2f(w.startSec),
        endFrame: base + sec2f(w.endSec),
      });
    }
  }

  const manifest: VideoManifest = {
    video_id,
    fps,
    width: 1080,
    height: 1920,
    audio,
    captions,
    timeline,
  };

  // 4) fail loud at build time if any card/props are invalid
  const errors = validateTimeline(timeline);
  if (errors.length) {
    throw new Error("Invalid manifest:\n" + errors.join("\n"));
  }
  return manifest;
}
