import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { theme } from "./theme";

const C = {
  ...theme,
  surface: "#142440",
  line: "#24375A",
  slate: "#8CA0B8",
  heat: "#FF8A4C",
  heatDeep: "#FF4D4D",
  cold: "#4DA6FF",
};

export type AnimationEntry = {
  component: React.FC<any>;
  schema: z.ZodTypeAny;
  description: string;
  slots: string[];
  defaultDurationSec: number;
};

const bgFields = {
  backgroundSrc: z.string().optional(),
  backgroundFileId: z.string().optional(),
  backgroundOpacity: z.number().min(0).max(1).optional().default(0.34),
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
const phase = (frame:number,start:number,duration:number) => clamp01((frame-start)/Math.max(1,duration));
const fade = (frame:number,start:number,duration=12) =>
  interpolate(frame,[start,start+duration],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
const enter = (frame:number,fps:number,delay=0,stiffness=120) =>
  clamp01(spring({frame:Math.max(0,frame-delay),fps,config:{damping:19,stiffness,mass:.72}}));
const loop01 = (frame:number,period:number,offset=0) => {
  const p=((frame+offset)%period)/period;
  return p<0?p+1:p;
};
const asset = (s:string) => s.startsWith("http") || s.startsWith("data:") ? s : staticFile(s);

const Stage:React.FC<{backgroundSrc?:string;backgroundOpacity?:number;children:React.ReactNode}> = ({backgroundSrc,backgroundOpacity=.34,children}) => (
  <AbsoluteFill>
    {backgroundSrc ? (
      <>
        <Img src={asset(backgroundSrc)} style={{width:"100%",height:"100%",objectFit:"cover"}} />
        <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(10,22,40,.88) 0%,rgba(10,22,40,.52) 48%,rgba(10,22,40,.82) 100%)",opacity:1-backgroundOpacity*.18}}/>
      </>
    ) : null}
    {children}
  </AbsoluteFill>
);

const Title:React.FC<{title?:string;kicker:string}> = ({title,kicker}) => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=enter(f,fps,0);
  const t=title||"";
  const size=t.length>54?46:t.length>38?52:58;
  return <div style={{position:"absolute",left:76,right:76,top:92,opacity:p,transform:`translateY(${(1-p)*18}px)`,textAlign:"center"}}>
    <div style={{fontFamily:"Inter,Arial",fontSize:24,fontWeight:800,color:C.teal,letterSpacing:3.2,marginBottom:14}}>{kicker.toUpperCase()}</div>
    <div style={{fontFamily:"Space Grotesk,Arial",fontSize:size,fontWeight:700,color:C.white,lineHeight:1.06,letterSpacing:-.8}}>{title}</div>
  </div>;
};

const Footer:React.FC<{text?:string}> = ({text}) => text ? <div style={{position:"absolute",left:76,right:76,top:1082,textAlign:"center",fontFamily:"Inter,Arial",fontSize:23,color:C.slate,lineHeight:1.25}}>{text}</div> : null;
const Panel:React.FC<{children:React.ReactNode;style?:React.CSSProperties}> = ({children,style}) => <div style={{background:"rgba(10,22,40,.72)",border:`2px solid ${C.line}`,borderRadius:28,boxShadow:"0 22px 70px rgba(0,0,0,.22)",...style}}>{children}</div>;

const pct = (v:any)=>Math.max(0,Math.min(100,Number(v)));
const baseSlots=["backgroundFileId","backgroundOpacity"];

