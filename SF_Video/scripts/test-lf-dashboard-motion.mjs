// VA-LF-014 must reveal content over the actual timeline beat, not just the first seconds.
// Run inside video-service: node scripts/test-lf-dashboard-motion.mjs
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"ax-lf-dashboard-motion-"));
const hash=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const serveUrl=await bundle({entryPoint:path.join(ROOT,"src","index.ts")});
const values={
  title:"BATTERY STATUS",subtitle:"Illustrative dashboard",mainValue:"87",mainUnit:"%",
  progress:74,detail:"Estimated condition",status:"CHECK COMPLETE"
};
try {
  for (const durationFrames of [180, 240, 360]) {
    const inputProps={animationId:"VA-LF-014",durationFrames,values};
    const comp=await selectComposition({serveUrl,id:"AXAnimationPreview",inputProps});
    assert.equal(comp.durationInFrames,durationFrames);
    const frames=[0.25,0.60,0.96].map(f=>Math.floor((durationFrames-1)*f));
    const hashes=[];
    for (const frame of frames) {
      const file=path.join(tmp,`dashboard-${durationFrames}-${frame}.png`);
      await renderStill({composition:comp,serveUrl,inputProps,frame,output:file,imageFormat:"png"});
      hashes.push(hash(fs.readFileSync(file)));
    }
    assert.notEqual(hashes[0],hashes[1],"VA-LF-014 should reveal more content past 25% of actual beat");
    assert.notEqual(hashes[1],hashes[2],"VA-LF-014 should continue revealing at 96% of actual beat");
    console.log("PASS VA-LF-014:",durationFrames,"frames; full-duration staged motion");
  }
} finally {
  fs.rmSync(tmp,{recursive:true,force:true});
}
