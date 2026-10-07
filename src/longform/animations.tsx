import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { lfTheme, toneColor } from "./theme";

type AnimEntry = {
  component: React.FC<any>;
  schema: z.ZodTypeAny;
  description: string;
  slots: string[];
  defaultDurationSec: number;
};

const baseProps = {
  title: z.string().optional(),
};

const batteryBufferSchema = z.object({
  ...baseProps,
  usablePct: z.number().min(0).max(100),
  bufferPct: z.number().min(0).max(100).default(0),
  usableLabel: z.string().optional().default("Usable"),
  bufferLabel: z.string().optional().default("Buffer"),
  footer: z.string().optional(),
});

const beforeAfterSchema = z.object({
  ...baseProps,
  beforeLabel: z.string(),
  beforePct: z.number().min(0).max(100),
  afterLabel: z.string(),
  afterPct: z.number().min(0).max(100),
  deltaLabel: z.string().optional(),
  footer: z.string().optional(),
});

const lineChartSchema = z.object({
  ...baseProps,
  seriesALabel: z.string().optional().default("A"),
  seriesA: z.array(z.number()).min(2),
  seriesBLabel: z.string().optional().default("B"),
  seriesB: z.array(z.number()).min(2).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  footer: z.string().optional(),
});

const processFlowSchema = z.object({
  ...baseProps,
  nodes: z.array(z.string()).min(2).max(5),
  centerLabel: z.string().optional(),
  direction: z.enum(["forward", "reverse", "bidirectional"]).default("forward"),
  footer: z.string().optional(),
});

const timelineSchema = z.object({
  ...baseProps,
  milestones: z.array(z.object({
    label: z.string(),
    value: z.string().optional(),
    tone: z.enum(["teal", "heat", "cold", "white"]).optional(),
  })).min(2).max(6),
  footer: z.string().optional(),
});

const counterSchema = z.object({
  ...baseProps,
  value: z.number(),
  decimals: z.number().int().min(0).max(2).default(0),
  prefix: z.string().optional().default(""),
  suffix: z.string().optional().default(""),
  label: z.string().optional(),
  tone: z.enum(["teal", "heat", "cold", "white"]).optional(),
  footer: z.string().optional(),
});

const systemDeltaSchema = z.object({
  ...baseProps,
  beforeLabel: z.string(),
  afterLabel: z.string(),
  beforeItems: z.array(z.string()).min(1).max(4),
  afterItems: z.array(z.string()).min(1).max(4),
  footer: z.string().optional(),
});

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const enter = (frame: number, fps: number, delay = 0) => {
  const p = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 18, stiffness: 125, mass: 0.75 },
  });
  return clamp01(p);
};

const sceneProgress = (frame: number, holdFrames?: number) => {
  const end = Math.max(24, Number(holdFrames || 150) - 8);
  return clamp01(frame / end);
};

const Title: React.FC<{ title?: string; kicker?: string }> = ({ title, kicker }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!title && !kicker) return null;
  const p = enter(frame, fps);
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: 78, opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}>
      {kicker ? (
        <div style={{ fontFamily: "Inter, Arial", fontSize: 28, fontWeight: 700, color: lfTheme.teal, letterSpacing: 4, marginBottom: 12 }}>
          {kicker.toUpperCase()}
        </div>
      ) : null}
      {title ? (
        <div style={{ fontFamily: "Space Grotesk, Arial", fontSize: 64, fontWeight: 700, color: lfTheme.white, lineHeight: 1.02 }}>
          {title}
        </div>
      ) : null}
    </div>
  );
};

const Footer: React.FC<{ text?: string }> = ({ text }) =>
  text ? (
    <div style={{ position: "absolute", left: 120, right: 120, bottom: 58, fontFamily: "Inter, Arial", fontSize: 28, color: lfTheme.slate }}>
      {text}
    </div>
  ) : null;

