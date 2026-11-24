import React from "react";
import { z } from "zod";
import { BatteryDiagram, DiagramArrow, DiagramPanel } from "../shared_system/BatteryVisuals";
import { lfTheme } from "../shared_system/CoreVisuals";
import { reveal } from "../shared_system/EditorialVisuals";
import { useLFRevealProgress } from "../shared_system/Timing";

const schema = z.object({ title: z.string().trim().min(1).max(54) });
const maxDurationSec = 7;
const background = { background: "bg.png", backgroundDim: 0.2 };

// Coolant circulates from the pump through the cold plate, then the heat exchanger and back.
const loop = "M304 558V338H490V314H576V360H658V314H740V360H822V314H904V360H986V314H1078V338H1308V558Z";
const tube = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

const VA_LF_025_Animation: React.FC<z.infer<typeof schema>> = ({ title }) => {
  const progress = useLFRevealProgress();
  const circulation = reveal(progress, 0.19, 0.43);
  const heatFlow = reveal(progress, 0.41, 0.68);

  return (
    <BatteryDiagram title={title} footer="Example liquid-cooled system. Loop layout and hardware vary by vehicle.">
      <DiagramPanel width={1680} height={748}>
        <path d="M44 60h36" stroke={lfTheme.teal} strokeWidth={6} strokeLinecap="round" />
        <text x={96} y={69} fill={lfTheme.teal}>Coolant</text>
        <path d="M44 105h36" stroke={lfTheme.heat} strokeWidth={6} strokeLinecap="round" />
        <text x={96} y={114} fill={lfTheme.heat}>Heat transfer</text>

        <text x={784} y={97} textAnchor="middle" fontSize={32}>Cells</text>
        {[0, 1, 2, 3, 4, 5].map((cell) => (
          <g key={cell} transform={`translate(${459 + cell * 109} 119)`}>
            <rect width={100} height={117} rx={12} fill={lfTheme.navySurface} stroke={lfTheme.cold} strokeWidth={2} />
            <path d="M15 26h70m-70 19h70m-70 19h70" stroke={lfTheme.cold} strokeWidth={2} strokeOpacity={0.45} />
            <path d="M24 0v-8h13v8m26 0v-8h13v8" fill="none" stroke={lfTheme.slate} strokeWidth={3} />
          </g>
        ))}
        <rect x={450} y={236} width={668} height={19} fill={lfTheme.slate} fillOpacity={0.52} />
        <rect x={450} y={255} width={668} height={139} rx={9} fill={lfTheme.navySurface} stroke={lfTheme.cold} strokeWidth={2} />
        <text x={1139} y={252} fill={lfTheme.slate} fontSize={25}>Thermal interface</text>
        <text x={1139} y={293} fontSize={27}>Cold plate</text>

        <path d={loop} {...tube} stroke="#243F58" strokeWidth={19} />
        <path d={loop} {...tube} stroke={lfTheme.teal} strokeWidth={5} opacity={0.65 * circulation} />
        <path d={loop} {...tube} pathLength={100} stroke={lfTheme.teal} strokeWidth={9} strokeDasharray="2 6" strokeDashoffset={-progress * 152} opacity={circulation} />
        <g opacity={circulation}>
          <DiagramArrow from={[304, 468]} to={[304, 404]} color={lfTheme.teal} width={6} />
          <DiagramArrow from={[750, 360]} to={[810, 360]} color={lfTheme.teal} width={6} />
          <DiagramArrow from={[1308, 399]} to={[1308, 467]} color={lfTheme.teal} width={6} />
          <DiagramArrow from={[886, 558]} to={[824, 558]} color={lfTheme.teal} width={6} />
        </g>

        <circle cx={304} cy={558} r={43} fill={lfTheme.navySurface} stroke={lfTheme.teal} strokeWidth={3} />
        <path d="M302 531q24 6 20 25l9 16q-19 14-31-4l-19 1q-4-21 16-24Z" fill={lfTheme.teal} fillOpacity={0.78} />
        <circle cx={304} cy={558} r={6} fill={lfTheme.navy} />
        <text x={304} y={644} textAnchor="middle">Pump</text>

        <rect x={1014} y={511} width={257} height={93} rx={13} fill={lfTheme.navySurface} stroke={lfTheme.slate} strokeWidth={2} />
        <path d="M1042 526v62m33-62v62m33-62v62m33-62v62m33-62v62m33-62v62m33-62v62" stroke={lfTheme.slate} strokeOpacity={0.5} strokeWidth={4} />
        <path d="M1014 558h257" stroke={lfTheme.teal} strokeWidth={5} opacity={circulation} />
        <text x={1143} y={484} textAnchor="middle">Heat exchanger</text>

        <g opacity={heatFlow}>
          {[510, 620, 730, 840, 950, 1060].map((x) => (
            <DiagramArrow key={x} from={[x, 219]} to={[x, 282 + 15 * heatFlow]} color={lfTheme.heat} width={5} />
          ))}
          {[1065, 1143, 1221].map((x) => (
            <DiagramArrow key={x} from={[x, 581]} to={[x, 625 + 22 * heatFlow]} color={lfTheme.heat} width={5} />
          ))}
          <text x={1143} y={697} textAnchor="middle" fill={lfTheme.heat} fontSize={26}>Heat rejected from the coolant</text>
        </g>
      </DiagramPanel>
    </BatteryDiagram>
  );
};

export const animation = {
  id: "VA_LF_025",
  name: "Battery Cooling Loop",
  component: VA_LF_025_Animation,
  schema,
  slots: Object.keys(schema.shape),
  description: "A closed coolant loop and heat transfer across a thermal interface and heat exchanger.",
  maxDurationSec,
  defaultDurationSec: maxDurationSec,
  previewProps: { title: "Battery cooling loop" },
  ...background,
};
