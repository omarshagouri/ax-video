/**
 * VA_LF_018 — Observed mild versus hot climate groups and sourced difference in annual capacity decline.
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
export const fleetEvidenceSchema=z.object({
  title:z.string().max(83).default("A real-world fleet observation"),
  vehicles:clampInteger(100, 1000000).default(22700),
  models:clampInteger(1, 100).default(21),
  difference:clampNumeric(0, 20).default(.4),
  source:z.string().max(65).default("GEOTAB FLEET ANALYSIS"),
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
export const VALF018FleetEvidence:React.FC<any>=({title,vehicles,models,difference,source,footer})=>{
  const progress=useLFRevealProgress();
  // DRAWING: The JSX below creates the animated objects shown on screen.
  return <AbsoluteFill>
    <Heading title={title} kicker="OBSERVATIONAL DATA — ASSOCIATION, NOT CAUSATION" footer={footer}/>
    <P style={{left:188,top:321,width:744,height:525,opacity:reveal(progress,.13,.23)}}/>
    <P style={{left:957,top:321,width:776,height:525,borderColor:C.heat+"66",
      opacity:reveal(progress,.26,.36)}}/>
    <svg width={1920} height={1080} style={{position:"absolute",inset:0}}>
      {/* Weather icons establish the two observed groups; there is no false data slider. */}
      <g opacity={reveal(progress,.27,.40)} fill="none" stroke={C.cold} strokeWidth={10}>
        <circle cx={464} cy={546} r={70} opacity={.5}/>
        <path d="M 400 598 H 575 C 627 598 635 536 594 522 C 578 482 531 477 500 508 C 450 479 408 506 414 547 C 382 555 379 587 400 598 Z"
          fill={C.panel}/>
      </g>
      <g opacity={reveal(progress,.40,.51)} stroke={C.heat} strokeWidth={10} strokeLinecap="round">
        <circle cx={1148} cy={524} r={55} fill={C.heat} fillOpacity={.17}/>
        {Array.from({length:8},(_,i)=>{
          const a=i*Math.PI/4;
          return <line key={i} x1={1148+Math.cos(a)*71} y1={524+Math.sin(a)*71}
            x2={1148+Math.cos(a)*94} y2={524+Math.sin(a)*94}/>;
        })}
      </g>
    </svg>
    <div style={{position:"absolute",left:246,top:363,width:635}}>
      <Text size={35} color={C.cold} cue={.23} span={.08}>MILD CLIMATE</Text>
    </div>
    <div style={{position:"absolute",left:246,top:658,width:635}}>
      <Text size={31} cue={.36} span={.08}>REFERENCE GROUP</Text>
      <Text size={27} color={C.slate} cue={.42} span={.08}>Fewer than 35% of days above 25°C</Text>
    </div>
    <div style={{position:"absolute",left:1016,top:363,width:660}}>
      <Text size={35} color={C.heat} cue={.36} span={.08}>HOT CLIMATE</Text>
    </div>
    <div style={{position:"absolute",left:1275,top:468,width:410}}>
      <Text size={27} color={C.slate} cue={.44} span={.08}>More than 35% of days above 25°C</Text>
    </div>
    <div style={{position:"absolute",left:1026,top:636,fontFamily:"Space Grotesk,Arial",fontSize:101,
      fontWeight:800,color:C.heat,opacity:reveal(progress,.52,.64)}}>
      +{Number(difference).toFixed(1)}
    </div>
    <div style={{position:"absolute",left:1310,top:667,width:390}}>
      <Text size={27} cue={.60} span={.07}>PERCENTAGE POINTS / YEAR</Text>
      <Text size={24} color={C.slate} cue={.66} span={.07}>Faster observed capacity decline</Text>
    </div>
    <div style={{position:"absolute",top:861,left:219,right:219,textAlign:"center"}}>
      <Text size={26} color={C.teal} cue={.68} span={.08}>
        {Number(vehicles).toLocaleString("en-US")}+ EVs · {models} models · {source}
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
  id: "VA_LF_018",
  component: VALF018FleetEvidence,
  schema: fleetEvidenceSchema,
  description: "Observed mild versus hot climate groups and sourced difference in annual capacity decline.",
  slots: Object.keys(fleetEvidenceSchema.shape),
  defaultDurationSec: 8,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 110,
};
