/**
 * VA_LF_010 — Continuously pulsing cell heat map with optional moving cooling sweep.
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
import { C, clamp01, ease, staged, appear, loop01, Title, Footer, Panel } from "../shared_system/ContinuousVisuals";

/** INPUTS: SECTION 2 — EDITABLE TEXT AND VALUES.
 * This schema defines accepted labels, numeric controls and defaults.
 * z.string() handles text; clampNumeric(min,max) bounds a numeric control;
 * .default(value) supplies a fallback when an input is omitted.
 * Change the local values here, without editing shared_system code.
 */
export const thermalSchema=z.object({
  title:z.string().optional(),
  heatLevel:clampNumeric(0, 100).default(70),
  hotspotRow:clampInteger(0, 4).default(2),
  hotspotCol:clampInteger(0, 7).default(5),
  cooling:z.boolean().default(true),
  note:z.string().optional(),
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
export const VALF010ThermalField:React.FC<any> = ({title,heatLevel,hotspotRow,hotspotCol,cooling,note,footer}) => {
  const progress=useLFRevealProgress(); const f=useCurrentFrame(); const real=useLFRealFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const rows=5,cols=8,cellW=120,cellH=70,gap=12,startX=280,startY=180;
  const wave=loop01(real,Math.round(fps*3.2));
  const pulse=(Math.sin(real/fps*Math.PI*2*.75)+1)/2;
  // DRAWING: The JSX below creates the animated objects shown on screen.
  return <AbsoluteFill>
    <Title title={title||"Heat moves through the pack"} kicker="Thermal map"/>
    <Panel style={{position:"absolute",left:155,top:285,width:1610,height:620,opacity:p}}>
      {note?<div style={{position:"absolute",left:100,right:100,top:45,textAlign:"center",fontFamily:"Inter,Arial",fontSize:28,fontWeight:650,color:C.slate}}>{note}</div>:null}
      {[...Array(rows)].flatMap((_,r)=>[...Array(cols)].map((__,c)=>{
        const d=Math.sqrt(Math.pow(r-hotspotRow,2)+Math.pow(c-hotspotCol,2));
        const influence=Math.max(0,1-d/4.2)*(Number(heatLevel)/100);
        const coolBand=cooling?Math.max(0,1-Math.abs((c/(cols-1))-wave)*4):0;
        const hot=clamp01(influence*(.72+.28*pulse)-coolBand*.35);
        const bg=hot>.55?C.heat:hot>.22?"#7B6558":C.surface;
        const border=hot>.45?C.heat:C.line;
        return <div key={r+"-"+c} style={{position:"absolute",left:startX+c*(cellW+gap),top:startY+r*(cellH+gap),width:cellW,height:cellH,border:`2px solid ${border}`,borderRadius:16,background:bg,boxShadow:hot>.45?`0 0 ${20+30*hot}px ${C.heat}44`:"none",transition:"none",opacity:.98*staged(progress,.20+(r*cols+c)/(rows*cols)*.48,.38+(r*cols+c)/(rows*cols)*.48)}}/>;
      }))}
      {cooling?<div style={{position:"absolute",left:startX+wave*((cols-1)*(cellW+gap))-25,top:startY-20,width:50,height:rows*(cellH+gap)-gap+40,background:"linear-gradient(90deg,rgba(77,166,255,0),rgba(77,166,255,.28),rgba(77,166,255,0))",opacity:staged(progress,.60,.79),filter:"blur(5px)",borderRadius:30}}/>:null}
      <div style={{position:"absolute",right:125,top:125,fontFamily:"Inter,Arial",fontSize:25,fontWeight:700,color:cooling?C.cold:C.heat}}>{cooling?"COOLING SWEEP ACTIVE":"HEAT PROPAGATION"}</div>
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
  id: "VA_LF_010",
  component: VALF010ThermalField,
  schema: thermalSchema,
  description: "Continuously pulsing cell heat map with optional moving cooling sweep.",
  slots: Object.keys(thermalSchema.shape),
  defaultDurationSec: 9,
  // Preview-only example values. Edit them here to see your changes in Studio.
  previewProps: {
    "heatLevel": 70,
    "hotspotRow": 2,
    "hotspotCol": 5,
    "cooling": true
  },
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 75,
};
