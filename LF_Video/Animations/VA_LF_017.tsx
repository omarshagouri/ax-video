import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFRevealProgress } from "../shared_system/Timing";
import { C, clamp, ease, reveal, P, Heading, Text } from "../shared_system/EditorialVisuals";

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_017. */
export const socHeatSchema=z.object({
  title:z.string().max(80).default("Stored charge and temperature both matter"),
  xAxisLabel:z.string().max(42).default("STORED STATE OF CHARGE"),
  yAxisLabel:z.string().max(42).default("AMBIENT TEMPERATURE"),
  footer:z.string().max(135).optional(),
});
/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
export const VALF017SocHeatMatrix:React.FC<any>=({title,xAxisLabel,yAxisLabel,footer})=>{
  const progress=useLFRevealProgress();
  const cols=6,rows=4,x0=484,y0=356,stepX=154,stepY=106;
  // The colors are qualitative; selected conditions are fixed examples, not tracked measurements.
  const low={x:x0+2*stepX,y:y0+3*stepY};
  const high={x:x0+5*stepX,y:y0};
  // DRAWING: The JSX below creates the animated objects shown on screen.
  return <AbsoluteFill>
    <Heading title={title} kicker="QUALITATIVE EXPOSURE MAP — NOT A PREDICTION" footer={footer}/>
    <P style={{left:230,top:282,width:1460,height:624}}/>
    <svg width={1920} height={1080} style={{position:"absolute",inset:0}}>
      {Array.from({length:rows},(_,i)=>Array.from({length:cols},(_,j)=>{
        const risk=.18+(j/(cols-1)*.35)+((rows-1-i)/(rows-1))*.45;
        const color=risk>.66?C.heat:risk>.42?C.yellow:C.teal;
        return <rect key={i+"-"+j} x={x0+j*stepX} y={y0+i*stepY} width={132} height={88}
          rx={16} fill={color}
          opacity={reveal(progress,.20+i*.024+j*.008,.32+i*.024+j*.008)*(.35+risk*.43)}
          stroke={color} strokeWidth={3}/>;
      }))}
      <rect x={low.x-6} y={low.y-6} width={144} height={100} rx={19} fill="none"
        stroke={C.white} strokeWidth={6} opacity={reveal(progress,.43,.52)}/>
      <rect x={high.x-6} y={high.y-6} width={144} height={100} rx={19} fill="none"
        stroke={C.white} strokeWidth={6} opacity={reveal(progress,.55,.63)}/>
      <text x={low.x+66} y={low.y+61} fontSize={42} textAnchor="middle" fontWeight={800}
        fill={C.white} opacity={reveal(progress,.43,.52)}>1</text>
      <text x={high.x+66} y={high.y+61} fontSize={42} textAnchor="middle" fontWeight={800}
        fill={C.white} opacity={reveal(progress,.55,.63)}>2</text>
      <path d="M 465 346 V 765" stroke={C.slate} strokeWidth={3} opacity={reveal(progress,.14,.24)}/>
      <path d="M 484 790 H 1390" stroke={C.slate} strokeWidth={3} opacity={reveal(progress,.14,.24)}/>
    </svg>
    <div style={{position:"absolute",top:307,left:280,width:560}}>
      <Text size={25} cue={.16} span={.08}>{yAxisLabel} ↑</Text>
    </div>
    <div style={{position:"absolute",top:381,left:282}}><Text size={25} color={C.heat} cue={.28}>WARMER</Text></div>
    <div style={{position:"absolute",top:713,left:282}}><Text size={25} color={C.cold} cue={.38}>COOLER</Text></div>
    <div style={{position:"absolute",top:810,left:648,width:680,textAlign:"center"}}>
      <Text size={27} cue={.28} span={.08}>{xAxisLabel} →</Text>
    </div>
    <div style={{position:"absolute",top:863,left:487}}><Text size={24} color={C.slate} cue={.39}>LOW SOC</Text></div>
    <div style={{position:"absolute",top:863,left:1250}}><Text size={24} color={C.slate} cue={.39}>HIGH SOC</Text></div>
    <div style={{position:"absolute",top:405,left:1410,width:248}}>
      <Text size={25} color={C.heat} cue={.57} span={.07}>2  HOT + HIGH SOC</Text>
      <Text size={21} color={C.slate} cue={.62} span={.07}>GREATER AGING STRESS</Text>
    </div>
    <div style={{position:"absolute",top:655,left:1410,width:248}}>
      <Text size={25} color={C.teal} cue={.46} span={.07}>1  COOL + MID SOC</Text>
      <Text size={21} color={C.slate} cue={.51} span={.07}>LOWER AGING STRESS</Text>
    </div>
  </AbsoluteFill>;
};


/** SETTINGS: Edit this block for this animation only. New files register automatically.
 * background: image in public/; backgroundDim: 0 (clear) to 1 (black).
 * authoredEndFrame: last entrance cue, NOT the video duration.
 * The older hyphenated ID is accepted by the renderer as an input alias.
 */
export const animation = {
  id: "VA_LF_017",
  component: VALF017SocHeatMatrix,
  schema: socHeatSchema,
  description: "Qualitative temperature versus stored-SOC matrix comparing two clearly labeled conditions.",
  slots: Object.keys(socHeatSchema.shape),
  defaultDurationSec: 8,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 110,
};
