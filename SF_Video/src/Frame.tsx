import React from "react";
import { AbsoluteFill, staticFile, Img } from "remotion";
import { theme } from "./theme";

/**
 * The brand stage: navy base + optional baked background.
 * The background texture is bundled at /public/bg.png.
 * (same asset the old ax-render used). Falls back to solid navy if absent.
 */
const HAS_BG = true; // The same art is used by the Python card renderer.

export const Frame: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.navy }}>
      {HAS_BG ? (
        <Img
          src={staticFile("bg.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
