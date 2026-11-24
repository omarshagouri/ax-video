import React from "react";
import { z } from "zod";
import { BatteryDiagram, DiagramArrow, DiagramPanel } from "../shared_system/BatteryVisuals";
import { lfTheme } from "../shared_system/CoreVisuals";
import { reveal } from "../shared_system/EditorialVisuals";
import { useLFRevealProgress } from "../shared_system/Timing";

const schema = z.object({
  title: z.string().trim().min(1).max(54),
  mode: z.enum(["charge", "discharge"]).default("charge"),
});

const maxDurationSec = 7;
const background = { background: "bg.png", backgroundDim: 0.2 };

const formats = [
  {
    name: "Cylindrical",
    shell: "Round metal can",
    drawing: <>
      <path d="M222 66H322V190a50 18 0 0 1-100 0Z" fill="#254468" stroke={lfTheme.cold} strokeWidth={2} />
      <path d="M239 87v97" stroke={lfTheme.cold} strokeOpacity={0.55} strokeWidth={8} strokeLinecap="round" />
      <ellipse cx={272} cy={66} rx={50} ry={18} fill={lfTheme.navySurface} stroke={lfTheme.cold} strokeWidth={2} />
      <ellipse cx={272} cy={60} rx={19} ry={9} fill={lfTheme.slate} />
    </>,
  },
  {
    name: "Prismatic",
    shell: "Rigid rectangular case",
    drawing: <>
      <path d="M188 69 217 50H356L327 69Z M327 69 356 50V179L327 201Z" fill="#254468" stroke={lfTheme.cold} strokeWidth={2} />
      <rect x={188} y={69} width={139} height={132} rx={5} fill={lfTheme.navySurface} stroke={lfTheme.cold} strokeWidth={2} />
      <path d="M213 88h91" stroke={lfTheme.cold} strokeOpacity={0.6} strokeWidth={3} />
      <path d="M224 57v-12h21v12m57 0v-12h21v12" fill={lfTheme.slate} stroke={lfTheme.slate} strokeWidth={2} />
    </>,
  },
  {
    name: "Pouch",
    shell: "Flexible laminate",
    drawing: <>
      <path d="M213 64h26V43h23v21h20V43h23v21h26q12 0 12 12v113q0 12-12 12H213q-12 0-12-12V76q0-12 12-12Z" fill={lfTheme.navySurface} stroke={lfTheme.cold} strokeWidth={2} />
      <rect x={215} y={78} width={114} height={109} rx={12} fill="#254468" stroke={lfTheme.slate} strokeWidth={2} strokeDasharray="5 4" />
      <path d="M240 62V44h21v18m22 0V44h21v18" fill={lfTheme.slate} />
    </>,
  },
];

const VA_LF_022_Animation: React.FC<z.infer<typeof schema>> = ({ title, mode }) => {
  const progress = useLFRevealProgress();
  const charge = mode === "charge";
  const cutaway = reveal(progress, 0.22, 0.44);
  const current = reveal(progress, 0.46, 0.63);
  const travel = (progress * 2.5 + 0.22) % 1;
  const direction = (x: number) => charge ? x : 1680 - x;

  return (
    <BatteryDiagram title={title} footer="Form factor describes the package. LFP and NMC describe chemistry.">
      {formats.map(({ name, shell, drawing }, index) => (
        <g key={name} opacity={reveal(progress, index * 0.07, 0.22 + index * 0.07)}>
          <DiagramPanel x={568 * index} width={544} height={308}>
            {drawing}
            <text x={272} y={252} textAnchor="middle" fontSize={34} fontWeight={730}>{name}</text>
            <text x={272} y={286} textAnchor="middle" fontSize={25} fill={lfTheme.slate}>{shell}</text>
          </DiagramPanel>
        </g>
      ))}
      <g opacity={cutaway}>
        <DiagramPanel y={332} width={1680} height={424}>
          <text x={36} y={56} fontSize={34} fontWeight={730}>Electrode cutaway</text>
          <text x={1644} y={54} textAnchor="end" fill={lfTheme.teal}>{charge ? "Charging" : "Discharging"}</text>
          <path d="M456 188V126H1224V188" fill="none" stroke={lfTheme.cold} strokeWidth={4} />
          <rect x={735} y={99} width={210} height={54} rx={12} fill={lfTheme.navySurface} stroke={lfTheme.cold} strokeWidth={2} />
          <text x={840} y={135} textAnchor="middle" fontSize={24}>{charge ? "Charger" : "Load"}</text>

          <rect x={330} y={188} width={1020} height={143} rx={12} fill={lfTheme.navySurface} stroke={lfTheme.navyLine} strokeWidth={2} />
          <path d="M342 188h311v143H342q-12 0-12-12V200q0-12 12-12Z" fill="#1C4054" />
          <path d="M1027 188h311q12 0 12 12v119q0 12-12 12h-311Z" fill="#274567" />
          <rect x={800} y={188} width={80} height={143} fill={lfTheme.slate} fillOpacity={0.18} stroke={lfTheme.slate} strokeWidth={2} strokeDasharray="5 6" />
          <path d="M385 217h205m-205 82h205m500-82h205m-205 82h205" stroke={lfTheme.slate} strokeWidth={2} strokeOpacity={0.75} />

          <g opacity={current}>
            <DiagramArrow from={[direction(485), 126]} to={[direction(690), 126]} color={lfTheme.cold} />
            <DiagramArrow from={[direction(990), 126]} to={[direction(1195), 126]} color={lfTheme.cold} />
            <circle cx={direction(492 + 174 * travel)} cy={126} r={7} fill={lfTheme.white} />
            <circle cx={direction(1010 + 174 * travel)} cy={126} r={7} fill={lfTheme.white} />
            <text x={284} y={134} fill={lfTheme.cold} textAnchor="end">e⁻ outside</text>
            <DiagramArrow from={[direction(438), 259]} to={[direction(1242), 259]} color={lfTheme.teal} />
            {[0, 0.5].map((offset) => (
              <circle key={offset} cx={direction(455 + 744 * ((travel + offset) % 1))} cy={259} r={10} fill={lfTheme.teal} stroke={lfTheme.navy} strokeWidth={2} />
            ))}
            <text x={284} y={267} fill={lfTheme.teal} textAnchor="end">Li⁺ inside</text>
          </g>
          <text x={491} y={373} textAnchor="middle" fontSize={25}>Positive electrode</text>
          <text x={840} y={373} textAnchor="middle" fontSize={25} fill={lfTheme.slate}>Separator</text>
          <text x={1189} y={373} textAnchor="middle" fontSize={25}>Negative electrode</text>
        </DiagramPanel>
      </g>
    </BatteryDiagram>
  );
};

export const animation = {
  id: "VA_LF_022",
  name: "Three Cell Formats",
  component: VA_LF_022_Animation,
  schema,
  slots: Object.keys(schema.shape),
  description: "Cylindrical, prismatic and pouch packages with a generic ion and electron path.",
  maxDurationSec,
  defaultDurationSec: maxDurationSec,
  previewProps: { title: "Three cell formats", mode: "charge" },
  ...background,
};
