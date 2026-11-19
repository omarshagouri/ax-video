import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRevealProgress } from "../shared system/Timing";
import { lfTheme, toneColor, clamp01, linearPhase, enter, fade, titleSizeFor, Title, Footer, Panel, LegendPill } from "../shared system/CoreVisuals";

const baseProps = { title: z.string().optional() };

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_001. */
export const batteryBufferSchema = z.object({
  ...baseProps,
  usablePct: clampNumeric(0, 100),
  bufferPct: clampNumeric(0, 100).default(0),
  usableLabel: z.string().optional().default("Usable"),
  bufferLabel: z.string().optional().default("Reserve"),
  footer: z.string().optional(),
});

/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
export const VALF001BatteryBuffer: React.FC<any> = ({
  title,
  usablePct,
  bufferPct,
  usableLabel,
  bufferLabel,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const usable = Math.min(100, Math.max(0, Number(usablePct)));
  const reserve = Math.min(100 - usable, Math.max(0, Number(bufferPct)));
  const remaining = Math.max(0, 100 - usable - reserve);

  const shellP = enter(frame, fps, 9);
  const usableP = linearPhase(frame, 16, 30);
  const reserveP = linearPhase(frame, 38, 18);
  const labelP = fade(frame, 42, 10);

  // DRAWING: The JSX below creates the animated objects shown on screen.
  return (
    <AbsoluteFill>
      <Title
        title={title || "Gross capacity vs usable capacity"}
        kicker="Battery architecture"
      />

      <div
        style={{
          position: "absolute",
          left: 210,
          right: 210,
          top: 330,
          height: 420,
          opacity: shellP,
          transform: `translateY(${(1 - shellP) * 18}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            top: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          <span
            style={{
              fontSize: 27,
              fontWeight: 700,
              color: lfTheme.slate,
              letterSpacing: 1.2,
            }}
          >
            PACK CAPACITY WINDOW
          </span>
          <span
            style={{
              padding: "8px 15px",
              borderRadius: 999,
              fontSize: 25,
              fontWeight: 800,
              color: lfTheme.white,
              background: "rgba(20,36,64,0.9)",
              border: `1px solid ${lfTheme.navyLine}`,
            }}
          >
            GROSS 100%
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 55,
            right: 55,
            top: 78,
            height: 210,
            border: `5px solid ${lfTheme.slate}`,
            borderRadius: 32,
            padding: 14,
            display: "flex",
            overflow: "visible",
            background: "rgba(20,36,64,0.68)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${usable * usableP}%`,
              background: lfTheme.teal,
              borderRadius: "16px 5px 5px 16px",
              boxShadow: `0 0 34px ${lfTheme.teal}22`,
            }}
          />
          <div
            style={{
              height: "100%",
              width: `${reserve * reserveP}%`,
              background: lfTheme.heat,
              opacity: 0.96,
              marginLeft: reserve > 0 ? 4 : 0,
              borderRadius: "5px",
              boxShadow: `0 0 28px ${lfTheme.heat}22`,
            }}
          />
          <div
            style={{
              height: "100%",
              flex: 1,
              marginLeft: remaining > 0 ? 4 : 0,
              background: "rgba(36,55,90,0.82)",
              borderRadius: "5px 16px 16px 5px",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 44,
              height: 96,
              right: -49,
              top: 56,
              borderRadius: "0 14px 14px 0",
              background: lfTheme.slate,
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 325,
            display: "flex",
            justifyContent: "center",
            gap: 18,
            opacity: labelP,
          }}
        >
          <LegendPill
            color={lfTheme.teal}
            label={usableLabel || "Usable"}
            value={`${Math.round(usable)}%`}
          />
          {reserve > 0 ? (
            <LegendPill
              color={lfTheme.heat}
              label={bufferLabel || "Reserve"}
              value={`${Math.round(reserve)}%`}
            />
          ) : null}
          {remaining > 0.5 ? (
            <LegendPill
              color={lfTheme.navyLine}
              label="Remaining"
              value={`${Math.round(remaining)}%`}
            />
          ) : null}
        </div>
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
  id: "VA_LF_001",
  component: VALF001BatteryBuffer,
  schema: batteryBufferSchema,
  description: "Animated battery fill with usable, reserve, and optional remaining regions.",
  slots: Object.keys(batteryBufferSchema.shape),
  defaultDurationSec: 8,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 68,
};
