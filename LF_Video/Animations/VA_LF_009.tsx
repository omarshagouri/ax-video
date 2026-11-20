/**
 * VA_LF_009 — Continuous input stream passes through a control gate and exits at a reduced rate.
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
export const throttleSchema=z.object({
  title:z.string().optional(),
  inputLabel:z.string(),
  gateLabel:z.string(),
  outputLabel:z.string(),
  inputRate:clampNumeric(0, 100),
  outputRate:clampNumeric(0, 100),
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
export const VALF009ThrottleGate:React.FC<any> = ({title,inputLabel,gateLabel,outputLabel,inputRate,outputRate,footer}) => {
  const progress=useLFRevealProgress(); const f=useCurrentFrame(); const real=useLFRealFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const W=1610, cy=348, inputEnd=370, gateL=696, gateR=914, outputStart=1240;
  const pct=clamp01(Number(outputRate)/100);
  const period=Math.max(30,Math.round(fps*2));
  const inCount=Math.max(1,Math.round(2+Number(inputRate)*.055));
  const outCount=Math.max(0,Math.round(inCount*pct));
  // DRAWING: The JSX below creates the animated objects shown on screen.
  return <AbsoluteFill>
    <Title title={title||"The BMS can throttle power"} kicker="Control gate"/>
    <Panel style={{position:"absolute",left:155,top:285,width:W,height:620,opacity:p}}>
      <div style={{position:"absolute",top:56,left:90,right:90,display:"flex",justifyContent:"center",gap:80,fontFamily:"Inter,Arial",fontSize:29,fontWeight:750}}>
        <span style={{color:C.teal,opacity:staged(progress,.27,.43)}}>REQUEST {Math.round(inputRate)}%</span>
        <span style={{color:C.heat,opacity:staged(progress,.65,.80)}}>ALLOWED {Math.round(outputRate)}%</span>
      </div>
      <svg width={W} height="620" style={{position:"absolute",inset:0}}>
        <line x1={inputEnd} y1={cy} x2={gateL} y2={cy} stroke={C.line} strokeWidth="9" strokeLinecap="round"/>
        <line x1={gateR} y1={cy} x2={outputStart} y2={cy} stroke={C.line} strokeWidth="9" strokeLinecap="round"/>
        {[...Array(inCount)].map((_,i)=>{const q=loop01(real,period,Math.round(i*period/inCount));return <circle key={"in"+i} cx={inputEnd+(gateL-inputEnd)*q} cy={cy} r={8} fill={C.teal}/>;})}
        {[...Array(outCount)].map((_,i)=>{const q=loop01(real,period,Math.round(i*period/outCount));return <circle key={"out"+i} cx={gateR+(outputStart-gateR)*q} cy={cy} r={8} fill={C.heat}/>;})}
      </svg>
      <NodeBox label={inputLabel} x={70} y={cy-75} width={300} accent={C.teal} opacity={staged(progress,.20,.42)}/>
      <div style={{position:"absolute",left:gateL,top:cy-130,width:gateR-gateL,height:260,opacity:staged(progress,.42,.66),border:`2px solid ${C.heat}88`,borderRadius:26,background:"rgba(20,36,64,.97)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxSizing:"border-box"}}>
        <div style={{fontFamily:"Space Grotesk,Arial",fontSize:29,fontWeight:700,color:C.white,textAlign:"center",padding:"0 15px"}}>{gateLabel}</div>
        <div style={{marginTop:23,width:125,height:38,border:`2px solid ${C.slate}`,borderRadius:10,padding:5,boxSizing:"border-box",background:C.navy}}>
          <div style={{width:`${pct*100}%`,height:"100%",background:C.heat,borderRadius:5,boxShadow:`0 0 16px ${C.heat}66`}}/>
        </div>
        <div style={{fontFamily:"Inter,Arial",fontSize:23,fontWeight:750,color:C.heat,marginTop:17}}>{Math.round(Number(outputRate))}% OPEN</div>
      </div>
      <NodeBox label={outputLabel} x={outputStart} y={cy-75} width={300} accent={C.heat} opacity={staged(progress,.65,.86)}/>
      <div style={{position:"absolute",left:90,right:90,bottom:40,textAlign:"center",fontFamily:"Inter,Arial",fontSize:25,color:C.slate}}>The BMS limits delivered power when operating conditions require it.</div>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};


/** SETTINGS: SECTION 7 — REGISTRATION CONFIGURATION.
 * Edit this final block for this animation only. New files register automatically.
 * background: image in public/; backgroundDim: 0 (clear) to 1 (black).
 * authoredEndFrame: last entrance cue, NOT the video duration.
 * The older hyphenated ID is accepted by the renderer as an input alias.
 */
export const animation = {
  id: "VA_LF_009",
  component: VALF009ThrottleGate,
  schema: throttleSchema,
  description: "Continuous input stream passes through a control gate and exits at a reduced rate.",
  slots: Object.keys(throttleSchema.shape),
  defaultDurationSec: 8,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 75,
};
