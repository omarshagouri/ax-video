import test from "node:test";
import assert from "node:assert/strict";
import { CLIP_ID, parseClipCatalog, selectClip, resolveExplicitClip, assertClipFitsBeat } from "./clip-catalog.mjs";
const rows=[
 ["Clip_name","When_to_use","Category","File_ID","Width","Height","Duration_sec","Aspect","Status","Visual_id"],
 ["VV-LF-001.mp4","SoC display","EV Buyer Problems","1QPNHe7BOULyVPcvpp2nwrTGkW3LRoSWl",1280,960,4,"4:3","Ready","VV-LF-001"],
 ["VV-LF-023.mp4","Cells","Engineering","17i9iBy3svt3hOmAaKxdLWKETog4fqj-q",1920,1080,4.5,"16:9","Ready","VV-LF-023"]
];
test("catalog IDs include new clips, not limited to native 001-004",()=>{
 assert.equal(CLIP_ID.test("VV-LF-001"),true);
 assert.equal(CLIP_ID.test("VV-LF-023"),true);
 assert.equal(CLIP_ID.test("VA-LF-023"),false);
});
test("resolve real Drive footage by Visual_id or exact filename",()=>{
 const c=parseClipCatalog(rows);
 assert.equal(selectClip(c,"VV-LF-001").fileId,rows[1][3]);
 assert.equal(selectClip(c,"VV-LF-023.mp4").fileId,rows[2][3]);
 assert.equal(selectClip(c,"VV-LF-001").duration,4);
});
test("reject missing, duplicate, disabled catalog clips",()=>{
 assert.throws(()=>selectClip(parseClipCatalog(rows),"VV-LF-049"),/absent/);
 assert.throws(()=>parseClipCatalog([...rows,rows[1]]),/Duplicate/);
 const disabled=rows.map(x=>[...x]);disabled[2][8]="Draft";
 assert.throws(()=>selectClip(parseClipCatalog(disabled),"VV-LF-023"),/not Ready/);
});
test("explicit Drive file ID works without Cloud Run Sheets authorization",()=>{
 assert.equal(resolveExplicitClip("VV-LF-023",{file_id:rows[2][3],clip_name:rows[2][0],max_duration_sec:4.5}).fileId,rows[2][3]);
 assert.equal(resolveExplicitClip("VV-LF-023",{}),null);
 assert.throws(()=>resolveExplicitClip("VV-LF-023",{file_id:"notValid"}),/Invalid/);
});
test("duration is sourced dynamically, never 3s hardcoded",()=>{
 assert.equal(assertClipFitsBeat({beatFrames:120,fps:30,mediaSeconds:4.0,catalogSeconds:4,id:"VV-LF-001"}),true);
 assert.equal(assertClipFitsBeat({beatFrames:134,fps:30,mediaSeconds:4.47,catalogSeconds:4.47,id:"VV-LF-004"}),true);
 assert.throws(()=>assertClipFitsBeat({beatFrames:135,fps:30,mediaSeconds:4.47,catalogSeconds:4.47,id:"VV-LF-004"}),/cap/);
 assert.throws(()=>assertClipFitsBeat({beatFrames:140,fps:30,mediaSeconds:3.0,id:"VV-LF-023"}),/exceeds real MP4/);
});
