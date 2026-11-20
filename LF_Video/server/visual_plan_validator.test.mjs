import test from "node:test";
import assert from "node:assert/strict";
import {auditVisualPlan,validateEditorialReview,RUBRIC} from "./visual_plan_validator.mjs";
const CLIP_HEADER=["Clip_name","When_to_use","Category","File_ID","Width","Height","Duration_sec","Aspect","Status","Visual_id","Editorial_job","Visible_story_and_motion","Evidence_limitations"];
function fixture(){
  const idA="1QPNHe7BOULyVPcvpp2nwrTGkW3LRoSWl",idB="1NTLgtDJVCoxaQaFuetPQU5rywS5jzt-g";
  const c={
    Cards:[["Card_id","Card_name","Status","Slots","MAX_duration_sec"],["VC-LF-018","Chapter divider","Ready","CHAPTER_NUM, TITLE",3]],
    Animations:[["Anim_id","Anim_name","Status","Slots","Max_duration"],["VA-LF-004","Flow","Ready","title, nodes",8],["VA-LF-008","Packets","Ready","title, nodes",8]],
    Clips:[CLIP_HEADER,["VV-LF-001.mp4","EV dashboard","",""+idA,1280,960,4,"4:3","Ready","VV-LF-001"],["VV-LF-002.mp4","Charging station","",""+idB,1280,960,4,"4:3","Ready","VV-LF-002"]]
  };
  const ch=[["chapter","chapter_title","narration","audio_file_id","audio_duration_sec"]];
  const beats=[["Chapter","Beat","card_id","values","duration","status","sentence"]];
  for(let n=1;n<=6;n++){
    ch.push([n,"Title "+n,"one two three four five","audio-"+n,26]);
    beats.push(
      [n,1,"VC-LF-018",JSON.stringify({CHAPTER_NUM:String(n),TITLE:"Title "+n}),2,"Ready","one"],
      [n,2,"VV-LF-001",JSON.stringify({file_id:idA,clip_name:"VV-LF-001.mp4",max_duration_sec:4}),4,"Ready","two"],
      [n,3,"VA-LF-004",JSON.stringify({title:"Process",nodes:["one","two"]}),8,"Ready","three"],
      [n,4,"VV-LF-002",JSON.stringify({file_id:idB,clip_name:"VV-LF-002.mp4",max_duration_sec:4}),4,"Ready","four"],
      [n,5,"VA-LF-008",JSON.stringify({title:"Stream",nodes:["A","B"]}),8,"Ready","five"]
    );
  }
  return {chapters:ch,visualPlan:beats,catalog:c};
}
test("valid six chapter storyboards audit deterministic structure and leave subjective score ungraded",()=>{
 const a=auditVisualPlan(fixture());
 assert.equal(a.technicalPass,true,JSON.stringify(a.errors));
 assert.equal(a.qualityScore,null);
 assert.equal(a.chapters.length,6);
 assert.ok(a.chapters.every(x=>x.splitFrame===420));
 assert.ok(a.warnings.some(x=>x.code==="alignment.unverified"));
});
test("detects wrong Drive footage ID and over-duration even when labels are plausible",()=>{
 const f=fixture(),r=f.visualPlan[2];r[3]=JSON.stringify({...JSON.parse(r[3]),file_id:"old-wrong-id"});
 r[4]=5;
 const a=auditVisualPlan(f);
 assert.ok(a.errors.some(x=>x.code==="clip.file_id"&&x.chapter===1));
 assert.ok(a.errors.some(x=>x.code==="beat.cap"&&x.chapter===1));
});
test("enforces a 3-second minimum for all LF animation IDs without changing cards or clips",()=>{
 const f=fixture();
 f.visualPlan[3][4]=2.5; // VA-LF-004, chapter 1: 75 frames is too short.
 f.visualPlan[5][4]=2.966666666666667; // VA-LF-008, chapter 1: 89 frames is too short.
 const a=auditVisualPlan(f);
 assert.ok(a.errors.some(x=>x.code==="beat.animation_min"&&x.id==="VA-LF-004"));
 assert.ok(a.errors.some(x=>x.code==="beat.animation_min"&&x.id==="VA-LF-008"));
 assert.equal(a.errors.filter(x=>x.code==="beat.animation_min").length,2);
 assert.ok(!a.errors.some(x=>x.code==="beat.animation_min"&&x.id.startsWith("VC-")));

 // Exactly 90 frames is allowed; the 2-second mandatory title card remains valid.
 f.visualPlan[3][4]=3;
 f.visualPlan[5][4]=3;
 const atMinimum=auditVisualPlan(f);
 assert.ok(!atMinimum.errors.some(x=>x.code==="beat.animation_min"));

 // A longer animation still cannot exceed its per-ID maximum from the catalog.
 f.visualPlan[3][4]=8.033333333333333;
 const overMaximum=auditVisualPlan(f);
 assert.ok(overMaximum.errors.some(x=>x.code==="beat.cap"&&x.id==="VA-LF-004"));
});
test("detects title mismatch, bad coverage and missing real clip at legal part boundary",()=>{
 const f=fixture();
 f.visualPlan[1][3]=JSON.stringify({CHAPTER_NUM:1,TITLE:"A different title"});
 f.visualPlan[4][2]="VA-LF-008";f.visualPlan[4][3]=JSON.stringify({nodes:["X","Y"]});
 f.visualPlan[3][6]="invented";
 const a=auditVisualPlan(f);
 assert.ok(a.errors.some(x=>x.code==="chapter.title_props"));
 assert.ok(a.errors.some(x=>x.code==="chapter.narration"));
 assert.ok(a.errors.some(x=>x.code==="chapter.two_clips"));
});
test("rejects unproved numerical rating, ungrounded evidence and subjective score under 95",()=>{
 const a=auditVisualPlan(fixture());
 const categories=Object.fromEntries(Object.entries(RUBRIC).map(([k,max])=>[k,{score:max,evidence:["chapter 1 beat 2 matches owner dashboard context"]}]));
 assert.equal(validateEditorialReview({categories,editorWouldKeepWatching:true},a).approved,true);
 categories.pacing.score=18;
 assert.equal(validateEditorialReview({categories,editorWouldKeepWatching:true},a).approved,false);
 categories.pacing.score=25;categories.flow.evidence=[];
 assert.equal(validateEditorialReview({categories,editorWouldKeepWatching:true},a).approved,false);
});
test("flags semantics for hot thermal map presented under winter cold narration",()=>{
 const f=fixture();f.catalog.Animations.push(["VA-LF-010","Thermal","Ready","cooling, title",9]);
 f.visualPlan[3][2]="VA-LF-010";f.visualPlan[3][3]=JSON.stringify({cooling:false});
 f.visualPlan[3][6]="cold winter";
 const a=auditVisualPlan(f);
 assert.ok(a.warnings.some(x=>x.code==="visual.hot_vs_cold"));
});


test("permanently retired VC-LF-016 is rejected in catalog and every plan beat",()=>{
 const f=fixture();
 f.catalog.Cards.push(["VC-LF-016","Tag chip","Ready","TAG_TEXT",3]);
 f.visualPlan[2][2]="VC-LF-016";
 f.visualPlan[2][3]=JSON.stringify({TAG_TEXT:"BANNED"});
 const a=auditVisualPlan(f);
 assert.equal(a.technicalPass,false);
 assert.ok(a.errors.some(x=>x.code==="catalog.retired_asset"&&x.id==="VC-LF-016"));
 assert.ok(a.errors.some(x=>x.code==="beat.retired_asset"&&x.id==="VC-LF-016"));
});
