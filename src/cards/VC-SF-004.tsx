import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { theme } from "../theme";
import { clamp, easeOutCubic } from "../lib/ease";
import { heldSeconds } from "../lib/held";
import { useFittedText } from "../lib/useFittedText";

/**
 * VC-SF-004  "Hook"  — slots KICKER + HOOK.
 * Ported 1:1 from ax-cards/Cards/VC-SF-004.py.
 * Timings (seconds), identical to the original seek():
 *   bar wipe   0.00 - 0.60
 *   kicker     0.55 - 1.15   (fade + rise 16px)
 *   hook line  1.15 - 2.25   (fade + rise 48px), then hold
 * Text stays above y=1180 (caption safe zone), same as the .py caption pass.
 */
export const VCSF004Schema = z.object({
  KICKER: z.string(),
  HOOK: z.string(),
});
export type VCSF004Props = z.infer<typeof VCSF004Schema>;

export const VCSF004: React.FC<VCSF004Props & { __holdFrames?: number }> = ({ 
  __holdFrames,KICKER, HOOK }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = heldSeconds(frame, fps, __holdFrames ?? 0, 2.25);

  const eBar = easeOutCubic(clamp(t / 0.6));
  const eK = easeOutCubic(clamp((t - 0.55) / 0.6));
  const eH = easeOutCubic(clamp((t - 1.15) / 1.1));

  const kicker = useFittedText(32, { maxWidth: 840, singleLine: true });
  const hook = useFittedText(92, { maxWidth: 840, maxHeight: 900 });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 192,
          width: 840,
          height: 988,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {/* kicker row: teal bar + kicker text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 66,
              height: 5,
              background: theme.teal,
              borderRadius: 2,
              transform: `scaleX(${eBar})`,
              transformOrigin: "left center",
            }}
          />
          <div
            ref={kicker.ref}
            style={{
              fontFamily: theme.font,
              fontWeight: 600,
              fontSize: kicker.fontSize,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: theme.teal,
              opacity: eK,
              transform: `translateY(${16 * (1 - eK)}px)`,
              maxWidth: 840,
              whiteSpace: "nowrap",
            }}
          >
            {KICKER}
          </div>
        </div>

        {/* hook line */}
        <div
          ref={hook.ref}
          style={{
            fontFamily: theme.font,
            fontWeight: 700,
            fontSize: hook.fontSize,
            lineHeight: 1.06,
            color: theme.white,
            opacity: eH,
            transform: `translateY(${48 * (1 - eH)}px)`,
            maxWidth: 840,
          }}
        >
          {HOOK}
        </div>
      </div>
    </AbsoluteFill>
  );
};
