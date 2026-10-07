import { LFChapterManifest } from "./types";

export const animationLibrarySample: LFChapterManifest = {
  video_id: "VA-LF-LIBRARY-TEST",
  chapter: 1,
  chapter_title: "Long-Form Animation Library V1",
  fps: 30,
  width: 1920,
  height: 1080,
  audio_src: "",
  timeline: [
    {
      id: "a1",
      type: "animation",
      component: "VA-LF-001",
      startFrame: 0,
      durationFrames: 240,
      props: {
        title: "Gross capacity vs usable capacity",
        usablePct: 82,
        bufferPct: 10,
        usableLabel: "Usable",
        bufferLabel: "Reserve",
        footer: "Illustrative values for animation QA only"
      }
    },
    {
      id: "a2",
      type: "animation",
      component: "VA-LF-002",
      startFrame: 240,
      durationFrames: 240,
      props: {
        title: "Usable capacity change",
        beforeLabel: "Before",
        beforePct: 92,
        afterLabel: "After",
        afterPct: 84,
        deltaLabel: "−8 pts",
        footer: "Illustrative values for animation QA only"
      }
    },
    {
      id: "a3",
      type: "animation",
      component: "VA-LF-003",
      startFrame: 480,
      durationFrames: 270,
      props: {
        title: "Capacity trend",
        seriesALabel: "Observed",
        seriesA: [100, 98, 96, 94, 92, 90],
        seriesBLabel: "Reference",
        seriesB: [100, 99, 98, 97, 96, 95],
        xLabel: "Time",
        yLabel: "Capacity",
        footer: "Illustrative values for animation QA only"
      }
    },
    {
      id: "a4",
      type: "animation",
      component: "VA-LF-004",
      startFrame: 750,
      durationFrames: 240,
      props: {
        title: "Charging control path",
        nodes: ["Charger", "BMS", "Pack", "Cells"],
        centerLabel: "Requested power is controlled by the vehicle",
        direction: "forward",
        footer: "Reusable process-flow pattern"
      }
    },
    {
      id: "a5",
      type: "animation",
      component: "VA-LF-005",
      startFrame: 990,
      durationFrames: 270,
      props: {
        title: "Software timeline",
        milestones: [
          { label: "Baseline", value: "V1", tone: "white" },
          { label: "Update", value: "V2", tone: "teal" },
          { label: "Change", value: "V3", tone: "heat" }
        ],
        footer: "Reusable chronology pattern"
      }
    },
    {
      id: "a6",
      type: "animation",
      component: "VA-LF-006",
      startFrame: 1260,
      durationFrames: 210,
      props: {
        title: "Fleet sample",
        value: 22700,
        decimals: 0,
        suffix: "+",
        label: "vehicles",
        tone: "teal",
        footer: "Illustrative QA value"
      }
    },
    {
      id: "a7",
      type: "animation",
      component: "VA-LF-007",
      startFrame: 1470,
      durationFrames: 270,
      props: {
        title: "BMS strategy change",
        beforeLabel: "Before",
        afterLabel: "After",
        beforeItems: ["Fixed usable window", "Original calibration"],
        afterItems: ["Revised usable window", "Updated calibration"],
        footer: "Reusable system-change pattern"
      }
    }
  ]
};
