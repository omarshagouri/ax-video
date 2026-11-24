/**
 * VA_LF_007 — Animated before/after system or software-version comparison with short change lists.
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
export const systemDeltaSchema = z.object({
  ...baseProps,
  beforeLabel: z.string(),
  afterLabel: z.string(),
  beforeItems: z.array(z.string()).min(1).max(4),
  afterItems: z.array(z.string()).min(1).max(4),
  footer: z.string().optional(),
});

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
export const VALF007SystemDelta: React.FC<any> = ({
  title,
  beforeLabel,
  afterLabel,
  beforeItems,
  afterItems,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const leftP = enter(frame, fps, 8);
  const arrowP = enter(frame, fps, 27, 155);
  const rightP = enter(frame, fps, 34);

  const renderSide = (
    label: string,
    items: string[],
    accent: string,
    p: number,
    direction: -1 | 1
  ) => (
    <Panel
      style={{
        width: 660,
        height: 455,
        padding: "38px 42px",
        boxSizing: "border-box",
        border: `2px solid ${accent}66`,
        opacity: p,
        transform: `translateX(${direction * (1 - p) * 28}px)`,
      }}
    >
      <div
        style={{
          fontFamily: "Space Grotesk, Arial, sans-serif",
          fontSize: 43,
          fontWeight: 750,
          color: accent,
          marginBottom: 32,
          lineHeight: 1.05,
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 19,
        }}
      >
        {items.map((item: string, i: number) => {
          const q = fade(frame, (direction < 0 ? 20 : 40) + i * 6, 10);
          // Fade each change-list row in sequence to keep the comparison readable.
          return (
            <div
              key={item + i}
              style={{
                display: "flex",
                gap: 17,
                alignItems: "flex-start",
                opacity: q,
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: item.length > 28 ? 29 : 32,
                lineHeight: 1.18,
                color: lfTheme.white,
                fontWeight: 620,
              }}
            >
              <span
                style={{
                  width: 11,
                  height: 11,
                  flex: "0 0 11px",
                  borderRadius: 99,
                  background: accent,
                  marginTop: 12,
                  boxShadow: `0 0 12px ${accent}55`,
                }}
              />
              <span>{item}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  return (
    <AbsoluteFill>
      <Title title={title || "System change"} kicker="Before / after" />

      <div
        style={{
          position: "absolute",
          left: 180,
          right: 180,
          top: 320,
          bottom: 135,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 42,
        }}
      >
        {renderSide(
          beforeLabel,
          beforeItems,
          lfTheme.slate,
          leftP,
          -1
        )}

        <div
          style={{
            width: 95,
            textAlign: "center",
            fontFamily: "Space Grotesk, Arial, sans-serif",
            fontSize: 72,
            fontWeight: 750,
            color: lfTheme.teal,
            opacity: arrowP,
            transform: `scale(${0.86 + 0.14 * arrowP})`,
          }}
        >
          →
        </div>

        {renderSide(
          afterLabel,
          afterItems,
          lfTheme.teal,
          rightP,
          1
        )}
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
  id: "VA_LF_007",
  component: VALF007SystemDelta,
  schema: systemDeltaSchema,
  description: "Animated before/after system or software-version comparison with short change lists.",
  slots: Object.keys(systemDeltaSchema.shape),
  defaultDurationSec: 9,
  // Preview-only example values. Edit them here to see your changes in Studio.
  previewProps: {
    "beforeLabel": "Before",
    "afterLabel": "After",
    "beforeItems": [
      "Old logic",
      "Manual checks"
    ],
    "afterItems": [
      "Updated logic",
      "Automated checks"
    ]
  },
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 88,
};
