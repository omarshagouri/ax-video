import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRevealProgress } from "../shared system/Timing";
import { lfTheme, toneColor, clamp01, linearPhase, enter, fade, titleSizeFor, Title, Footer, Panel, LegendPill } from "../shared system/CoreVisuals";

const baseProps = { title: z.string().optional() };

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_002. */
export const beforeAfterSchema = z.object({
  ...baseProps,
  beforeLabel: z.string(),
  beforePct: clampNumeric(0, 100),
  afterLabel: z.string(),
  afterPct: clampNumeric(0, 100),
  deltaLabel: z.string().optional(),
  footer: z.string().optional(),
});

const HorizontalBattery: React.FC<{
  label: string;
  pct: number;
  accent: string;
  delay: number;
}> = ({ label, pct, accent, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, delay);
  const fillP = linearPhase(frame, delay + 10, 28);
  return (
    <Panel
      style={{
        width: 650,
        height: 360,
        padding: "34px 42px",
        boxSizing: "border-box",
        opacity: p,
        transform: `translateY(${(1 - p) * 22}px)`,
      }}
    >
      <div
        style={{
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: 29,
          fontWeight: 750,
          color: lfTheme.slate,
          marginBottom: 28,
          letterSpacing: 0.4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          position: "relative",
          width: 535,
          height: 128,
          border: `4px solid ${lfTheme.slate}`,
          borderRadius: 22,
          padding: 10,
          background: "rgba(20,36,64,0.84)",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, pct)) * fillP}%`,
            height: "100%",
            borderRadius: 12,
            background: accent,
            boxShadow: `0 0 26px ${accent}2b`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -30,
            top: 34,
            width: 28,
            height: 54,
            borderRadius: "0 9px 9px 0",
            background: lfTheme.slate,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 26,
          fontFamily: "Space Grotesk, Arial, sans-serif",
          fontSize: 68,
          lineHeight: 1,
          fontWeight: 750,
          color: accent,
          letterSpacing: -1.5,
        }}
      >
        {Math.round(pct)}%
      </div>
    </Panel>
  );
};

/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
export const VALF002BeforeAfter: React.FC<any> = ({
  title,
  beforeLabel,
  beforePct,
  afterLabel,
  afterPct,
  deltaLabel,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const diff = Number(afterPct) - Number(beforePct);
  const arrowP = enter(frame, fps, 30, 150);

  // DRAWING: The JSX below creates the animated objects shown on screen.
  return (
    <AbsoluteFill>
      <Title title={title || "Before vs after"} kicker="Capacity comparison" />

      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 310,
          bottom: 130,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 46,
        }}
      >
        <HorizontalBattery
          label={beforeLabel}
          pct={Number(beforePct)}
          accent={lfTheme.slate}
          delay={8}
        />

        <div
          style={{
            width: 170,
            textAlign: "center",
            opacity: arrowP,
            transform: `scale(${0.9 + 0.1 * arrowP})`,
          }}
        >
          <div
            style={{
              fontFamily: "Space Grotesk, Arial, sans-serif",
              fontSize: 70,
              fontWeight: 700,
              color: diff < 0 ? lfTheme.heat : lfTheme.teal,
              lineHeight: 1,
            }}
          >
            →
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: diff < 0 ? lfTheme.heat : lfTheme.teal,
              whiteSpace: "nowrap",
            }}
          >
            {deltaLabel || `${diff > 0 ? "+" : ""}${diff.toFixed(0)} pts`}
          </div>
        </div>

        <HorizontalBattery
          label={afterLabel}
          pct={Number(afterPct)}
          accent={diff < 0 ? lfTheme.heat : lfTheme.teal}
          delay={22}
        />
      </div>

      <Footer text={footer} />
    </AbsoluteFill>
  );
};


/** SETTINGS: Edit this block for this animation only. New files register automatically.
 * background: image in public/; backgroundDim: 0 (clear) to 1 (black).
 * authoredEndFrame: last entrance cue, NOT the video duration.
 * The older hyphenated ID is accepted by the renderer as an input alias.
 */
export const animation = {
  id: "VA_LF_002",
  component: VALF002BeforeAfter,
  schema: beforeAfterSchema,
  description: "Two animated horizontal battery gauges for before/after capacity, usable-window, or SOC comparison.",
  slots: Object.keys(beforeAfterSchema.shape),
  defaultDurationSec: 8,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 72,
};
