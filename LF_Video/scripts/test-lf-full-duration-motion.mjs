// Regression: long-form visual entrances must still evolve after the first 2.8s.
// Render representative HTML card + continuous + editorial animations at 30fps.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {renderStill, selectComposition} from "@remotion/renderer";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const serveUrl=await bundle({entryPoint:path.join(ROOT,"src","index.ts")});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"ax-lf-motion-"));
const samples=[66,150,235];  // 2.2s, 5.0s, 7.83s within an 8s beat
const hash=buf=>crypto.createHash("sha256").update(buf).digest("hex");

async function verify({id,compositionId,inputProps,sampleFrames=samples}){
  const comp=await selectComposition({serveUrl,id:compositionId,inputProps});
  const hashes=[];
  for(const frame of sampleFrames){
    const output=path.join(tmp,id+"-"+frame+".png");
    await renderStill({composition:comp,serveUrl,inputProps,frame,output,imageFormat:"png"});
    hashes.push(hash(fs.readFileSync(output)));
  }
  assert.notEqual(hashes[0],hashes[1],id+" must change visibly after 2.8 seconds");
  assert.notEqual(hashes[1],hashes[2],id+" must keep progressing after 5 seconds");
  console.log("PASS:",id,"still changes during the real 8s beat");
}

const vals={title:"Low mileage does not pause time",leftLabel:"LOW MILEAGE",rightLabel:"HIGH MILEAGE",
  leftValue:"TIME PASSES",rightValue:"TIME PASSES",leftIntensity:50,rightIntensity:50,
  metricLabel:"Calendar time in both",footer:"Illustrative comparison; no measured aging rates"};
// Directional choreography: context → labeled objects → links → signal,
// and comparator labels/values BEFORE the two progress bars.
await verify({id:"VA-LF-004",compositionId:"AXAnimationPreview",
  inputProps:{animationId:"VA-LF-004",durationFrames:240,
    values:{title:"Chemistry continues even without driving",nodes:["Electrode interface","Cell-side reactions","Storage aging"],
      centerLabel:"Conceptual mechanism",direction:"forward"}}});
await verify({id:"VA-LF-008",compositionId:"AXAnimationPreview",
  inputProps:{animationId:"VA-LF-008",durationFrames:240,
    values:{title:"Charge/discharge is one aging pathway",nodes:["Charging","BMS","Pack","Cells"],
      flowLabel:"CYCLING ENERGY",intensity:3}}});
await verify({id:"VA-LF-012",compositionId:"AXAnimationPreview",
  inputProps:{animationId:"VA-LF-012",durationFrames:240,
    values:{title:"BMS signals help estimate range",sensors:["Cell temperature","Pack voltage","Recent current"],
      decisionLabel:"BMS estimate",actionLabel:"Range estimate"}}});
await verify({id:"VA-LF-013",compositionId:"AXAnimationPreview",
  inputProps:{animationId:"VA-LF-013",durationFrames:240,values:vals}});
await verify({id:"VA-LF-013-12s",compositionId:"AXAnimationPreview",
  sampleFrames:[100,245,353],
  inputProps:{animationId:"VA-LF-013",durationFrames:360,values:vals}});
await verify({id:"VA-LF-015",compositionId:"AXAnimationPreview",
  inputProps:{animationId:"VA-LF-015",durationFrames:240,values:{title:"Your battery has two clocks",
    cycleLabel:"Charging cycles",calendarLabel:"Calendar time",
    takeaway:"One slows down when parked. One does not."}}});
await verify({id:"VC-LF-018",compositionId:"AXLongForm",inputProps:{manifest:{
  video_id:"AX-LF-CARD-TIMING-QA",fps:30,width:1920,height:1080,audio:[],timeline:[
    {beat:1,track:"card",component:"VC-LF-018",props:{CHAPTER_NUM:"2",TITLE:"Heat and state of charge"},
      startFrame:0,durationFrames:240},
  ],
}}});
console.log("PASS: pacing regression suite");
