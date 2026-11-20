/**
 * VA_LF_016 — Battery cell cross section with local particle motion and one-way illustrative interface growth.
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
export const cellAgingSchema=z.object({
  title:z.string().max(85).default("Reactions continue while parked"),
  anodeLabel:z.string().max(32).default("ANODE"),
  cathodeLabel:z.string().max(32).default("CATHODE"),
  reactionLabel:z.string().max(48).default("Gradual side reaction"),
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
export const VALF016CellAging:React.FC<any>=({title,anodeLabel,cathodeLabel,reactionLabel,footer})=>{
  const progress=useLFRevealProgress();
  // Clearly visible reaction motion during the explanation, with a settled final pose.
  // These schematic particles represent a process, not measured ion trajectories.
  const reactionMotion=clamp((progress-.34)/.41);
  // The interfacial film thickens once; aging must not appear to reverse.
  const deposit=8+23*reveal(progress,.50,.72);
  // DRAWING: The JSX below creates the animated objects shown on screen.
  return <AbsoluteFill>
    <Heading title={title} kicker="CALENDAR AGING — CELL CROSS-SECTION" footer={footer}/>
    <P style={{left:182,top:314,width:1556,height:515}}/>
    <svg width={1920} height={1080} style={{position:"absolute",inset:0}}>
      <rect x={305} y={398} width={320} height={325} rx={20} fill="#30577A" stroke={C.cold} strokeWidth={6}
        opacity={reveal(progress,.22,.36)}/>
      <rect x={1295} y={398} width={320} height={325} rx={20} fill="#725044" stroke={C.heat} strokeWidth={6}
        opacity={reveal(progress,.51,.64)}/>
      <rect x={670} y={404} width={580} height={313} rx={18} fill="#1A3549" stroke={C.line} strokeWidth={5}
        opacity={reveal(progress,.38,.53)}/>
      {Array.from({length:13},(_,i)=><line key={i} x1={700+i*40} x2={700+i*40} y1={425} y2={690}
        stroke="#527283" strokeWidth={2} opacity={.52*reveal(progress,.43,.55)}/>)}
      <rect x={625} y={391} width={deposit} height={340} fill={C.teal}
        opacity={.8*reveal(progress,.47,.57)} rx={7}/>
      {Array.from({length:16},(_,i)=>{
        // Local electrolyte activity is visible without suggesting a charging current.
        const x=700+(i%8)*64+22*Math.sin(reactionMotion*5+i);
        const y=447+Math.floor(i/8)*125+(i%4)*27+13*Math.cos(reactionMotion*4+i);
        return <g key={i}>
          <circle cx={x} cy={y} r={7+(i%3)} fill={i%4===0?C.heat:C.teal}
            opacity={reveal(progress,.39,.49)*(.7+.18*Math.sin(reactionMotion*5+i))}/>
        </g>;
      })}
      {Array.from({length:8},(_,i)=>{
        // Staggered species move toward the anode interface as the film develops.
        const q=(reactionMotion*.92+i/8)%1;
        const alpha=Math.min(1,q/.12,(1-q)/.14);
        return <circle key={i} cx={955-305*q} cy={426+i*39} r={7+3*q} fill={C.yellow}
          opacity={alpha*.92*reveal(progress,.43,.54)}/>;
      })}
      {/* Paired electrode brackets connect visually below the reaction caption. */}
      <path d="M 490 740 V 815 H 960" stroke={C.cold} strokeWidth={4} strokeLinecap="round"
        fill="none" strokeDasharray="900"
        strokeDashoffset={900*(1-reveal(progress,.38,.54))}/>
      <path d="M 1450 740 V 815 H 960" stroke={C.heat} strokeWidth={4} strokeLinecap="round"
        fill="none" strokeDasharray="900"
        strokeDashoffset={900*(1-reveal(progress,.49,.63))}/>
    </svg>
    <div style={{position:"absolute",top:344,left:330}}><Text size={33} cue={.30}>{anodeLabel}</Text></div>
    <div style={{position:"absolute",top:344,left:1320}}><Text size={33} cue={.56}>{cathodeLabel}</Text></div>
    <div style={{position:"absolute",top:733,left:625,width:670,textAlign:"center"}}>
      <Text size={26} color={C.teal} cue={.60} span={.08}>{reactionLabel}</Text>
    </div>
    <div style={{position:"absolute",top:872,left:250,right:250,textAlign:"center"}}>
      <Text size={28} color={C.slate} cue={.69} span={.07}>Illustrative side reactions continue even when vehicle current is low.</Text>
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
  id: "VA_LF_016",
  component: VALF016CellAging,
  schema: cellAgingSchema,
  description: "Battery cell cross section with local particle motion and one-way illustrative interface growth.",
  slots: Object.keys(cellAgingSchema.shape),
  defaultDurationSec: 8,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 110,
};
