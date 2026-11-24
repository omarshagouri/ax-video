/**
 * VA_LF_006 — Large animated numeric count-up for money, percentages, capacity, fleet size, range, or cycle count.
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
export const counterSchema = z.object({
  ...baseProps,
  value: z.number(),
  decimals: clampInteger(0, 2).default(0),
  prefix: z.string().optional().default(""),
  suffix: z.string().optional().default(""),
  label: z.string().optional(),
  tone: z.enum(["teal", "heat", "cold", "white"]).optional(),
  footer: z.string().optional(),
});

const formatCount = (value: number, decimals: number) => {
  if (decimals > 0) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return Math.round(value).toLocaleString("en-US");
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
export const VALF006Counter: React.FC<any> = ({
  title,
  value,
  decimals,
  prefix,
  suffix,
  label,
  tone,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = toneColor(tone);
  const boxP = enter(frame, fps, 8);
  const countP = linearPhase(frame, 18, 46);
  const eased = 1 - Math.pow(1 - countP, 3);
  const shown = Number(value) * eased;
  const digits = String(Math.abs(Math.round(Number(value)))).length;
  const numberSize = digits >= 7 ? 150 : digits >= 5 ? 178 : 205;

  // DRAWING: The JSX below creates the animated objects shown on screen.
  return (
    <AbsoluteFill>
      <Title title={title} kicker="Key number" />

      <Panel
        style={{
          position: "absolute",
          left: 380,
          right: 380,
          top: 330,
          height: 430,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: boxP,
          transform: `scale(${0.97 + 0.03 * boxP})`,
        }}
      >
        <div style={{ textAlign: "center", width: "100%" }}>
          <div
            style={{
              fontFamily: "Space Grotesk, Arial, sans-serif",
              fontSize: numberSize,
              lineHeight: 0.9,
              fontWeight: 750,
              color: accent,
              letterSpacing: digits >= 6 ? -5 : -3,
              whiteSpace: "nowrap",
            }}
          >
            {prefix || ""}
            {formatCount(shown, Number(decimals || 0))}
            {suffix || ""}
          </div>

          {label ? (
            <div
              style={{
                marginTop: 30,
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: 40,
                lineHeight: 1.15,
                color: lfTheme.white,
                fontWeight: 650,
              }}
            >
              {label}
            </div>
          ) : null}

          <div
            style={{
              width: 190 * fade(frame, 54, 14),
              height: 5,
              margin: "34px auto 0",
              borderRadius: 99,
              background: accent,
              boxShadow: `0 0 18px ${accent}55`,
            }}
          />
        </div>
      </Panel>

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
  id: "VA_LF_006",
  component: VALF006Counter,
  schema: counterSchema,
  description: "Large animated numeric count-up for money, percentages, capacity, fleet size, range, or cycle count.",
  slots: Object.keys(counterSchema.shape),
  defaultDurationSec: 7,
  // Preview-only example values. Edit them here to see your changes in Studio.
  previewProps: {
    "value": 87,
    "decimals": 0,
    "suffix": "%",
    "label": "Battery capacity"
  },
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 79,
};