const batteryBufferSchema=z.object({...bgFields,title:z.string().optional(),usablePct:z.number().min(0).max(100),bufferPct:z.number().min(0).max(100).default(0),usableLabel:z.string().optional().default("Usable"),bufferLabel:z.string().optional().default("Reserve"),footer:z.string().optional()});
const beforeAfterSchema=z.object({...bgFields,title:z.string().optional(),beforeLabel:z.string(),beforePct:z.number().min(0).max(100),afterLabel:z.string(),afterPct:z.number().min(0).max(100),deltaLabel:z.string().optional(),footer:z.string().optional()});
const lineChartSchema=z.object({...bgFields,title:z.string().optional(),seriesALabel:z.string().optional().default("A"),seriesA:z.array(z.number()).min(2),seriesBLabel:z.string().optional().default("B"),seriesB:z.array(z.number()).min(2).optional(),xLabel:z.string().optional(),yLabel:z.string().optional(),footer:z.string().optional()});
const processFlowSchema=z.object({...bgFields,title:z.string().optional(),nodes:z.array(z.string()).min(2).max(5),centerLabel:z.string().optional(),direction:z.enum(["forward","reverse","bidirectional"]).default("forward"),footer:z.string().optional()});
const timelineSchema=z.object({...bgFields,title:z.string().optional(),milestones:z.array(z.object({label:z.string(),value:z.string().optional(),tone:z.enum(["teal","heat","cold","white"]).optional()})).min(2).max(6),footer:z.string().optional()});
const counterSchema=z.object({...bgFields,title:z.string().optional(),value:z.number(),decimals:z.number().int().min(0).max(2).default(0),prefix:z.string().optional().default(""),suffix:z.string().optional().default(""),label:z.string().optional(),tone:z.enum(["teal","heat","cold","white"]).optional(),footer:z.string().optional()});
const systemDeltaSchema=z.object({...bgFields,title:z.string().optional(),beforeLabel:z.string(),afterLabel:z.string(),beforeItems:z.array(z.string()).min(1).max(4),afterItems:z.array(z.string()).min(1).max(4),footer:z.string().optional()});
const packetStreamSchema=z.object({...bgFields,title:z.string().optional(),nodes:z.array(z.string()).min(2).max(5),flowLabel:z.string().optional(),intensity:z.number().min(1).max(5).default(3),footer:z.string().optional()});
const throttleSchema=z.object({...bgFields,title:z.string().optional(),inputLabel:z.string(),gateLabel:z.string(),outputLabel:z.string(),inputRate:z.number().min(0).max(100),outputRate:z.number().min(0).max(100),footer:z.string().optional()});
const thermalSchema=z.object({...bgFields,title:z.string().optional(),heatLevel:z.number().min(0).max(100).default(70),hotspotRow:z.number().int().min(0).max(5).default(2),hotspotCol:z.number().int().min(0).max(4).default(2),cooling:z.boolean().default(true),note:z.string().optional(),footer:z.string().optional()});
const calibrationSchema=z.object({...bgFields,title:z.string().optional(),displayedStart:z.number().min(0).max(100),displayedEnd:z.number().min(0).max(100),usablePct:z.number().min(0).max(100),displayedLabel:z.string().default("Displayed estimate"),usableLabel:z.string().default("Usable energy"),footer:z.string().optional()});
const dataDecisionSchema=z.object({...bgFields,title:z.string().optional(),sensors:z.array(z.string()).min(2).max(4),decisionLabel:z.string(),actionLabel:z.string(),footer:z.string().optional()});
const dynamicCompareSchema=z.object({...bgFields,title:z.string().optional(),leftLabel:z.string(),rightLabel:z.string(),leftValue:z.string(),rightValue:z.string(),leftIntensity:z.number().min(0).max(100),rightIntensity:z.number().min(0).max(100),metricLabel:z.string().optional(),footer:z.string().optional()});

const toneColor=(tone?:string)=>tone==="heat"?C.heat:tone==="cold"?C.cold:tone==="white"?C.white:C.teal;

export const VASF001BatteryBuffer:React.FC<any>=({title,usablePct,bufferPct,usableLabel,bufferLabel,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  const usable=pct(usablePct),reserve=Math.min(100-usable,pct(bufferPct)),remaining=Math.max(0,100-usable-reserve);
  const box=enter(f,fps,7),u=phase(f,18,34),r=phase(f,44,20),scan=loop01(f,Math.round(fps*2.4));
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"Gross capacity vs usable capacity"} kicker="Battery window"/>
    <Panel style={{position:"absolute",left:90,right:90,top:385,height:650,opacity:box,transform:`translateY(${(1-box)*20}px)`}}>
      <div style={{position:"absolute",left:90,right:90,top:82,height:430,border:`6px solid ${C.slate}`,borderRadius:34,padding:14,display:"flex",flexDirection:"column-reverse",overflow:"hidden",background:"rgba(20,36,64,.76)"}}>
        <div style={{height:`${usable*u}%`,background:C.teal,borderRadius:16,boxShadow:`0 0 30px ${C.teal}33`}}/>
        <div style={{height:`${reserve*r}%`,background:C.heat,opacity:.95}}/>
        <div style={{height:`${remaining}%`,background:C.line}}/>
        <div style={{position:"absolute",left:0,right:0,top:`${scan*100}%`,height:3,background:"rgba(255,255,255,.72)",boxShadow:"0 0 18px rgba(255,255,255,.55)"}}/>
      </div>
      <div style={{position:"absolute",left:65,right:65,bottom:50,display:"flex",justifyContent:"center",gap:18,fontFamily:"Inter,Arial",fontSize:25,fontWeight:750}}>
        <span style={{color:C.teal}}>{usableLabel||"Usable"} {Math.round(usable)}%</span>
        {reserve>0?<span style={{color:C.heat}}>{bufferLabel||"Reserve"} {Math.round(reserve)}%</span>:null}
      </div>
    </Panel><Footer text={footer}/></Stage>;
};

const BatteryBlock:React.FC<{label:string;value:number;accent:string;frame:number;delay:number}> = ({label,value,accent,frame,delay})=>{
  const p=fade(frame,delay,14),fill=phase(frame,delay+10,30),pulse=.96+.04*Math.sin(frame/12);
  return <div style={{width:390,height:410,border:`2px solid ${accent}66`,borderRadius:26,background:"rgba(20,36,64,.9)",padding:"30px 28px",boxSizing:"border-box",opacity:p,transform:`scale(${pulse})`}}>
    <div style={{fontFamily:"Inter,Arial",fontSize:26,fontWeight:750,color:C.slate,textAlign:"center"}}>{label}</div>
    <div style={{position:"relative",height:210,width:140,margin:"28px auto 0",border:`5px solid ${C.slate}`,borderRadius:22,padding:9,display:"flex",alignItems:"flex-end",background:"rgba(10,22,40,.65)"}}>
      <div style={{width:"100%",height:`${value*fill}%`,borderRadius:12,background:accent,boxShadow:`0 0 24px ${accent}44`}}/>
    </div>
    <div style={{marginTop:18,fontFamily:"Space Grotesk,Arial",fontSize:58,fontWeight:750,color:accent,textAlign:"center"}}>{Math.round(value)}%</div>
  </div>;
};

