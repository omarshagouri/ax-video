import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lfTheme, toneColor } from "./theme";

const fadeUp = (frame: number, fps: number, delay = 0) => {
  const f = Math.max(0, frame - delay);
  const p = spring({ frame: f, fps, config: { damping: 18, stiffness: 130, mass: 0.7 } });
  return {
    opacity: interpolate(p, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(p, [0, 1], [28, 0])}px)`,
  };
};

const sourceStyle: React.CSSProperties = {
  position: "absolute",
  left: 120,
  bottom: 70,
  fontFamily: "Inter, Arial, sans-serif",
  fontSize: 28,
  color: lfTheme.slate,
  letterSpacing: 0.2,
};

export const LFHook: React.FC<any> = ({ eyebrow, lines, footer }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "105px 120px", justifyContent: "center" }}>
      {eyebrow ? (
        <div style={{ ...fadeUp(frame, fps, 0), fontFamily: "Inter, Arial", fontWeight: 700, fontSize: 34, color: lfTheme.teal, letterSpacing: 5, marginBottom: 28 }}>
          {eyebrow.toUpperCase()}
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(lines || []).map((line: string, i: number) => (
          <div
            key={line + i}
            style={{
              ...fadeUp(frame, fps, i * 5),
              fontFamily: "Space Grotesk, Arial, sans-serif",
              fontWeight: 700,
              fontSize: i === 2 ? 110 : 125,
              lineHeight: 0.96,
              letterSpacing: -3,
              color: i === 2 ? lfTheme.teal : lfTheme.white,
            }}
          >
            {line}
          </div>
        ))}
      </div>
      {footer ? (
        <div style={{ ...fadeUp(frame, fps, 18), marginTop: 42, fontFamily: "Inter, Arial", fontSize: 38, color: lfTheme.slate }}>
          {footer}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const LFBeat: React.FC<any> = ({ kicker, title, subtitle, tone }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = toneColor(tone);
  return (
    <AbsoluteFill style={{ padding: "120px", justifyContent: "center" }}>
      {kicker ? (
        <div style={{ ...fadeUp(frame, fps, 0), color: accent, fontFamily: "Inter, Arial", fontWeight: 700, fontSize: 34, letterSpacing: 4, marginBottom: 24 }}>
          {kicker.toUpperCase()}
        </div>
      ) : null}
      <div style={{ ...fadeUp(frame, fps, 3), fontFamily: "Space Grotesk, Arial", fontWeight: 700, fontSize: 106, lineHeight: 1.02, letterSpacing: -2.5, color: lfTheme.white, maxWidth: 1540 }}>
        {title}
      </div>
      {subtitle ? (
        <div style={{ ...fadeUp(frame, fps, 10), fontFamily: "Inter, Arial", fontWeight: 600, fontSize: 42, lineHeight: 1.25, color: lfTheme.slate, maxWidth: 1450, marginTop: 28 }}>
          {subtitle}
        </div>
      ) : null}
      <div style={{ width: 180, height: 8, background: accent, borderRadius: 10, marginTop: 42, ...fadeUp(frame, fps, 14) }} />
    </AbsoluteFill>
  );
};

const Side: React.FC<any> = ({ side, frame, fps, delay }) => {
  const accent = toneColor(side.tone);
  return (
    <div
      style={{
        ...fadeUp(frame, fps, delay),
        flex: 1,
        minHeight: 520,
        borderRadius: 34,
        background: "rgba(20,36,64,0.88)",
        border: `2px solid ${lfTheme.navyLine}`,
        padding: "58px 62px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
      }}
    >
      <div style={{ fontFamily: "Inter, Arial", fontSize: 34, fontWeight: 700, letterSpacing: 3, color: accent }}>
        {side.label.toUpperCase()}
      </div>
      <div style={{ fontFamily: "Space Grotesk, Arial", fontSize: 106, fontWeight: 700, lineHeight: 0.96, letterSpacing: -3, color: lfTheme.white }}>
        {side.value}
      </div>
      {side.caption ? (
        <div style={{ fontFamily: "Inter, Arial", fontSize: 38, fontWeight: 600, lineHeight: 1.22, color: lfTheme.slate }}>
          {side.caption}
        </div>
      ) : <div />}
      <div style={{ height: 8, borderRadius: 8, background: accent, width: "100%" }} />
    </div>
  );
};

export const LFVersus: React.FC<any> = ({ title, left, right, source }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "88px 120px 105px" }}>
      {title ? (
        <div style={{ ...fadeUp(frame, fps, 0), fontFamily: "Space Grotesk, Arial", fontWeight: 700, fontSize: 72, color: lfTheme.white, marginBottom: 42 }}>
          {title}
        </div>
      ) : null}
      <div style={{ display: "flex", flex: 1, gap: 42, alignItems: "center" }}>
        <Side side={left} frame={frame} fps={fps} delay={3} />
        <div style={{ ...fadeUp(frame, fps, 8), fontFamily: "Space Grotesk, Arial", fontWeight: 700, fontSize: 48, color: lfTheme.slate }}>
          VS
        </div>
        <Side side={right} frame={frame} fps={fps} delay={8} />
      </div>
      {source ? <div style={sourceStyle}>Source: {source}</div> : null}
    </AbsoluteFill>
  );
};
