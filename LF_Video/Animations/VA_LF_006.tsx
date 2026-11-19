import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRevealProgress } from "../shared system/Timing";
import { lfTheme, toneColor, clamp01, linearPhase, enter, fade, titleSizeFor, Title, Footer, Panel, LegendPill } from "../shared system/CoreVisuals";

const baseProps = { title: z.string().optional() };

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_006. */
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

/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
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


/** SETTINGS: Edit this block for this animation only. New files register automatically.
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
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 79,
};
