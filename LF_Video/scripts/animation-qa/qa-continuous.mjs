import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,"../..");
const ENTRY=path.join(ROOT,"src","index.ts");
const OUT=path.join(ROOT,"qa-continuous-v2");
fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});

const cases=[
 {id:"VA-LF-008",durationFrames:240,values:{title:"Energy packets moving through the charging system",nodes:["Charger","BMS","Pack","Cells"],flowLabel:"Power keeps moving while the vehicle controls the path",intensity:4,footer:"QA"}},
 {id:"VA-LF-009",durationFrames:240,values:{title:"The BMS can throttle requested charging power",inputLabel:"Charger request",gateLabel:"BMS limit",outputLabel:"Cell power",inputRate:100,outputRate:42,footer:"QA"}},
 {id:"VA-LF-010",durationFrames:270,values:{title:"A hot spot spreads unless cooling removes the heat",heatLevel:82,hotspotRow:2,hotspotCol:5,cooling:true,note:"Cell temperature is not uniform across a working pack",footer:"QA"}},
 {id:"VA-LF-011",durationFrames:270,values:{title:"The dashboard estimate can move after recalibration",displayedStart:88,displayedEnd:96,usablePct:95,displayedLabel:"Displayed SoH",usableLabel:"Usable-energy reference",footer:"QA"}},
 {id:"VA-LF-012",durationFrames:270,values:{title:"The BMS turns live sensor data into a control decision",sensors:["Voltage","Current","Temperature","SOC"],decisionLabel:"BMS estimate + limits",actionLabel:"Allowed power",footer:"QA"}},
 {id:"VA-LF-013",durationFrames:270,values:{title:"Same battery, different operating stress",leftLabel:"Mild operation",rightLabel:"High stress",leftValue:"LOW",rightValue:"HIGH",leftIntensity:28,rightIntensity:88,metricLabel:"Relative activity / stress",footer:"QA"}},
 {id:"VA-LF-013",caseName:"equal-half-bars",durationFrames:270,values:{title:"Low mileage does not pause time",leftLabel:"LOW MILEAGE",rightLabel:"HIGH MILEAGE",leftValue:"TIME PASSES",rightValue:"TIME PASSES",leftIntensity:50,rightIntensity:50,metricLabel:"Calendar time in both",footer:"Illustrative comparison; no measured aging rates"}},
 {id:"VA-LF-013",caseName:"long-value-spacing",durationFrames:270,values:{title:"Stored charge and heat are two factors",leftLabel:"COOL / MODERATE SOC",rightLabel:"HOT / HIGH SOC",leftValue:"LOWER STRESS",rightValue:"HIGHER STRESS",leftIntensity:30,rightIntensity:70,metricLabel:"Qualitative storage stress",footer:"Illustrative comparison; no measured aging rates"}}
];

const serveUrl=await bundle({entryPoint:ENTRY,webpackOverride:(c)=>c});

for(const test of cases){
 const inputProps={animationId:test.id,values:test.values,durationFrames:test.durationFrames};
 const comp=await selectComposition({serveUrl,id:"AXAnimationPreview",inputProps});
 const dir=path.join(OUT,test.id+(test.caseName?"-"+test.caseName:"")); fs.mkdirSync(dir,{recursive:true});
 for(const cp of [
  ["t00_0.5s",15],["t01_1.5s",45],["t02_3.0s",90],["t03_5.0s",Math.min(test.durationFrames-2,150)],["t04_final",test.durationFrames-2]
 ]){
  await renderStill({composition:comp,serveUrl,output:path.join(dir,cp[0]+".png"),inputProps,frame:cp[1],imageFormat:"png"});
 }
 await renderMedia({composition:comp,serveUrl,codec:"h264",outputLocation:path.join(dir,test.id+".mp4"),inputProps,concurrency:2});
 fs.writeFileSync(path.join(dir,"input.json"),JSON.stringify(test,null,2));
}
console.log("Rendered "+cases.length+" continuous-motion animations");
