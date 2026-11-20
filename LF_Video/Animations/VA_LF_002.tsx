/**
 * VA_LF_002 — Two animated horizontal battery gauges for before/after capacity, usable-window, or SOC comparison.
 *
 * SEVEN EDITING SECTIONS (all local to THIS animation):
 * 1. ANIMATION SETTINGS — see the final 'animation' object (section 7).
 * 2. EDITABLE TEXT AND VALUES — input schema, labels and numeric limits below.
 * 3. COLORS AND SIZES — JSX styles and lfTheme; fontSize, width, height, fill.
 * 4. ELEMENT POSITIONS — style left/top/right/bottom or SVG x/y coordinates.
 * 5. MOVEMENT AND TIMING — progress, frames, easing, reveal and loop cues.
 * 6. ANIMATION COMPONENT — React JSX describing the visual on each frame.
 * 7. REGISTRATION CONFIGURATION — final exported 'animation' settings block.
 *
 * The canvas is 1920 × 1080. Imported shared_system helpers supply reusable
 * drawing and timing primitives; this file controls its own unique behavior.
 * Edit only the relevant values; do not change shared code for local changes.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRevealProgress } from "../shared_system/Timing";
import { lfTheme, toneColor, clamp01, linearPhase, enter, fade, titleSizeFor, Title, Footer, Panel, LegendPill } from "../shared_system/CoreVisuals";

const baseProps = { title: z.string().optional() };

/** INPUTS: SECTION 2 — EDITABLE TEXT AND VALUES.
 * This schema defines accepted labels, numeric controls and defaults.
 * z.string() handles text; clampNumeric(min,max) bounds a numeric control;
 * .default(value) supplies a fallback when an input is omitted.
 * Change the local values here, without editing shared_system code.
 */
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

/** VISUAL: SECTION 3 — COLORS AND SIZES.
 * Edit fill/background/color, fontSize, width and height in the JSX styles.
 * Use the imported lfTheme for consistent shared colors when appropriate.
 *
 * SECTION 4 — ELEMENT POSITIONS.
 * Position each object using JSX style offsets, flex/grid settings or SVG
 * coordinates. These positions belong to this animation, not the shared UI.
 *
 * SECTION 5 — MOVEMENT AND TIMING.
 * Hooks provide the frame or progress value; local formulas control entrances,
 * easing, reveals and continuous loops. Modify their cues to change motion.
 *
 * SECTION 6 — ANIMATION COMPONENT.
 * The exported React component below draws this animation's on-screen objects.
 * Its return/JSX contains each text label, panel, icon, line and SVG element.
 */
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


/** SETTINGS: SECTION 7 — REGISTRATION CONFIGURATION.
 * Edit this final block for this animation only. New files register automatically.
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
