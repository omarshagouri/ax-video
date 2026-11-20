// Fail-closed chapter timeline checks. Used only by /render-chapter on LF.
export const MAX_TIMING_DRIFT_SECONDS = 0.75;

export function assertChapterTimelineMatchesAudio({ timeline, audio, fps }) {
  if (!Number.isFinite(fps) || fps <= 0) throw new Error("Chapter timing: invalid fps");
  if (!Array.isArray(timeline) || timeline.length === 0) {
    throw new Error("Chapter timing: visual timeline is empty");
  }
  if (!Array.isArray(audio) || audio.length === 0) {
    throw new Error("Chapter timing: no narration audio was supplied");
  }
  let visualEnd = 0;
  for (const item of timeline) {
    if (!Number.isInteger(item.startFrame) || !Number.isInteger(item.durationFrames) ||
        item.durationFrames < 1 || item.startFrame !== visualEnd) {
      throw new Error(`Chapter timing: gap or overlap before visual beat ${item.beat}; expected start frame ${visualEnd}, got ${item.startFrame}`);
    }
    visualEnd += item.durationFrames;
  }
  let audioEnd = 0;
  for (const track of audio) {
    if (!Number.isInteger(track.startFrame) || !Number.isInteger(track.durationFrames) ||
        track.durationFrames < 1 || track.startFrame !== audioEnd) {
      throw new Error("Chapter timing: narration audio has a gap, overlap or invalid duration");
    }
    audioEnd += track.durationFrames;
  }
  const visualSeconds = visualEnd / fps;
  const audioSeconds = audioEnd / fps;
  const difference = Math.abs(visualSeconds - audioSeconds);
  if (difference > MAX_TIMING_DRIFT_SECONDS) {
    throw new Error(`Chapter timing mismatch: visuals=${visualSeconds.toFixed(2)}s audio=${audioSeconds.toFixed(2)}s delta=${difference.toFixed(2)}s. Adjust Visual_Plan durations before rendering; do not stretch, loop or silently blank the screen.`);
  }
  return { visual_seconds: visualSeconds, audio_seconds: audioSeconds, difference_seconds: difference };
}
