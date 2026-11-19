import test from "node:test";
import assert from "node:assert/strict";
import { assertNativeClipDuration,assertNativeMotionMix,NATIVE_CLIP_IDS } from "./native-motion.mjs";
test("four native motion IDs are registered",()=>assert.deepEqual(NATIVE_CLIP_IDS,["VV-LF-001","VV-LF-002","VV-LF-003","VV-LF-004"]));
test("clips must be exactly 90 frames at 30fps",()=>{
 for (const id of NATIVE_CLIP_IDS) { assert.doesNotThrow(()=>assertNativeClipDuration(id,90,30)); assert.throws(()=>assertNativeClipDuration(id,89,30),/exactly 3 seconds/);}
 assert.throws(()=>assertNativeClipDuration("VV-LF-999",90,30),/Unsupported/);
});
test("one clip and one animation required in each separately rendered part",()=>{
 const c={component:"VV-LF-001",track:"clip"},a={component:"VA-LF-004",track:"anim"},v={component:"VC-LF-018",track:"card"};
 assert.deepEqual(assertNativeMotionMix([c,a,v]),{clips:1,animations:1});
 for(const arr of [[v],[c,v],[a,v],[]])assert.throws(()=>assertNativeMotionMix(arr),/Visual mix requirement/);
});
