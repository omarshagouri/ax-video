import test from "node:test";
import assert from "node:assert/strict";
import { prepareChapterSidecar, buildFinalSrt, wordsFromElevenLabs } from "./subtitles.mjs";
const tts=text=>{
  const chars=[...text];
  const start=chars.map((_,i)=>i*.08);
  const end=chars.map((_,i)=>(i+1)*.08);
  return {audio_base64:"TUlJRg==",alignment:{
    characters:chars,character_start_times_seconds:start,character_end_times_seconds:end
  }};
};
test("ElevenLabs real measured characters convert to word timings, not guessed word counts",()=>{
  const a=wordsFromElevenLabs(tts("Hello world.")).words;
  assert.deepEqual(a.map(x=>x.text),["Hello","world."]);
  assert.equal(a[0].start,0);
  assert.equal(a[1].start,.48);
});
test("Full SRT uses first chapter offset including the silent thumbnail and exact chapter part durations",()=>{
  const one=prepareChapterSidecar({video_id:"AX-LF-006",chapter:1,
    narration:"Hello world.",tts:tts("Hello world.")});
  const two=prepareChapterSidecar({video_id:"AX-LF-006",chapter:2,
    narration:"Another thing.",tts:tts("Another thing.")});
  assert.equal(JSON.stringify(one).includes("audio_base64"),false);
  const res=buildFinalSrt({video_id:"AX-LF-006",
    parts:[{chapter:2.2,duration:4},{chapter:1.2,duration:3},
      {chapter:2.1,duration:3},{chapter:1.1,duration:2}],
    sidecars:new Map([[1,one],[2,two]]),thumbnail_intro_seconds:1});
  assert.equal(res.chapter_count,2);
  assert.ok(res.text.includes("00:00:01,000 --> "));
  assert.ok(res.text.includes("00:00:06,000 --> "));
  assert.ok(res.text.includes("Hello world."));
  assert.ok(res.text.includes("Another thing."));
  assert.ok(res.text.includes("1\n00:00:01,000"));
  assert.ok(res.text.endsWith("\n"));
});
test("No invented subtitles: reject missing or mismatched word-timing sidecars",()=>{
  const one=prepareChapterSidecar({video_id:"AX-LF-006",chapter:1,narration:"Hello",tts:tts("Hello")});
  assert.throws(()=>buildFinalSrt({video_id:"AX-LF-006",parts:[{chapter:1.1,duration:2}],
    sidecars:new Map()}),/Missing, mismatched/);
  assert.throws(()=>buildFinalSrt({video_id:"AX-LF-007",parts:[{chapter:1.1,duration:2}],
    sidecars:new Map([[1,one]])}),/Missing, mismatched/);
  assert.throws(()=>wordsFromElevenLabs({alignment:{characters:["a"],character_start_times_seconds:[],
    character_end_times_seconds:[.2]}}),/alignment missing/);
});
