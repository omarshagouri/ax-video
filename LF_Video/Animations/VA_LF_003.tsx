import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRevealProgress } from "../shared_system/Timing";
import { lfTheme, toneColor, clamp01, linearPhase, enter, fade, titleSizeFor, Title, Footer, Panel, LegendPill } from "../shared_system/CoreVisuals";

const baseProps = { title: z.string().optional() };

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_003. */
export const lineChartSchema = z.object({
  ...baseProps,
  seriesALabel: z.string().optional().default("A"),
  seriesA: z.array(z.number()).min(2),
  seriesBLabel: z.string().optional().default("B"),
  seriesB: z.array(z.number()).min(2).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  footer: z.string().optional(),
});

const makePath = (
  values: number[],
  w: number,
  h: number,
  min: number,
  max: number
) => {
  const range = Math.max(1e-6, max - min);
  return values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
};

const fmtAxis = (v: number) => {
  if (Math.abs(v) >= 100) return String(Math.round(v));
  if (Math.abs(v) >= 10) return v.toFixed(1).replace(/\.0$/, "");
  return v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
export const VALF003LineChart: React.FC<any> = ({
  title,
  seriesALabel,
  seriesA,
  seriesBLabel,
  seriesB,
  xLabel,
  yLabel,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, 7);
  const draw = linearPhase(frame, 20, 42);
  const all = [...seriesA, ...(seriesB || [])].map(Number);
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const spread = Math.max(1e-6, rawMax - rawMin);
  const niceStep =
    spread <= 1 ? 0.2 :
    spread <= 5 ? 1 :
    spread <= 15 ? 5 :
    spread <= 40 ? 10 :
    spread <= 100 ? 20 :
    spread <= 250 ? 50 : 100;
  let min = Math.floor(rawMin / niceStep) * niceStep;
  let max = Math.ceil(rawMax / niceStep) * niceStep;
  if (min === max) max = min + niceStep;

  const chartW = 1320;
  const chartH = 430;
  const originX = 110;
  const originY = 62;

  const aPath = makePath(seriesA.map(Number), chartW, chartH, min, max);
  const bPath = seriesB
    ? makePath(seriesB.map(Number), chartW, chartH, min, max)
    : "";

  const lastA = Number(seriesA[seriesA.length - 1]);
  const lastB = seriesB ? Number(seriesB[seriesB.length - 1]) : null;
  const yFor = (v: number) => originY + chartH - ((v - min) / (max - min)) * chartH;

  // DRAWING: The JSX below creates the animated objects shown on screen.
  return (
    <AbsoluteFill>
      <Title title={title || "Trend over time"} kicker="Animated chart" />

      <Panel
        style={{
          position: "absolute",
          left: 155,
          right: 155,
          top: 275,
          height: 650,
          opacity: p,
          transform: `translateY(${(1 - p) * 18}px)`,
        }}
      >
        <svg
          width="1610"
          height="620"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g}
              x1={originX}
              y1={originY + chartH * g}
              x2={originX + chartW}
              y2={originY + chartH * g}
              stroke={lfTheme.navyLine}
              strokeWidth={g === 1 ? 4 : 2}
              opacity={g === 1 ? 1 : 0.72}
            />
          ))}
          <line
            x1={originX}
            y1={originY}
            x2={originX}
            y2={originY + chartH}
            stroke={lfTheme.navyLine}
            strokeWidth="4"
          />

          <path
            d={aPath}
            transform={`translate(${originX},${originY})`}
            fill="none"
            stroke={lfTheme.teal}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - draw}
          />
          {seriesB ? (
            <path
              d={bPath}
              transform={`translate(${originX},${originY})`}
              fill="none"
              stroke={lfTheme.slate}
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - draw}
            />
          ) : null}

          {draw > 0.98 ? (
            <>
              <circle
                cx={originX + chartW}
                cy={yFor(lastA)}
                r="10"
                fill={lfTheme.teal}
              />
              {lastB !== null ? (
                <circle
                  cx={originX + chartW}
                  cy={yFor(lastB)}
                  r="9"
                  fill={lfTheme.slate}
                />
              ) : null}
            </>
          ) : null}

          <text
            x="30"
            y={originY + 8}
            fill={lfTheme.slate}
            fontFamily="Inter"
            fontSize="25"
          >
            {fmtAxis(max)}
          </text>
          <text
            x="30"
            y={originY + chartH + 8}
            fill={lfTheme.slate}
            fontFamily="Inter"
            fontSize="25"
          >
            {fmtAxis(min)}
          </text>
        </svg>

        <div
          style={{
            position: "absolute",
            left: originX,
            top: 22,
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 26,
            color: lfTheme.slate,
            fontWeight: 650,
          }}
        >
          {yLabel || ""}
        </div>

        <div
          style={{
            position: "absolute",
            right: 180,
            top: 24,
            display: "flex",
            gap: 28,
            padding: "10px 16px",
            borderRadius: 999,
            background: "rgba(20,36,64,0.82)",
            border: `1px solid ${lfTheme.navyLine}`,
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 25,
            fontWeight: 700,
          }}
        >
          <span style={{ color: lfTheme.teal }}>
            ● {seriesALabel || "A"}
          </span>
          {seriesB ? (
            <span style={{ color: lfTheme.slate }}>
              ● {seriesBLabel || "B"}
            </span>
          ) : null}
        </div>

        <div
          style={{
            position: "absolute",
            right: 175,
            bottom: 34,
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 26,
            color: lfTheme.slate,
            fontWeight: 650,
          }}
        >
          {xLabel || ""}
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
  id: "VA_LF_003",
  component: VALF003LineChart,
  schema: lineChartSchema,
  description: "Animated one- or two-series line chart drawn over time.",
  slots: Object.keys(lineChartSchema.shape),
  defaultDurationSec: 9,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 73,
};
