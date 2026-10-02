import React from "react";
import { AbsoluteFill } from "remotion";
import { lfTheme } from "./theme";

export const LFBackground: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: lfTheme.navy,
      backgroundImage: `
        radial-gradient(circle at 78% 18%, rgba(0,212,170,0.13), transparent 30%),
        linear-gradient(125deg, transparent 0%, transparent 54%, rgba(0,212,170,0.08) 55%, transparent 61%),
        linear-gradient(rgba(36,55,90,0.22) 1px, transparent 1px),
        linear-gradient(90deg, rgba(36,55,90,0.20) 1px, transparent 1px)
      `,
      backgroundSize: "auto, auto, 88px 88px, 88px 88px",
    }}
  />
);