export const VASF002BeforeAfter:React.FC<any>=({title,beforeLabel,beforePct,afterLabel,afterPct,deltaLabel,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const diff=Number(afterPct)-Number(beforePct),ap=fade(f,34,14);
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"Before vs after"} kicker="Capacity comparison"/>
    <div style={{position:"absolute",left:80,right:80,top:410,display:"flex",alignItems:"center",justifyContent:"center",gap:26}}>
      <BatteryBlock label={beforeLabel} value={pct(beforePct)} accent={C.slate} frame={f} delay={8}/>
      <div style={{width:100,textAlign:"center",opacity:ap,fontFamily:"Space Grotesk,Arial",fontSize:58,fontWeight:800,color:diff<0?C.heat:C.teal}}>→<div style={{fontFamily:"Inter,Arial",fontSize:22,marginTop:10,whiteSpace:"nowrap"}}>{deltaLabel||`${diff>0?"+":""}${diff.toFixed(0)} pts`}</div></div>
      <BatteryBlock label={afterLabel} value={pct(afterPct)} accent={diff<0?C.heat:C.teal} frame={f} delay={24}/>
    </div><Footer text={footer}/></Stage>;
};

const makePath=(vals:number[],w:number,h:number,min:number,max:number)=>vals.map((v,i)=>`${i===0?"M":"L"} ${((i/Math.max(1,vals.length-1))*w).toFixed(1)} ${(h-((v-min)/Math.max(1e-6,max-min))*h).toFixed(1)}`).join(" ");

export const VASF003LineChart:React.FC<any>=({title,seriesALabel,seriesA,seriesBLabel,seriesB,xLabel,yLabel,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const p=fade(f,7,14),draw=phase(f,20,50),all=[...seriesA,...(seriesB||[])].map(Number),rawMin=Math.min(...all),rawMax=Math.max(...all),spread=Math.max(1,rawMax-rawMin),step=spread<=5?1:spread<=15?5:spread<=40?10:spread<=100?20:50,min=Math.floor(rawMin/step)*step,max=Math.max(min+step,Math.ceil(rawMax/step)*step);
  const w=760,h=470,ox=110,oy=120,tracer=loop01(f,Math.round(30*2.8));
  const pa=makePath(seriesA.map(Number),w,h,min,max),pb=seriesB?makePath(seriesB.map(Number),w,h,min,max):"";
  const tracerIndex=Math.min(seriesA.length-1,Math.floor(tracer*(seriesA.length-1))),tx=ox+(tracerIndex/Math.max(1,seriesA.length-1))*w,ty=oy+h-((Number(seriesA[tracerIndex])-min)/(max-min))*h;
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"Trend over time"} kicker="Animated chart"/>
    <Panel style={{position:"absolute",left:70,right:70,top:365,height:720,opacity:p}}>
      <svg width="940" height="650" style={{position:"absolute",left:0,top:0}}>
        {[0,.25,.5,.75,1].map(g=><line key={g} x1={ox} y1={oy+h*g} x2={ox+w} y2={oy+h*g} stroke={C.line} strokeWidth={g===1?4:2}/>)}
        <line x1={ox} y1={oy} x2={ox} y2={oy+h} stroke={C.line} strokeWidth="4"/>
        <path d={pa} transform={`translate(${ox},${oy})`} fill="none" stroke={C.teal} strokeWidth="8" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-draw}/>
        {seriesB?<path d={pb} transform={`translate(${ox},${oy})`} fill="none" stroke={C.slate} strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-draw}/>:null}
        {draw>.95?<circle cx={tx} cy={ty} r="11" fill={C.white} stroke={C.teal} strokeWidth="5"/>:null}
      </svg>
      <div style={{position:"absolute",left:110,top:55,fontFamily:"Inter,Arial",fontSize:24,fontWeight:700,color:C.slate}}>{yLabel||""}</div>
      <div style={{position:"absolute",right:85,bottom:55,fontFamily:"Inter,Arial",fontSize:24,fontWeight:700,color:C.slate}}>{xLabel||""}</div>
      <div style={{position:"absolute",left:120,right:120,bottom:20,display:"flex",justifyContent:"center",gap:26,fontFamily:"Inter,Arial",fontSize:23,fontWeight:700}}>
        <span style={{color:C.teal}}>● {seriesALabel||"A"}</span>{seriesB?<span style={{color:C.slate}}>● {seriesBLabel||"B"}</span>:null}
      </div>
    </Panel><Footer text={footer}/></Stage>;
};

