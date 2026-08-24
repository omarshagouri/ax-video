import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { theme } from "../theme";
import { clamp, easeOutCubic } from "../lib/ease";
import { useFittedText } from "../lib/useFittedText";

/**
 * VC-SF-003  "Engineer's Note"  — slots TAG, STATEMENT, ROLE.
 * Ported 1:1 from ax-cards/Cards/VC-SF-003.py. Mandatory: exactly one per video.
 * pill fade+scale 0.0-0.5 | statement fade+rise 0.4-1.1 | teal rule 1.0-1.6 | role 1.5-2.0
 */
export const VCSF003Schema = z.object({
  TAG: z.string(),
  STATEMENT: z.string(),
  ROLE: z.string(),
});
export type VCSF003Props = z.infer<typeof VCSF003Schema>;

export const VCSF003: React.FC<VCSF003Props> = ({ TAG, STATEMENT, ROLE }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const pe = easeOutCubic(clamp(t / 0.5));
  const se = easeOutCubic(clamp((t - 0.4) / 0.7));
  const re = easeOutCubic(clamp((t - 1.0) / 0.6));
  const oe = easeOutCubic(clamp((t - 1.5) / 0.5));

  const stmt = useFittedText(60, { maxWidth: 840, maxHeight: 600 });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 120,
          width: 840,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            opacity: pe,
            transform: `scale(${0.9 + 0.1 * pe})`,
            color: theme.teal,
            border: `2px solid ${theme.teal}`,
            borderRadius: 999,
            fontFamily: theme.font,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            padding: "14px 34px",
          }}
        >
          {TAG}
        </div>

        <div
          ref={stmt.ref}
          style={{
            opacity: se,
            transform: `translateY(${24 * (1 - se)}px)`,
            margin: "48px auto 0",
            maxWidth: 840,
            color: theme.white,
            fontFamily: theme.font,
            fontSize: stmt.fontSize,
            fontWeight: 600,
            lineHeight: 1.28,
          }}
        >
          {STATEMENT}
        </div>

        <div
          style={{
            width: 130,
            height: 5,
            background: theme.teal,
            margin: "44px auto 0",
            borderRadius: 3,
            transformOrigin: "center",
            transform: `scaleX(${re})`,
          }}
        />

        <div
          style={{
            opacity: oe,
            transform: `translateY(${16 * (1 - oe)}px)`,
            margin: "40px 0 0",
            color: "#8CA0B8",
            fontFamily: "'Inter', sans-serif",
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          {ROLE}
        </div>
      </div>
    </AbsoluteFill>
  );
};
