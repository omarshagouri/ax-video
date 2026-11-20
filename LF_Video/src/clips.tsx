// Four native, 3-second AX motion clips. Synthetic engineering imagery,
// not filmed/stock footage. Each plays as a full-screen moving visual in Remotion.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";

const INK="#091628", SURFACE="#122640", TEAL="#21d6ca", SKY="#52a8f7", ORANGE="#ffb453", WHITE="#f0f8ff";
const clipSchema = z.object({
  title:z.string().max(80).optional(),
  footer:z.string().max(130).optional(),
}).strict();
const ease=(n:number)=>Math.max(0,Math.min(1,n));
const css=(extra:React.CSSProperties):React.CSSProperties=>({position:"absolute",...extra});
const Background:React.FC<{children:React.ReactNode;title?:string;footer?:string;kicker:string}>=({children,title,footer,kicker})=><AbsoluteFill style={{background:"radial-gradient(ellipse at 52% 42%,#1a3550 0%,#091628 64%,#050b15 100%)",overflow:"hidden",fontFamily:"Inter, Arial"}}>
 <div style={css({inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)",backgroundSize:"72px 72px"})}/>
 {children}
 <div style={css({left:120,top:92,color:TEAL,fontWeight:700,fontSize:25,letterSpacing:5})}>{kicker}</div>
 {title?<div style={css({left:120,top:142,fontWeight:700,fontSize:53,color:WHITE,maxWidth:1500})}>{title}</div>:null}
 {footer?<div style={css({left:120,bottom:65,color:"#adc6db",fontSize:24})}>{footer}</div>:null}
 </AbsoluteFill>;
const Glow:React.FC<{x:number;y:number;size:number;color?:string;opacity?:number}>=({x,y,size,color=TEAL,opacity=.5})=><div style={css({left:x-size/2,top:y-size/2,width:size,height:size,borderRadius:"50%",background:`radial-gradient(circle,${color}77,transparent 72%)`,opacity})}/>;
export const CellArray:React.FC<{title?:string;footer?:string}>=({title="Inside a battery pack",footer})=>{
 const f=useCurrentFrame(),pan=-54+f*2.25;
 return <Background kicker="CELL ARCHITECTURE" title={title} footer={footer}>
  <div style={css({inset:0,transform:`translateX(${pan}px) skewX(-8deg)`,opacity:.98})}>
   {Array.from({length:45},(_,i)=>{const col=i%9,row=Math.floor(i/9);const x=370+col*151+row*45,y=365+row*121;const shimmer=(f/90+col*.13+row*.19)%1;return <React.Fragment key={i}>
     <Glow x={x+53} y={y+75} size={125} color={SKY} opacity={.3}/>
     <div style={css({left:x,top:y,width:106,height:97,border:"2px solid #5b7b94",borderRadius:"50%",background:"radial-gradient(ellipse at 35% 28%,#a7bdca 0%,#384e60 28%,#11243b 55%,#0d1e31 80%)",boxShadow:"0 14px 15px #04111a,0 0 18px #27bfef22"})}/>
     <div style={css({left:x+18,top:y+14,width:70,height:66,border:`4px solid ${shimmer<.35?TEAL:"#537e97"}`,borderRadius:"50%",opacity:.75})}/>
   </React.Fragment>})}
  </div>
 </Background>};
export const ChargeTransfer:React.FC<{title?:string;footer?:string}>=({title="Energy transfer",footer})=>{
 const f=useCurrentFrame(),pulse=f/90;
 return <Background kicker="CHARGING SYSTEM" title={title} footer={footer}>
  <div style={css({left:280,top:465,width:570,height:18,borderRadius:12,background:"#253b53",boxShadow:"0 0 22px #23cfc455"})}/>
  <div style={css({left:270,top:406,width:165,height:140,borderRadius:29,border:"7px solid #66849b",background:"linear-gradient(125deg,#50647d,#172e45)",boxShadow:"0 25px 40px #0007"})}/>
  {[0,1,2].map(i=><div key={i} style={css({left:330,top:422+i*31,width:47,height:11,borderRadius:6,background:TEAL,boxShadow:"0 0 14px #21d6ca88"})}/>)}
  <div style={css({left:890,top:347,width:590,height:320,borderRadius:28,border:"7px solid #6e879a",background:"linear-gradient(145deg,#273c54,#081b32)",boxShadow:"0 20px 90px #000a"})}/>
  <div style={css({left:925,top:385,width:520,height:243,borderRadius:16,background:"repeating-linear-gradient(90deg,#145568 0px,#145568 31px,#107987 33px,#107987 45px)",opacity:.73})}/>
  {Array.from({length:7},(_,i)=>{const p=((pulse*2.3+i/7)%1),x=480+p*840;return <div key={i} style={css({left:x,top:464+(i%3-1)*23,width:35,height:11,background:TEAL,borderRadius:9,boxShadow:"0 0 20px #21d6ca",opacity:Math.sin(p*Math.PI)})}/>})}
 </Background>};
export const ThermalField:React.FC<{title?:string;footer?:string}>=({title="Heat moves through the pack",footer})=>{
 const f=useCurrentFrame(),wave=f/90;
 return <Background kicker="THERMAL MANAGEMENT" title={title} footer={footer}>
  {Array.from({length:80},(_,i)=>{const x=i%10,y=Math.floor(i/10);const dist=Math.hypot(x-6.4+wave*1.2,y-3.7);const heat=ease(1-dist/6.5),col=heat>.64?"#ffab57":heat>.37?"#42bac8":"#24618f";return <div key={i} style={css({left:265+x*138,top:321+y*82,width:121,height:67,borderRadius:9,background:col,border:"2px solid #c2e9ff44",opacity:.5+heat*.5,boxShadow:heat>.65?"0 0 18px #e78038bb":"none"})}/>})}
  <div style={css({left:250+f*13,top:298,width:6,height:715,background:TEAL,opacity:.8,boxShadow:"0 0 30px #21d6ca"})}/>
 </Background>};
export const PackLayers:React.FC<{title?:string;footer?:string}>=({title="Cell, module and pack",footer})=>{
 const f=useCurrentFrame(),open=ease(f/45),w=940,h=170;
 return <Background kicker="PACK ENGINEERING" title={title} footer={footer}>
  {["ENCLOSURE","THERMAL PLATE","CELL MODULES","CONTROL LAYER"].map((name,i)=>{const y=465+(i-1.5)*open*105,x=445+(i-1.5)*open*45;const accents=[SKY,TEAL,ORANGE,"#8ccbee"];return <div key={name} style={css({left:x,top:y,width:w,height:h,transform:"perspective(1200px) rotateX(57deg) rotateZ(-8deg)",border:`4px solid ${accents[i]}`,background:"linear-gradient(130deg,#294961,#091b2d)",borderRadius:20,boxShadow:`0 20px 60px #0009,0 0 17px ${accents[i]}44`})}>
    <div style={{margin:38,color:accents[i],fontSize:38,fontWeight:700,letterSpacing:3}}>{name}</div>
   </div>})}
 </Background>};
export const nativeClips:Record<string,{component:React.FC<any>,schema:z.ZodTypeAny}>={
 "VV-LF-001":{component:CellArray,schema:clipSchema},
 "VV-LF-002":{component:ChargeTransfer,schema:clipSchema},
 "VV-LF-003":{component:ThermalField,schema:clipSchema},
 "VV-LF-004":{component:PackLayers,schema:clipSchema},
};
export const NATIVE_CLIP_IDS=Object.keys(nativeClips);
