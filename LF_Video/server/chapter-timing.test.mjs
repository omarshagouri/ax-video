import assert from "node:assert/strict";
import test from "node:test";
import { assertChapterTimelineMatchesAudio, MAX_TIMING_DRIFT_SECONDS } from "./chapter-timing.mjs";

function segment(start, len, beat=1) { return { beat, startFrame:start, durationFrames:len }; }
function track(start,len) { return { startFrame:start, durationFrames:len }; }
const fps=30;
test("accepts narration covered by visuals within 0.75 second",()=>{
  const result=assertChapterTimelineMatchesAudio({fps,timeline:[segment(0,900),segment(900,870,2)],audio:[track(0,1780)]});
  assert.ok(result.difference_seconds<MAX_TIMING_DRIFT_SECONDS);
});
test("rejects the 85s visual / 164s narration AX-LF-003 failure",()=>{
  assert.throws(()=>assertChapterTimelineMatchesAudio({fps,timeline:[segment(0,2550)],audio:[track(0,4920)]}),/Chapter timing mismatch: visuals=85.00s audio=164.00s/);
});
test("rejects empty narration input",()=>{
  assert.throws(()=>assertChapterTimelineMatchesAudio({fps,timeline:[segment(0,900)],audio:[]}),/no narration/);
});
test("rejects gap between visual beats despite correct total end time",()=>{
  assert.throws(()=>assertChapterTimelineMatchesAudio({fps,timeline:[segment(0,450),segment(460,440,2)],audio:[track(0,900)]}),/gap or overlap/);
});
test("rejects overlaps between beats",()=>{
  assert.throws(()=>assertChapterTimelineMatchesAudio({fps,timeline:[segment(0,500),segment(450,450,2)],audio:[track(0,900)]}),/gap or overlap/);
});
test("rejects uncovered last part of audio",()=>{
  assert.throws(()=>assertChapterTimelineMatchesAudio({fps,timeline:[segment(0,900)],audio:[track(0,945)]}),/Chapter timing mismatch/);
});
test("rejects missing visual beats",()=>{
  assert.throws(()=>assertChapterTimelineMatchesAudio({fps,timeline:[],audio:[track(0,900)]}),/visual timeline is empty/);
});
