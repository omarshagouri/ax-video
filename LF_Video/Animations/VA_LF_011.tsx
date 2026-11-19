import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRealFrame, useLFRevealProgress } from "../shared system/Timing";
import { C, clamp01, ease, staged, appear, loop01, Title, Footer, Panel } from "../shared system/ContinuousVisuals";

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_011. */
export const calibrationSchema=z.object({
  title:z.string().optional(),
  displayedStart:clampNumeric(0, 100),
  displayedEnd:clampNumeric(0, 100),
  usablePct:clampNumeric(0, 100),
  displayedLabel:z.string().default("Displayed estimate"),
  usableLabel:z.string().default("Usable energy"),
  footer:z.string().optional(),
});
const Meter:React.FC<{label:string;value:number;accent:string;y:number;scan:number;opacity?:number}> = ({label,value,accent,y,scan,opacity=1}) => <div style={{position:"absolute",left:250,top:y,width:1110,opacity}}>
  <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Inter,Arial",fontSize:28,fontWeight:700,color:C.white,marginBottom:14}}><span>{label}</span><span style={{color:accent}}>{value.toFixed(1)}%</span></div>
  <div style={{height:28,borderRadius:16,background:C.line,position:"relative",overflow:"visible"}}>
    <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${value}%`,background:accent,borderRadius:16,opacity:.86}}/>
    <div style={{position:"absolute",left:`calc(${scan}% - 3px)`,top:-9,width:6,height:46,background:C.white,borderRadius:6,boxShadow:`0 0 18px ${C.white}66`}}/>
  </div>
</div>;

/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
export const VALF011CalibrationShift:React.FC<any> = ({title,displayedStart,displayedEnd,usablePct,displayedLabel,usableLabel,footer}) => {
  const progress=useLFRevealProgress(); const f=useCurrentFrame(); const real=useLFRealFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const shift=ease(f/(fps*3.0));
  const displayed=Number(displayedStart)+(Number(displayedEnd)-Number(displayedStart))*shift;
  const scan=5+90*loop01(real,Math.round(fps*2.6));
  const err=displayed-Number(usablePct);
  // DRAWING: The JSX below creates the animated objects shown on screen.
  return <AbsoluteFill>
    <Title title={title||"The estimate can move while usable energy barely changes"} kicker="Live calibration"/>
    <Panel style={{position:"absolute",left:155,top:285,width:1610,height:620,opacity:p}}>
      <Meter label={displayedLabel||"Displayed estimate"} value={displayed} accent={C.heat} y={150} scan={scan} opacity={staged(progress,.24,.47)}/>
      <Meter label={usableLabel||"Usable energy"} value={Number(usablePct)} accent={C.teal} y={310} scan={100-scan} opacity={staged(progress,.49,.71)}/>
      <div style={{position:"absolute",left:250,right:250,bottom:65,opacity:staged(progress,.72,.88),display:"flex",justifyContent:"center",gap:24,fontFamily:"Inter,Arial",fontSize:29,fontWeight:700}}>
        <span style={{color:C.slate}}>DIFFERENCE</span>
        <span style={{color:Math.abs(err)<2?C.teal:C.heat}}>{err>0?"+":""}{err.toFixed(1)} pts</span>
        <span style={{color:C.slate}}>• estimator keeps scanning</span>
      </div>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};


/** SETTINGS: Edit this block for this animation only. New files register automatically.
 * background: image in public/; backgroundDim: 0 (clear) to 1 (black).
 * authoredEndFrame: last entrance cue, NOT the video duration.
 * The older hyphenated ID is accepted by the renderer as an input alias.
 */
export const animation = {
  id: "VA_LF_011",
  component: VALF011CalibrationShift,
  schema: calibrationSchema,
  description: "Displayed battery estimate shifts while usable-energy reference stays stable; scan markers remain active.",
  slots: Object.keys(calibrationSchema.shape),
  defaultDurationSec: 9,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 75,
};
