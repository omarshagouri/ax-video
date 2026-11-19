// Validates independent per-MP4 motion requirements without constraining source claims.
export const NATIVE_CLIP_IDS = Object.freeze(["VV-LF-001", "VV-LF-002", "VV-LF-003", "VV-LF-004"]);
export function assertNativeClipDuration(id, frames, fps) {
  if (!NATIVE_CLIP_IDS.includes(id)) throw new Error("Unsupported native clip " + id);
  if (!Number.isInteger(frames) || frames !== fps * 3) {
    throw new Error(id + " must be exactly 3 seconds (" + fps * 3 + " frames)");
  }
}
export function assertNativeMotionMix(timeline) {
  const clips = timeline.filter(x=>x.track === "clip" && NATIVE_CLIP_IDS.includes(x.component));
  const animations = timeline.filter(x=>x.track === "anim" && x.component.startsWith("VA-LF-"));
  if (clips.length < 1 || animations.length < 1) {
    throw new Error("Visual mix requirement: every MP4 needs >=1 3s VV-LF native clip and >=1 VA-LF animation");
  }
  return { clips:clips.length, animations:animations.length };
}
