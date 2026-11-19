import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFRevealProgress } from "../shared system/Timing";
import { C, clamp, ease, reveal, P, Heading, Text } from "../shared system/EditorialVisuals";

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_020. */
export const fluctuationTrendSchema=z.object({
  title:z.string().max(86).default("Fluctuation and long-term change are different"),
  topLabel:z.string().max(45).default("TEMPORARY RANGE VARIATION"),
  bottomLabel:z.string().max(45).default("PERSISTENT CAPACITY TREND"),
  footer:z.string().max(135).optional(),
});
/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
export const VALF020FluctuationTrend:React.FC<any>=({title,topLabel,bottomLabel,footer})=>{
  const progress=useLFRevealProgress();
  const W=1065,x0=550,top=410,bottom=672;
  // Plot each illustrative history once and hold. A roaming cursor implied live telemetry.
  const topDraw=reveal(progress,.29,.46),bottomDraw=reveal(progress,.51,.68);
  const wave=(x:number)=>36*Math.sin(x*17)+17*Math.cos(x*43);
  const decline=(x:number)=>-x*98+11*Math.sin(x*6);
  const points=(base:number,fn:(x:number)=>number)=>Array.from({length:160},(_,i)=>{
    const p=i/159;// DRAWING: The JSX below creates the animated objects shown on screen.
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


/** SETTINGS: Edit this block for this animation only. New files register automatically.
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
