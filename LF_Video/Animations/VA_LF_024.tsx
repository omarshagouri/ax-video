import React from "react";
import { z } from "zod";
import { BatteryDiagram, DiagramPanel, PackSlab, packPoint } from "../shared_system/BatteryVisuals";
import { lfTheme } from "../shared_system/CoreVisuals";
import { reveal } from "../shared_system/EditorialVisuals";
import { useLFRevealProgress } from "../shared_system/Timing";

const schema = z.object({ title: z.string().trim().min(1).max(54) });
const maxDurationSec = 7;
const background = { background: "bg.png", backgroundDim: 0.2 };

const Construction: React.FC<{ modular: boolean; progress: number }> = ({ modular, progress }) => {
  const accent = modular ? lfTheme.teal : lfTheme.cold;
  const lower = reveal(progress, 0.23, 0.92);
  const guides = reveal(progress, 0.07, 0.25) * (1 - lower);
  const markX = modular ? 676 : 688;
  const markY = modular ? 416 - 172 * (1 - lower) : 436;
  return (
    <DiagramPanel x={modular ? 0 : 864} width={816} height={733}>
      <text x={40} y={67} fontSize={43} fontWeight={740}>{modular ? "Module-based" : "Cell-to-pack"}</text>
      <text x={40} y={110} fontSize={27} fill={lfTheme.slate}>{modular ? "Cells grouped in module housings" : "Cells integrated into the enclosure"}</text>

      <g transform="translate(44 506)">
        <PackSlab width={536} length={280} height={34} color={lfTheme.slate} />
        <PackSlab x={13} depth={13} width={510} length={254} height={10} color={lfTheme.navyLine} />
        <path d="M18 -12v-226 M502 -12v-226 M685 -122v-226" stroke={accent} strokeWidth={2} strokeDasharray="7 9" opacity={guides} />
        <g transform={`translate(0 ${-25 - 172 * (1 - lower)})`} opacity={reveal(progress, 0.04, 0.2)}>
          {modular && [21, 276].map((x) => (
            <PackSlab key={x} x={x} depth={19} width={239} length={242} height={23} color={lfTheme.slate} />
          ))}
          {[185, 112, 39].map((depth) =>
            [0, 1, 2, 3].map((column) => {
              const x = modular ? 34 + column * 113 + (column >= 2 ? 30 : 0) : 34 + column * 119;
              const [tabX, tabY] = packPoint(x + 28, depth + 39);
              return (
                <g key={`${column}-${depth}`} transform="translate(0 -13)">
                  <PackSlab x={x} depth={depth} width={102} length={58} height={22} color={accent} />
                  <path d={`M${tabX} ${tabY}h12m28 0h12`} stroke={lfTheme.white} strokeOpacity={0.8} strokeWidth={4} strokeLinecap="round" />
                </g>
              );
            }),
          )}
        </g>
      </g>
      <g opacity={reveal(progress, 0.62, 0.89)}>
        <path d={`M${markX} ${markY}l56-38V293H588`} stroke={accent} strokeWidth={2} fill="none" />
        <circle cx={markX} cy={markY} r={5} fill={accent} />
        <text x={570} y={301} textAnchor="end" fontSize={28} fill={accent}>{modular ? "Module housing" : "Pack tray"}</text>
      </g>
      <g opacity={reveal(progress, 0.62, 0.86)}>
        <path d="M136 611h544" stroke={lfTheme.navyLine} strokeWidth={2} />
        <text x={408} y={671} textAnchor="middle" fontSize={33} fill={accent}>
          {modular ? "Cells → modules → enclosure" : "Cells → enclosure"}
        </text>
      </g>
    </DiagramPanel>
  );
};

const VA_LF_024_Animation: React.FC<z.infer<typeof schema>> = ({ title }) => {
  const progress = useLFRevealProgress();
  return (
    <BatteryDiagram title={title} footer="Removing module housings can free space. Serviceability depends on the pack design and the manufacturer’s procedures.">
      <Construction modular progress={progress} />
      <Construction modular={false} progress={progress} />
    </BatteryDiagram>
  );
};

export const animation = {
  id: "VA_LF_024",
  name: "Module Pack vs Cell-to-Pack",
  component: VA_LF_024_Animation,
  schema,
  slots: Object.keys(schema.shape),
  description: "A matched view of cells assembled in modules or directly in a pack enclosure.",
  maxDurationSec,
  defaultDurationSec: maxDurationSec,
  previewProps: { title: "Module pack vs. cell-to-pack" },
  ...background,
};