const FlowNode:React.FC<{label:string;top:number;accent:string;opacity:number}> = ({label,top,accent,opacity})=><div style={{position:"absolute",left:250,width:580,height:116,top,border:`2px solid ${accent}77`,borderRadius:22,background:"rgba(20,36,64,.94)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px 24px",boxSizing:"border-box",fontFamily:"Space Grotesk,Arial",fontSize:32,fontWeight:700,color:C.white,textAlign:"center",opacity}}>{label}</div>;

export const VASF004ProcessFlow:React.FC<any>=({title,nodes,centerLabel,direction,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const n=nodes.length,top=410,gap=130,positions=nodes.map((_:string,i:number)=>top+i*gap),period=Math.round(fps*1.8),q=loop01(f,period),p=fade(f,6,12);
  const y0=positions[0]+116,y1=positions[n-1],pulseY=y0+(y1-y0)*q;
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"Energy flow"} kicker="Process diagram"/>
    <Panel style={{position:"absolute",left:100,right:100,top:350,height:760,opacity:p}}>
      {centerLabel?<div style={{position:"absolute",left:60,right:60,top:35,fontFamily:"Inter,Arial",fontSize:24,fontWeight:650,color:C.slate,textAlign:"center"}}>{centerLabel}</div>:null}
      <svg width="880" height="760" style={{position:"absolute",inset:0}}>
        {positions.slice(0,-1).map((y:number,i:number)=><g key={i}><line x1="440" y1={y+116} x2="440" y2={positions[i+1]} stroke={C.line} strokeWidth="7"/><text x="440" y={(y+116+positions[i+1])/2+10} textAnchor="middle" fill={C.teal} fontSize="34" fontWeight="700">{direction==="reverse"?"↑":direction==="bidirectional"?"↕":"↓"}</text></g>)}
        {f>40?<circle cx="440" cy={pulseY} r="12" fill={C.teal}/>:null}
      </svg>
      {nodes.map((node:string,i:number)=><FlowNode key={node+i} label={node} top={positions[i]} accent={i===0||i===n-1?C.teal:C.slate} opacity={fade(f,12+i*6,10)}/>)}
    </Panel><Footer text={footer}/></Stage>;
};

export const VASF005Timeline:React.FC<any>=({title,milestones,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=fade(f,6,12),line=phase(f,16,45),top=435,h=520,n=milestones.length,step=h/Math.max(1,n-1);
  const travel=loop01(f,Math.round(fps*3.0));
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"Timeline"} kicker="Milestones"/>
    <Panel style={{position:"absolute",left:120,right:120,top:360,height:720,opacity:p}}>
      <div style={{position:"absolute",left:215,top:top-360,width:7,height:h,background:C.line,borderRadius:8}}/>
      <div style={{position:"absolute",left:215,top:top-360,width:7,height:h*line,background:C.teal,borderRadius:8,boxShadow:`0 0 18px ${C.teal}44`}}/>
      <div style={{position:"absolute",left:204,top:top-360+h*travel-11,width:29,height:29,borderRadius:99,background:C.white,boxShadow:`0 0 20px ${C.teal}`}}/>
      {milestones.map((m:any,i:number)=>{const y=top-360+i*step,c=toneColor(m.tone),r=fade(f,18+i*8,10);return <div key={i} style={{position:"absolute",left:190,top:y-34,width:600,display:"flex",alignItems:"center",gap:30,opacity:r}}>
        <div style={{width:56,height:56,borderRadius:99,background:c,border:`6px solid ${C.surface}`,boxShadow:`0 0 18px ${c}55`,flex:"0 0 56px"}}/>
        <div><div style={{fontFamily:"Space Grotesk,Arial",fontSize:34,fontWeight:750,color:c}}>{m.value||""}</div><div style={{fontFamily:"Inter,Arial",fontSize:27,fontWeight:650,color:C.white,marginTop:2}}>{m.label}</div></div>
      </div>})}
    </Panel><Footer text={footer}/></Stage>;
};

const formatCount=(value:number,decimals:number)=>decimals>0?value.toLocaleString("en-US",{minimumFractionDigits:decimals,maximumFractionDigits:decimals}):Math.round(value).toLocaleString("en-US");

export const VASF006Counter:React.FC<any>=({title,value,decimals,prefix,suffix,label,tone,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const accent=toneColor(tone),p=enter(f,fps,6),count=ease(phase(f,14,48)),shown=Number(value)*count,breath=1+.025*Math.sin(f/fps*Math.PI*2*.6);
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title} kicker="Key number"/>
    <Panel style={{position:"absolute",left:105,right:105,top:500,height:470,display:"flex",alignItems:"center",justifyContent:"center",opacity:p,transform:`scale(${breath})`}}>
      <div style={{textAlign:"center",width:"100%"}}><div style={{fontFamily:"Space Grotesk,Arial",fontSize:String(Math.abs(Math.round(Number(value)))).length>=6?112:138,fontWeight:750,color:accent,whiteSpace:"nowrap",lineHeight:.95}}>{prefix||""}{formatCount(shown,Number(decimals||0))}{suffix||""}</div>
      {label?<div style={{marginTop:30,fontFamily:"Inter,Arial",fontSize:34,fontWeight:650,color:C.white}}>{label}</div>:null}</div>
    </Panel><Footer text={footer}/></Stage>;
};

