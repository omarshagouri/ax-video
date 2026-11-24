import React from "react";
import { z } from "zod";
import { BatteryDiagram, DiagramPanel } from "../shared_system/BatteryVisuals";
import { lfTheme } from "../shared_system/CoreVisuals";
import { reveal } from "../shared_system/EditorialVisuals";
import { useLFRevealProgress } from "../shared_system/Timing";
import { clampNumeric } from "../src/clampNumeric";

const schema = z.object({
  title: z.string().trim().min(1).max(54),
  cellVoltage: clampNumeric(2.5, 4.5),
  cellCapacityAh: clampNumeric(1, 300),
});

const maxDurationSec = 7;
const background = { background: "bg.png", backgroundDim: 0.2 };
const formatNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const wire = { fill: "none", stroke: lfTheme.slate, strokeWidth: 4, strokeLinecap: "round" } as const;

/** The long plate is positive. Both symbols are drawn from minus to plus, left to right. */
const Cell: React.FC<{ x: number; y: number; showPolarity?: boolean }> = ({ x, y, showPolarity }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-18-14v28 M18-26v52" stroke={lfTheme.white} strokeWidth={5} />
    {showPolarity && (
      <g fontSize={24} textAnchor="middle">
        <text x={-19} y={-42} fill={lfTheme.cold}>−</text>
        <text x={19} y={-42} fill={lfTheme.teal}>+</text>
      </g>
    )}
  </g>
);

const WiringPanel: React.FC<{
  series: boolean;
  progress: number;
  cellVoltage: number;
  cellCapacityAh: number;
}> = ({ series, progress, cellVoltage, cellCapacityAh }) => {
  const accent = series ? lfTheme.teal : lfTheme.cold;
  const values = [
    { label: "Voltage", formula: series ? "2 × cell voltage" : "Same as one cell", value: `${formatNumber.format(series ? 2 * cellVoltage : cellVoltage)} V` },
    { label: "Charge capacity", formula: series ? "Same as one cell" : "2 × cell capacity", value: `${formatNumber.format(series ? cellCapacityAh : 2 * cellCapacityAh)} Ah` },
  ];
  return (
    <DiagramPanel x={series ? 0 : 864} width={816} height={455}>
      <text x={36} y={56} fontSize={40} fontWeight={740}>{series ? "Series" : "Parallel"}</text>
      <text x={36} y={95} fontSize={25} fill={lfTheme.slate}>{series ? "Positive connects to negative" : "Positive to positive, negative to negative"}</text>
      <g opacity={reveal(progress, 0.08, 0.29)}>
        {series ? (
          <>
            <path d="M94 222H242 M278 222H538 M574 222H722" {...wire} />
            <Cell x={260} y={222} showPolarity />
            <Cell x={556} y={222} showPolarity />
          </>
        ) : (
          <>
            <path d="M94 222H148 M668 222H722 M390 168H148V274H390 M426 168H668V274H426" {...wire} />
            <circle cx={148} cy={222} r={6} fill={lfTheme.slate} />
            <circle cx={668} cy={222} r={6} fill={lfTheme.slate} />
            <Cell x={408} y={168} showPolarity />
            <Cell x={408} y={274} showPolarity />
          </>
        )}
        <circle cx={94} cy={222} r={9} stroke={lfTheme.cold} fill={lfTheme.navy} strokeWidth={4} />
        <circle cx={722} cy={222} r={9} stroke={lfTheme.teal} fill={lfTheme.navy} strokeWidth={4} />
        <text x={94} y={198} textAnchor="middle" fill={lfTheme.cold}>−</text>
        <text x={722} y={198} textAnchor="middle" fill={lfTheme.teal}>+</text>
      </g>
      <path d="M36 315H780" stroke={lfTheme.navyLine} strokeWidth={2} />
      {values.map(({ label, formula, value }, index) => (
        <g key={label} transform={`translate(${36 + index * 402} 0)`} opacity={reveal(progress, 0.28 + index * 0.11, 0.46 + index * 0.11)}>
          <text y={351} fontSize={24} fill={lfTheme.slate}>{label}</text>
          <text y={399} fontSize={41} fontWeight={760} fill={accent}>{value}</text>
          <text y={432} fontSize={23}>{formula}</text>
        </g>
      ))}
    </DiagramPanel>
  );
};

const VA_LF_023_Animation: React.FC<z.infer<typeof schema>> = ({ title, cellVoltage, cellCapacityAh }) => {
  const progress = useLFRevealProgress();

  return (
    <BatteryDiagram
      title={title}
      footer={`Identical example cells · ${formatNumber.format(cellVoltage)} V and ${formatNumber.format(cellCapacityAh)} Ah per cell. Taycan specifications · AX-LF-009, chapter 4.`}
    >
      <WiringPanel series progress={progress} cellVoltage={cellVoltage} cellCapacityAh={cellCapacityAh} />
      <WiringPanel series={false} progress={progress} cellVoltage={cellVoltage} cellCapacityAh={cellCapacityAh} />
      <g opacity={reveal(progress, 0.53, 0.77)}>
        <DiagramPanel y={483} width={1680} height={273}>
          <text x={36} y={54} fontSize={34} fontWeight={740}>Original Taycan · smaller Performance Battery</text>
          <path d="M44 133H424 M566 133H744" {...wire} />
          <path d="M424 133H566" {...wire} strokeDasharray="4 16" />
          {[80, 286, 592].map((x) => (
            <g key={x} transform={`translate(${x} 95)`}>
              <rect x={-8} y={-4} width={116} height={84} rx={14} fill={lfTheme.navy} stroke={lfTheme.navyLine} strokeWidth={2} />
              <path d="M-8 38H10M90 38h18 M41 19H10V57H41 M59 19H90V57H59" {...wire} strokeWidth={2.5} />
              <g transform="translate(50 19) scale(0.5)"><Cell x={0} y={0} /></g>
              <g transform="translate(50 57) scale(0.5)"><Cell x={0} y={0} /></g>
            </g>
          ))}
          <text x={36} y={229} fontSize={27} fill={lfTheme.slate}>168 groups in series · 2 cells in parallel per group</text>
          <path d="M884 93v142" stroke={lfTheme.navyLine} strokeWidth={2} />
          <g opacity={reveal(progress, 0.68, 0.98)}>
            <text x={942} y={157} fontSize={51} fontWeight={760} fill={lfTheme.teal}>336 cells</text>
            <text x={1290} y={157} fontSize={51} fontWeight={760} fill={lfTheme.cold}>520–720 V</text>
            <text x={942} y={201} fontSize={25} fill={lfTheme.slate}>168 × 2</text>
            <text x={1290} y={201} fontSize={25} fill={lfTheme.slate}>Pack voltage range</text>
          </g>
        </DiagramPanel>
      </g>
    </BatteryDiagram>
  );
};

export const animation = {
  id: "VA_LF_023",
  name: "Series and Parallel Wiring",
  component: VA_LF_023_Animation,
  schema,
  slots: Object.keys(schema.shape),
  description: "Two-cell series and parallel circuits with voltage and charge capacity, plus a 168s2p pack example.",
  maxDurationSec,
  defaultDurationSec: maxDurationSec,
  previewProps: { title: "Series and parallel wiring", cellVoltage: 3.7, cellCapacityAh: 5 },
  ...background,
};
