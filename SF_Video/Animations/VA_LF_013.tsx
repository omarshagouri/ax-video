import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRealFrame, useLFRevealProgress } from "../shared system/Timing";
import { C, clamp01, ease, staged, appear, loop01, Title, Footer, Panel } from "../shared system/ContinuousVisuals";

/** INPUTS: Validated labels, numbers and lists specific to VA_LF_013. */
export const dynamicCompareSchema=z.object({
  title:z.string().optional(),
  leftLabel:z.string(),
  rightLabel:z.string(),
  leftValue:z.string(),
  rightValue:z.string(),
  leftIntensity:clampNumeric(0, 100),
  rightIntensity:clampNumeric(0, 100),
  metricLabel:z.string().optional(),
  footer:z.string().optional(),
});

const CompareLane:React.FC<{x:number;label:string;value:string;intensity:number;accent:string;metric?:string}> = ({x,label,value,intensity,accent,metric}) => {
  // The intensity is a percentage of a fixed gray 0–100 reference track.
  const progress=useLFRevealProgress();
  const cue=x<600?.23:.42;
  const targetPct=Number.isFinite(intensity)?Math.max(0,Math.min(100,intensity)):0;
  // Both progress bars are the final payoff after the lane labels and values.
  const barStart=x<600?.79:.84;
  const reveal=staged(progress,barStart,.98);
  const filledPct=targetPct*reveal;
  const labelRef=React.useRef<HTMLDivElement>(null);
  const valueRef=React.useRef<HTMLDivElement>(null);

  // Fit labels to reserved text zones before Remotion captures the frame.
  // A second line is allowed, but cannot move the metric into the bar.
  React.useLayoutEffect(()=>{
    const fit=(el:HTMLDivElement|null,starting:number,minimum:number)=>{
      if(!el)return;
      let size=starting;
      el.style.fontSize=size+"px";
      while(size>minimum && (el.scrollHeight>el.clientHeight+1 || el.scrollWidth>el.clientWidth+1)){
        size-=2;
        el.style.fontSize=size+"px";
      }
    };
    fit(labelRef.current,36,24);
    fit(valueRef.current,66,28);
  },[label,value]);

  const trackLabels={fontFamily:"Inter,Arial",fontSize:23,fontWeight:700,color:C.slate};
  const showNumberInsideFill=filledPct>=18;
  const barOpacity=staged(progress,barStart-.045,barStart+.035);
  return <div style={{position:"absolute",left:x,top:95,width:620,height:430,border:"2px solid "+accent+"55",borderRadius:28,background:"rgba(20,36,64,.88)",boxSizing:"border-box"}}>
    <div ref={labelRef} style={{position:"absolute",left:38,right:38,top:28,height:66,overflow:"hidden",overflowWrap:"anywhere",fontFamily:"Space Grotesk,Arial",fontSize:36,lineHeight:1.1,fontWeight:750,color:accent,opacity:staged(progress,cue,cue+.15)}}>{label}</div>
    <div ref={valueRef} style={{position:"absolute",left:38,right:38,top:107,height:134,overflow:"hidden",overflowWrap:"anywhere",fontFamily:"Space Grotesk,Arial",fontSize:66,lineHeight:1.05,fontWeight:750,color:C.white,opacity:staged(progress,cue+.09,cue+.24)}}>{value}</div>
    {metric?<div style={{position:"absolute",left:38,right:38,top:251,height:56,overflow:"hidden",overflowWrap:"anywhere",fontFamily:"Inter,Arial",fontSize:25,lineHeight:1.12,fontWeight:650,color:C.slate,opacity:staged(progress,cue+.17,cue+.32)}}>{metric}</div>:null}
    <div style={{position:"absolute",left:45,right:45,bottom:77,height:34,borderRadius:10,background:C.line,overflow:"hidden",opacity:barOpacity}}>
      <div style={{position:"absolute",left:0,top:0,height:"100%",width:String(filledPct)+"%",borderRadius:10,background:accent}}/>
      <div style={{position:"absolute",left:0,top:0,height:"100%",width:showNumberInsideFill?String(filledPct)+"%":"100%",display:"flex",alignItems:"center",justifyContent:showNumberInsideFill?"center":"flex-start",paddingLeft:showNumberInsideFill?0:10,boxSizing:"border-box",fontFamily:"Inter,Arial",fontSize:22,fontWeight:800,letterSpacing:0.2,color:showNumberInsideFill?C.navy:C.white}}>
        {Math.round(filledPct)}%
      </div>
    </div>
    <div style={{position:"absolute",left:45,right:45,bottom:31,display:"flex",justifyContent:"space-between",...trackLabels,opacity:barOpacity}}><span>0</span><span>100</span></div>
  </div>;
};
/** VISUAL: Only this file controls its own shapes, labels, movement and layout. */
// TIMING: Shared hooks control when these local effects appear; edit reveal cues here.
export const VALF013DynamicCompare:React.FC<any> = ({title,leftLabel,rightLabel,leftValue,rightValue,leftIntensity,rightIntensity,metricLabel,footer}) => {
  const progress=useLFRevealProgress(); const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  // DRAWING: The JSX below creates the animated objects shown on screen.
  return <AbsoluteFill>
    <Title title={title||"Same system, different operating condition"} kicker="Live comparator"/>
    <Panel style={{position:"absolute",left:155,top:285,width:1610,height:620,opacity:p}}>
      <CompareLane x={105} label={leftLabel} value={leftValue} intensity={Number(leftIntensity)} accent={C.teal} metric={metricLabel}/>
      <CompareLane x={885} label={rightLabel} value={rightValue} intensity={Number(rightIntensity)} accent={C.heat} metric={metricLabel}/>
      <div style={{position:"absolute",left:775,top:255,width:60,textAlign:"center",fontFamily:"Space Grotesk,Arial",fontSize:44,fontWeight:800,color:C.slate,opacity:staged(progress,.39,.52)}}>VS</div>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};


/** SETTINGS: Edit this block for this animation only. New files register automatically.
 * background: image in public/; backgroundDim: 0 (clear) to 1 (black).
 * authoredEndFrame: last entrance cue, NOT the video duration.
 * The older hyphenated ID is accepted by the renderer as an input alias.
 */
export const animation = {
  id: "VA_LF_013",
  component: VALF013DynamicCompare,
  schema: dynamicCompareSchema,
  description: "Two side-by-side normalized progress bars, filled to leftIntensity/rightIntensity percent of their gray 0-100 reference tracks.",
  slots: Object.keys(dynamicCompareSchema.shape),
  defaultDurationSec: 9,
  background: "bg.png",
  backgroundDim: 0,
  authoredEndFrame: 65,
};
