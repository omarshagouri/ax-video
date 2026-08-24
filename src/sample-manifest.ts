import { VideoManifest } from "./manifest";

/**
 * Demo manifest built from real AX-017 data. Shows several card types and
 * reuses VC-SF-004 (beats 1 & 2) on purpose - the exact case that froze before.
 * Here it just renders twice, cleanly. Drop an mp3 in /public + set audio[].src
 * for sound.
 */
export const sampleManifest: VideoManifest = {
  video_id: "AX-017-SF",
  fps: 30,
  width: 1080,
  height: 1920,
  timeline: [
    {
      beat: 1,
      component: "VC-SF-004",
      props: {
        KICKER: "Tesla Model Y Owner Report",
        HOOK: "Nine percent battery lost in year one.",
      },
      startFrame: 0,
      durationFrames: 90,
      track: "card",
    },
    {
      beat: 2,
      component: "VC-SF-004", // reused card - the old freeze case
      props: {
        KICKER: "Real-World Data",
        HOOK: "Faster degradation than most owners expect.",
      },
      startFrame: 90,
      durationFrames: 90,
      track: "card",
    },
    {
      beat: 3,
      component: "VC-SF-002",
      props: {
        TITLE: "Year 1 vs Year 2 loss",
        VALUE_A: "9",
        LABEL_A: "Year 1 (%)",
        VALUE_B: "4",
        LABEL_B: "Year 2 (%)",
        SOURCE: "Owner-reported, single vehicle",
      },
      startFrame: 180,
      durationFrames: 105,
      track: "card",
    },
    {
      beat: 4,
      component: "VC-SF-011",
      props: {
        HEADER: "What drives early loss",
        ITEM1: "Frequent DC fast charging",
        ITEM2: "High states of charge at rest",
        ITEM3: "Heat exposure",
        REVEAL: 3,
      },
      startFrame: 285,
      durationFrames: 150,
      track: "card",
    },
    {
      beat: 5,
      component: "VC-SF-003",
      props: {
        TAG: "Engineer's Note",
        STATEMENT: "Year-one loss front-loads. The curve flattens after.",
        ROLE: "Practicing battery engineer",
      },
      startFrame: 435,
      durationFrames: 120,
      track: "card",
    },
    {
      beat: 6,
      component: "VC-SF-006", // rendered via HtmlCard (original css/body/seek)
      props: {
        TERM: "State of Health (SoH)",
        DEFINITION: "Usable capacity now vs when the pack was new.",
      },
      startFrame: 555,
      durationFrames: 105,
      track: "card",
    },
  ],
  audio: [
    // { chapter: 1, src: "AX-017-SF_Audio_1.mp3", startFrame: 0, durationFrames: 555 },
  ],
  captions: [
    { word: "Nine", startFrame: 6, endFrame: 20 },
    { word: "percent", startFrame: 20, endFrame: 40 },
    { word: "battery", startFrame: 44, endFrame: 62 },
    { word: "lost", startFrame: 62, endFrame: 78 },
    { word: "in", startFrame: 78, endFrame: 84 },
    { word: "year", startFrame: 84, endFrame: 96 },
    { word: "one.", startFrame: 96, endFrame: 108 },
  ],
};
