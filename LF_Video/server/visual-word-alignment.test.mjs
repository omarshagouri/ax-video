import test from "node:test";
import assert from "node:assert/strict";
import {verifyMeasuredWordCues,compareBeatsToCues} from "./visual-word-alignment.mjs";
const cues=[
 {word:"Cold",start:0,end:.5},
 {word:"weather",start:.5,end:1.1},
 {word:"changes",start:1.1,end:2.0},
 {word:"range",start:2,end:2.8}
];
test("trust exact real word timings only when anchored to source MP3 and transcript",()=>{
 const a=verifyMeasuredWordCues({chapterNumber:3,narration:"Cold weather changes range",audioDurationSec:3,method:"ASR forced-alignment on original MP3",sourceAudioId:"1abcdeSOURCEAUDIOID",cues});
 assert.equal(a.valid,true,a.errors.join("|"));
 const wrong=verifyMeasuredWordCues({chapterNumber:3,narration:"Cold weather changes range",audioDurationSec:3,method:"word-count estimate",sourceAudioId:"1abcdeSOURCEAUDIOID",cues});
 assert.equal(wrong.valid,false);
});
test("measured beat drift can be checked in frames without altering narration",()=>{
 const b=[[3,1,"VC-LF-018","{}",1.1,"Ready","Cold weather"],[3,2,"VV-LF-024","{}",1.7,"Ready","changes range"]];
 const result=compareBeatsToCues(b,cues);
 assert.equal(result.within075Seconds,true);
 assert.ok(result.maxAbsDriftFrames<=1);
 b[0][4]=2.0;
 assert.equal(compareBeatsToCues(b,cues).within075Seconds,false);
});
test("missing transcript words refuse alignment",()=>{
 const b=[[3,1,"VC-LF-018","{}",1.1,"Ready","Cold conditions"],[3,2,"VV-LF-024","{}",1.7,"Ready","changes range"]];
 assert.throws(()=>compareBeatsToCues(b,cues),/does not align/);
});
