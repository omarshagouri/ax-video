import assert from "node:assert/strict";
import {bundle} from "@remotion/bundler";
import {selectComposition} from "@remotion/renderer";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const serveUrl=await bundle({entryPoint:path.join(root,"src","index.ts")});
const valid={
  video_id:"AX-LF-006-validation-test",fps:30,width:1920,height:1080,audio:[],
  timeline:[
    {beat:1,track:"clip",component:"VV-LF-033",props:{fit:"cover"},
     src:"http://127.0.0.1:8080/assets/real-drive-clip.mp4",startFrame:0,durationFrames:90},
  ],
};
const good=await selectComposition({serveUrl,id:"AXLongForm",inputProps:{manifest:valid}});
assert.equal(good.durationInFrames,90);
console.log("PASS: resolved catalog clip VV-LF-033 is recognized in AXLongForm");
for (const [name,change,pattern] of [
  ["unresolved catalog clip", {src:undefined}, /no resolved MP4 source/],
  ["invalid catalog clip ID", {component:"VV-LF-invalid"}, /invalid footage ID/],
]){
  const manifest={...valid,timeline:[{...valid.timeline[0],...change}]};
  await assert.rejects(
    selectComposition({serveUrl,id:"AXLongForm",inputProps:{manifest}}),
    pattern,
    "Expected invalid "+name+" to fail closed"
  );
  console.log("PASS: "+name+" rejected");
}
