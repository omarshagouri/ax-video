import React from "react";
import { AbsoluteFill, staticFile, Img } from "remotion";
import { theme } from "../shared system/theme";

/** Shared image layer. Each animation can select another file from public/. */
export const Frame: React.FC<{ background?: string; dim?: number }> = ({ background = "bg.png", dim = 0 }) => (
  <AbsoluteFill style={{ backgroundColor: theme.navy }}>
    <Img
      src={staticFile(background)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
    {dim > 0 ? <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${Math.max(0, Math.min(1, dim))})` }} /> : null}
  </AbsoluteFill>
);
