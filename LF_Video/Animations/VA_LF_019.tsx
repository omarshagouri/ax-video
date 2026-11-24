/**
 * VA_LF_019 — A one-time cold-weather range-estimate change beside a stable battery-health reference.
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
export const rangeVsHealthSchema=z.object({
  title:z.string().max(86).default("Dashboard range is not battery health"),
  rangeStart:clampNumeric(0, 100).default(82),
  rangeEnd:clampNumeric(0, 100).default(58),
  healthReference:clampNumeric(0, 100).default(79),
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
export const VALF019RangeHealth:React.FC<any>=({title,rangeStart,rangeEnd,healthReference,footer})=>{
  const progress=useLFRevealProgress();
  // Conditions change once, then the estimate settles. Battery health does not scan or oscillate.
  const conditionChange=reveal(progress,.45,.54);
  const range=Number(rangeStart)+(Number(rangeEnd)-Number(rangeStart))*reveal(progress,.52,.68);
  const ref=Number(healthReference);
  // DRAWING: The JSX below creates the animated objects shown on screen.
  return <AbsoluteFill>
    <Heading title={title} kicker="TWO DIFFERENT OWNER QUESTIONS"
      footer={footer||"SCHEMATIC INDEXES ONLY — not actual range, battery SoH or vehicle telemetry"}/>
    <P style={{left:188,top:317,width:740,height:527,opacity:reveal(progress,.12,.22)}}/>
    <P style={{left:955,top:317,width:777,height:527,opacity:reveal(progress,.19,.30)}}/>
    <svg width={1920} height={1080} style={{position:"absolute",inset:0}}>
      <rect x={277} y={695} width={562} height={50} rx={23} fill={C.line}
        opacity={reveal(progress,.30,.39)}/>
      <rect x={277} y={695} width={562*range/100} height={50} rx={23} fill={C.teal}
        opacity={reveal(progress,.33,.41)}/>
      <rect x={1057} y={695} width={560} height={50} rx={23} fill={C.line}
        opacity={reveal(progress,.34,.43)}/>
      <rect x={1057} y={695} width={560*ref/100} height={50} rx={23} fill={C.cold}
        opacity={reveal(progress,.34,.43)}/>
    </svg>
    <div style={{position:"absolute",left:258,top:368,width:610}}>
      <Text color={C.teal} size={35} cue={.23} span={.07}>RANGE ESTIMATE</Text>
    </div>
    <div style={{position:"absolute",left:258,top:439,width:610,
      opacity:1-conditionChange}}>
      <Text size={28} color={C.slate} cue={.30} span={.06}>MILD DAY — LOWER HVAC LOAD</Text>
    </div>
    <div style={{position:"absolute",left:258,top:439,width:610,
      opacity:conditionChange}}>
      <Text size={28} color={C.yellow} cue={.45} span={.07}>COLD DAY + CABIN HEAT</Text>
    </div>
    <div style={{position:"absolute",left:280,top:516,fontFamily:"Space Grotesk,Arial",fontSize:116,
      color:C.white,fontWeight:800,opacity:reveal(progress,.31,.41)}}>
      {Math.round(range)}<span style={{fontSize:35,color:C.slate}}> INDEX</span>
    </div>
    <div style={{position:"absolute",left:1056,top:368,width:615}}>
      <Text color={C.cold} size={35} cue={.29} span={.07}>BATTERY HEALTH REFERENCE</Text>
    </div>
    <div style={{position:"absolute",left:1065,top:516,fontFamily:"Space Grotesk,Arial",
      fontSize:116,color:C.white,fontWeight:800,opacity:reveal(progress,.36,.45)}}>
      {ref}<span style={{fontSize:35,color:C.slate}}> INDEX</span>
    </div>
    <div style={{position:"absolute",left:276,top:774,width:580}}>
      <Text size={25} color={C.slate} cue={.49} span={.07}>Estimate responds to current conditions</Text>
    </div>
    <div style={{position:"absolute",left:1056,top:774,width:610}}>
      <Text size={25} color={C.slate} cue={.49} span={.07}>Does not jump after one cold drive</Text>
    </div>
    <div style={{position:"absolute",top:865,left:247,right:247,textAlign:"center"}}>
      <Text size={29} color={C.yellow} cue={.66} span={.08}>
        A lower range estimate does not, by itself, prove permanent battery degradation.
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
  id: "VA_LF_019",
  component: VALF019RangeHealth,
  schema: rangeVsHealthSchema,
  description: "A one-time cold-weather range-estimate change beside a stable battery-health reference.",
  slots: Object.keys(rangeVsHealthSchema.shape),
  defaultDurationSec: 8,
  // Preview-only example values. Edit them here to see your changes in Studio.
  previewProps: {},
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 110,
};
