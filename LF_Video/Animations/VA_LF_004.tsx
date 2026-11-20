import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRevealProgress } from "../shared_system/Timing";
import { lfTheme, toneColor, clamp01, linearPhase, enter, fade, titleSizeFor, Title, Footer, Panel, LegendPill } from "../shared_system/CoreVisuals";

const baseProps = { title: z.string().optional() };

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_004. */
export const processFlowSchema = z.object({
  ...baseProps,
  nodes: z.array(z.string()).min(2).max(5),
  centerLabel: z.string().optional(),
  direction: z.enum(["forward", "reverse", "bidirectional"]).default("forward"),
  footer: z.string().optional(),
});

/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
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


/** SETTINGS: Edit this block for this animation only. New files register automatically.
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
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 86,
};
