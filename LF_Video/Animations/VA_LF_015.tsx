/**
 * VA_LF_015 — Two aging clocks: cycling stops while parked; calendar time continues.
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
export const twoClocksSchema=z.object({
  title:z.string().max(85).default("Your battery has two clocks"),
  cycleLabel:z.string().max(32).default("Charging cycles"),
  calendarLabel:z.string().max(32).default("Calendar time"),
  takeaway:z.string().max(70).default("One slows down when parked. One does not."),
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
export const VALF015TwoClocks:React.FC<any>=({title,cycleLabel,calendarLabel,takeaway,footer})=>{
  const progress=useLFRevealProgress();
  const centers=[575,1345],cy=574,r=148;
  // One illustrative movement: cycling stops when parked; calendar time continues.
  const cycleTravel=1.22*reveal(progress,.37,.56);
  const calendarTravel=1.82*reveal(progress,.37,.70);
  // DRAWING: The JSX below creates the animated objects shown on screen.
  return <AbsoluteFill>
    <Heading title={title} kicker="TWO INDEPENDENT AGING PATHWAYS" footer={footer}/>
    {centers.map((cx,i)=>{
      const angle=-Math.PI/2+(i===0?cycleTravel:calendarTravel);
      const color=i===0?C.cold:C.teal;
      const pointerX=cx+Math.cos(angle)*113,pointerY=cy+Math.sin(angle)*113;
      const dots=Array.from({length:24},(_,k)=>{const a=k/24*Math.PI*2;return {x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r};});
      return <React.Fragment key={i}>
        <P style={{left:cx-338,top:304,width:676,height:575,boxShadow:"0 16px 65px #0003",
          opacity:reveal(progress,i===0?.12:.22,i===0?.22:.31)}}/>
        <svg style={{position:"absolute",inset:0,opacity:reveal(progress,i===0?.30:.40,i===0?.41:.50)}} width={1920} height={1080}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth={20}/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8} opacity={.6}/>
          {dots.map((d,k)=><circle key={k} cx={d.x} cy={d.y} r={k%6===0?7:4} fill={color} opacity={k%6===0?1:.5}/>)}
          <line x1={cx} y1={cy} x2={pointerX} y2={pointerY} stroke={color} strokeWidth={12} strokeLinecap="round"/>
          <circle cx={cx} cy={cy} r={17} fill={C.white}/>
        </svg>
        <div style={{position:"absolute",top:342,left:cx-290,width:580,textAlign:"center"}}>
          <Text size={(i===0?cycleLabel:calendarLabel)?.length>24?30:38}
            color={color} cue={i===0?.23:.32} span={.08}>{i===0?cycleLabel:calendarLabel}</Text>
        </div>
        <div style={{position:"absolute",top:761,left:cx-290,width:580,textAlign:"center"}}>
          <Text size={29} cue={i===0?.49:.55} span={.08}>{i===0?"USE-RELATED WEAR":"TIME IN SERVICE"}</Text>
        </div>
        <div style={{position:"absolute",top:813,left:cx-290,width:580,textAlign:"center"}}>
          <Text size={22} color={color} cue={.62} span={.08}>
            {i===0?"NO NEW CYCLES WHILE PARKED":"STILL ELAPSES WHILE PARKED"}
          </Text>
        </div>
      </React.Fragment>;
    })}
    <div style={{position:"absolute",top:908,left:300,right:300,textAlign:"center"}}>
      <Text size={30} color={C.yellow} cue={.66} span={.08}>{takeaway}</Text>
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
  id: "VA_LF_015",
  component: VALF015TwoClocks,
  schema: twoClocksSchema,
  description: "Two aging clocks: cycling stops while parked; calendar time continues.",
  slots: Object.keys(twoClocksSchema.shape),
  defaultDurationSec: 8,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 110,
};
