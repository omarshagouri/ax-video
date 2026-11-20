import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRevealProgress } from "../shared_system/Timing";
import { lfTheme, toneColor, clamp01, linearPhase, enter, fade, titleSizeFor, Title, Footer, Panel, LegendPill } from "../shared_system/CoreVisuals";

const baseProps = { title: z.string().optional() };

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_007. */
export const systemDeltaSchema = z.object({
  ...baseProps,
  beforeLabel: z.string(),
  afterLabel: z.string(),
  beforeItems: z.array(z.string()).min(1).max(4),
  afterItems: z.array(z.string()).min(1).max(4),
  footer: z.string().optional(),
});

/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
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
          // DRAWING: The JSX below creates the animated objects shown on screen.
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


/** SETTINGS: Edit this block for this animation only. New files register automatically.
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
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 88,
};
