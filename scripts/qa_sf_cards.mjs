import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,"..");
const ENTRY=path.join(ROOT,"src","index.ts");
const OUT=path.join(ROOT,"qa-sf-cards");
fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});

const cases=[
["VC-SF-001",4,{KICKER:"Capacity retained after 200,000 km",NUM:"87",PCT:"%"}],
["VC-SF-002",5,{TITLE:"Energy density (Wh/kg)",VALUE_A:"220",LABEL_A:"NMC",VALUE_B:"160",LABEL_B:"LFP",SOURCE:"TEST SOURCE"}],
["VC-SF-003",6,{TAG:"Engineer's Note",STATEMENT:"A dashboard estimate can move even when physical capacity changes very little.",ROLE:"Battery engineer"}],
["VC-SF-004",7,{KICKER:"Cold-weather range",HOOK:"Temperature can change available range before the battery has permanently degraded."}],
["VC-SF-005",4,{BEAT_LINE:"The dashboard is estimating a managed battery system."}],
["VC-SF-006",5,{TERM:"State of Health (SoH)",DEFINITION:"An estimate of remaining battery capability relative to a defined reference condition."}],
["VC-SF-007",6,{WARNING_LINE:"Avoid unsupported battery safety shortcuts",DETAIL:"Safety claims need vehicle- and chemistry-specific evidence."}],
["VC-SF-008",7,{CORRECT_LABEL:"Supported",CORRECT_ITEM:"Repeated high-temperature exposure matters",WRONG_LABEL:"Overstated",WRONG_ITEM:"One fast charge destroys the pack"}],
["VC-SF-009",4.5,{MYTH_LINE:"The dashboard directly measures cell capacity.",FACT_LINE:"It is a BMS estimate shaped by the managed system.",SOURCE:"TEST SOURCE"}],
["VC-SF-010",5,{COL1_TITLE:"Chemistry",COL1_POINT:"Changes electrochemical trade-offs",COL2_TITLE:"BMS",COL2_POINT:"Controls the usable operating window",COL3_TITLE:"Thermal system",COL3_POINT:"Manages temperature and power limits"}],
["VC-SF-011",5,{HEADER:"Protect your battery",ITEM1:"Follow vehicle-specific charge guidance",ITEM2:"Avoid long hot high-SOC storage",ITEM3:"Use preconditioning when available",ITEM4:"Separate occasional use from repeated habits"}],
["VC-SF-012",4,{LOW_PCT:"20",HIGH_PCT:"80",CAPTION:"Illustrative daily SOC window for layout testing"}],
["VC-SF-013",4.5,{STEP1:"Collect",STEP2:"Diagnose",STEP3:"Recover",STEP4:"Reuse"}],
["VC-SF-014",4.5,{ITEM1:"Temperature",ITEM2:"State of charge",ITEM3:"Charge rate",ITEM4:"Calendar time"}],
["VC-SF-015",4.5,{QUOTE_TEXT:"Battery aging depends on both time and operating conditions.",SOURCE_NAME:"TEST SOURCE"}],
["VC-SF-016",3,{TAG_TEXT:"CHAPTER 1"}],
["VC-SF-017",4.5,{TITLE:"Range vs temperature",C1_LABEL:"25°C",C1_VALUE:"100",C2_LABEL:"0°C",C2_VALUE:"80",C3_LABEL:"−10°C",C3_VALUE:"70",SOURCE:"TEST SOURCE"}],
["VC-SF-018",5,{SERIES:"BATTERY INTELLIGENCE",HEADLINE:"LFP VS NMC",SUBHEAD:"The trade-off hiding behind the dashboard"}]
];

const serveUrl=await bundle({entryPoint:ENTRY,webpackOverride:(c)=>c});
for(const [id,durationSec,values] of cases){
  const durationFrames=Math.round(durationSec*30);
  const manifest={video_id:"QA-"+id,fps:30,width:1080,height:1920,audio:[],captions:[],timeline:[{beat:1,component:id,props:values,src:"",startFrame:0,durationFrames,track:"card"}]};
  const inputProps={manifest};
  const comp=await selectComposition({serveUrl,id:"AXVideo",inputProps});
  const dir=path.join(OUT,id); fs.mkdirSync(dir,{recursive:true});
  for(const [name,frame] of [["t00_0.5s",15],["t01_1.5s",45],["t02_final",durationFrames-2]]){
    await renderStill({composition:comp,serveUrl,output:path.join(dir,name+".png"),inputProps,frame,imageFormat:"png"});
  }
}
console.log("Rendered",cases.length,"Short Form cards");
