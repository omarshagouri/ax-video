import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRealFrame, useLFRevealProgress } from "../shared_system/Timing";
import { C, clamp01, ease, staged, appear, loop01, Title, Footer, Panel, NodeBox } from "../shared_system/ContinuousVisuals";

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_008. */
export const packetStreamSchema=z.object({
  title:z.string().optional(),
  nodes:z.array(z.string()).min(2).max(5),
  flowLabel:z.string().optional(),
  intensity:clampNumeric(1, 5).default(3),
  footer:z.string().optional(),
});
/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
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


/** SETTINGS: Edit this block for this animation only. New files register automatically.
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