export const VASF007SystemDelta:React.FC<any>=({title,beforeLabel,afterLabel,beforeItems,afterItems,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const left=fade(f,8,14),right=fade(f,30,14),pulse=.96+.04*Math.sin(f/15);
  const side=(label:string,items:string[],accent:string,opacity:number,top:number)=><Panel style={{position:"absolute",left:130,right:130,top,height:285,padding:"26px 30px",boxSizing:"border-box",border:`2px solid ${accent}66`,opacity,transform:`scale(${pulse})`}}>
    <div style={{fontFamily:"Space Grotesk,Arial",fontSize:34,fontWeight:750,color:accent,marginBottom:18}}>{label}</div>{items.map((x:string,i:number)=><div key={i} style={{display:"flex",gap:14,marginTop:12,fontFamily:"Inter,Arial",fontSize:x.length>30?24:27,fontWeight:620,color:C.white,opacity:fade(f,(top<700?18:40)+i*5,9)}}><span style={{color:accent}}>●</span><span>{x}</span></div>)}
  </Panel>;
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"System change"} kicker="Before / after"/>
    {side(beforeLabel,beforeItems,C.slate,left,405)}
    <div style={{position:"absolute",left:0,right:0,top:705,textAlign:"center",fontFamily:"Space Grotesk,Arial",fontSize:54,fontWeight:800,color:C.teal}}>↓</div>
    {side(afterLabel,afterItems,C.teal,right,775)}
    <Footer text={footer}/></Stage>;
};

export const VASF008PacketStream:React.FC<any>=({title,nodes,flowLabel,intensity,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const n=nodes.length,top=400,gap=132,pos=nodes.map((_:string,i:number)=>top+i*gap),y0=pos[0]+116,y1=pos[n-1],count=Math.max(3,Math.min(8,Number(intensity||3)+3)),period=Math.round(fps*(2.7-Math.min(5,Number(intensity||3))*.24));
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"Energy packets moving through the system"} kicker="Continuous stream"/>
    <Panel style={{position:"absolute",left:105,right:105,top:350,height:760}}>
      {flowLabel?<div style={{position:"absolute",left:55,right:55,top:32,textAlign:"center",fontFamily:"Inter,Arial",fontSize:23,fontWeight:650,color:C.slate}}>{flowLabel}</div>:null}
      <svg width="870" height="760" style={{position:"absolute",inset:0}}><line x1="435" y1={y0-350} x2="435" y2={y1-350} stroke={C.line} strokeWidth="9" strokeLinecap="round"/>
      {[...Array(count)].map((_,i)=>{const q=loop01(f,period,Math.round(i*period/count)),y=(y0-350)+(y1-y0)*q;return <g key={i}><circle cx="435" cy={y} r="18" fill={C.teal} opacity=".14"/><circle cx="435" cy={y} r="8" fill={C.teal}/></g>;})}</svg>
      {nodes.map((node:string,i:number)=><div key={i} style={{position:"absolute",left:185,right:185,top:pos[i]-350,height:108,border:`2px solid ${i===0||i===n-1?C.teal+"88":C.line}`,borderRadius:22,background:"rgba(20,36,64,.94)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Space Grotesk,Arial",fontSize:30,fontWeight:700,color:C.white,textAlign:"center"}}>{node}</div>)}
    </Panel><Footer text={footer}/></Stage>;
};

