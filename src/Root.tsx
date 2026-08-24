import React from "react";
import { Composition } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { Video } from "./Video";
import { sampleManifest } from "./sample-manifest";
import { totalFrames, VideoManifest } from "./manifest";

// Load the brand font (weights the cards use). waitUntilDone() blocks render
// until it's ready so nothing pops.
const { waitUntilDone } = loadFont("normal", {
  weights: ["500", "600", "700"],
});

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AmpCoreX"
      component={Video}
      fps={sampleManifest.fps}
      width={sampleManifest.width}
      height={sampleManifest.height}
      durationInFrames={totalFrames(sampleManifest)}
      defaultProps={{ manifest: sampleManifest }}
      calculateMetadata={async ({ props }) => {
        await waitUntilDone();
        const m = props.manifest as VideoManifest;
        return {
          durationInFrames: totalFrames(m),
          fps: m.fps,
          width: m.width,
          height: m.height,
        };
      }}
    />
  );
};
