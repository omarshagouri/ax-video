import test from "node:test";
import assert from "node:assert/strict";
import {splitNarration,mergeElevenLabsAlignments} from "./segmented-tts.mjs";
import {prepareChapterSidecar} from "./subtitles.mjs";
import {makeVisualTimingContext} from "./visual-timing-context.mjs";
test("long approved narration splits to <=700 characters with no text loss",()=>{
  const sentence="When a battery sits in the garage, the chemistry keeps moving even while the wheels are still.";
  const input=Array.from({length:17},()=>sentence).join(" ");
  const chunks=splitNarration(input);
  assert.ok(chunks.length>=3);
  assert.ok(chunks.every(c=>c.length<=700 && c.length>0));
  assert.equal(chunks.join(" "),input);
});
test("short narration stays one TTS request",()=>{
  assert.deepEqual(splitNarration("A short narration."),["A short narration."]);
});
test("invalid long word and invalid input are rejected",()=>{
  assert.throws(()=>splitNarration("X".repeat(701)),/word longer/);
  assert.throws(()=>splitNarration("  "),/missing/);
});
test("offsets shift character timestamps by real decoded audio lengths",()=>{
 const make=(word)=>({alignment:{characters:[...word],
   character_start_times_seconds:[0,.1,.2],
   character_end_times_seconds:[.08,.18,.28]},
   normalized_alignment:{characters:[...word],
   character_start_times_seconds:[0,.1,.2],
   character_end_times_seconds:[.08,.18,.28]}});
 const joined=mergeElevenLabsAlignments([make("One"),make("Two")],[1.25,2.5]);
 assert.deepEqual(joined.alignment.character_start_times_seconds,[0,.1,.2,1.25,1.35,1.45]);
 assert.deepEqual(joined.normalized_alignment.character_end_times_seconds,[.08,.18,.28,1.33,1.43,1.53]);
});
test("refuse absent real character timestamps, no invented word speed",()=>{
 assert.throws(()=>mergeElevenLabsAlignments([{alignment:{characters:["H"],character_start_times_seconds:[],character_end_times_seconds:[]}}],[1]),/measurable/);
});
test("Visual Agent receives chapter-local measured seconds, never guessed word counts",()=>{
 const alignment={alignment:{characters:[..."Hello world."],
   character_start_times_seconds:[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1,1.1],
   character_end_times_seconds:[.08,.18,.28,.38,.48,.58,.68,.78,.88,.98,1.08,1.18]}};
 const sidecar=prepareChapterSidecar({video_id:"AX-LF-006",chapter:4,narration:"Hello world.",tts:alignment,audio_file_id:"mp3-123"});
 const ctx=makeVisualTimingContext({sidecar,video_id:"AX-LF-006",chapter:4,narration:"Hello world."});
 assert.equal(ctx.source,"measured_elevenlabs_word_timings");
 assert.equal(ctx.sentence_cues.length,1);
 assert.equal(ctx.sentence_cues[0].start_seconds,0);
 assert.equal(ctx.sentence_cues[0].end_seconds,1.18);
 assert.throws(()=>makeVisualTimingContext({sidecar,video_id:"AX-LF-006",chapter:4,narration:"Different"}),/does not match/);
});
