/**
 * VA_LF_014 — Image-backed dashboard with a deterministic sequence of on-screen data slots.
 *
 * SEVEN EDITING SECTIONS (all local to THIS animation):
 * 1. ANIMATION SETTINGS — see the final 'animation' object (section 7).
 * 2. EDITABLE TEXT AND VALUES — input schema, labels and numeric limits below.
 * 3. COLORS AND SIZES — JSX styles and local dashboard styles; fontSize, width, height, fill.
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
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampNumericValue } from "../src/clampNumeric";

// Fixed 1920x1080 slot geometry. The supplied image owns all baked-in dashboard labels.
/** INPUTS: SECTION 2 — EDITABLE TEXT AND VALUES.
 * This schema defines accepted labels, numeric controls and defaults.
 * z.string() handles text; clampNumeric(min,max) bounds a numeric control;
 * .default(value) supplies a fallback when an input is omitted.
 * Change the local values here, without editing shared_system code.
 */
export const dashboardSchema = z.object({
  title: z.string().trim().min(1).max(22),
  subtitle: z.string().trim().max(36).optional().default(""),
  mainValue: z.string().trim().max(12).optional().default(""),
  mainUnit: z.string().trim().max(10).optional().default(""),
  progress: clampNumeric(0, 100).optional(),
  detail: z.string().trim().max(38).optional().default(""),
  status: z.string().trim().max(24).optional().default(""),
  backgroundSrc: z.string().optional().default(""),
  backgroundFileId: z.string().optional(),
  __holdFrames: z.number().int().positive().optional(),
}).strict();

export type DashboardProps = z.infer<typeof dashboardSchema>;
const CYAN = "#36D5CD";
const MUTED = "#B4C9D1";
const easeOut = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const clamp = (x: number) => Math.max(0, Math.min(1, x));

/** Display sequence: title -> subtitle -> optional value -> gauge -> detail -> status. */
/** VISUAL: SECTION 3 — COLORS AND SIZES.
 * Edit fill/background/color, fontSize, width and height in the JSX styles.
 * Use the imported local dashboard styles for consistent shared colors when appropriate.
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
export const Dashboard: React.FC<DashboardProps> = ({
  title, subtitle = "", mainValue = "", mainUnit = "", progress,
  detail = "", status = "", backgroundSrc = "", __holdFrames,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const frames = Math.max(1, __holdFrames ?? durationInFrames);
  const at = (start: number, span = 0.12) => clamp((frame / frames - start) / span);
  const appear = (start: number) => easeOut(at(start));
  const boundedProgress = progress === undefined ? undefined : clampNumericValue(progress, 0, 100);
  const progressP = easeOut(at(0.35, 0.38));
  const opacity = (start: number) => appear(start);
  const metric = mainValue.trim().length > 0;
  const barTop = metric ? 407 : 287;

  const label: React.CSSProperties = {
    fontFamily: "'Space Grotesk', Inter, Arial, sans-serif",
    textAlign: "center", textShadow: "0 2px 18px #000c",
  };

  // DRAWING: The JSX below creates the animated objects shown on screen.
  return (
    <AbsoluteFill style={{ backgroundColor: "#02090F", overflow: "hidden" }}>
      <Img src={backgroundSrc || staticFile("VA_LF_014_bg.png")} style={{
        width: "100%", height: "100%", objectFit: "fill",
      }} />
      {/* Coordinates are local to the empty center screen; all other baked UI stays untouched. */}
      <div style={{
        position: "absolute", left: 610, top: 292, width: 820, height: 582,
        display: "flex", flexDirection: "column", alignItems: "center",
        pointerEvents: "none",
      }}>
        <div style={{
          ...label, fontSize: title.length > 16 ? 48 : 61,
          fontWeight: 700, letterSpacing: 1, lineHeight: 1.12, color: CYAN,
          opacity: opacity(0.04), transform: `translateY(${(1 - appear(0.04)) * 20}px)`,
          width: "100%", whiteSpace: "nowrap",
        }}>{title}</div>
        {subtitle ? <div style={{
          ...label, fontSize: 32, lineHeight: 1.2, fontWeight: 600,
          color: CYAN, marginTop: 20, width: "100%",
          opacity: opacity(0.19),
        }}>{subtitle}</div> : null}
        {metric ? (
          <div style={{
            ...label, position: "absolute", top: 171, width: "100%",
            color: "#E9FFFF", opacity: opacity(0.31), whiteSpace: "nowrap",
          }}>
            <span style={{ fontWeight: 700, fontSize: mainValue.length > 7 ? 65 : 98 }}>{mainValue}</span>
            <span style={{ fontWeight: 500, fontSize: 34, marginLeft: 10, color: CYAN }}>{mainUnit}</span>
          </div>
        ) : null}
        {progress !== undefined ? (
          <div style={{ position: "absolute", top: barTop, width: 544, opacity: opacity(0.38) }}>
            <div style={{ height: 18, borderRadius: 12, overflow: "hidden",
              border: "1px solid #2B514F", background: "rgba(7,28,29,.88)",
              boxShadow: "0 0 18px #1E817555" }}>
              <div style={{ height: "100%", width: `${(boundedProgress ?? 0) * progressP}%`,
                background: "linear-gradient(90deg,#72E9BE,#22B6AE)",
                boxShadow: "0 0 24px #4AF9CB", borderRadius: 12 }} />
            </div>
            <div style={{
              ...label, marginTop: 14, fontSize: 22, color: MUTED,
              opacity: opacity(0.51),
            }}>{Math.round((boundedProgress ?? 0) * progressP)}%</div>
          </div>
        ) : null}
        {detail ? <div style={{
          ...label, position: "absolute", top: metric ? 495 : 393,
          width: "100%", color: MUTED, fontSize: 23, fontWeight: 550,
          opacity: opacity(0.67),
        }}>{detail}</div> : null}
        {status ? <div style={{
          // Keep the final status clear of the detail line when a large metric is shown.
          ...label, position: "absolute", top: metric && detail ? 550 : 521,
          color: "#74E5C8", fontSize: 23, fontWeight: 700,
          letterSpacing: 2.5, opacity: opacity(0.81),
        }}>{status}</div> : null}
      </div>
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
  id: "VA_LF_014",
  component: Dashboard,
  schema: dashboardSchema,
  description: "Image-backed dashboard with a deterministic sequence of on-screen data slots.",
  slots: Object.keys(dashboardSchema.shape),
  defaultDurationSec: 6,
  background: "VA_LF_014_bg.png",
  backgroundDim: 0,
  authoredEndFrame: undefined,
};
