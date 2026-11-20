import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFRevealProgress } from "../shared_system/Timing";
import { C, clamp, ease, reveal, P, Heading, Text } from "../shared_system/EditorialVisuals";

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_019. */
export const rangeVsHealthSchema=z.object({
  title:z.string().max(86).default("Dashboard range is not battery health"),
  rangeStart:clampNumeric(0, 100).default(82),
  rangeEnd:clampNumeric(0, 100).default(58),
  healthReference:clampNumeric(0, 100).default(79),
  footer:z.string().max(135).optional(),
});
/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
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


/** SETTINGS: Edit this block for this animation only. New files register automatically.
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
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 110,
};
