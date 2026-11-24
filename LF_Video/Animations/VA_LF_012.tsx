/**
 * VA_LF_012 — Continuous sensor data packets feed BMS logic and produce an animated control action.
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
export const dataDecisionSchema=z.object({
  title:z.string().optional(),
  sensors:z.array(z.string()).min(2).max(4),
  decisionLabel:z.string(),
  actionLabel:z.string(),
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


/** SETTINGS: SECTION 7 — REGISTRATION CONFIGURATION.
 * Edit this final block for this animation only. New files register automatically.
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
  // Preview-only example values. Edit them here to see your changes in Studio.
  previewProps: {
    "sensors": [
      "Voltage",
      "Temperature",
      "Current"
    ],
    "decisionLabel": "BMS decision",
    "actionLabel": "Control action"
  },
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 83,
};
