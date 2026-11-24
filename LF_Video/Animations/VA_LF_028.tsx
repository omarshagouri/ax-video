import React from "react";
import { z } from "zod";
import { BatteryDiagram, DiagramArrow, DiagramPanel, PackSlab } from "../shared_system/BatteryVisuals";
import { lfTheme } from "../shared_system/CoreVisuals";
import { reveal } from "../shared_system/EditorialVisuals";
import { useLFRevealProgress } from "../shared_system/Timing";

const schema = z.object({ title: z.string().trim().min(1).max(54) });
const maxDurationSec = 7;
const background = { background: "bg.png", backgroundDim: 0.2 };

const layers = [
  {
    label: "Cooling",
    y: 579,
    color: lfTheme.cold,
    drawing: <>
      <PackSlab width={405} length={191} height={23} color={lfTheme.slate} />
      <g transform="translate(0 -26)">
        <PackSlab x={7} depth={6} width={391} length={179} height={10} color={lfTheme.cold} />
        <path d="M39-13H360l24-16H62l24-16h322l24-16H110" fill="none" stroke={lfTheme.cold} strokeWidth={4} strokeLinejoin="round" />
      </g>
    </>,
  },
  {
    label: "BMS electronics",
    y: 445,
    color: lfTheme.teal,
    drawing: <>
      <PackSlab x={216} depth={26} width={180} length={128} height={13} color={lfTheme.teal} />
      <path d="M267-31h76l32-22h60M319-17h76l32-22h33" fill="none" stroke={lfTheme.teal} strokeWidth={3} />
      <PackSlab x={295} depth={71} width={44} length={45} height={6} color={lfTheme.slate} />
    </>,
  },
  {
    label: "Cells",
    y: 352,
    color: lfTheme.teal,
    drawing: [105, 28].map((depth) => (
      <g key={depth}>
        {[20, 117, 214, 311].map((x) => (
          <PackSlab key={x} x={x} depth={depth} width={82} length={65} height={24} color={lfTheme.teal} />
        ))}
      </g>
    )),
  },
  {
    label: "Interconnects",
    y: 254,
    color: lfTheme.heat,
    drawing: <>
      <PackSlab x={12} depth={14} width={380} length={160} height={6} color={lfTheme.navyLine} />
      <path d="M46-18h319l75-51H121 M136-18l75-51m19 51 77-51m16 51 78-51" stroke={lfTheme.heat} strokeWidth={6} fill="none" strokeLinecap="round" />
    </>,
  },
  {
    label: "Enclosure",
    y: 160,
    color: lfTheme.slate,
    drawing: <>
      <PackSlab width={405} length={191} height={13} color={lfTheme.slate} />
      <path d="M86-32h341M122-57h341" fill="none" stroke={lfTheme.slate} strokeWidth={3} strokeOpacity={0.65} />
    </>,
  },
];

const Manufacturing: React.FC<{ progress: number }> = ({ progress }) => (
  <DiagramPanel width={991} height={748}>
    <text x={40} y={61} fontSize={40} fontWeight={740}>Manufacturing cost</text>
    {layers.map(({ label, y, color, drawing }, index) => {
      const cue = 0.05 * (layers.length - 1 - index);
      const lift = reveal(progress, cue, cue + 0.41);
      const compactY = 478 - index * 20;
      const anchorY = label === "Cooling" ? y - 47 : y - 33;
      return (
        <g key={label}>
          <g transform={`translate(51 ${compactY + (y - compactY) * lift})`}>{drawing}</g>
          <g opacity={reveal(progress, cue + 0.31, cue + 0.49)}>
            <path d={`M530 ${anchorY}H599l25 16h39`} stroke={color} strokeWidth={2} fill="none" />
            <circle cx={530} cy={anchorY} r={4} fill={color} />
            <text x={682} y={anchorY + 26} fontSize={30}>{label}</text>
          </g>
        </g>
      );
    })}
    <g opacity={reveal(progress, 0.51, 0.70)}>
      <path d="M41 640H950" stroke={lfTheme.navyLine} strokeWidth={2} />
      <text x={41} y={697} fontSize={30} fill={lfTheme.teal}>Assembly</text>
      <text x={198} y={697} fontSize={27} fill={lfTheme.slate}>Parts fitted and tested as a pack</text>
    </g>
  </DiagramPanel>
);

const repairSteps = [
  { label: "Diagnose the fault", y: 148 },
  { label: "Check manufacturer procedures", y: 266 },
  { label: "Module service approved?", y: 384 },
];

const RepairScope: React.FC<{ progress: number }> = ({ progress }) => (
  <DiagramPanel x={1031} width={649} height={748}>
    <text x={40} y={61} fontSize={40} fontWeight={740}>Repair scope</text>
    <text x={40} y={105} fill={lfTheme.slate} fontSize={26}>Fault and approved procedure</text>
    {repairSteps.map(({ label, y }, index) => (
      <g key={label} opacity={reveal(progress, 0.31 + index * 0.1, 0.48 + index * 0.1)}>
        {index > 0 && <DiagramArrow from={[324.5, y - 45]} to={[324.5, y - 6]} color={lfTheme.slate} width={3} />}
        <rect x={40} y={y} width={569} height={72} rx={14} fill={lfTheme.navySurface} stroke={lfTheme.navyLine} strokeWidth={2} />
        <text x={324.5} y={y + 46} fontSize={28} textAnchor="middle">{label}</text>
      </g>
    ))}
    <g opacity={reveal(progress, 0.69, 0.93)}>
      <path d="M324.5 456V486H173 M324.5 486H476" stroke={lfTheme.slate} strokeWidth={3} fill="none" />
      {[
        { label: "Module service", answer: "Yes", x: 173, color: lfTheme.teal },
        { label: "Pack-level action", answer: "No", x: 476, color: lfTheme.cold },
      ].map(({ label, answer, x, color }) => (
        <g key={answer}>
          <DiagramArrow from={[x, 486]} to={[x, 549]} color={color} width={3} />
          <text x={x + 17} y={526} fontSize={23} fill={color}>{answer}</text>
          <rect x={x - 132} y={557} width={264} height={76} rx={14} fill={lfTheme.navySurface} stroke={color} strokeWidth={2} />
          <text x={x} y={605} textAnchor="middle" fontSize={27} fill={color}>{label}</text>
        </g>
      ))}
    </g>
  </DiagramPanel>
);

const VA_LF_028_Animation: React.FC<z.infer<typeof schema>> = ({ title }) => {
  const progress = useLFRevealProgress();
  return (
    <BatteryDiagram title={title} footer="A repair quote depends on approved work, parts and labour.">
      <Manufacturing progress={progress} />
      <RepairScope progress={progress} />
    </BatteryDiagram>
  );
};

export const animation = {
  id: "VA_LF_028",
  name: "Battery Pack Cost and Repair Layers",
  component: VA_LF_028_Animation,
  schema,
  slots: Object.keys(schema.shape),
  description: "Battery pack manufacturing cost categories and a service-policy decision flow.",
  maxDurationSec,
  defaultDurationSec: maxDurationSec,
  previewProps: { title: "Battery pack cost and repair layers" },
  ...background,
};
