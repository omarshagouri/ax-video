import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  renderStill,
  selectComposition,
} from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const OUT = path.join(ROOT, "qa-output");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const cases = [
  {
    id: "VA-LF-001",
    durationFrames: 240,
    values: {
      title: "Gross capacity vs usable capacity",
      usablePct: 82,
      bufferPct: 18,
      usableLabel: "Usable",
      bufferLabel: "Reserve",
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-002",
    durationFrames: 240,
    values: {
      title: "Usable capacity change",
      beforeLabel: "Before",
      beforePct: 92,
      afterLabel: "After",
      afterPct: 84,
      deltaLabel: "−8 pts",
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-003",
    durationFrames: 270,
    values: {
      title: "Capacity trend",
      seriesALabel: "Observed",
      seriesA: [100, 98, 96, 94, 92, 90],
      seriesBLabel: "Reference",
      seriesB: [100, 99, 98, 97, 96, 95],
      xLabel: "Time",
      yLabel: "Capacity (%)",
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-004",
    durationFrames: 240,
    values: {
      title: "Charging control path",
      nodes: ["Charger", "BMS", "Pack", "Cells"],
      centerLabel: "Requested power is controlled by the vehicle",
      direction: "forward",
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-005",
    durationFrames: 270,
    values: {
      title: "Software timeline",
      milestones: [
        { label: "Baseline", value: "V1", tone: "white" },
        { label: "Update", value: "V2", tone: "teal" },
        { label: "Change", value: "V3", tone: "heat" },
        { label: "Validated", value: "V4", tone: "teal" },
      ],
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-006",
    durationFrames: 210,
    values: {
      title: "Fleet sample",
      value: 22700,
      decimals: 0,
      prefix: "",
      suffix: "+",
      label: "vehicles",
      tone: "teal",
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-007",
    durationFrames: 270,
    values: {
      title: "BMS strategy change",
      beforeLabel: "Before",
      afterLabel: "After",
      beforeItems: ["Fixed usable window", "Original calibration"],
      afterItems: ["Revised usable window", "Updated calibration"],
      footer: "Animation QA only",
    },
  },
];


const stressCases = [
  {
    id: "VA-LF-001",
    name: "stress",
    durationFrames: 240,
    values: {
      title: "What the driver can use vs what the pack keeps hidden",
      usablePct: 70,
      bufferPct: 10,
      usableLabel: "Daily usable",
      bufferLabel: "Protected reserve",
      footer: "Stress-test layout",
    },
  },
  {
    id: "VA-LF-002",
    name: "stress",
    durationFrames: 240,
    values: {
      title: "Usable battery capacity before and after a software change",
      beforeLabel: "Before software update",
      beforePct: 96,
      afterLabel: "After software update",
      afterPct: 81,
      deltaLabel: "−15 pts",
      footer: "Stress-test layout",
    },
  },
  {
    id: "VA-LF-003",
    name: "stress",
    durationFrames: 270,
    values: {
      title: "Real-world degradation trend by charging behavior",
      seriesALabel: "High-power DC charging",
      seriesA: [100, 99.2, 98.0, 96.7, 95.1, 93.4, 91.6, 90.2],
      seriesBLabel: "AC / lower-power",
      seriesB: [100, 99.5, 99.0, 98.4, 97.8, 97.0, 96.2, 95.4],
      xLabel: "Time",
      yLabel: "State of health (%)",
      footer: "Stress-test layout",
    },
  },
  {
    id: "VA-LF-004",
    name: "stress",
    durationFrames: 240,
    values: {
      title: "How charging power moves through the vehicle",
      nodes: ["Charger", "Vehicle BMS", "Pack controller", "Module", "Cells"],
      centerLabel: "Each stage can limit, route, or manage the requested power",
      direction: "forward",
      footer: "Stress-test layout",
    },
  },
  {
    id: "VA-LF-005",
    name: "stress",
    durationFrames: 270,
    values: {
      title: "From laboratory result to customer vehicles",
      milestones: [
        { label: "Lab prototype", value: "2025", tone: "white" },
        { label: "Vehicle pilot", value: "2026", tone: "teal" },
        { label: "Validation", value: "2027", tone: "teal" },
        { label: "Launch prep", value: "2028", tone: "heat" },
        { label: "Production", value: "2029", tone: "teal" },
        { label: "Customer fleet", value: "2030", tone: "teal" }
      ],
      footer: "Stress-test layout",
    },
  },
  {
    id: "VA-LF-006",
    name: "stress",
    durationFrames: 210,
    values: {
      title: "Estimated battery replacement exposure",
      value: 1234567,
      decimals: 0,
      prefix: "$",
      suffix: "",
      label: "illustrative total exposure",
      tone: "heat",
      footer: "Stress-test layout",
    },
  },
  {
    id: "VA-LF-007",
    name: "stress",
    durationFrames: 270,
    values: {
      title: "Battery-management strategy before and after an update",
      beforeLabel: "Before",
      afterLabel: "After",
      beforeItems: [
        "Fixed usable-energy window",
        "Original state-of-charge calibration",
        "Conservative power limit",
        "Earlier thermal threshold"
      ],
      afterItems: [
        "Revised usable-energy window",
        "Updated state-of-charge calibration",
        "Adaptive power limit",
        "Revised thermal threshold"
      ],
      footer: "Stress-test layout",
    },
  },
];

const serveUrl = await bundle({
  entryPoint: ENTRY,
  webpackOverride: (config) => config,
});

for (const test of cases) {
  const inputProps = {
    animationId: test.id,
    values: test.values,
    durationFrames: test.durationFrames,
  };

  const composition = await selectComposition({
    serveUrl,
    id: "AXAnimationPreview",
    inputProps,
  });

  const dir = path.join(OUT, test.id);
  fs.mkdirSync(dir, { recursive: true });

  const checkpoints = [
    { name: "t00_0.5s", frame: Math.min(test.durationFrames - 1, 15) },
    { name: "t01_1.5s", frame: Math.min(test.durationFrames - 1, 45) },
    { name: "t02_3.0s", frame: Math.min(test.durationFrames - 1, 90) },
    { name: "t03_mid", frame: Math.floor(test.durationFrames / 2) },
    { name: "t04_final", frame: test.durationFrames - 2 },
  ];

  for (const cp of checkpoints) {
    await renderStill({
      composition,
      serveUrl,
      output: path.join(dir, `${cp.name}.png`),
      inputProps,
      frame: cp.frame,
      imageFormat: "png",
    });
  }

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: path.join(dir, `${test.id}.mp4`),
    inputProps,
    concurrency: 2,
  });

  fs.writeFileSync(
    path.join(dir, "input.json"),
    JSON.stringify(test, null, 2)
  );
}


for (const test of stressCases) {
  const inputProps = {
    animationId: test.id,
    values: test.values,
    durationFrames: test.durationFrames,
  };

  const composition = await selectComposition({
    serveUrl,
    id: "AXAnimationPreview",
    inputProps,
  });

  const dir = path.join(OUT, "stress");
  fs.mkdirSync(dir, { recursive: true });

  for (const cp of [
    { name: "t01_1.5s", frame: Math.min(test.durationFrames - 1, 45) },
    { name: "t02_2.0s", frame: Math.min(test.durationFrames - 1, 60) },
    { name: "t04_final", frame: test.durationFrames - 2 },
  ]) {
    await renderStill({
      composition,
      serveUrl,
      output: path.join(dir, `${test.id}_${cp.name}.png`),
      inputProps,
      frame: cp.frame,
      imageFormat: "png",
    });
  }
}

console.log(`Rendered ${cases.length} canonical animations plus ${stressCases.length} stress layouts to ${OUT}`);
