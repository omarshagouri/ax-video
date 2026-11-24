import React from "react";
import { z } from "zod";
import { BatteryDiagram, DiagramArrow, DiagramPanel } from "../shared_system/BatteryVisuals";
import { lfTheme } from "../shared_system/CoreVisuals";
import { reveal } from "../shared_system/EditorialVisuals";
import { useLFRevealProgress } from "../shared_system/Timing";

const schema = z.object({ title: z.string().trim().min(1).max(54) });
const maxDurationSec = 7;
const background = { background: "bg.png", backgroundDim: 0.2 };
const surfaceX = 414;

const GraphiteCutaway: React.FC<{ coldCharge: boolean; progress: number }> = ({ coldCharge, progress }) => {
  const plating = coldCharge ? reveal(progress, 0.51, 0.83) : 0;
  const accent = coldCharge ? lfTheme.heat : lfTheme.teal;
  return (
    <DiagramPanel x={coldCharge ? 864 : 0} width={816} height={733}>
      <text x={40} y={68} fontSize={41} fontWeight={740}>{coldCharge ? "Cold, high-rate charging" : "Suitable charging conditions"}</text>
      <text x={40} y={111} fontSize={27} fill={accent}>{coldCharge ? "Surface plating can compete" : "Lithium intercalates"}</text>

      <rect x={40} y={186} width={736} height={351} rx={15} fill={lfTheme.navySurface} stroke={lfTheme.navyLine} strokeWidth={2} />
      <text x={63} y={224} fontSize={24} fill={lfTheme.slate}>Electrolyte</text>
      <text x={751} y={224} fontSize={24} fill={lfTheme.slate} textAnchor="end">Graphite anode</text>
      <rect x={surfaceX} y={243} width={340} height={274} fill={lfTheme.cold} fillOpacity={0.10} />
      <path d={`M${surfaceX} 243V517`} stroke={lfTheme.slate} strokeWidth={2} strokeDasharray="5 5" />
      {[252, 303, 354, 405, 456, 507].map((y) => (
        <path key={y} d={`M${surfaceX} ${y}H747`} stroke={lfTheme.cold} strokeWidth={7} strokeLinecap="round" />
      ))}

      {[278, 329, 380, 431, 482].map((y, index) => {
        const deposits = coldCharge && index !== 1 && index !== 3;
        const entry = reveal(progress, 0.14 + index * 0.05, 0.60 + index * 0.09);
        const arrival = deposits ? surfaceX - 15 : 508 + (index % 3) * 65;
        const start = 137 + (index % 2) * 52;
        const cx = start + (arrival - start) * entry;
        const metal = deposits ? reveal(entry, 0.85, 1) : 0;
        return (
          <g key={y} opacity={reveal(progress, 0.07 + index * 0.05, 0.19 + index * 0.05)}>
            <path d={`M${start} ${y}H${arrival}`} stroke={lfTheme.teal} strokeWidth={2} strokeOpacity={0.32} strokeDasharray="4 6" />
            <g opacity={1 - metal}>
              <circle cx={cx} cy={y} r={17} fill={lfTheme.teal} stroke={lfTheme.navy} strokeWidth={2} />
              <text x={cx} y={y + 5} fontSize={15} textAnchor="middle" fill={lfTheme.navy} fontWeight={780}>Li⁺</text>
            </g>
            {deposits && <path d={`M${surfaceX} ${y - 16}q-18-5-24 9t-4 18q10 8 28 3Z`} fill={lfTheme.heat} opacity={metal} />}
          </g>
        );
      })}
      {coldCharge && (
        <g opacity={plating}>
          <path d={`M${surfaceX - 12} 476V539l-83 49H84`} fill="none" stroke={lfTheme.heat} strokeWidth={2} />
          <circle cx={surfaceX - 12} cy={476} r={5} fill={lfTheme.heat} />
        </g>
      )}
      <g opacity={reveal(progress, 0.58, 0.83)}>
        {coldCharge ? (
          <>
            <text x={40} y={635} fontSize={32} fill={accent}>Metallic lithium on the surface</text>
            <text x={40} y={680} fontSize={27} fill={lfTheme.slate}>Li⁺ + e⁻ → Li metal</text>
          </>
        ) : (
          <>
            <DiagramArrow from={[83, 580]} to={[161, 580]} color={accent} />
            <text x={40} y={635} fontSize={32} fill={accent}>Li⁺ enters the graphite layers</text>
            <text x={40} y={680} fontSize={27} fill={lfTheme.slate}>Lithium is stored between layers.</text>
          </>
        )}
      </g>
    </DiagramPanel>
  );
};

const VA_LF_026_Animation: React.FC<z.infer<typeof schema>> = ({ title }) => {
  const progress = useLFRevealProgress();
  return (
    <BatteryDiagram title={title} footer="Simplified mechanism for graphite-anode lithium-ion cells. Cold, high-rate charging increases plating risk.">
      <GraphiteCutaway coldCharge={false} progress={progress} />
      <GraphiteCutaway coldCharge progress={progress} />
    </BatteryDiagram>
  );
};

export const animation = {
  id: "VA_LF_026",
  name: "Cold Charging Lithium Plating",
  component: VA_LF_026_Animation,
  schema,
  slots: Object.keys(schema.shape),
  description: "Graphite intercalation and possible metallic lithium deposition during cold, high-rate charging.",
  maxDurationSec,
  defaultDurationSec: maxDurationSec,
  previewProps: { title: "Lithium plating during cold charging" },
  ...background,
};
