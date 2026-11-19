import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFRevealProgress } from "../shared system/Timing";
import { C, clamp, ease, reveal, P, Heading, Text } from "../shared system/EditorialVisuals";

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_015. */
export const twoClocksSchema=z.object({
  title:z.string().max(85).default("Your battery has two clocks"),
  cycleLabel:z.string().max(32).default("Charging cycles"),
  calendarLabel:z.string().max(32).default("Calendar time"),
  takeaway:z.string().max(70).default("One slows down when parked. One does not."),
  footer:z.string().max(135).optional(),
});
/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
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


/** SETTINGS: Edit this block for this animation only. New files register automatically.
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
