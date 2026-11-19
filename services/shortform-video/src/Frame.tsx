import React from "react";
import { AbsoluteFill, staticFile, Img } from "remotion";
import { theme } from "./theme";

/**
 * The brand stage: navy base + optional baked background.
 * Drop your existing background.png into /public to enable the texture
 * (same asset the old ax-render used). Falls back to solid navy if absent.
 */
const HAS_BG = true; // uses public/background.png (same asset as ax-render)

export const Frame: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.navy }}>
      {HAS_BG ? (
        <Img
          src={staticFile("background.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
