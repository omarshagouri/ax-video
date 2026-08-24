import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { theme } from "../theme";
import { clamp, easeOutCubic } from "../lib/ease";

/**
 * VC-SF-002 "Versus" - two numeric bars scaled to the larger value.
 * Robust rewrite: parses $/B/M/K/% and normalises units so bars always draw;
 * fixed, predictable type sizes (no fragile auto-fit); labels sit centred under
 * their own bar so they never overlap.
 */
export const VCSF002Schema = z.object({
  TITLE: z.string(),
  VALUE_A: z.union([z.string(), z.number()]),
  LABEL_A: z.string(),
  VALUE_B: z.union([z.string(), z.number()]),
  LABEL_B: z.string(),
  SOURCE: z.string().optional().default(""),
});
export type VCSF002Props = z.infer<typeof VCSF002Schema>;

// "$1.25B" -> 1.25e9 ; "500M" -> 5e8 ; "9%" -> 9 ; "1,250" -> 1250
function toNumber(s: string | number): number {
  const str = String(s).trim();
  const m = str.match(/(-?\d[\d,]*\.?\d*)\s*([a-zA-Z%]*)/);
  if (!m) return NaN;
  let n = parseFloat(m[1].replace(/,/g, ""));
  const u = (m[2] || "").toLowerCase();
  if (u.startsWith("b")) n *= 1e9;
  else if (u.startsWith("m")) n *= 1e6;
  else if (u.startsWith("k")) n *= 1e3;
  else if (u.startsWith("g")) n *= 1e9;
  return n;
}

const MAX_BAR = 450;
const BASE = 1000; // baseline from bottom

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

  const a = toNumber(VALUE_A);
  const b = toNumber(VALUE_B);
  const maxV = Math.max(a || 0, b || 0, 0.0001);
  const hA = Number.isFinite(a) ? (MAX_BAR * a) / maxV : 40;
  const hB = Number.isFinite(b) ? (MAX_BAR * b) / maxV : 40;

  const te = easeOutCubic(clamp(t / 0.6));
  const fe = clamp((t - 0.4) / 0.5);
  const ge = easeOutCubic(clamp((t - 0.5) / 0.8));
  const ve = easeOutCubic(clamp((t - 1.3) / 0.4));

  // bar A centred at x=400, bar B centred at x=700 (width 200 each)
  const bar = (leftCenter: number, h: number, color: string): React.CSSProperties => ({
    position: "absolute",
    bottom: BASE,
    left: leftCenter - 100,
    width: 200,
    height: Math.max(2, h),
    background: color,
    transformOrigin: "bottom center",
    transform: `scaleY(${ge})`,
    borderRadius: "6px 6px 0 0",
  });

  const valBox = (cx: number, h: number): React.CSSProperties => ({
    position: "absolute",
    bottom: BASE + Math.max(2, h) + 20,
    left: cx - 130,
    width: 260,
    textAlign: "center",
    color: theme.white,
    fontFamily: theme.font,
    fontWeight: 700,
    fontSize: 58,
    opacity: ve,
    transform: `translateY(${18 * (1 - ve)}px)`,
  });

  const labelBox = (cx: number): React.CSSProperties => ({
    position: "absolute",
    bottom: 860,
    left: cx - 150,
    width: 300,
    textAlign: "center",
    color: "#9DB2C8",
    fontFamily: theme.font,
    fontWeight: 500,
    fontSize: 32,
    lineHeight: 1.2,
    opacity: fe,
  });

  return (
    <AbsoluteFill>
      {/* title */}
      <div
        style={{
          position: "absolute",
          top: 210,
          left: 60,
          width: 960,
          textAlign: "center",
          opacity: te,
          transform: `translateY(${30 * (1 - te)}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            maxWidth: 960,
            color: theme.white,
            fontFamily: theme.font,
            fontWeight: 700,
            fontSize: 64,
            lineHeight: 1.1,
          }}
        >
          {TITLE}
        </div>
      </div>

      {/* baseline */}
      <div
        style={{
          position: "absolute",
          bottom: BASE,
          left: 240,
          width: 600,
          height: 3,
          background: "#3A4A5E",
        }}
      />

      <div style={bar(400, hA, theme.teal)} />
      <div style={bar(700, hB, "#FF7A3C")} />

      <div style={valBox(400, hA)}>{String(VALUE_A)}</div>
      <div style={valBox(700, hB)}>{String(VALUE_B)}</div>

      <div style={labelBox(400)}>{LABEL_A}</div>
      <div style={labelBox(700)}>{LABEL_B}</div>

      {SOURCE ? (
        <div
          style={{
            position: "absolute",
            bottom: 760,
            left: 90,
            maxWidth: 900,
            color: "#8CA0B8",
            fontFamily: theme.font,
            fontSize: 28,
            fontWeight: 400,
            opacity: fe,
            borderLeft: `6px solid ${theme.teal}`,
            paddingLeft: 16,
          }}
        >
          {SOURCE}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
