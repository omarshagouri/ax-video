import React from "react";
import { Composition, Still } from "remotion";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Video } from "./Video";
import { nativeClips } from "./clips";
import { Dashboard, DashboardProps } from "./Dashboard";
import { Thumbnail } from "./Thumbnail";
import { AnimationPreview, AnimationPreviewProps } from "./AnimationPreview";
import { sampleManifest } from "./sample-manifest";
import { totalFrames, VideoManifest } from "./manifest";
import { validateTimeline } from "./registry";

const { waitUntilDone: waitSpace } = loadSpaceGrotesk("normal", {
  weights: ["500", "600", "700"],
});
const { waitUntilDone: waitInter } = loadInter("normal", {
  weights: ["500", "600", "700"],
});

const waitForFonts = async () => {
  await Promise.all([waitSpace(), waitInter()]);
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="AXLongForm"
      component={Video}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={totalFrames(sampleManifest)}
      defaultProps={{ manifest: sampleManifest }}
      calculateMetadata={async ({ props }) => {
        await waitForFonts();
        const m = props.manifest as VideoManifest;
        const errors = validateTimeline(m.timeline);
        if (errors.length) {
          throw new Error("Invalid LF visual plan: " + errors.slice(0, 12).join("; "));
        }
        return {
          durationInFrames: totalFrames(m),
          fps: m.fps,
          width: 1920,
          height: 1080,
        };
      }}
    />

    <Composition
      id="AXAnimationPreview"
      component={AnimationPreview}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={240}
      defaultProps={{
        animationId: "VA_LF_001",
        values: {
          title: "Gross capacity vs usable capacity",
          usablePct: 82,
          bufferPct: 18,
          usableLabel: "Usable",
          bufferLabel: "Reserve",
          footer: "Animation QA",
        },
        durationFrames: 240,
      }}
      calculateMetadata={async ({ props }) => {
        await waitForFonts();
        const p = props as AnimationPreviewProps;
        return {
          durationInFrames: Math.max(1, Number(p.durationFrames || 240)),
          fps: 30,
          width: 1920,
          height: 1080,
        };
      }}
    />

    <Composition
      id="AXClipPreview"
      component={({ clipId, title, footer }: { clipId: string; title?: string; footer?: string }) => {
        const Clip = nativeClips[clipId]?.component ?? nativeClips["VV-LF-001"].component;
        return <Clip title={title} footer={footer} />;
      }}
      fps={30} width={1920} height={1080} durationInFrames={90}
      defaultProps={{ clipId: "VV-LF-001", title: "Inside a battery pack", footer: "" }}
    />

    <Composition
      id="AXDashboardPreview"
      component={Dashboard}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={180}
      defaultProps={{
        title: "SETTINGS",
        subtitle: "Update in progress",
        mainValue: "",
        mainUnit: "",
        progress: 38,
        detail: "SYSTEM CHECK",
        status: "READY",
        backgroundSrc: "",
        __holdFrames: 180,
      }}
      calculateMetadata={async ({ props }) => {
        await waitForFonts();
        const p = props as DashboardProps;
        const frames = Math.round(Number(p.__holdFrames ?? 180));
        if (!Number.isInteger(frames) || frames < 90 || frames > 450) {
          throw new Error("Dashboard duration must be 90–450 frames at 30 fps");
        }
        return { durationInFrames: frames, fps: 30, width: 1920, height: 1080 };
      }}
    />

    <Still
      id="AXThumbnail"
      component={Thumbnail}
      width={1280}
      height={720}
      defaultProps={{
        backgroundSrc: "",
        logoSrc: "",
        series: "BATTERY INTELLIGENCE",
        headline: "Battery intelligence",
        subhead: "",
      }}
    />
  </>
);
