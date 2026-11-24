import React from "react";
import { z } from "zod";
import { BatteryDiagram, PackSlab, packPoint } from "../shared_system/BatteryVisuals";
import { lfTheme } from "../shared_system/CoreVisuals";
import { reveal } from "../shared_system/EditorialVisuals";
import { useLFRevealProgress } from "../shared_system/Timing";
import { clampInteger } from "../src/clampNumeric";

const schema = z.object({
  title: z.string().trim().min(1).max(54),
  focus: z.enum(["all", "structure", "electrical", "cooling"]).default("all"),
  moduleColumns: clampInteger(2, 4).default(3),
});

const maxDurationSec = 7;
const background = { background: "bg.png", backgroundDim: 0.2 };

const coolingChannels = [
  [32, 34], [580, 34], [580, 102], [64, 102], [64, 172],
  [580, 172], [580, 242], [64, 242], [64, 312], [609, 312],
].map(([x, depth]) => packPoint(x, depth).join(",")).join(" ");

const VA_LF_021_Animation: React.FC<z.infer<typeof schema>> = ({ title, focus, moduleColumns }) => {
  const progress = useLFRevealProgress();
  const moduleWidth = (566 - (moduleColumns - 1) * 16) / moduleColumns;
  const layers = [
    {
      label: "Tray and lower shield",
      detail: "Support and underbody protection",
      category: "structure",
      color: lfTheme.slate,
      assembledY: 555,
      y: 691,
      anchorX: 898,
      cue: 0,
      drawing: <>
        <PackSlab width={660} length={366} height={27} color={lfTheme.slate} />
        <PackSlab x={13} depth={12} width={634} length={338} height={10} color={lfTheme.slate} />
      </>,
    },
    {
      label: "Cooling plate",
      detail: "Draws heat from the cells",
      category: "cooling",
      color: lfTheme.cold,
      assembledY: 543,
      y: 582,
      anchorX: 887,
      cue: 0.12,
      drawing: <>
        <PackSlab x={12} depth={10} width={636} length={346} color={lfTheme.cold} />
        <polyline points={coolingChannels} pathLength={1} fill="none" stroke={lfTheme.cold} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={1} strokeDashoffset={1 - reveal(progress, 0.21, 0.47)} />
      </>,
    },
    {
      label: "Cell modules",
      detail: "Cells grouped in housings",
      category: "electrical",
      color: lfTheme.teal,
      assembledY: 510,
      y: 464,
      anchorX: 843,
      cue: 0.24,
      drawing: [187, 28].map((depth) =>
        Array.from({ length: moduleColumns }, (_, column) => {
          const x = 40 + column * (moduleWidth + 16);
          const [frontX, frontY] = packPoint(x, depth);
          return (
            <g key={`${depth}-${column}`}>
              <PackSlab x={x} depth={depth} width={moduleWidth} length={137} height={27} color={lfTheme.teal} />
              <path
                d={[0.2, 0.4, 0.6, 0.8].map((fraction) => {
                  const mark = frontX + moduleWidth * fraction;
                  return `M${mark} ${frontY + 5}v16`;
                }).join(" ")}
                stroke={lfTheme.teal}
                strokeOpacity={0.65}
                strokeWidth={2}
              />
            </g>
          );
        }),
      ),
    },
    {
      label: "Busbars and controls",
      detail: "HV connector, sensors and BMS",
      category: "electrical",
      color: lfTheme.heat,
      assembledY: 488,
      y: 346,
      anchorX: 784,
      cue: 0.36,
      drawing: <>
        <PackSlab x={22} depth={26} width={602} length={310} height={8} color={lfTheme.navyLine} />
        <polyline points="67,3 412,3 479,-39 607,-39 640,1" fill="none" stroke={lfTheme.heat} strokeWidth={8} strokeLinejoin="round" />
        <path d="M155 -8 205 -89H464 M410 -2 460 -70H552" fill="none" stroke={lfTheme.teal} strokeWidth={3} strokeDasharray="6 5" />
        <circle cx={205} cy={-89} r={7} fill={lfTheme.teal} />
        <circle cx={552} cy={-70} r={7} fill={lfTheme.teal} />
        <PackSlab x={449} depth={202} width={114} length={84} height={10} color={lfTheme.teal} />
        <path d="M603 -99h65m-76 13h65" fill="none" stroke={lfTheme.teal} strokeWidth={3} />
        <rect x={613} y={-3} width={51} height={26} rx={6} fill={lfTheme.heat} />
        <path d="M629 3v14m17-14v14" stroke={lfTheme.navy} strokeWidth={4} />
      </>,
    },
    {
      label: "Upper lid",
      detail: "Closes the pack enclosure",
      category: "structure",
      color: lfTheme.slate,
      assembledY: 475,
      y: 209,
      anchorX: 899,
      cue: 0.06,
      drawing: <>
        <PackSlab width={660} length={366} height={16} color={lfTheme.slate} />
        <path d="M137 -62H677 M194 -100H733" fill="none" stroke={lfTheme.slate} strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round" />
      </>,
    },
  ];

  return (
    <BatteryDiagram title={title} footer="Generic underfloor pack. Component placement varies by design.">
      <path d="M 74 222 V 691 M 954 65 V 533" stroke={lfTheme.slate} strokeWidth={2} strokeDasharray="7 10" fill="none" opacity={0.45 * reveal(progress, 0.42, 0.72)} />
      {layers.map(({ label, detail, category, color, assembledY, y, anchorX, cue, drawing }) => {
        const lift = reveal(progress, cue, cue + 0.47);
        const labelOpacity = reveal(progress, cue + 0.39, cue + 0.59);
        const accent = focus === "all" || focus === category ? color : lfTheme.slate;
        const anchorY = assembledY + (y - assembledY) * lift - 112;
        return (
          <g key={label}>
            <g transform={`translate(74 ${assembledY + (y - assembledY) * lift})`}>{drawing}</g>
            <g opacity={labelOpacity}>
              <path d={`M ${anchorX} ${anchorY} H 953 L 1022 ${y - 17} H 1068`} stroke={accent} strokeWidth={2} fill="none" />
              <circle cx={anchorX} cy={anchorY} r={5} fill={accent} />
              <text x={1090} y={y - 7} fontSize={35} fontWeight={720}>{label}</text>
              <text x={1090} y={y + 32} fontSize={27} fill={accent}>{detail}</text>
            </g>
          </g>
        );
      })}
    </BatteryDiagram>
  );
};

export const animation = {
  id: "VA_LF_021",
  name: "Inside EV Battery Pack",
  component: VA_LF_021_Animation,
  schema,
  slots: Object.keys(schema.shape),
  description: "Exploded layers of a generic underfloor EV battery pack.",
  maxDurationSec,
  defaultDurationSec: maxDurationSec,
  previewProps: { title: "Inside an EV battery pack", focus: "all", moduleColumns: 3 },
  ...background,
};
