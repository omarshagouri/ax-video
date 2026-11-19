import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,"..");
const ENTRY=path.join(ROOT,"src","index.ts");
const OUT=path.join(ROOT,"qa-sf-animations");
fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});

const cases=[
["VA-SF-001",8,{title:"Gross capacity vs usable capacity",usablePct:82,bufferPct:18,usableLabel:"Usable",bufferLabel:"Reserve",footer:"Short Form QA"}],
["VA-SF-002",8,{title:"Usable capacity change",beforeLabel:"Before",beforePct:92,afterLabel:"After",afterPct:84,deltaLabel:"−8 pts",footer:"Short Form QA"}],
["VA-SF-003",9,{title:"Capacity trend",seriesALabel:"Observed",seriesA:[100,98,96,94,92,90],seriesBLabel:"Reference",seriesB:[100,99,98,97,96,95],xLabel:"Time",yLabel:"Capacity (%)",footer:"Short Form QA"}],
["VA-SF-004",8,{title:"Charging control path",nodes:["Charger","BMS","Pack","Cells"],centerLabel:"Requested power is controlled by the vehicle",direction:"forward",footer:"Short Form QA"}],
["VA-SF-005",9,{title:"Software timeline",milestones:[{label:"Baseline",value:"V1",tone:"white"},{label:"Update",value:"V2",tone:"teal"},{label:"Change",value:"V3",tone:"heat"},{label:"Validated",value:"V4",tone:"teal"}],footer:"Short Form QA"}],
["VA-SF-006",7,{title:"Fleet sample",value:22700,decimals:0,prefix:"",suffix:"+",label:"vehicles",tone:"teal",footer:"Short Form QA"}],
["VA-SF-007",9,{title:"BMS strategy change",beforeLabel:"Before",afterLabel:"After",beforeItems:["Fixed usable window","Original calibration"],afterItems:["Revised usable window","Updated calibration"],footer:"Short Form QA"}],
["VA-SF-008",8,{title:"Energy packets moving through the charging system",nodes:["Charger","BMS","Pack","Cells"],flowLabel:"Power keeps moving while the vehicle controls the path",intensity:4,footer:"Short Form QA"}],
["VA-SF-009",8,{title:"The BMS can throttle requested charging power",inputLabel:"Charger request",gateLabel:"BMS limit",outputLabel:"Cell power",inputRate:100,outputRate:42,footer:"Short Form QA"}],
["VA-SF-010",9,{title:"A hot spot spreads unless cooling removes the heat",heatLevel:82,hotspotRow:3,hotspotCol:3,cooling:true,note:"Cell temperature is not uniform across a working pack",footer:"Short Form QA"}],
["VA-SF-011",9,{title:"The dashboard estimate can move after recalibration",displayedStart:88,displayedEnd:96,usablePct:95,displayedLabel:"Displayed SoH",usableLabel:"Usable-energy reference",footer:"Short Form QA"}],
["VA-SF-012",9,{title:"The BMS turns live sensor data into a control decision",sensors:["Voltage","Current","Temperature","SOC"],decisionLabel:"BMS estimate + limits",actionLabel:"Allowed power",footer:"Short Form QA"}],
["VA-SF-013",9,{title:"Same battery, different operating stress",leftLabel:"Mild operation",rightLabel:"High stress",leftValue:"LOW",rightValue:"HIGH",leftIntensity:28,rightIntensity:88,metricLabel:"Relative activity / stress",footer:"Short Form QA",backgroundSrc:"background.png",backgroundOpacity:.5}]
];

const serveUrl=await bundle({entryPoint:ENTRY,webpackOverride:(c)=>c});
for(const [id,durationSec,values] of cases){
  const durationFrames=Math.round(durationSec*30);
  const manifest={video_id:"QA-"+id,fps:30,width:1080,height:1920,audio:[],captions:[],timeline:[{beat:1,component:id,props:values,src:"",startFrame:0,durationFrames,track:"card"}]};
  const inputProps={manifest};
  const comp=await selectComposition({serveUrl,id:"AXVideo",inputProps});
  const dir=path.join(OUT,id); fs.mkdirSync(dir,{recursive:true});
  for(const [name,frame] of [["t00_0.5s",15],["t01_1.5s",45],["t02_3.0s",90],["t03_5.0s",Math.min(durationFrames-2,150)],["t04_final",durationFrames-2]]){
    await renderStill({composition:comp,serveUrl,output:path.join(dir,name+".png"),inputProps,frame,imageFormat:"png"});
  }
  await renderMedia({composition:comp,serveUrl,codec:"h264",outputLocation:path.join(dir,id+".mp4"),inputProps,concurrency:2});
}
console.log("Rendered",cases.length,"Short Form animations");
