/**
 * VA_LF_008 — Continuous multi-packet energy/data flow across 2-5 system nodes.
 *
 * SEVEN EDITING SECTIONS (all local to THIS animation):
 * 1. ANIMATION SETTINGS — see the final 'animation' object (section 7).
 * 2. EDITABLE TEXT AND VALUES — input schema, labels and numeric limits below.
 * 3. COLORS AND SIZES — JSX styles and C; fontSize, width, height, fill.
 * 4. ELEMENT POSITIONS — style left/top/right/bottom or SVG x/y coordinates.
 * 5. MOVEMENT AND TIMING — progress, frames, easing, reveal and loop cues.
 * 6. ANIMATION COMPONENT — React JSX describing the visual on each frame.
 * 7. REGISTRATION CONFIGURATION — final exported 'animation' settings block.
 *
 * The canvas is 1920 × 1080. Imported shared_system helpers supply reusable
 * drawing and timing primitives; this file controls its own unique behavior.
 * Edit only the relevant values; do not change shared code for local changes.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRealFrame, useLFRevealProgress } from "../shared_system/Timing";
import { C, clamp01, ease, staged, appear, loop01, Title, Footer, Panel, NodeBox } from "../shared_system/ContinuousVisuals";

/** INPUTS: SECTION 2 — EDITABLE TEXT AND VALUES.
 * This schema defines accepted labels, numeric controls and defaults.
 * z.string() handles text; clampNumeric(min,max) bounds a numeric control;
 * .default(value) supplies a fallback when an input is omitted.
 * Change the local values here, without editing shared_system code.
 */
export const packetStreamSchema=z.object({
  title:z.string().optional(),
  nodes:z.array(z.string()).min(2).max(5),
  flowLabel:z.string().optional(),
  intensity:clampNumeric(1, 5).default(3),
  footer:z.string().optional(),
});
/** VISUAL: SECTION 3 — COLORS AND SIZES.
 * Edit fill/background/color, fontSize, width and height in the JSX styles.
 * Use the imported C for consistent shared colors when appropriate.
 *
 * SECTION 4 — ELEMENT POSITIONS.
 * Position each object using JSX style offsets, flex/grid settings or SVG
 * coordinates. These positions belong to this animation, not the shared UI.
 *
 * SECTION 5 — MOVEMENT AND TIMING.
 * Hooks provide the frame or progress value; local formulas control entrances,
 * easing, reveals and continuous loops. Modify their cues to change motion.
 *
 * SECTION 6 — ANIMATION COMPONENT.
 * The exported React component below draws this animation's on-screen objects.
 * Its return/JSX contains each text label, panel, icon, line and SVG element.
 */
export const VALF008PacketStream:React.FC<any> = ({title,nodes,flowLabel,intensity,footer}) => {
  const progress=useLFRevealProgress(); const f=useCurrentFrame(); const real=useLFRealFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const W=1610,left=155,inner=95,y=440,n=nodes.length,gap=n<=3?100:66,nodeW=Math.min(250,(W-190-gap*(n-1))/n);
  const xs=nodes.map((_:string,i:number)=>inner+i*(nodeW+gap));
  const x0=xs[0]+nodeW, x1=xs[n-1], span=Math.max(1,x1-x0);
  const count=Math.max(3,Math.min(8,Math.round(Number(intensity||3)+3)));
  const period=Math.round(fps*(2.8-Math.min(5,Number(intensity||3))*.25));
  // DRAWING: The JSX below creates the animated objects shown on screen.
  return <AbsoluteFill>
    <Title title={title||"Energy moving through the system"} kicker="Live energy stream"/>
    <Panel style={{position:"absolute",left,top:285,width:W,height:620,opacity:p,transform:`translateY(${(1-p)*16}px)`}}>
      {flowLabel?<div style={{position:"absolute",left:80,right:80,top:46,textAlign:"center",fontFamily:"Inter,Arial",fontSize:29,fontWeight:650,color:C.slate,opacity:staged(progress,.13,.25)}}>{flowLabel}</div>:null}
      <svg width={W} height="620" style={{position:"absolute",inset:0}}>
        <line x1={x0} y1={y} x2={x1} y2={y} stroke={C.line} strokeWidth="10" strokeLinecap="round" opacity={staged(progress,.65,.77)}/>
        {[...Array(count)].map((_,i)=>{
          const q=loop01(real,period,Math.round(i*period/count));
          const x=x0+span*q;
          const glow=.55+.45*Math.sin(q*Math.PI);
          return <g key={i} opacity={staged(progress,.79,.92)}>
            <circle cx={x} cy={y} r={18} fill={C.teal} opacity={.14*glow}/>
            <circle cx={x} cy={y} r={8} fill={C.teal} opacity={.95}/>
          </g>;
        })}
      </svg>
      {nodes.map((node:string,i:number)=><NodeBox key={node+i} label={node} x={xs[i]} y={y-75} width={nodeW} accent={i===0||i===n-1?C.teal:C.slate} opacity={staged(progress,.23+i*.085,.34+i*.085)}/>)}
      <div style={{position:"absolute",left:100,right:100,bottom:48,textAlign:"center",fontFamily:"Inter,Arial",fontSize:27,fontWeight:750,color:C.teal,letterSpacing:.5,opacity:staged(progress,.89,.98)}}>CONTINUOUS ENERGY FLOW</div>
    </Panel>
    <Footer text={footer}/>
  </AbsoluteFill>;
};


/** SETTINGS: SECTION 7 — REGISTRATION CONFIGURATION.
 * Edit this final block for this animation only. New files register automatically.
 * background: image in public/; backgroundDim: 0 (clear) to 1 (black).
 * authoredEndFrame: last entrance cue, NOT the video duration.
 * The older hyphenated ID is accepted by the renderer as an input alias.
 */
export const animation = {
  id: "VA_LF_008",
  component: VALF008PacketStream,
  schema: packetStreamSchema,
  description: "Continuous multi-packet energy/data flow across 2-5 system nodes.",
  slots: Object.keys(packetStreamSchema.shape),
  defaultDurationSec: 8,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 60,
};
