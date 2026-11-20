import React from "react";
import { Composition } from "remotion";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Video } from "./Video";
import { sampleManifest } from "./sample-manifest";
import { totalFrames, VideoManifest } from "./manifest";
import { LongFormChapter } from "./longform/LongFormChapter";
import { openingManifest } from "./longform/sample-opening";
import { LFChapterManifest, totalLongFormFrames } from "./longform/types";

const { waitUntilDone: waitSpaceGrotesk } = loadSpaceGrotesk("normal", {
  weights: ["500", "600", "700"],
});

const { waitUntilDone: waitInter } = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
});

const waitForFonts = async () => {
  await Promise.all([waitSpaceGrotesk(), waitInter()]);
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AXVideo"
        component={Video}
        fps={sampleManifest.fps}
        width={sampleManifest.width}
        height={sampleManifest.height}
        durationInFrames={totalFrames(sampleManifest)}
        defaultProps={{ manifest: sampleManifest }}
        calculateMetadata={async ({ props }) => {
          await waitForFonts();
          const m = props.manifest as VideoManifest;
          return {
            durationInFrames: totalFrames(m),
            fps: m.fps,
            width: m.width,
            height: m.height,
          };
        }}
      />

      <Composition
        id="AXLongFormChapter"
        component={LongFormChapter}
        fps={openingManifest.fps}
        width={openingManifest.width}
        height={openingManifest.height}
        durationInFrames={totalLongFormFrames(openingManifest)}
        defaultProps={{ manifest: openingManifest }}
        calculateMetadata={async ({ props }) => {
          await waitForFonts();
          const m = props.manifest as LFChapterManifest;
          return {
            durationInFrames: totalLongFormFrames(m),
            fps: m.fps,
            width: m.width,
            height: m.height,
          };
        }}
      />
    </>
  );
};
