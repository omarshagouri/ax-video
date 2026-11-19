import test from "node:test";
import assert from "node:assert/strict";
import {chooseSplitFrame,makeSilentPartManifest,makeAudioPartManifest,validatePairedJoin} from "./paired-chapter.mjs";
const timeline=[{beat:1,startFrame:0,durationFrames:600},{beat:2,startFrame:600,durationFrames:600},{beat:3,startFrame:1200,durationFrames:90},{beat:4,startFrame:1290,durationFrames:600},{beat:5,startFrame:1890,durationFrames:510}];
const m={video_id:"AX-LF-006_CH01",fps:30,timeline,audio:[{chapter:1,src:"whole.mp3",startFrame:0,durationFrames:2400}]};
test("stable beat split at 1200/2400 frames",()=>assert.equal(chooseSplitFrame(timeline).splitFrame,1200));
test("silent halves cover every frame",()=>{const s=chooseSplitFrame(timeline),a=makeSilentPartManifest(m,1,s),b=makeSilentPartManifest(m,2,s);assert.deepEqual(a.audio,[]);assert.deepEqual(b.audio,[]);assert.equal(a.timeline.length+b.timeline.length,timeline.length);assert.equal(b.timeline[0].startFrame,0);});
test("reject invalid timeline",()=>assert.throws(()=>chooseSplitFrame([{startFrame:0,durationFrames:200},{startFrame:190,durationFrames:500}]),/gap, overlap/));
test("reject >110-second chapter",()=>assert.throws(()=>chooseSplitFrame([{startFrame:0,durationFrames:3000},{startFrame:3000,durationFrames:400}]),/exceeds/));
test("fail closed if original audio drifts",()=>assert.throws(()=>validatePairedJoin({part1Frames:1200,part2Frames:1200,splitFrame:1200,totalFrames:2400,audioDurationSec:79}),/0.25s/));
test("join accepts contiguous segments and full original audio",()=>assert.deepEqual(validatePairedJoin({part1Frames:1200,part2Frames:1200,splitFrame:1200,totalFrames:2400,audioDurationSec:80.1}),{duration_seconds:80}));

test("two render-ready MP4 parts each carry ONLY the matching narration segment",()=>{
 const s=chooseSplitFrame(timeline),a=makeAudioPartManifest(m,1,s),b=makeAudioPartManifest(m,2,s);
 assert.equal(a.audio[0].src,"whole.mp3"); assert.equal(b.audio[0].src,"whole.mp3");
 assert.equal(a.audio[0].startFrom,0);assert.equal(b.audio[0].startFrom,s.splitFrame);
 assert.equal(a.audio[0].durationFrames,s.part1Frames);assert.equal(b.audio[0].durationFrames,s.part2Frames);
 assert.equal(a.audio[0].durationFrames+b.audio[0].durationFrames,m.audio[0].durationFrames);
 assert.equal(a.timeline.at(-1).startFrame+a.timeline.at(-1).durationFrames,a.audio[0].durationFrames);
 assert.equal(b.timeline.at(-1).startFrame+b.timeline.at(-1).durationFrames,b.audio[0].durationFrames);
});
test("do not cut, stretch, or silently loop audio when chapter duration differs",()=>{
 const broken={...m,audio:[{...m.audio[0],durationFrames:2405}]};
 assert.throws(()=>makeAudioPartManifest(broken,1),/exactly in frames/);
});

test("split keeps one Drive-backed clip in each technical MP4 part",()=>{
  const footage=[
    {beat:1,startFrame:0,durationFrames:60,track:"card"},
    {beat:2,startFrame:60,durationFrames:120,track:"clip",component:"VV-LF-023"},
    {beat:3,startFrame:180,durationFrames:540,track:"anim"},
    {beat:4,startFrame:720,durationFrames:500,track:"card"},
    {beat:5,startFrame:1220,durationFrames:120,track:"clip",component:"VV-LF-046"},
    {beat:6,startFrame:1340,durationFrames:460,track:"anim"}
  ];
  const split=chooseSplitFrame(footage,{requireClipPerPart:true});
  assert.ok(split.splitFrame>=180&&split.splitFrame<=1220);
  assert.ok(split.part1Frames<=1650&&split.part2Frames<=1650);
});
test("a plan with both clips in the first part and no legal split fails closed",()=>{
  const footage=[
    {beat:1,startFrame:0,durationFrames:90,track:"clip"},
    {beat:2,startFrame:90,durationFrames:90,track:"clip"},
    {beat:3,startFrame:180,durationFrames:1600,track:"anim"},
    {beat:4,startFrame:1780,durationFrames:100,track:"card"}
  ];
  assert.throws(()=>chooseSplitFrame(footage,{requireClipPerPart:true}),/no legal split/);
});
