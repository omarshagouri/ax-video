import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRevealProgress } from "../shared_system/Timing";
import { lfTheme, toneColor, clamp01, linearPhase, enter, fade, titleSizeFor, Title, Footer, Panel, LegendPill } from "../shared_system/CoreVisuals";

const baseProps = { title: z.string().optional() };

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_005. */
export const timelineSchema = z.object({
  ...baseProps,
  milestones: z.array(
    z.object({
      label: z.string(),
      value: z.string().optional(),
      tone: z.enum(["teal", "heat", "cold", "white"]).optional(),
    })
  ).min(2).max(6),
  footer: z.string().optional(),
});

/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
export const VALF005Timeline: React.FC<any> = ({
  title,
  milestones,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, 7);
  const lineP = linearPhase(frame, 18, 40);

  const left = 150;
  const width = 1310;
  const y = 300;
  const step = width / Math.max(1, milestones.length - 1);

  // DRAWING: The JSX below creates the animated objects shown on screen.
  return (
    <AbsoluteFill>
      <Title title={title || "Timeline"} kicker="Milestones" />

      <Panel
        style={{
          position: "absolute",
          left: 155,
          top: 300,
          width: 1610,
          height: 590,
          opacity: p,
          transform: `translateY(${(1 - p) * 18}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left,
            top: y,
            width,
            height: 7,
            borderRadius: 10,
            background: lfTheme.navyLine,
          }}
        />
        <div
          style={{
            position: "absolute",
            left,
            top: y,
            width: width * lineP,
            height: 7,
            borderRadius: 10,
            background: lfTheme.teal,
            boxShadow: `0 0 20px ${lfTheme.teal}33`,
          }}
        />

        {milestones.map((m: any, i: number) => {
          const x = left + i * step;
          const revealAt = 20 + i * 8;
          const q = enter(frame, fps, revealAt, 145);
          const c = toneColor(m.tone);
          const labelSize =
            String(m.label || "").length > 14 ? 25 : 29;
          return (
            <div
              key={String(m.label) + i}
              style={{
                position: "absolute",
                left: x - 110,
                top: y - 150,
                width: 220,
                height: 300,
                textAlign: "center",
                opacity: q,
                transform: `translateY(${(1 - q) * 15}px)`,
              }}
            >
              <div
                style={{
                  height: 70,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  fontFamily: "Space Grotesk, Arial, sans-serif",
                  fontSize: 40,
                  fontWeight: 750,
                  color: c,
                  lineHeight: 1,
                }}
              >
                {m.value || ""}
              </div>

              <div
                style={{
                  width: 30,
                  height: 30,
                  margin: "55px auto 0",
                  borderRadius: "50%",
                  background: c,
                  border: `5px solid ${lfTheme.navySurface}`,
                  boxShadow: `0 0 24px ${c}66`,
                }}
              />

              <div
                style={{
                  marginTop: 33,
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: labelSize,
                  lineHeight: 1.15,
                  fontWeight: 650,
                  color: lfTheme.white,
                }}
              >
                {m.label}
              </div>
            </div>
          );
        })}
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
  id: "VA_LF_005",
  component: VALF005Timeline,
  schema: timelineSchema,
  description: "Animated milestone timeline for software, recalls, legal events, or development stages.",
  slots: Object.keys(timelineSchema.shape),
  defaultDurationSec: 9,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 76,
};
