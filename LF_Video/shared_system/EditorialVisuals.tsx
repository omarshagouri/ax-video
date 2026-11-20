import React from "react";
import { AbsoluteFill } from "remotion";
import { useLFRevealProgress } from "./Timing";

export const C={navy:"#0A1628",panel:"#142440",line:"#28405E",white:"#F5FAFF",
  slate:"#B3C6D5",teal:"#39D7CB",cold:"#58B8FF",heat:"#FF8865",yellow:"#FFE0A1"};
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const ease=(v:number)=>1-Math.pow(1-clamp(v),3);
export const reveal=(p:number,start:number,end:number)=>ease((p-start)/Math.max(.01,end-start));
export const P:React.FC<{children?:React.ReactNode;style?:React.CSSProperties}>=({children,style})=>{
  const progress=useLFRevealProgress(),alpha=reveal(progress,.14,.27);
  return <div style={{position:"absolute",background:C.panel,border:"2px solid "+C.line,borderRadius:28,
    boxSizing:"border-box",opacity:alpha,...style}}>{children}</div>;
};
export const Heading:React.FC<{title?:string;kicker:string;footer?:string}>=({title,kicker,footer})=>{
  const progress=useLFRevealProgress(),first=reveal(progress,.01,.09),second=reveal(progress,.08,.20);
  return <AbsoluteFill style={{pointerEvents:"none",fontFamily:"Inter,Arial,sans-serif"}}>
    <div style={{position:"absolute",left:172,top:104,color:C.teal,fontSize:25,
      letterSpacing:4,fontWeight:800,opacity:first,transform:"translateY("+((1-first)*14)+"px"}}>{kicker.toUpperCase()}</div>
    <div style={{position:"absolute",left:172,top:145,right:172,color:C.white,fontWeight:750,
      fontSize:(title||"").length>55?51:63,lineHeight:1.1,fontFamily:"Space Grotesk,Arial,sans-serif",
      opacity:second,transform:"translateY("+((1-second)*18)+"px"}}>{title}</div>
    {/* Evidence attributions must remain available while factual values are on screen. */}
    <div style={{position:"absolute",left:172,right:172,bottom:70,textAlign:"center",
      color:C.slate,fontSize:23,letterSpacing:.3,opacity:reveal(progress,.19,.30)}}>{footer||"ILLUSTRATIVE ENGINEERING VISUAL — NOT MEASURED VEHICLE DATA"}</div>
  </AbsoluteFill>;
};
export const Text:React.FC<{children:React.ReactNode;size?:number;color?:string;weight?:number;cue?:number;span?:number}>=({children,size=31,color=C.white,weight=650,cue=.34,span=.11})=>{
  const p=useLFRevealProgress(),alpha=reveal(p,cue,cue+span);
  return <div style={{fontFamily:"Inter,Arial,sans-serif",fontSize:size,color,fontWeight:weight,lineHeight:1.22,
    opacity:alpha,transform:"translateY("+((1-alpha)*15)+"px"}}>{children}</div>;
};

