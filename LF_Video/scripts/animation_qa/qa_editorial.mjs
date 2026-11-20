import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
import {bundle} from "@remotion/bundler";
import {renderMedia,renderStill,selectComposition} from "@remotion/renderer";

// Reuses the old AXAnimationPreview QA workflow exactly: canonical MP4,
// 5 timed PNG checkpoints, stress layout stills and saved input.json.
// Run ONE animation per execution: node Animations/testing/qa_editorial.mjs VA-LF-015
// Never claims a generated render was actually visually reviewed.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const out=path.join(root,"card-testing","editorial-animations-V1");
const specs=[
 {id:"VA-LF-015",title:"Two independent battery aging clocks",durationFrames:180,values:{
  title:"Two clocks run inside every EV battery",cycleLabel:"Usage cycles",calendarLabel:"Calendar time",
  takeaway:"Parking can stop cycles — it cannot stop calendar time",
  footer:"SCHEMATIC — no claim of measured clock rates"},stress:{title:"Why calendar aging can matter even if the car is rarely charged or driven",calendarLabel:"Elapsed years in service"}},
 {id:"VA-LF-016",title:"Slow reactions during battery storage",durationFrames:180,values:{
  title:"Cell chemistry keeps reacting while parked",anodeLabel:"ANODE",cathodeLabel:"CATHODE",
  reactionLabel:"Simplified side reactions at interfaces",
  footer:"SCHEMATIC CELL CROSS-SECTION — not literal atomic motion"},stress:{title:"Battery cell side reactions may continue during extended parking or low current conditions"}},
 {id:"VA-LF-017",title:"Storage temperature times state of charge",durationFrames:180,values:{
  title:"Temperature and stored charge affect aging stress",
  xAxisLabel:"STORED CHARGE",yAxisLabel:"TEMPERATURE",
  footer:"QUALITATIVE STRESS MAP — no quantitative storage prescription"},stress:{title:"How elevated temperature and high stored state of charge interact with time in storage"}},
 {id:"VA-LF-018",title:"Geotab fleet climate association",durationFrames:180,values:{
  title:"What the large EV fleet actually showed",vehicles:22700,models:21,difference:.4,
  source:"GEOTAB — REPORTED FLEET FINDING",
  footer:"Observed faster annual decline in hot versus mild climates; not isolated calendar aging"},
  stress:{title:"Climate-associated battery-health difference across vehicle models and usage patterns"}},
 {id:"VA-LF-019",title:"Dashboard estimate is not state of health",durationFrames:180,values:{
  title:"The range estimate moves; capacity health is different",
  rangeStart:83,rangeEnd:57,healthReference:80,
  footer:"DEMONSTRATION INDEXES ONLY — not actual miles, range estimate or battery SOH"},stress:{title:"A cold morning may change the displayed estimate without proving irreversible capacity loss"}},
 {id:"VA-LF-020",title:"Temporary range versus persistent loss",durationFrames:180,values:{
  title:"One cold reading is not a degradation trend",
  topLabel:"DAILY RANGE",bottomLabel:"LONG-TERM HEALTH",
  footer:"ILLUSTRATIVE PATHS — not observations or calibrated degradation rates"},stress:{title:"Short term dashboard range fluctuations differ from persistent loss over comparable conditions"}},
];
const requested=process.argv[2];const spec=specs.find(x=>x.id===requested);
if(!spec)throw new Error("Specify one ID: "+specs.map(x=>x.id).join(", "));
const dst=path.join(out,spec.id);
fs.mkdirSync(dst,{recursive:true});
const bundled=await bundle({entryPoint:path.join(root,"src","index.ts"),webpackOverride:c=>c});
const props={animationId:spec.id,values:spec.values,durationFrames:spec.durationFrames};
const composition=await selectComposition({serveUrl:bundled,id:"AXAnimationPreview",inputProps:props});
if(composition.width!==1920||composition.height!==1080||composition.fps!==30||composition.durationInFrames!==spec.durationFrames)
 throw new Error("Wrong preview geometry or duration for "+spec.id);
