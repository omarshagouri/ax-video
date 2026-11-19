import React, { createContext, useContext } from "react";
import { useCurrentFrame as useRawCurrentFrame } from "remotion";

// Each file owns its authored cue endpoint; no animation IDs belong here.

type Timing = { durationFrames: number; authoredEndFrame?: number };
const Context = createContext<Timing | null>(null);
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export const LFAnimationTimingProvider: React.FC<{
  animationId: string;
  durationFrames: number;
  authoredEndFrame?: number;
  children: React.ReactNode;
}> = ({ durationFrames, authoredEndFrame, children }) => (
  <Context.Provider value={{ durationFrames, authoredEndFrame }}>
    {children}
  </Context.Provider>
);

export function getLFRevealProgress(frame: number, durationFrames: number): number {
  const last = Math.max(1, durationFrames - 1);
  // Keep 2% for a clean final pose, with content revealed across the other 98%.
  return clamp01(frame / Math.max(1, last * 0.98));
}

export function getLFPacedFrame(
  frame: number,
  durationFrames: number,
  _animationId: string,
  authoredEndFrame?: number,
): number {
  const target = authoredEndFrame;
  if (!target || !Number.isFinite(durationFrames) || durationFrames < 2) return frame;
  return target * getLFRevealProgress(frame, durationFrames);
}

/** Animated content uses an authored cue-clock stretched to the real beat. */
export function useLFPacedFrame(): number {
  const raw = useRawCurrentFrame();
  const context = useContext(Context);
  return context
    ? getLFPacedFrame(raw, context.durationFrames, "", context.authoredEndFrame)
    : raw;
}

/** Use this only when continuous natural-speed looping matters independently. */
export function useLFRealFrame(): number {
  return useRawCurrentFrame();
}

/** From 0 to 1 over the entire real beat, for staged labels and editorial layers. */
export function useLFRevealProgress(): number {
  const raw = useRawCurrentFrame();
  const context = useContext(Context);
  return context
    ? getLFRevealProgress(raw, context.durationFrames)
    : 1;
}
