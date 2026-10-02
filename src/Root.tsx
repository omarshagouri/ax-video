import React from "react";
import { Composition } from "remotion";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Video } from "./Video";
import { sampleManifest } from "./sample-manifest";
import { totalFrames, VideoManifest } from "./manifest";
import { LongFormChapter } from "./longform/LongFormChapter";
import { ax002OpeningManifest } from "./longform/sample-ax002-opening";
import { LFChapterManifest, totalLongFormFrames } from "./longform/types";

// Existing Shorts font load.
const { waitUntilDone: waitSpaceGrotesk } = loadSpaceGrotesk("normal", {
  weights: ["500", "600", "700"],
});

// Long-form cards deliberately use Inter for support text.
const { waitUntilDone: waitInter } = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
});

const waitForBrandFonts = async () => {
  await Promise.all([waitSpaceGrotesk(), waitInter()]);
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Existing Shorts composition. Do not change its ID or behavior. */}
      <Composition
        id="AmpCoreX"
        component={Video}
        fps={sampleManifest.fps}
        width={sampleManifest.width}
        height={sampleManifest.height}
        durationInFrames={totalFrames(sampleManifest)}
        defaultProps={{ manifest: sampleManifest }}
        calculateMetadata={async ({ props }) => {
          await waitForBrandFonts();
          const m = props.manifest as VideoManifest;
          return {
            durationInFrames: totalFrames(m),
            fps: m.fps,
            width: m.width,
            height: m.height,
          };
        }}
      />

      {/* Isolated 16:9 long-form chapter composition. */}
      <Composition
        id="AmpCoreXLongFormChapter"
        component={LongFormChapter}
        fps={ax002OpeningManifest.fps}
        width={ax002OpeningManifest.width}
        height={ax002OpeningManifest.height}
        durationInFrames={totalLongFormFrames(ax002OpeningManifest)}
        defaultProps={{ manifest: ax002OpeningManifest }}
        calculateMetadata={async ({ props }) => {
          await waitForBrandFonts();
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
