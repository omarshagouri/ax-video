import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { useLFPacedFrame as useCurrentFrame, useLFRevealProgress } from "./Timing";
import { theme } from "./theme";

export const lfTheme = {
  ...theme,
  navySurface: "#142440",
  navyLine: "#24375A",
  slate: "#8CA0B8",
  heatDeep: "#FF4D4D",
};

export const toneColor = (tone?: string) => {
  if (tone === "heat") return lfTheme.heat;
  if (tone === "cold") return lfTheme.cold;
  if (tone === "white") return lfTheme.white;
  return lfTheme.teal;
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const linearPhase = (frame: number, start: number, duration: number) =>
  clamp01((frame - start) / Math.max(1, duration));

export const enter = (frame: number, fps: number, delay = 0, stiffness = 120) => {
  const p = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 19, stiffness, mass: 0.72 },
  });
  return clamp01(p);
};

export const fade = (frame: number, start: number, duration = 12) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const titleSizeFor = (title: string) => {
  if (title.length > 54) return 54;
  if (title.length > 40) return 60;
  return 66;
};

export const Title: React.FC<{ title?: string; kicker?: string }> = ({
  title,
  kicker,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!title && !kicker) return null;
  const p = enter(frame, fps, 0);
  const t = title || "";
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        top: 62,
        opacity: p,
        transform: `translateY(${(1 - p) * 16}px)`,
      }}
    >
      {kicker ? (
        <div
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 27,
            fontWeight: 700,
            color: lfTheme.teal,
            letterSpacing: 4.2,
            marginBottom: 12,
          }}
        >
          {kicker.toUpperCase()}
        </div>
      ) : null}
      {title ? (
        <div
          style={{
            maxWidth: 1580,
            fontFamily: "Space Grotesk, Arial, sans-serif",
            fontSize: titleSizeFor(t),
            fontWeight: 700,
            color: lfTheme.white,
            lineHeight: 1.05,
            letterSpacing: -1.1,
          }}
        >
          {title}
        </div>
      ) : null}
    </div>
  );
};

export const Footer: React.FC<{ text?: string }> = ({ text }) =>
  text ? (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 42,
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: 25,
        color: lfTheme.slate,
        lineHeight: 1.25,
      }}
    >
      {text}
    </div>
  ) : null;

export const Panel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(10,22,40,0.68)",
      border: `2px solid ${lfTheme.navyLine}`,
      borderRadius: 28,
      boxShadow: "0 22px 70px rgba(0,0,0,0.22)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const LegendPill: React.FC<{
  color: string;
  label: string;
  value: string;
  opacity?: number;
}> = ({ color, label, value, opacity = 1 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 18px",
      borderRadius: 999,
      background: "rgba(20,36,64,0.86)",
      border: `1px solid ${lfTheme.navyLine}`,
      opacity,
      fontFamily: "Inter, Arial, sans-serif",
      color: lfTheme.white,
      fontSize: 27,
      fontWeight: 650,
      whiteSpace: "nowrap",
    }}
  >
    <span
      style={{
        width: 13,
        height: 13,
        borderRadius: 99,
        background: color,
        boxShadow: `0 0 16px ${color}55`,
      }}
    />
    <span style={{ color: lfTheme.slate }}>{label}</span>
    <span style={{ fontWeight: 800, color: lfTheme.white }}>{value}</span>
  </div>
);

