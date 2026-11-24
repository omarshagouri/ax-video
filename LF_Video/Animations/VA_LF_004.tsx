/**
 * VA_LF_004 — Animated process/energy-flow diagram with 2-5 nodes and a repeating flow pulse.
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
export const processFlowSchema = z.object({
  ...baseProps,
  nodes: z.array(z.string()).min(2).max(5),
  centerLabel: z.string().optional(),
  direction: z.enum(["forward", "reverse", "bidirectional"]).default("forward"),
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
export const VALF004ProcessFlow: React.FC<any> = ({
  title,
  nodes,
  centerLabel,
  direction,
  footer,
}) => {
  const frame = useCurrentFrame();
  const progress = useLFRevealProgress();
  const { fps } = useVideoConfig();
  // Staged story: contextual label, node, connector, next node, then moving flow.
  const reveal = (start: number, end: number) => {
    const p = clamp01((progress - start) / (end - start));
    return 1 - Math.pow(1 - p, 3);
  };
  const sequenceStep = 0.54 / (2 * nodes.length - 1);
  const n = nodes.length;
  const panelP = enter(frame, fps, 7);
  const flowStart = 48;
  const loopFrames = Math.round(fps * 1.9);
  const loopP =
    frame < flowStart ? 0 : ((frame - flowStart) % loopFrames) / loopFrames;

  const panelLeft = 155;
  const panelWidth = 1610;
  const innerLeft = 95;
  const innerRight = 95;
  const usableW = panelWidth - innerLeft - innerRight;
  const gap = n <= 3 ? 90 : 62;
  const nodeW = Math.min(280, (usableW - gap * (n - 1)) / n);
  const nodeH = 165;
  const y = 245;
  const positions = nodes.map(
    (_: string, i: number) => innerLeft + i * (nodeW + gap)
  );

  const connectorStart = positions[0] + nodeW;
  const connectorEnd = positions[n - 1];
  const pulseX = connectorStart + (connectorEnd - connectorStart) * loopP;

  // DRAWING: The JSX below creates the animated objects shown on screen.
  return (
    <AbsoluteFill>
      <Title title={title || "Energy flow"} kicker="Process diagram" />

      <Panel
        style={{
          position: "absolute",
          left: panelLeft,
          top: 285,
          width: panelWidth,
          height: 620,
          opacity: panelP,
          transform: `translateY(${(1 - panelP) * 18}px)`,
        }}
      >
        {centerLabel ? (
          <div
            style={{
              position: "absolute",
              left: 90,
              right: 90,
              top: 45,
              textAlign: "center",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: 29,
              lineHeight: 1.25,
              fontWeight: 650,
              color: lfTheme.slate,
              opacity: reveal(0.12, 0.24),
            }}
          >
            {centerLabel}
          </div>
        ) : null}

        <svg
          width={panelWidth}
          height="620"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {positions.slice(0, -1).map((x: number, i: number) => {
            const x1 = x + nodeW;
            const x2 = positions[i + 1];
            const midY = y + nodeH / 2;
            return (
              <g key={i} opacity={reveal(0.20 + (2 * i + 1) * sequenceStep, 0.20 + (2 * i + 2) * sequenceStep)}>
                <line
                  x1={x1 + 12}
                  y1={midY}
                  x2={x2 - 12}
                  y2={midY}
                  stroke={lfTheme.navyLine}
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={midY + 12}
                  textAnchor="middle"
                  fill={lfTheme.teal}
                  fontFamily="Inter"
                  fontSize="37"
                  fontWeight="700"
                >
                  {direction === "reverse"
                    ? "←"
                    : direction === "bidirectional"
                    ? "↔"
                    : "→"}
                </text>
              </g>
            );
          })}

          {frame >= flowStart && connectorEnd > connectorStart ? (
            <circle
              cx={pulseX}
              cy={y + nodeH / 2}
              r="13"
              fill={lfTheme.teal}
              opacity={0.98 * reveal(0.79, 0.91)}
            />
          ) : null}
        </svg>

        {nodes.map((node: string, i: number) => {
          const q = reveal(0.20 + 2 * i * sequenceStep, 0.20 + (2 * i + 1) * sequenceStep);
          return (
            <div
              key={node + i}
              style={{
                position: "absolute",
                left: positions[i],
                top: y,
                width: nodeW,
                height: nodeH,
                boxSizing: "border-box",
                border: `2px solid ${
                  i === 0 || i === n - 1
                    ? lfTheme.teal + "88"
                    : lfTheme.navyLine
                }`,
                borderRadius: 23,
                background: "rgba(20,36,64,0.92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 22px",
                textAlign: "center",
                fontFamily: "Space Grotesk, Arial, sans-serif",
                fontSize: node.length > 13 ? 30 : 34,
                lineHeight: 1.08,
                fontWeight: 700,
                color: lfTheme.white,
                opacity: q,
                transform: `scale(${0.95 + 0.05 * q})`,
              }}
            >
              {node}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: 100,
            right: 100,
            bottom: 48,
            textAlign: "center",
            fontFamily: "Inter, Arial, sans-serif",
            color: lfTheme.teal,
            fontSize: 27,
            fontWeight: 750,
            letterSpacing: 0.4,
            opacity: reveal(0.88, 0.98),
          }}
        >
          {direction === "reverse"
            ? "REVERSE FLOW"
            : direction === "bidirectional"
            ? "BIDIRECTIONAL FLOW"
            : "FORWARD FLOW"}
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
  id: "VA_LF_004",
  component: VALF004ProcessFlow,
  schema: processFlowSchema,
  description: "Animated process/energy-flow diagram with 2-5 nodes and a repeating flow pulse.",
  slots: Object.keys(processFlowSchema.shape),
  defaultDurationSec: 8,
  // Preview-only example values. Edit them here to see your changes in Studio.
  previewProps: {
    "nodes": [
      "Charger",
      "BMS",
      "Pack",
      "Cells"
    ],
    "centerLabel": "Vehicle controls charging power",
    "direction": "forward"
  },
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 86,
};