const BatteryShell: React.FC<{ pct: number; accent: string; label?: string; sublabel?: string; delay?: number }> = ({ pct, accent, label, sublabel, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, delay);
  const fill = interpolate(p, [0, 1], [0, pct]);
  return (
    <div style={{ width: 430 }}>
      {label ? <div style={{ fontFamily: "Inter, Arial", fontSize: 31, fontWeight: 700, color: lfTheme.white, marginBottom: 18 }}>{label}</div> : null}
      <div style={{ position: "relative", width: 370, height: 430, border: `5px solid ${lfTheme.slate}`, borderRadius: 22, padding: 14, display: "flex", alignItems: "flex-end", background: "rgba(10,22,40,0.40)" }}>
        <div style={{ position: "absolute", width: 110, height: 22, left: 130, top: -25, background: lfTheme.slate, borderRadius: "10px 10px 0 0" }} />
        <div style={{ width: "100%", height: `${fill}%`, background: accent, borderRadius: 10, boxShadow: `0 0 45px ${accent}33` }} />
      </div>
      {sublabel ? <div style={{ fontFamily: "Space Grotesk, Arial", fontSize: 42, fontWeight: 700, color: accent, marginTop: 18 }}>{sublabel}</div> : null}
    </div>
  );
};

export const VALF001BatteryBuffer: React.FC<any> = ({ title, usablePct, bufferPct, usableLabel, bufferLabel, footer, __holdFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const base = Math.min(100, Math.max(0, usablePct));
  const reserve = Math.min(100 - base, Math.max(0, bufferPct));
  const p1 = enter(frame, fps, 6);
  const p2 = enter(frame, fps, 24);
  return (
    <AbsoluteFill>
      <Title title={title || "Battery usable capacity"} kicker="Battery architecture" />
      <div style={{ position: "absolute", left: 235, right: 235, top: 265, bottom: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 1040, height: 390, border: `6px solid ${lfTheme.slate}`, borderRadius: 34, padding: 18, display: "flex", overflow: "hidden", background: "rgba(20,36,64,0.70)" }}>
          <div style={{ width: `${base * p1}%`, height: "100%", background: lfTheme.teal, borderRadius: 18, transition: "none" }} />
          <div style={{ width: `${reserve * p2}%`, height: "100%", background: lfTheme.heat, opacity: 0.88 }} />
          <div style={{ flex: 1 }} />
          <div style={{ position: "absolute", width: 76, height: 150, right: -80, top: 120, borderRadius: "0 18px 18px 0", background: lfTheme.slate }} />
          <div style={{ position: "absolute", left: 45, bottom: 42, fontFamily: "Space Grotesk, Arial", fontWeight: 700, fontSize: 58, color: lfTheme.navy }}>
            {usableLabel} {Math.round(base)}%
          </div>
          {reserve > 0 ? (
            <div style={{ position: "absolute", right: 42, top: 42, fontFamily: "Inter, Arial", fontWeight: 700, fontSize: 34, color: lfTheme.white, opacity: p2 }}>
              {bufferLabel} {Math.round(reserve)}%
            </div>
          ) : null}
        </div>
      </div>
      <Footer text={footer} />
    </AbsoluteFill>
  );
};

export const VALF002BeforeAfter: React.FC<any> = ({ title, beforeLabel, beforePct, afterLabel, afterPct, deltaLabel, footer }) => {
  const diff = afterPct - beforePct;
  return (
    <AbsoluteFill>
      <Title title={title || "Before vs after"} kicker="Capacity comparison" />
      <div style={{ position: "absolute", left: 260, right: 260, top: 250, bottom: 145, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BatteryShell pct={beforePct} accent={lfTheme.slate} label={beforeLabel} sublabel={`${beforePct}%`} delay={3} />
        <div style={{ fontFamily: "Space Grotesk, Arial", fontSize: 74, color: diff < 0 ? lfTheme.heat : lfTheme.teal, fontWeight: 700, textAlign: "center" }}>
          {deltaLabel || `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`}
        </div>
        <BatteryShell pct={afterPct} accent={diff < 0 ? lfTheme.heat : lfTheme.teal} label={afterLabel} sublabel={`${afterPct}%`} delay={16} />
      </div>
      <Footer text={footer} />
    </AbsoluteFill>
  );
};

const makePath = (values: number[], w: number, h: number, min: number, max: number) => {
  const range = Math.max(1e-6, max - min);
  return values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
};

export const VALF003LineChart: React.FC<any> = ({ title, seriesALabel, seriesA, seriesBLabel, seriesB, xLabel, yLabel, footer, __holdFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const all = [...seriesA, ...(seriesB || [])];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const w = 1260, h = 540;
  const draw = interpolate(sceneProgress(frame, __holdFrames), [0, 0.82], [1, 0], { extrapolateRight: "clamp" });
  const p = enter(frame, fps, 2);
  return (
    <AbsoluteFill>
      <Title title={title || "Trend over time"} kicker="Animated chart" />
      <div style={{ position: "absolute", left: 230, top: 260, width: w + 160, height: h + 120, opacity: p }}>
        <svg width={w + 160} height={h + 120}>
          <line x1="80" y1={h} x2={w + 80} y2={h} stroke={lfTheme.navyLine} strokeWidth="4" />
          <line x1="80" y1="0" x2="80" y2={h} stroke={lfTheme.navyLine} strokeWidth="4" />
          {[0.25,0.5,0.75].map((g)=><line key={g} x1="80" y1={h*g} x2={w+80} y2={h*g} stroke={lfTheme.navyLine} strokeWidth="2" opacity="0.6" />)}
          <path d={makePath(seriesA,w,h,min,max)} transform="translate(80,0)" fill="none" stroke={lfTheme.teal} strokeWidth="8" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={draw} />
          {seriesB ? <path d={makePath(seriesB,w,h,min,max)} transform="translate(80,0)" fill="none" stroke={lfTheme.slate} strokeWidth="8" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={draw} /> : null}
          <text x="90" y={h+70} fill={lfTheme.slate} fontFamily="Inter" fontSize="28">{xLabel || ""}</text>
          <text x="22" y="34" fill={lfTheme.slate} fontFamily="Inter" fontSize="28">{yLabel || ""}</text>
        </svg>
        <div style={{ position: "absolute", right: 15, top: 20, display: "flex", gap: 30, fontFamily: "Inter, Arial", fontSize: 28, fontWeight: 700 }}>
          <span style={{ color: lfTheme.teal }}>● {seriesALabel}</span>
          {seriesB ? <span style={{ color: lfTheme.slate }}>● {seriesBLabel}</span> : null}
        </div>
      </div>
      <Footer text={footer} />
    </AbsoluteFill>
  );
};

export const VALF004ProcessFlow: React.FC<any> = ({ title, nodes, centerLabel, direction, footer, __holdFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, 2);
  const progress = sceneProgress(frame, __holdFrames);
  const positions = nodes.map((_n: string, i: number) => 180 + i * (1420 / Math.max(1, nodes.length - 1)));
  return (
    <AbsoluteFill>
      <Title title={title || "Energy flow"} kicker="Process diagram" />
      <div style={{ position: "absolute", left: 110, right: 110, top: 315, height: 430, opacity: p }}>
        <svg width="1700" height="430" style={{ position: "absolute", left: 0, top: 0 }}>
          {positions.slice(0,-1).map((x:number,i:number)=>{
            const x2=positions[i+1];
            return <line key={i} x1={x+110} y1="215" x2={x2-110} y2="215" stroke={lfTheme.navyLine} strokeWidth="8" strokeLinecap="round" />;
          })}
          {positions.slice(0,-1).map((x:number,i:number)=>{
            const x2=positions[i+1];
            const seg = 1 / (positions.length - 1);
            const local = clamp01((progress - i*seg)/seg);
            const cx = x+110 + (x2-x-220)*local;
            return <circle key={"p"+i} cx={cx} cy="215" r="16" fill={lfTheme.teal} opacity={local > 0 && local < 1 ? 1 : 0.25} />;
          })}
        </svg>
        {nodes.map((node:string,i:number)=>{
          const q=enter(frame,fps,6+i*5);
          return (
            <div key={node+i} style={{ position:"absolute", left:positions[i]-110, top:115, width:220, minHeight:200, border:`3px solid ${i===0||i===nodes.length-1?lfTheme.teal:lfTheme.navyLine}`, borderRadius:28, background:"rgba(20,36,64,0.90)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, textAlign:"center", fontFamily:"Space Grotesk, Arial", fontSize:34, fontWeight:700, color:lfTheme.white, opacity:q, transform:`scale(${0.94+0.06*q})` }}>
              {node}
            </div>
          );
        })}
        {centerLabel ? <div style={{ position:"absolute", left:"50%", top:18, transform:"translateX(-50%)", fontFamily:"Inter, Arial", color:lfTheme.slate, fontSize:30, fontWeight:700 }}>{centerLabel}</div> : null}
        <div style={{ position:"absolute", left:"50%", bottom:0, transform:"translateX(-50%)", fontFamily:"Inter, Arial", color:lfTheme.teal, fontSize:30, fontWeight:700 }}>
          {direction === "reverse" ? "← reverse flow" : direction === "bidirectional" ? "↔ bidirectional flow" : "forward flow →"}
        </div>
      </div>
      <Footer text={footer} />
    </AbsoluteFill>
  );
};

export const VALF005Timeline: React.FC<any> = ({ title, milestones, footer }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Title title={title || "Timeline"} kicker="Milestones" />
      <div style={{ position:"absolute", left:170, right:170, top:410, height:300 }}>
        <div style={{ position:"absolute", left:35, right:35, top:90, height:8, borderRadius:8, background:lfTheme.navyLine }} />
        <div style={{ display:"flex", justifyContent:"space-between", position:"relative" }}>
          {milestones.map((m:any,i:number)=>{
            const p=enter(frame,fps,4+i*7);
            const c=toneColor(m.tone);
            return (
              <div key={m.label+i} style={{ width:260, textAlign:"center", opacity:p, transform:`translateY(${(1-p)*18}px)` }}>
                <div style={{ height:180, display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <div style={{ fontFamily:"Space Grotesk, Arial", fontSize:42, fontWeight:700, color:c }}>{m.value || ""}</div>
                  <div style={{ width:34, height:34, borderRadius:"50%", marginTop:35, background:c, boxShadow:`0 0 28px ${c}55` }} />
                  <div style={{ fontFamily:"Inter, Arial", fontSize:30, fontWeight:600, color:lfTheme.white, marginTop:28 }}>{m.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer text={footer} />
    </AbsoluteFill>
  );
};

export const VALF006Counter: React.FC<any> = ({ title, value, decimals, prefix, suffix, label, tone, footer, __holdFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame,fps,2);
  const prog = clamp01(sceneProgress(frame,__holdFrames)*1.45);
  const shown = value * prog;
  const accent=toneColor(tone);
  return (
    <AbsoluteFill style={{ alignItems:"center", justifyContent:"center" }}>
      <Title title={title} kicker="Key number" />
      <div style={{ opacity:p, transform:`scale(${0.94+0.06*p})`, textAlign:"center" }}>
        <div style={{ fontFamily:"Space Grotesk, Arial", fontSize:220, lineHeight:0.95, fontWeight:700, color:accent, letterSpacing:-6 }}>
          {prefix}{shown.toFixed(decimals)}{suffix}
        </div>
        {label ? <div style={{ fontFamily:"Inter, Arial", fontSize:42, color:lfTheme.white, marginTop:32, fontWeight:600 }}>{label}</div> : null}
      </div>
      <Footer text={footer} />
    </AbsoluteFill>
  );
};

export const VALF007SystemDelta: React.FC<any> = ({ title, beforeLabel, afterLabel, beforeItems, afterItems, footer }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const renderSide=(label:string,items:string[],accent:string,delay:number)=> {
    const p=enter(frame,fps,delay);
    return (
      <div style={{ flex:1, minHeight:520, border:`3px solid ${accent}55`, borderRadius:34, background:"rgba(20,36,64,0.90)", padding:"48px 52px", opacity:p, transform:`translateY(${(1-p)*24}px)` }}>
        <div style={{ fontFamily:"Space Grotesk, Arial", fontSize:54, fontWeight:700, color:accent, marginBottom:34 }}>{label}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
          {items.map((x,i)=><div key={x+i} style={{ display:"flex", gap:18, fontFamily:"Inter, Arial", fontSize:34, color:lfTheme.white, fontWeight:600 }}><span style={{ color:accent }}>●</span><span>{x}</span></div>)}
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Title title={title || "System change"} kicker="Before / after" />
      <div style={{ position:"absolute", left:170, right:170, top:270, bottom:135, display:"flex", gap:56, alignItems:"center" }}>
        {renderSide(beforeLabel,beforeItems,lfTheme.slate,3)}
        <div style={{ fontFamily:"Space Grotesk, Arial", fontSize:64, fontWeight:700, color:lfTheme.teal }}>→</div>
        {renderSide(afterLabel,afterItems,lfTheme.teal,14)}
      </div>
      <Footer text={footer} />
    </AbsoluteFill>
  );
};

export const animationRegistry: Record<string, AnimEntry> = {
  "VA-LF-001": {
    component: VALF001BatteryBuffer,
    schema: batteryBufferSchema,
    description: "Animated battery fill with a separately revealed usable region and hidden/reserve buffer.",
    slots: ["title","usablePct","bufferPct","usableLabel","bufferLabel","footer"],
    defaultDurationSec: 8,
  },
  "VA-LF-002": {
    component: VALF002BeforeAfter,
    schema: beforeAfterSchema,
    description: "Two animated battery gauges for before/after capacity, usable-window, or SOC comparison.",
    slots: ["title","beforeLabel","beforePct","afterLabel","afterPct","deltaLabel","footer"],
    defaultDurationSec: 8,
  },
  "VA-LF-003": {
    component: VALF003LineChart,
    schema: lineChartSchema,
    description: "Animated one- or two-series line chart drawn over time.",
    slots: ["title","seriesALabel","seriesA","seriesBLabel","seriesB","xLabel","yLabel","footer"],
    defaultDurationSec: 9,
  },
  "VA-LF-004": {
    component: VALF004ProcessFlow,
    schema: processFlowSchema,
    description: "Animated process/energy-flow diagram with 2-5 nodes and moving pulse.",
    slots: ["title","nodes","centerLabel","direction","footer"],
    defaultDurationSec: 8,
  },
  "VA-LF-005": {
    component: VALF005Timeline,
    schema: timelineSchema,
    description: "Animated timeline for months, software versions, legal events, or development milestones.",
    slots: ["title","milestones","footer"],
    defaultDurationSec: 9,
  },
  "VA-LF-006": {
    component: VALF006Counter,
    schema: counterSchema,
    description: "Large animated numeric reveal/count-up for money, percentages, capacity, or fleet size.",
    slots: ["title","value","decimals","prefix","suffix","label","tone","footer"],
    defaultDurationSec: 7,
  },
  "VA-LF-007": {
    component: VALF007SystemDelta,
    schema: systemDeltaSchema,
    description: "Animated before/after system or software-version comparison with short change lists.",
    slots: ["title","beforeLabel","afterLabel","beforeItems","afterItems","footer"],
    defaultDurationSec: 9,
  },
};

export const availableAnimations = () => Object.keys(animationRegistry).sort();