export const VASF009ThrottleGate:React.FC<any>=({title,inputLabel,gateLabel,outputLabel,inputRate,outputRate,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const inCount=7,outCount=Math.max(2,Math.round(2+6*Number(outputRate)/100)),inPeriod=Math.round(fps*(1.2+1.2*(1-Number(inputRate)/100))),outPeriod=Math.round(fps*(1.5+1.5*(1-Number(outputRate)/100)));
  const x=540,top=390,gateTop=650;
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"The BMS can throttle power"} kicker="Control gate"/>
    <Panel style={{position:"absolute",left:105,right:105,top:350,height:760}}>
      <div style={{position:"absolute",left:155,right:155,top:35,display:"flex",justifyContent:"space-between",fontFamily:"Inter,Arial",fontSize:24,fontWeight:750}}><span style={{color:C.teal}}>REQUEST {Math.round(inputRate)}%</span><span style={{color:C.heat}}>ALLOWED {Math.round(outputRate)}%</span></div>
      <div style={{position:"absolute",left:245,right:245,top:95,height:100,border:`2px solid ${C.teal}77`,borderRadius:20,background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Space Grotesk,Arial",fontSize:29,fontWeight:700,color:C.white}}>{inputLabel}</div>
      <svg width="870" height="760" style={{position:"absolute",inset:0}}>
        <line x1={x-105} y1="205" x2={x-105} y2="300" stroke={C.line} strokeWidth="8"/>{[...Array(inCount)].map((_,i)=>{const q=loop01(f,inPeriod,Math.round(i*inPeriod/inCount));return <circle key={"i"+i} cx={x-105} cy={205+95*q} r="8" fill={C.teal}/>;})}
        <line x1={x-105} y1="510" x2={x-105} y2="605" stroke={C.line} strokeWidth="8"/>{[...Array(outCount)].map((_,i)=>{const q=loop01(f,outPeriod,Math.round(i*outPeriod/outCount));return <circle key={"o"+i} cx={x-105} cy={510+95*q} r="8" fill={C.heat}/>;})}
      </svg>
      <div style={{position:"absolute",left:260,right:260,top:300,height:210,border:`3px solid ${C.heat}88`,borderRadius:26,background:"rgba(20,36,64,.96)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontFamily:"Space Grotesk,Arial",fontSize:30,fontWeight:700,color:C.white}}>{gateLabel}</div><div style={{marginTop:20,width:250,height:24,borderRadius:12,background:C.line,overflow:"hidden"}}><div style={{width:`${pct(outputRate)}%`,height:"100%",background:C.heat}}/></div><div style={{fontFamily:"Inter,Arial",fontSize:23,fontWeight:750,color:C.heat,marginTop:12}}>{Math.round(outputRate)}% OPEN</div>
      </div>
      <div style={{position:"absolute",left:245,right:245,top:605,height:100,border:`2px solid ${C.heat}77`,borderRadius:20,background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Space Grotesk,Arial",fontSize:29,fontWeight:700,color:C.white}}>{outputLabel}</div>
    </Panel><Footer text={footer}/></Stage>;
};

export const VASF010ThermalField:React.FC<any>=({title,heatLevel,hotspotRow,hotspotCol,cooling,note,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const rows=6,cols=5,w=130,h=72,gap=15,startX=135,startY=195,wave=loop01(f,Math.round(fps*3)),pulse=(Math.sin(f/fps*Math.PI*2*.72)+1)/2;
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"Heat moves through the pack"} kicker="Thermal field"/>
    <Panel style={{position:"absolute",left:105,right:105,top:350,height:760}}>
      {note?<div style={{position:"absolute",left:55,right:55,top:34,textAlign:"center",fontFamily:"Inter,Arial",fontSize:23,fontWeight:650,color:C.slate}}>{note}</div>:null}
      {[...Array(rows)].flatMap((_,r)=>[...Array(cols)].map((__,c)=>{const d=Math.sqrt(Math.pow(r-hotspotRow,2)+Math.pow(c-hotspotCol,2)),influence=Math.max(0,1-d/3.6)*(Number(heatLevel)/100),coolBand=cooling?Math.max(0,1-Math.abs((r/(rows-1))-wave)*4):0,hot=clamp01(influence*(.72+.28*pulse)-coolBand*.35),bg=hot>.55?C.heat:hot>.22?"#736257":C.surface,border=hot>.45?C.heat:C.line;return <div key={r+"-"+c} style={{position:"absolute",left:startX+c*(w+gap),top:startY+r*(h+gap),width:w,height:h,border:`2px solid ${border}`,borderRadius:14,background:bg,boxShadow:hot>.45?`0 0 ${18+28*hot}px ${C.heat}44`:"none"}}/>;}))}
      {cooling?<div style={{position:"absolute",left:startX-20,top:startY+wave*((rows-1)*(h+gap))-18,width:cols*(w+gap)-gap+40,height:36,background:"linear-gradient(180deg,rgba(77,166,255,0),rgba(77,166,255,.35),rgba(77,166,255,0))",filter:"blur(5px)",borderRadius:30}}/>:null}
      <div style={{position:"absolute",left:0,right:0,bottom:35,textAlign:"center",fontFamily:"Inter,Arial",fontSize:24,fontWeight:750,color:cooling?C.cold:C.heat}}>{cooling?"COOLING SWEEP ACTIVE":"HEAT PROPAGATION"}</div>
    </Panel><Footer text={footer}/></Stage>;
};

const Meter:React.FC<{label:string;value:number;accent:string;top:number;scan:number}> = ({label,value,accent,top,scan})=><div style={{position:"absolute",left:105,right:105,top}}>
  <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Inter,Arial",fontSize:25,fontWeight:750,color:C.white,marginBottom:13}}><span>{label}</span><span style={{color:accent}}>{value.toFixed(1)}%</span></div>
  <div style={{height:28,borderRadius:16,background:C.line,position:"relative"}}><div style={{height:"100%",width:`${value}%`,background:accent,borderRadius:16}}/><div style={{position:"absolute",left:`calc(${scan}% - 3px)`,top:-9,width:6,height:46,borderRadius:6,background:C.white,boxShadow:"0 0 18px rgba(255,255,255,.65)"}}/></div>
</div>;

export const VASF011CalibrationShift:React.FC<any>=({title,displayedStart,displayedEnd,usablePct,displayedLabel,usableLabel,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const shift=ease(f/(fps*3)),displayed=Number(displayedStart)+(Number(displayedEnd)-Number(displayedStart))*shift,scan=5+90*loop01(f,Math.round(fps*2.5)),err=displayed-Number(usablePct);
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"The estimate can move after recalibration"} kicker="Live calibration"/>
    <Panel style={{position:"absolute",left:105,right:105,top:410,height:610}}>
      <Meter label={displayedLabel||"Displayed estimate"} value={displayed} accent={C.heat} top={130} scan={scan}/><Meter label={usableLabel||"Usable energy"} value={Number(usablePct)} accent={C.teal} top={315} scan={100-scan}/>
      <div style={{position:"absolute",left:0,right:0,bottom:75,textAlign:"center",fontFamily:"Inter,Arial",fontSize:26,fontWeight:750}}><span style={{color:C.slate}}>DIFFERENCE </span><span style={{color:Math.abs(err)<2?C.teal:C.heat}}>{err>0?"+":""}{err.toFixed(1)} pts</span></div>
    </Panel><Footer text={footer}/></Stage>;
};

export const VASF012DataDecision:React.FC<any>=({title,sensors,decisionLabel,actionLabel,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const ys=sensors.map((_:string,i:number)=>420+i*(115/Math.max(1,sensors.length-1))),period=Math.round(fps*1.7),centerY=680,pulse=.94+.06*Math.sin(f/fps*Math.PI*2*1.1);
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"Live sensor data becomes a control decision"} kicker="BMS logic"/>
    <Panel style={{position:"absolute",left:105,right:105,top:350,height:760}}>
      <svg width="870" height="760" style={{position:"absolute",inset:0}}>
        {ys.map((y:number,i:number)=>{const q=loop01(f,period,Math.round(i*period/sensors.length));return <g key={i}><line x1="220" y1={y-350} x2="435" y2={centerY-350} stroke={C.line} strokeWidth="5"/><circle cx={220+(435-220)*q} cy={(y-350)+(centerY-y)*q} r="8" fill={i%2?C.cold:C.teal}/></g>;})}
        <line x1="435" y1={centerY-350+105} x2="435" y2="625" stroke={C.line} strokeWidth="7"/>{[0,1,2].map(i=>{const q=loop01(f,Math.round(fps*1.45),i*15);return <circle key={i} cx="435" cy={centerY-350+110+(515-(centerY-350))*q} r="8" fill={C.heat}/>;})}
      </svg>
      {sensors.map((s:string,i:number)=><div key={i} style={{position:"absolute",left:70,width:300,height:78,top:ys[i]-350-39,border:`2px solid ${i%2?C.cold+"77":C.teal+"77"}`,borderRadius:18,background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Space Grotesk,Arial",fontSize:25,fontWeight:700,color:C.white}}>{s}</div>)}
      <div style={{position:"absolute",left:315,right:315,top:centerY-350-105,height:210,border:`3px solid ${C.teal}`,borderRadius:32,background:"rgba(20,36,64,.96)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,boxSizing:"border-box",fontFamily:"Space Grotesk,Arial",fontSize:28,fontWeight:750,color:C.white,textAlign:"center",transform:`scale(${pulse})`}}>{decisionLabel}</div>
      <div style={{position:"absolute",left:245,right:245,top:625,height:92,border:`2px solid ${C.heat}77`,borderRadius:20,background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Space Grotesk,Arial",fontSize:28,fontWeight:700,color:C.white}}>{actionLabel}</div>
    </Panel><Footer text={footer}/></Stage>;
};

const CompareLane:React.FC<{left:number;label:string;value:string;intensity:number;accent:string;metric?:string;frame:number;fps:number}> = ({left,label,value,intensity,accent,metric,frame,fps})=>{
  const count=Math.max(2,Math.round(2+intensity/16)),period=Math.round(fps*(2.5-1.25*intensity/100));
  return <div style={{position:"absolute",left,top:110,width:370,height:500,border:`2px solid ${accent}55`,borderRadius:25,background:"rgba(20,36,64,.9)",padding:"28px 26px",boxSizing:"border-box"}}>
    <div style={{fontFamily:"Space Grotesk,Arial",fontSize:31,fontWeight:750,color:accent,textAlign:"center"}}>{label}</div><div style={{fontFamily:"Space Grotesk,Arial",fontSize:62,fontWeight:750,color:C.white,textAlign:"center",marginTop:30}}>{value}</div>{metric?<div style={{fontFamily:"Inter,Arial",fontSize:21,fontWeight:650,color:C.slate,textAlign:"center",marginTop:8}}>{metric}</div>:null}
    <div style={{position:"absolute",left:45,right:45,bottom:120,height:18,borderRadius:10,background:C.line}}>{[...Array(count)].map((_,i)=>{const q=loop01(frame,period,Math.round(i*period/count));return <div key={i} style={{position:"absolute",left:`calc(${q*100}% - 8px)`,top:1,width:16,height:16,borderRadius:99,background:accent,boxShadow:`0 0 16px ${accent}66`}}/>;})}</div>
    <div style={{position:"absolute",left:45,right:45,bottom:72,display:"flex",justifyContent:"space-between",fontFamily:"Inter,Arial",fontSize:20,fontWeight:700,color:C.slate}}><span>LOW</span><span>HIGH</span></div>
  </div>;
};

export const VASF013DynamicCompare:React.FC<any>=({title,leftLabel,rightLabel,leftValue,rightValue,leftIntensity,rightIntensity,metricLabel,footer,backgroundSrc,backgroundOpacity})=>{
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  return <Stage backgroundSrc={backgroundSrc} backgroundOpacity={backgroundOpacity}><Title title={title||"Same battery, different operating condition"} kicker="Live comparator"/>
    <Panel style={{position:"absolute",left:105,right:105,top:370,height:720}}>
      <CompareLane left={55} label={leftLabel} value={leftValue} intensity={Number(leftIntensity)} accent={C.teal} metric={metricLabel} frame={f} fps={fps}/>
      <CompareLane left={445} label={rightLabel} value={rightValue} intensity={Number(rightIntensity)} accent={C.heat} metric={metricLabel} frame={f} fps={fps}/>
      <div style={{position:"absolute",left:0,right:0,top:325,textAlign:"center",fontFamily:"Space Grotesk,Arial",fontSize:36,fontWeight:800,color:C.slate}}>VS</div>
    </Panel><Footer text={footer}/></Stage>;
};

export const animationRegistry:Record<string,AnimationEntry>={
  "VA-SF-001":{component:VASF001BatteryBuffer,schema:batteryBufferSchema,description:"Animated battery fill with usable and reserve regions plus a continuous scan.",slots:["title","usablePct","bufferPct","usableLabel","bufferLabel","footer",...baseSlots],defaultDurationSec:8},
  "VA-SF-002":{component:VASF002BeforeAfter,schema:beforeAfterSchema,description:"Animated before/after battery gauges.",slots:["title","beforeLabel","beforePct","afterLabel","afterPct","deltaLabel","footer",...baseSlots],defaultDurationSec:8},
  "VA-SF-003":{component:VASF003LineChart,schema:lineChartSchema,description:"Animated one- or two-series chart with a moving tracer.",slots:["title","seriesALabel","seriesA","seriesBLabel","seriesB","xLabel","yLabel","footer",...baseSlots],defaultDurationSec:9},
  "VA-SF-004":{component:VASF004ProcessFlow,schema:processFlowSchema,description:"Vertical process or energy-flow diagram with repeating pulse.",slots:["title","nodes","centerLabel","direction","footer",...baseSlots],defaultDurationSec:8},
  "VA-SF-005":{component:VASF005Timeline,schema:timelineSchema,description:"Animated milestone timeline with continuous travel marker.",slots:["title","milestones","footer",...baseSlots],defaultDurationSec:9},
  "VA-SF-006":{component:VASF006Counter,schema:counterSchema,description:"Animated numeric count-up with a subtle continuous emphasis pulse.",slots:["title","value","decimals","prefix","suffix","label","tone","footer",...baseSlots],defaultDurationSec:7},
  "VA-SF-007":{component:VASF007SystemDelta,schema:systemDeltaSchema,description:"Animated before/after system comparison.",slots:["title","beforeLabel","afterLabel","beforeItems","afterItems","footer",...baseSlots],defaultDurationSec:9},
  "VA-SF-008":{component:VASF008PacketStream,schema:packetStreamSchema,description:"Continuous multi-packet energy/data stream across system nodes.",slots:["title","nodes","flowLabel","intensity","footer",...baseSlots],defaultDurationSec:8},
  "VA-SF-009":{component:VASF009ThrottleGate,schema:throttleSchema,description:"Continuous input stream throttled by a BMS/control gate.",slots:["title","inputLabel","gateLabel","outputLabel","inputRate","outputRate","footer",...baseSlots],defaultDurationSec:8},
  "VA-SF-010":{component:VASF010ThermalField,schema:thermalSchema,description:"Continuously pulsing cell heat field with optional cooling sweep.",slots:["title","heatLevel","hotspotRow","hotspotCol","cooling","note","footer",...baseSlots],defaultDurationSec:9},
  "VA-SF-011":{component:VASF011CalibrationShift,schema:calibrationSchema,description:"Displayed battery estimate shifts while the usable-energy reference stays stable.",slots:["title","displayedStart","displayedEnd","usablePct","displayedLabel","usableLabel","footer",...baseSlots],defaultDurationSec:9},
  "VA-SF-012":{component:VASF012DataDecision,schema:dataDecisionSchema,description:"Continuous sensor data feeds BMS logic and produces an output action.",slots:["title","sensors","decisionLabel","actionLabel","footer",...baseSlots],defaultDurationSec:9},
  "VA-SF-013":{component:VASF013DynamicCompare,schema:dynamicCompareSchema,description:"Two continuously moving activity lanes compare operating conditions.",slots:["title","leftLabel","rightLabel","leftValue","rightValue","leftIntensity","rightIntensity","metricLabel","footer",...baseSlots],defaultDurationSec:9},
};

export const availableAnimations=()=>Object.keys(animationRegistry).sort();
