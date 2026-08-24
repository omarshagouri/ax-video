import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { theme } from "../theme";
import { clamp, easeOutCubic } from "../lib/ease";
import { useFittedText } from "../lib/useFittedText";

/**
 * VC-SF-002  "Versus"  — slots TITLE, VALUE_A, LABEL_A, VALUE_B, LABEL_B, SOURCE.
 * Ported 1:1 from ax-cards/Cards/VC-SF-002.py. Two numeric bars scaled to the
 * larger value. Routing guard (from the old system): only use with two real
 * numeric values + short labels — never qualitative comparisons.
 * title 0-0.6 | labels+source 0.4-0.9 | bars grow 0.5-1.3 | values 1.3-1.7
 */
export const VCSF002Schema = z.object({
  TITLE: z.string(),
  VALUE_A: z.string(),
  LABEL_A: z.string(),
  VALUE_B: z.string(),
  LABEL_B: z.string(),
  SOURCE: z.string().optional().default(""),
});
export type VCSF002Props = z.infer<typeof VCSF002Schema>;

const MAX_BAR = 450;
const BASE = 1000; // bar baseline from bottom (caption-safe pass)

export const VCSF002: React.FC<VCSF002Props> = ({
  TITLE,
  VALUE_A,
  LABEL_A,
  VALUE_B,
  LABEL_B,
  SOURCE,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const a = parseFloat(VALUE_A) || 0;
  const b = parseFloat(VALUE_B) || 0;
  const maxV = Math.max(a, b, 0.0001);
  const hA = (MAX_BAR * a) / maxV;
  const hB = (MAX_BAR * b) / maxV;

  const te = easeOutCubic(clamp(t / 0.6));
  const fe = clamp((t - 0.4) / 0.5);
  const ge = easeOutCubic(clamp((t - 0.5) / 0.8));
  const ve = easeOutCubic(clamp((t - 1.3) / 0.4));

  const title = useFittedText(76, { maxWidth: 1000, maxHeight: 180 });
  const valA = useFittedText(64, { maxWidth: 200, singleLine: true });
  const valB = useFittedText(64, { maxWidth: 200, singleLine: true });
  const labA = useFittedText(40, { maxWidth: 360, singleLine: true });
  const labB = useFittedText(40, { maxWidth: 360, singleLine: true });
  const source = useFittedText(30, { maxWidth: 900, maxHeight: 90 });

  const bar = (
    left: number,
    h: number,
    color: string
  ): React.CSSProperties => ({
    position: "absolute",
    bottom: BASE,
    left,
    width: 200,
    height: h,
    background: color,
    transformOrigin: "bottom center",
    transform: `scaleY(${ge})`,
    borderRadius: "4px 4px 0 0",
  });

  const val = (
    left: number,
    h: number,
    ref: React.RefObject<HTMLDivElement>,
    size: number
  ): { style: React.CSSProperties; ref: React.RefObject<HTMLDivElement> } => ({
    ref,
    style: {
      position: "absolute",
      bottom: BASE + h + 18,
      left,
      width: 200,
      textAlign: "center",
      color: theme.white,
      fontFamily: theme.font,
      fontWeight: 700,
      fontSize: size,
      opacity: ve,
      transform: `translateY(${18 * (1 - ve)}px)`,
    },
  });

  const axis = (
    left: number,
    ref: React.RefObject<HTMLDivElement>,
    size: number
  ): { style: React.CSSProperties; ref: React.RefObject<HTMLDivElement> } => ({
    ref,
    style: {
      position: "absolute",
      bottom: 900,
      left,
      width: 360,
      textAlign: "center",
      whiteSpace: "nowrap",
      color: "#8CA0B8",
      fontFamily: theme.font,
      fontWeight: 500,
      fontSize: size,
      opacity: fe,
    },
  });

  const valAs = val(300, hA, valA.ref, valA.fontSize);
  const valBs = val(600, hB, valB.ref, valB.fontSize);
  const labAs = axis(220, labA.ref, labA.fontSize);
  const labBs = axis(520, labB.ref, labB.fontSize);

  return (
    <AbsoluteFill>
      <div
        ref={title.ref}
        style={{
          position: "absolute",
          top: 230,
          left: 0,
          width: 1080,
          textAlign: "center",
          color: theme.white,
          fontFamily: theme.font,
          fontSize: title.fontSize,
          fontWeight: 700,
          opacity: te,
          transform: `translateY(${30 * (1 - te)}px)`,
        }}
      >
        {TITLE}
      </div>

      {/* baseline */}
      <div
        style={{
          position: "absolute",
          bottom: BASE,
          left: 240,
          width: 600,
          height: 3,
          background: "#8CA0B8",
          opacity: 0.35,
        }}
      />

      <div style={bar(300, hA, theme.teal)} />
      <div style={bar(600, hB, "#FF7A3C")} />

      <div ref={valAs.ref} style={valAs.style}>
        {VALUE_A}
      </div>
      <div ref={valBs.ref} style={valBs.style}>
        {VALUE_B}
      </div>
      <div ref={labAs.ref} style={labAs.style}>
        {LABEL_A}
      </div>
      <div ref={labBs.ref} style={labBs.style}>
        {LABEL_B}
      </div>

      <div
        ref={source.ref}
        style={{
          position: "absolute",
          bottom: 820,
          left: 90,
          color: "#8CA0B8",
          fontFamily: theme.font,
          fontSize: source.fontSize,
          fontWeight: 400,
          opacity: fe,
          borderLeft: `6px solid ${theme.teal}`,
          paddingLeft: 16,
          maxWidth: 900,
        }}
      >
        {SOURCE}
      </div>
    </AbsoluteFill>
  );
};
