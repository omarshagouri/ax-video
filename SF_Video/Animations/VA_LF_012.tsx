import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRealFrame, useLFRevealProgress } from "../shared system/Timing";
import { C, clamp01, ease, staged, appear, loop01, Title, Footer, Panel, NodeBox } from "../shared system/ContinuousVisuals";

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_012. */
export const dataDecisionSchema=z.object({
  title:z.string().optional(),
  sensors:z.array(z.string()).min(2).max(4),
  decisionLabel:z.string(),
  actionLabel:z.string(),
  footer:z.string().optional(),
});
/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
export const VALF012DataDecision:React.FC<any> = ({title,sensors,decisionLabel,actionLabel,footer}) => {
  const progress=useLFRevealProgress(); const f=useCurrentFrame(); const real=useLFRealFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const W=1610, sx=85, sensorW=275, sensorH=90, cy=350, cx=815, centerW=250, actionX=1230;
  const spacing=112, ys=sensors.map((_:string,i:number)=>cy+(i-(sensors.length-1)/2)*spacing);
  const period=Math.max(30,Math.round(fps*1.9));
  const centralPulse=1+.016*Math.sin(real/fps*Math.PI*2*1.2);
  // DRAWING: The JSX below creates the animated objects shown on screen.
  return <AbsoluteFill>
    <Title title={title||"Data becomes a battery decision"} kicker="Live BMS logic"/>
    <Panel style={{position:"absolute",left:155,top:285,width:W,height:620,opacity:p}}>
      <div style={{position:"absolute",left:80,right:80,top:48,textAlign:"center",fontFamily:"Inter,Arial",fontSize:27,fontWeight:700,color:C.slate,opacity:staged(progress,.12,.24)}}>SENSORS → ESTIMATE → DECIDE → ACT</div>
      <svg width={W} height="620" style={{position:"absolute",inset:0}}>
        {ys.map((y:number,i:number)=>{
          const q=loop01(real,period,Math.round(i*period/sensors.length));
          const from=sx+sensorW,to=cx-centerW/2;
          return <g key={i}>
            <line x1={from} y1={y} x2={to} y2={cy} stroke={C.line} strokeWidth="5" opacity={staged(progress,.54,.66)}/>
            <circle cx={from+(to-from)*q} cy={y+(cy-y)*q} r="8" fill={i%2?C.cold:C.teal} opacity={staged(progress,.66,.79)}/>
          </g>;
        })}
        <line x1={cx+centerW/2} y1={cy} x2={actionX} y2={cy} stroke={C.line} strokeWidth="8" strokeLinecap="round" opacity={staged(progress,.83,.91)}/>
        {[0,1,2].map(i=>{const q=loop01(real,Math.round(fps*1.65),i*16);return <circle key={"out"+i} cx={cx+centerW/2+(actionX-cx-centerW/2)*q} cy={cy} r="9" fill={C.heat} opacity={staged(progress,.91,.985)}/>;})}
      </svg>
      {sensors.map((label:string,i:number)=><div key={i} style={{position:"absolute",left:sx,top:ys[i]-sensorH/2,width:sensorW,height:sensorH,boxSizing:"border-box",border:`2px solid ${i%2?C.cold:C.teal}88`,borderRadius:20,background:"rgba(20,36,64,.97)",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 15px",fontFamily:"Space Grotesk,Arial",fontSize:label.length>17?25:31,fontWeight:700,color:C.white,textAlign:"center",opacity:staged(progress,.20+i*.087,.31+i*.087)}}>{label}</div>)}
      <div style={{position:"absolute",left:cx-centerW/2,top:cy-100,width:centerW,height:200,opacity:staged(progress,.64,.79),boxSizing:"border-box",borderRadius:30,border:`3px solid ${C.teal}`,background:"rgba(20,36,64,.97)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,textAlign:"center",fontFamily:"Space Grotesk,Arial",fontSize:30,fontWeight:750,color:C.white,transform:`scale(${centralPulse})`,boxShadow:`0 0 30px ${C.teal}33`}}>{decisionLabel}</div>
      <NodeBox label={actionLabel} x={actionX} y={cy-75} width={300} accent={C.heat} opacity={staged(progress,.79,.90)}/>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};


/** SETTINGS: Edit this block for this animation only. New files register automatically.
 * background: image in public/; backgroundDim: 0 (clear) to 1 (black).
 * authoredEndFrame: last entrance cue, NOT the video duration.
 * The older hyphenated ID is accepted by the renderer as an input alias.
 */
export const animation = {
  id: "VA_LF_012",
  component: VALF012DataDecision,
  schema: dataDecisionSchema,
  description: "Continuous sensor data packets feed BMS logic and produce an animated control action.",
  slots: Object.keys(dataDecisionSchema.shape),
  defaultDurationSec: 9,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 83,
};