for(const [name,frame] of [["t00_start",15],["t01_1.5s",45],["t02_3.0s",90],["t03_4.5s",135],["t04_final",178]]){
 await renderStill({composition,serveUrl:bundled,inputProps:props,output:path.join(dst,name+".png"),frame,imageFormat:"png"});
}
await renderMedia({composition,serveUrl:bundled,inputProps:props,codec:"h264",outputLocation:path.join(dst,spec.id+"_V1.mp4"),concurrency:2});
const stressProps={...props,values:{...spec.values,...spec.stress}};
const stressComp=await selectComposition({serveUrl:bundled,id:"AXAnimationPreview",inputProps:stressProps});
for(const [name,frame] of [["stress_1.5s",45],["stress_final",178]]){
 await renderStill({composition:stressComp,serveUrl:bundled,inputProps:stressProps,output:path.join(dst,name+".png"),frame,imageFormat:"png"});
}
// Actual Visual Plan beats can be much shorter than the 6s catalog preview.
// Verify that the entire staged reveal completes inside a 124-frame beat, too.
const shortProps={...props,durationFrames:124};
const shortComp=await selectComposition({serveUrl:bundled,id:"AXAnimationPreview",inputProps:shortProps});
if(shortComp.durationInFrames!==124)throw new Error("Short-beat duration ignored for "+spec.id);
for(const [name,frame] of [["short_00_start",5],["short_01_early",26],["short_02_middle",52],
                            ["short_03_late",84],["short_05_hold",93],["short_04_final",122]]){
 await renderStill({composition:shortComp,serveUrl:bundled,inputProps:shortProps,
   output:path.join(dst,name+".png"),frame,imageFormat:"png"});
}
// A fully revealed animation must not keep blinking, looping or sweeping through its last second.
if(!fs.readFileSync(path.join(dst,"short_05_hold.png"))
    .equals(fs.readFileSync(path.join(dst,"short_04_final.png")))){
 throw new Error("Final held pose changed between frames 93 and 122 for "+spec.id);
}
if(spec.id==="VA-LF-016"){
 // Regression for a previously overcorrected clip: motion MUST be visible, and
 // its electrode connecting brackets MUST be present without crossing text.
 for(const [name,frame] of [["short_motion_a",68],["short_motion_b",82]]){
  await renderStill({composition:shortComp,serveUrl:bundled,inputProps:shortProps,
    output:path.join(dst,name+".png"),frame,imageFormat:"png"});
 }
 const rgbCrop=(name,crop)=>execFileSync("ffmpeg",[
  "-v","error","-i",path.join(dst,name+".png"),"-vf",`crop=${crop}`,
  "-frames:v","1","-pix_fmt","rgb24","-f","rawvideo","pipe:1"
 ],{maxBuffer:1024*1024});
 const movementA=rgbCrop("short_motion_a","540:290:690:420");
 const movementB=rgbCrop("short_motion_b","540:290:690:420");
 if(movementA.equals(movementB))throw new Error("VA-LF-016 electrolyte became static again");
 const connections=rgbCrop("short_04_final","1000:40:480:790");
 let blue=0,orange=0;
 for(let i=0;i<connections.length;i+=3){
  const r=connections[i],g=connections[i+1],b=connections[i+2];
  if(r>=60&&r<=125&&g>=145&&g<=220&&b>=225)blue++;
  if(r>=230&&g>=100&&g<=175&&b>=65&&b<=145)orange++;
 }
 if(blue<500||orange<500)
  throw new Error("VA-LF-016 connecting bracket missing: blue="+blue+" orange="+orange);
}
fs.writeFileSync(path.join(dst,"input.json"),JSON.stringify({spec,canonicalProps:props,shortProps,stressProps,
 checkpoints:[15,45,90,135,178],shortCheckpoints:[5,26,52,84,93,122]},null,2));
fs.writeFileSync(path.join(dst,"review-checklist.txt"),[
 "ANIMATION "+spec.id,
 "REVIEWER MUST WATCH ENTIRE MP4 AND CHECK ALL FIVE PNG FRAMES.",
 "1. Brand consistency: navy/teal/heat; 1920x1080, 30fps; mobile readable.",
 "2. Every motion explains a cause, comparison or state transition; no decorative oscillation.",
 "3. Science / provenance: no pseudo-observations or false measured rates.",
 "4. Text does not overflow under stress props; no ellipsized important source.",
 "5. First frame, 1.5s, 3.0s, 4.5s, final frame are visually distinct.",
 "5a. Inspect all six SHORT beat PNGs: labels precede numbers and traces; full scene appears before final 1-second hold.",
 "5b. A deterministic final hold is enforced by comparing the last two short-beat stills.",
 "5c. VA-LF-016 is checked for visible electrolyte movement and both electrode connecting lines.",
 "6. Editor confirms this visual performs a different job from VA-LF-013.",
 "7. DO NOT ADD TO READY CATALOG until actual watch/review and renderer deploy."
 ].join("\n")+"\n");
console.log("Rendered "+spec.id+" individual 1080p MP4 + five stills + two stress stills + six short-beat stills in "+dst);
