/**
 * VA_LF_020 — One-time reveal of short-term range variation versus a persistent long-term capacity trend.
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
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFRevealProgress } from "../shared_system/Timing";
import { C, clamp, ease, reveal, P, Heading, Text } from "../shared_system/EditorialVisuals";

/** INPUTS: SECTION 2 — EDITABLE TEXT AND VALUES.
 * This schema defines accepted labels, numeric controls and defaults.
 * z.string() handles text; clampNumeric(min,max) bounds a numeric control;
 * .default(value) supplies a fallback when an input is omitted.
 * Change the local values here, without editing shared_system code.
 */
export const fluctuationTrendSchema=z.object({
  title:z.string().max(86).default("Fluctuation and long-term change are different"),
  topLabel:z.string().max(45).default("TEMPORARY RANGE VARIATION"),
  bottomLabel:z.string().max(45).default("PERSISTENT CAPACITY TREND"),
  footer:z.string().max(135).optional(),
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
export const VALF020FluctuationTrend:React.FC<any>=({title,topLabel,bottomLabel,footer})=>{
  const progress=useLFRevealProgress();
  const W=1065,x0=550,top=410,bottom=672;
  // Plot each illustrative history once and hold. A roaming cursor implied live telemetry.
  const topDraw=reveal(progress,.29,.46),bottomDraw=reveal(progress,.51,.68);
  const wave=(x:number)=>36*Math.sin(x*17)+17*Math.cos(x*43);
  const decline=(x:number)=>-x*98+11*Math.sin(x*6);
  const points=(base:number,fn:(x:number)=>number)=>Array.from({length:160},(_,i)=>{
    // Normalize each of the 160 line-chart points from 0 (start) to 1 (end).
    const p=i/159;
    // Build an SVG path: M starts the curve, L joins each following point.
    return (i===0?"M":"L")+" "+(x0+p*W).toFixed(1)+" "+(base-fn(p)).toFixed(1);
  }).join(" ");
  return <AbsoluteFill>
    <Heading title={title} kicker="SHORT-TERM NOISE VERSUS LONG-TERM SIGNAL" footer={footer}/>
    <P style={{left:218,top:300,width:1485,height:566}}/>
    <svg width={1920} height={1080} style={{position:"absolute",inset:0}}>
      {[top,bottom].map((y,k)=><g key={k} opacity={reveal(progress,k===0?.23:.54,k===0?.34:.64)}>
        <line x1={x0-20} y1={y+93} x2={x0+W+20} y2={y+93} stroke={C.line} strokeWidth={3}/>
        <line x1={x0-20} y1={y-96} x2={x0-20} y2={y+100} stroke={C.line} strokeWidth={3}/>
        {Array.from({length:5},(_,i)=><line key={i} x1={x0+i*W/4} x2={x0+i*W/4} y1={y-92} y2={y+90}
          stroke={C.line} strokeWidth={2} opacity={.5}/>)}
      </g>)}
      <path d={points(top,wave)} fill="none" stroke={C.cold} strokeWidth={8} strokeLinecap="round"
        strokeDasharray="2500" strokeDashoffset={2500*(1-topDraw)}/>
      <path d={points(bottom,decline)} fill="none" stroke={C.heat} strokeWidth={8} strokeLinecap="round"
        strokeDasharray="2500" strokeDashoffset={2500*(1-bottomDraw)}/>
      <circle cx={x0+W} cy={top-wave(1)} r={12} fill={C.white} stroke={C.cold} strokeWidth={5}
        opacity={reveal(progress,.46,.51)}/>
      <circle cx={x0+W} cy={bottom-decline(1)} r={12} fill={C.white} stroke={C.heat} strokeWidth={5}
        opacity={reveal(progress,.68,.73)}/>
    </svg>
    <div style={{position:"absolute",left:264,top:362,width:240}}><Text size={28} color={C.cold} cue={.20} span={.07}>{topLabel}</Text></div>
    <div style={{position:"absolute",left:264,top:636,width:240}}><Text size={28} color={C.heat} cue={.46} span={.07}>{bottomLabel}</Text></div>
    <div style={{position:"absolute",top:815,left:1100,right:304,textAlign:"right"}}>
      <Text size={24} color={C.slate} cue={.64} span={.07}>TIME →</Text>
    </div>
    <div style={{position:"absolute",top:887,left:260,right:260,textAlign:"center"}}>
      <Text size={26} color={C.yellow} cue={.67} span={.07}>
        Short-term range can recover; persistent capacity loss is a long-term trend.
      </Text>
    </div>
  </AbsoluteFill>;
};


/** SETTINGS: SECTION 7 — REGISTRATION CONFIGURATION.
 * Edit this final block for this animation only. New files register automatically.
 * background: image in public/; backgroundDim: 0 (clear) to 1 (black).
 * authoredEndFrame: last entrance cue, NOT the video duration.
 * The older hyphenated ID is accepted by the renderer as an input alias.
 */
export const animation = {
  id: "VA_LF_020",
  component: VALF020FluctuationTrend,
  schema: fluctuationTrendSchema,
  description: "One-time reveal of short-term range variation versus a persistent long-term capacity trend.",
  slots: Object.keys(fluctuationTrendSchema.shape),
  defaultDurationSec: 8,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 110,
};
