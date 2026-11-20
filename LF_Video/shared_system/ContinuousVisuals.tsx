import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { useLFPacedFrame as useCurrentFrame } from "./Timing";
import { theme } from "./theme";

export const C = {
  ...theme,
  surface: "#142440",
  line: "#24375A",
  slate: "#8CA0B8",
  heatDeep: "#FF4D4D",
};

export const clamp01 = (v:number) => Math.max(0, Math.min(1, v));
export const ease = (v:number) => 1 - Math.pow(1 - clamp01(v), 3);
export const staged = (p:number,start:number,end:number) => ease((p-start)/Math.max(.01,end-start));
export const appear = (frame:number, fps:number, delay=0) => clamp01(spring({
  frame: Math.max(0, frame-delay), fps,
  config:{damping:19, stiffness:125, mass:.72}
}));
export const loop01 = (frame:number, period:number, offset=0) => {
  const p = ((frame + offset) % period) / period;
  return p < 0 ? p + 1 : p;
};

export const Title: React.FC<{title?:string;kicker:string}> = ({title,kicker}) => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps);
  const size=(title||"").length>52?54:(title||"").length>38?60:66;
  return <div style={{position:"absolute",left:120,right:120,top:62,opacity:p,transform:`translateY(${(1-p)*15}px)`}}>
    <div style={{fontFamily:"Inter,Arial",fontSize:27,fontWeight:700,color:C.teal,letterSpacing:4.2,marginBottom:12}}>{kicker.toUpperCase()}</div>
    <div style={{fontFamily:"Space Grotesk,Arial",fontSize:size,fontWeight:700,color:C.white,lineHeight:1.05,letterSpacing:-1,maxWidth:1580}}>{title}</div>
  </div>;
};
export const Footer:React.FC<{text?:string}> = ({text}) => text ? <div style={{position:"absolute",left:120,right:120,bottom:42,fontFamily:"Inter,Arial",fontSize:25,color:C.slate}}>{text}</div> : null;
export const Panel:React.FC<{children:React.ReactNode;style?:React.CSSProperties}> = ({children,style}) => <div style={{background:"rgba(10,22,40,.72)",border:`2px solid ${C.line}`,borderRadius:28,boxShadow:"0 22px 70px rgba(0,0,0,.22)",...style}}>{children}</div>;

// Shared by the packet, gate, and BMS decision animations.
export const NodeBox:React.FC<{label:string;x:number;y:number;width:number;accent?:string;opacity?:number}> = ({label,x,y,width,accent=C.teal,opacity=1}) =>
  <div style={{position:"absolute",left:x,top:y,width,height:150,boxSizing:"border-box",border:`2px solid ${accent}88`,borderRadius:23,background:"rgba(20,36,64,.94)",display:"flex",alignItems:"center",justifyContent:"center",padding:"18px 20px",textAlign:"center",fontFamily:"Space Grotesk,Arial",fontSize:label.length>16?27:32,fontWeight:700,color:C.white,opacity}}>
    {label}
  </div>;

