import { buildLongFormChapter } from "./types";

/**
 * AX-002-LF visual control test.
 *
 * This is intentionally NOT a new creative direction. It recreates the visual
 * grammar of the successful hand-made opening so we can compare automated
 * output against the Canva reference before building the full LF pipeline.
 *
 * Audio is blank in the sample. The Make/Drive chapter audio URL can be passed
 * as audio_src later. Chapter audio must stay <= ~1–2 minutes by workflow rule.
 */
export const ax002OpeningManifest = buildLongFormChapter({
  video_id: "AX-002-LF-CONTROL",
  chapter: 1,
  chapter_title: "Opening + Cycle-Life Gap",
  fps: 30,
  width: 1920,
  height: 1080,
  audio_src: "",
  scenes: [
    {
      id: "hook-one-ev-two-chemistries",
      type: "hook",
      durationSec: 4.5,
      props: {
        eyebrow: "LFP VS NMC",
        lines: ["ONE EV", "ONE MODEL", "TWO CHEMISTRIES"],
        footer: "Same machine. Different battery underneath.",
      },
    },
    {
      id: "pattern-runs-backwards",
      type: "beat",
      durationSec: 4.0,
      props: {
        kicker: "THE PARADOX",
        title: "A PATTERN RUNS BACKWARDS",
        tone: "teal",
      },
    },
    {
      id: "longer-life-bigger-drop",
      type: "versus",
      durationSec: 6.5,
      props: {
        title: "The dashboard can tell the opposite story",
        left: {
          label: "Longer life",
          value: "BIGGER DROP",
          caption: "The chemistry expected to outlast the car",
          tone: "heat",
        },
        right: {
          label: "Shorter life",
          value: "BARELY MOVES",
          caption: "The chemistry with the weaker cycle-life rating",
          tone: "teal",
        },
      },
    },
    {
      id: "numbers-wrong",
      type: "beat",
      durationSec: 4.0,
      props: {
        kicker: "OPTION 1",
        title: "Either the durability numbers are wrong…",
        tone: "heat",
      },
    },
    {
      id: "dashboard-measures-something-else",
      type: "beat",
      durationSec: 5.0,
      props: {
        kicker: "OPTION 2",
        title: "…or the dashboard is measuring something else.",
        tone: "teal",
      },
    },
    {
      id: "cycle-life-gap",
      type: "beat",
      durationSec: 3.5,
      props: {
        kicker: "CHAPTER 1",
        title: "THE CYCLE-LIFE GAP",
        subtitle: "Start with the lab numbers.",
        tone: "teal",
      },
    },
    {
      id: "lfp-vs-nmc-cycles",
      type: "versus",
      durationSec: 12.5,
      props: {
        title: "Typical full cycles before ~80% capacity",
        left: {
          label: "LFP",
          value: "3,000–6,000",
          caption: "Lithium iron phosphate",
          tone: "teal",
        },
        right: {
          label: "NMC",
          value: "1,000–2,000",
          caption: "Nickel manganese cobalt",
          tone: "heat",
        },
        source: "AX-002-LF control script — source tag to be replaced by final verified source",
      },
    },
  ],
});
