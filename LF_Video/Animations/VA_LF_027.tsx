import React from "react";
import { z } from "zod";
import { BatteryDiagram, DiagramArrow, DiagramPanel } from "../shared_system/BatteryVisuals";
import { lfTheme } from "../shared_system/CoreVisuals";
import { reveal } from "../shared_system/EditorialVisuals";
import { useLFRevealProgress } from "../shared_system/Timing";

const schema = z.object({ title: z.string().trim().min(1).max(54) });
const maxDurationSec = 7;
const background = { background: "bg.png", backgroundDim: 0.2 };

const ModuleSection: React.FC<{ routed: boolean; progress: number }> = ({ routed, progress }) => {
  const selfHeating = reveal(progress, 0.06, 0.40);
  const venting = reveal(progress, 0.34, 0.70);
  const exposure = reveal(progress, 0.58, 0.88);
  const housing = routed ? "M65 196H728V227 M728 272V507H65V196" : "M65 196H728V507H65Z";
  const gas = routed ? "M245 312V250H757" : "M245 312V250H572L628 292";
  const gasColor = lfTheme.cold;
  const accent = routed ? lfTheme.teal : lfTheme.heat;

  return (
    <DiagramPanel x={routed ? 0 : 864} width={816} height={733}>
      <text x={40} y={66} fontSize={41} fontWeight={740}>{routed ? "Directed vent path" : "Undirected vent gas"}</text>
      <text x={40} y={108} fontSize={26} fill={lfTheme.slate}>
        {routed ? "Duct and barrier between cells" : "Example without duct or barrier"}
      </text>
      <path d={housing} stroke={lfTheme.slate} strokeOpacity={0.72} strokeWidth={4} fill="none" />
      <path d="M67 493H726" stroke={lfTheme.navyLine} strokeWidth={5} />

      <g opacity={selfHeating}>
        <path d="M145 342q-48 58 0 139 M342 342q48 58 0 139" stroke={lfTheme.heat} strokeWidth={4} strokeLinecap="round" fill="none" />
        <text x={245} y={570} textAnchor="middle" fill={lfTheme.heat} fontSize={24}>Self-heating accelerates</text>
      </g>
      {routed && (
        <>
          <path d="M225 309V227H728 M265 309V272H728" stroke={lfTheme.slate} strokeWidth={3} fill="none" />
          <rect x={414} y={292} width={19} height={213} fill={lfTheme.teal} fillOpacity={0.18} stroke={lfTheme.teal} strokeWidth={2} />
          <path d="M419 315v168m9-168v168" stroke={lfTheme.teal} strokeWidth={1.5} strokeOpacity={0.58} />
        </>
      )}
      {[{ x: 161, failing: true }, { x: 490, failing: false }].map(({ x, failing }) => (
        <g key={x}>
          <rect x={x} y={320} width={168} height={172} rx={13} fill={lfTheme.navySurface} stroke={lfTheme.slate} strokeWidth={2} />
          <rect x={x} y={320} width={168} height={172} rx={13} fill={lfTheme.heat} fillOpacity={failing ? 0.29 * selfHeating : 0.18 * exposure * (routed ? 0 : 1)} />
          <path d={`M${x + 65} 320v-9h38v9M${x + 20} 364h128m-128 25h128m-128 25h128`} stroke={failing ? lfTheme.heat : lfTheme.slate} strokeWidth={3} strokeOpacity={failing ? 0.8 : 0.48} fill="none" />
          <text x={x + 84} y={538} textAnchor="middle" fontSize={25}>{failing ? "Failing cell" : "Neighbouring cell"}</text>
        </g>
      ))}

      <g opacity={venting}>
        <path d={gas} pathLength={1} stroke={gasColor} strokeWidth={4} fill="none" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - venting} />
        <path d={gas} pathLength={100} stroke={lfTheme.white} strokeWidth={6} fill="none" strokeOpacity={0.8 * exposure} strokeDasharray="1 12" strokeDashoffset={-progress * 90} />
        <g opacity={reveal(progress, 0.62, 0.75)}>
          {routed
            ? <DiagramArrow from={[709, 250]} to={[771, 250]} color={gasColor} />
            : <DiagramArrow from={[593, 266]} to={[638, 300]} color={gasColor} width={4} />}
        </g>
        <text x={475} y={177} textAnchor="middle" fill={gasColor} fontSize={24}>{routed ? "Gas to outlet" : "Gas spreads inside housing"}</text>
      </g>
      <g opacity={exposure}>
        <DiagramArrow from={[346, 410]} to={[routed ? 411 : 485, 410]} color={lfTheme.heat} width={5} />
        <path d="M40 603h736" stroke={lfTheme.navyLine} strokeWidth={2} />
        <text x={408} y={659} textAnchor="middle" fill={accent} fontSize={30}>
          {routed ? "Barrier can limit heat transfer" : "Heat can trigger another cell failure"}
        </text>
      </g>
    </DiagramPanel>
  );
};

const VA_LF_027_Animation: React.FC<z.infer<typeof schema>> = ({ title }) => {
  const progress = useLFRevealProgress();
  return (
    <BatteryDiagram title={title} footer="Vent paths and barriers can limit propagation. Outcomes depend on the pack design and the event.">
      <ModuleSection routed progress={progress} />
      <ModuleSection routed={false} progress={progress} />
    </BatteryDiagram>
  );
};

export const animation = {
  id: "VA_LF_027",
  name: "Thermal Runaway and Venting",
  component: VA_LF_027_Animation,
  schema,
  slots: Object.keys(schema.shape),
  description: "Cell self-heating, vent gas and heat transfer in two illustrative pack designs.",
  maxDurationSec,
  defaultDurationSec: maxDurationSec,
  previewProps: { title: "Thermal runaway and venting" },
  ...background,
};
