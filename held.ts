// Spread a card's authored entrance animation across a long "held" sequence.
//
// The visual agent now holds one card across several sentence-cells, so the
// server coalesces those beats into a single long Sequence (e.g. 9s). But every
// card's entrance was authored to finish in ~2s, so it played once and froze for
// the rest of the hold. heldSeconds() remaps the elapsed time fed to a card so
// its same entrance sequence stretches across the whole hold, then settles.
//
// Short / normal holds (a card shown for roughly its own length) are returned
// unchanged, so a single 2-3s cell looks exactly as authored.

export const MAX_SETTLE = 1.2; // seconds of rest left at the end of a long hold

/**
 * Remap real elapsed seconds so an animation authored to finish at ~`motionEnd`s
 * instead finishes MAX_SETTLE before the end of a held sequence of `holdFrames`.
 */
export function heldSeconds(
  frame: number,
  fps: number,
  holdFrames: number,
  motionEnd: number
): number {
  const real = frame / fps;
  if (!holdFrames || !fps || !motionEnd || motionEnd <= 0) return real;
  const holdSec = holdFrames / fps;
  // Not held meaningfully longer than its own animation -> leave exactly as authored.
  if (holdSec - motionEnd <= MAX_SETTLE) return real;
  const target = holdSec - MAX_SETTLE; // entrances should finish by here
  return real * (motionEnd / target);
}

/**
 * Best-effort: the last time (in seconds) a seek script animates something in.
 * Returns 0 for static "fit-only" cards (no timed reveal) so they are left alone.
 * Biased to over-estimate slightly rather than clip a late element.
 */
export function motionEndOf(seek: string): number {
  let end = 0;
  const bump = (v: number) => {
    if (Number.isFinite(v) && v > end && v < 30) end = v;
  };
  let m: RegExpExecArray | null;

  // clamp((t - A) / (B - A))  -> ends at B
  const re1 = /\(\s*t\s*-\s*[\d.]+\s*\)\s*\/\s*\(\s*([\d.]+)\s*-\s*[\d.]+\s*\)/g;
  while ((m = re1.exec(seek))) bump(parseFloat(m[1]));

  // clamp((t - A) / B)  -> ends at A + B
  const re2 = /\(\s*t\s*-\s*([\d.]+)\s*\)\s*\/\s*([\d.]+)/g;
  while ((m = re2.exec(seek))) bump(parseFloat(m[1]) + parseFloat(m[2]));

  // clamp(t / B)  -> ends at B
  const re3 = /\bt\s*\/\s*([\d.]+)/g;
  while ((m = re3.exec(seek))) bump(parseFloat(m[1]));

  // show(id, A, B, ...) or grow(id, A, B)  -> ends at B
  const re4 = /(?:show|grow)\([^,]+,\s*[\d.]+\s*,\s*([\d.]+)/g;
  while ((m = re4.exec(seek))) bump(parseFloat(m[1]));

  // t > A / t >= A / t < A  -> A
  const re5 = /\bt\s*[<>]=?\s*([\d.]+)/g;
  while ((m = re5.exec(seek))) bump(parseFloat(m[1]));

  return end;
}
