import { VideoManifest } from "./manifest";

export const sampleManifest: VideoManifest = {
  video_id: "AX-LF-TEST-001-C01",
  fps: 30,
  width: 1920,
  height: 1080,
  timeline: [
    {
      beat: 1,
      component: "VC-LF-001",
      props: { KICKER: "BATTERY HEALTH", NUM: "87", PCT: "%" },
      startFrame: 0,
      durationFrames: 90,
      track: "card",
    },
  ],
  audio: [],
};
