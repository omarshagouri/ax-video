// AX read-only visual plan audit. No writes or pipeline promotion.
// node server/visual-plan-validator.mjs --live [visual_sheet_id] [catalog_sheet_id]
// node server/visual-plan-validator.mjs --input snapshot.json [--review review.json]
import fs from "node:fs";
import {pathToFileURL} from "node:url";
import {verifyMeasuredWordCues,compareBeatsToCues} from "./visual-word-alignment.mjs";

export const RUBRIC={relevance:25,pacing:25,flow:20,variety:10,readability:10,payoff:10};
export const MIN_ANIMATION_DURATION_SECONDS=3;
const canon=s=>String(s??"").toLowerCase().replace(/[^a-z0-9]/g,"");
const norm=s=>String(s??"").replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g," ").trim();
const words=s=>norm(s).split(" ").filter(Boolean);
const isClip=s=>/^VV-LF-\d{3,}$/i.test(s),isAnim=s=>/^VA-LF-\d{3,}$/i.test(s),isCard=s=>/^VC-LF-\d{3,}$/i.test(s);
const RETIRED_VISUALS=new Set(["VC-LF-016"]);
const continuous=new Set(["VA-LF-004","VA-LF-008","VA-LF-009","VA-LF-010","VA-LF-011","VA-LF-012","VA-LF-013"]);
function buildCatalog(tabs,err){
  const map=new Map();
  for(const name of ["Cards","Animations","Clips"]){
    const rows=tabs?.[name]||[],h=(rows[0]||[]).map(canon),at=k=>h.indexOf(canon(k));
    const v=(r,k)=>at(k)<0?"":r[at(k)];
    const key=name==="Cards"?"Card_id":name==="Animations"?"Anim_id":"Visual_id";
    const maxKey=name==="Cards"?"MAX_duration_sec":name==="Animations"?"Max_duration":"Max_duration_sec";
    for(const [i,r] of rows.entries()){
      if(i===0||!r?.length)continue;
      const id=norm(v(r,key));if(!id)continue;
      if(RETIRED_VISUALS.has(id)){err("catalog.retired_asset",0,0,id,"Permanently retired asset cannot be listed");continue;}
      if(map.has(id))err("catalog.duplicate",0,0,id,"Duplicate Visual ID");
      const limit=Number(v(r,maxKey)||v(r,name==="Animations"?"Default_duration":"Duration_sec"));
      if(!Number.isFinite(limit)||limit<=0)err("catalog.cap",0,0,id,"No valid maximum duration");
      map.set(id,{id,kind:name,status:norm(v(r,"Status")),max:limit,
        slots:String(v(r,"Slots")||"").split(",").map(x=>x.trim().replace(/\?$/,"")).filter(Boolean),
        fileId:norm(v(r,"File_ID")),fileName:norm(v(r,"Clip_name")),useLimit:norm(v(r,"Usage_limit")),
        evidence:norm(v(r,"Evidence_limitations"))});
    }
  }
  return map;
}
function jsonValues(raw,err,ch,b,id){
  try{const o=typeof raw==="string"?JSON.parse(raw||"{}"):(raw||{});
    if(!o||Array.isArray(o)||typeof o!=="object")throw Error("values must be JSON object");return o;
  }catch(e){err("beat.json",ch,b,id,String(e.message||e));return {}}
}
function warnSemantics(id,p,s,ch,b,warn) {
  const n=String(s||"").toLowerCase();
  if(id==="VA-LF-010"&&p.cooling===false&&/\bcold\b|\bwinter\b/.test(n)&&!/\bheat\b|\bhot\b/.test(n))
    warn("visual.hot_vs_cold",ch,b,id,"Heat propagation render under cold-weather narrative; visual review needed");
  if(id==="VA-LF-012"&&/\bstudy\b|\bfleet\b|\bgeotab\b|\brecurrent\b|\bowner decision\b/.test(n))
    warn("visual.bms_context",ch,b,id,"Fixed BMS SENSOR→ESTIMATE→DECIDE→ACT meaning could misrepresent research/owners");
}
export function auditVisualPlan(data) {
  const errors=[],warnings=[],chapters=[];
  const err=(code,chapter,beat,id,message)=>errors.push({code,chapter,beat,id,message});
  const warn=(code,chapter,beat,id,message)=>warnings.push({code,chapter,beat,id,message});
  const assets=buildCatalog(data.catalog||{},err);
  const chapterRows=(data.chapters||[]).slice(1).filter(r=>norm(r?.[0]));
  const planRows=(data.visualPlan||[]).slice(1).filter(r=>norm(r?.[0]));
  const uses=new Map(),total=planRows.length;
  if(chapterRows.length<5||chapterRows.length>7)err("video.chapters",0,0,null,"Expected 5–7 chapters, found "+chapterRows.length);
  for(const ch of chapterRows) {
    const n=Number(ch[0]),title=String(ch[1]||""),audio=Number(ch[4]),src=ch[2]||"";
    const rows=planRows.filter(r=>Number(r[0])===n).sort((a,b)=>Number(a[1])-Number(b[1]));
    let frame=0,clipCount=0,animCount=0,seq=[];
    if(!rows.length)err("chapter.empty",n,0,null,"No visual beats");
    if(!Number.isFinite(audio)||audio<=0)err("chapter.audio",n,0,null,"Measured audio duration missing");
    for(let i=0;i<rows.length;i++){
      const r=rows[i],b=Number(r[1]),id=norm(r[2]),a=assets.get(id),sec=Number(r[4]),f=Math.round(sec*30);
      if(RETIRED_VISUALS.has(id))err("beat.retired_asset",n,b,id,"Permanently retired AX card is prohibited");
      if(b!==i+1)err("beat.order",n,b,id,"Beats must be sequential from 1");
      if(!a)err("beat.unknown_asset",n,b,id,"ID not in live catalog");
      else if(a.status.toLowerCase()!=="ready")err("beat.not_ready",n,b,id,"Catalog asset is not Ready");
      if(!Number.isFinite(sec)||sec<=0||f<1){err("beat.duration",n,b,id,"Duration invalid");continue}
      if(Math.abs(sec-f/30)>0.00001)err("beat.frames",n,b,id,"Duration not quantized to 30fps");
      if(a?.max&&f>Math.floor(a.max*30+1e-6))err("beat.cap",n,b,id,"Beat "+f+" frames exceeds catalog max "+a.max+"s");
      if(norm(r[5])!=="Ready")err("beat.status",n,b,id,"Saved beat must be Ready before promotion (found "+norm(r[5])+")");
      const p=jsonValues(r[3],err,n,b,id);
      if(a?.slots?.length && (isCard(id)||isAnim(id))) {
        const valid=new Set([...a.slots,"backgroundFileId","backgroundOpacity"]);
        for(const k of Object.keys(p))if(!valid.has(k))err("beat.slot",n,b,id,"Unsupported key "+k);
      }
      if(isCard(id)&&sec>3.000001)err("beat.static",n,b,id,"Static card likely >3s (requires verified continuous movement)");
      if(isAnim(id)){
        animCount++;
        if(f<MIN_ANIMATION_DURATION_SECONDS*30)err("beat.animation_min",n,b,id,"Animation must last at least "+MIN_ANIMATION_DURATION_SECONDS+"s (90 frames at 30fps); found "+f+" frames");
        if(!continuous.has(id)&&sec>3)warn("motion.unverified",n,b,id,"Meaningful movement across full "+sec+"s unverified");
      }
      if(isClip(id)){
        clipCount++;
        if(!a?.fileId||norm(p.file_id||p.fileId)!==a.fileId)err("clip.file_id",n,b,id,"Missing/different live catalog Drive File_ID");
        if(a?.fileName&&norm(p.clip_name)!==a.fileName)err("clip.name",n,b,id,"Clip filename does not match catalog");
        if(a?.max&&p.max_duration_sec!=null&&Number(p.max_duration_sec)>a.max+1e-5)err("clip.override",n,b,id,"Provided cap larger than catalog");
        warn("clip.unprobed",n,b,id,"Actual MP4 motion and playable duration not independently probed");
      }
      if(i===0&&id!=="VC-LF-018")err("chapter.title_missing",n,b,id,"First beat not title card");
      if(id==="VC-LF-018"){
        if(i!==0)err("chapter.extra_title",n,b,id,"Title card occurs after beat 1");
        if(f!==60)err("chapter.title_frames",n,b,id,"Must equal exactly 60 frames");
        if(String(p.TITLE||"")!==title||Number(p.CHAPTER_NUM)!==n)err("chapter.title_props",n,b,id,"Title and chapter number must exactly match Chapters tab");
      }
      warnSemantics(id,p,r[6],n,b,warn);
      uses.set(id,(uses.get(id)||0)+1);
      seq.push({beat:b,id,from:frame,to:frame+f,track:isClip(id)?"clip":isAnim(id)?"anim":"card"});
      frame+=f;
    }
    const audioFrames=Math.round(audio*30);
    if(Math.abs(frame-audioFrames)>1)err("chapter.audio_visual_frames",n,0,null,"Visual "+frame+"f / audio "+audioFrames+"f");
    const narr=words(src),covered=words(rows.map(r=>r[6]||"").join(" "));
    if(narr.join("\x1f")!==covered.join("\x1f"))err("chapter.narration",n,0,null,"Narration fragments differ from original text (source "+narr.length+" words, plan "+covered.length+" words)");
    if(clipCount!==2)err("chapter.two_clips",n,0,null,"Exactly 2 footage clips required; got "+clipCount);
    if(animCount<1)err("chapter.animation",n,0,null,"At least 1 mechanism animation required");
    const legal=seq.slice(0,-1).map(s=>s.to).filter(t=>t>=240&&frame-t>=240&&t<=1650&&frame-t<=1650)
      .filter(t=>seq.filter(s=>s.track==="clip"&&s.from<t).length===1 && seq.filter(s=>s.track==="clip"&&s.from>=t).length===1);
    legal.sort((x,y)=>Math.abs(x-frame/2)-Math.abs(y-frame/2)||x-y);
    if(!legal.length)err("chapter.split",n,0,null,"No legal two-part beat boundary with one footage clip in each <=55s part");
    chapters.push({number:n,title,beats:rows.length,clips:clipCount,animations:animCount,visualFrames:frame,audioFrames,wordCount:narr.length,splitFrame:legal[0]??null});
  }
  for(const [id,num]of uses){
    const a=assets.get(id);
    if(/^\d+\/video$/i.test(a?.useLimit||"") && num>Number(a.useLimit.split("/")[0]))err("asset.use_limit",0,0,id,"Used "+num+"x despite "+a.useLimit);
    if(id==="VA-LF-004"&&num>=8)warn("editor.repetition",0,0,id,"Generic 3-node process template used "+num+" times");
  }
  warn("alignment.unverified",0,0,null,"Word-by-word audio alignment is NOT verified without measured audio word timestamps");
  return {technicalPass:errors.length===0,qualityScore:null,qualityNote:"Must receive evidence-backed independent YouTube visual editorial review",
    errorCount:errors.length,warningCount:warnings.length,totalBeats:total,chapters,errors,warnings,uses:Object.fromEntries(uses)};
}
export function validateEditorialReview(review,audit) {
  const failures=[];let sum=0;
  for(const [k,max]of Object.entries(RUBRIC)){
    const x=review?.categories?.[k],s=x?.score;
    if(!Number.isInteger(s)||s<0||s>max)failures.push(k+" must score 0.."+max);
    else sum+=s;
    if(!Array.isArray(x?.evidence)||!x.evidence.length||!x.evidence.every(e=>typeof e==="string"&&e.trim().length>=12))
      failures.push(k+" needs evidence tied to actual beats");
  }
  if(review?.editorWouldKeepWatching!==true)failures.push("Independent editorial suitability not affirmed");
  if(audit?.technicalPass!==true)failures.push("Technical hard rules not passed");
  if(sum<95)failures.push("Visual-only score "+sum+"/100 below 95");
  return {approved:failures.length===0,score:sum,threshold:95,failures};
}
async function live(visual,catalog){
  const {GoogleAuth}=await import("google-auth-library");
  const client=await new GoogleAuth({scopes:["https://www.googleapis.com/auth/spreadsheets.readonly"]}).getClient();
  const get=async(id,range)=>(await client.request({url:"https://sheets.googleapis.com/v4/spreadsheets/"+encodeURIComponent(id)+"/values/"+encodeURIComponent(range)+"?valueRenderOption=UNFORMATTED_VALUE"})).data.values||[];
  const [chapters,visualPlan,Cards,Animations,Clips]=await Promise.all([
    get(visual,"Chapters!A1:P120"),get(visual,"Visual_Plan!A1:G1200"),
    get(catalog,"Cards!A1:M200"),get(catalog,"Animations!A1:I200"),get(catalog,"Clips!A1:M400")]);
  return {chapters,visualPlan,catalog:{Cards,Animations,Clips}};
}
async function main() {
  const args=process.argv.slice(2);
  const data=args[0]==="--input"?JSON.parse(fs.readFileSync(args[1],"utf8")):args[0]==="--live"?await live(
    args[1]||"1-soN3grzRjvGPWJsT8UCg8Hq0O7kOWa6_PSAVlqRn3c",
    args[2]||"1n_BoKTFc1EUIVjNPU5hRhGo2FJ3uZfVqoTf2CPjhf78"):
    (()=>{throw Error("Usage: --live [video_sheet_id] [catalog_sheet_id] OR --input snapshot.json [--review review.json]")})();
  const audit=auditVisualPlan(data);
  const ai=args.indexOf("--alignment");
  if(ai>=0){
    const sidecar=JSON.parse(fs.readFileSync(args[ai+1],"utf8"));
    audit.measuredAlignment=[];
    for(const ch of data.chapters.slice(1).filter(r=>r?.[0])){
      const n=String(ch[0]),entry=sidecar.chapters?.[n];
      if(!entry){audit.measuredAlignment.push({chapter:n,verified:false,reason:"No real word timestamps available"});continue;}
      const verified=verifyMeasuredWordCues({chapterNumber:Number(n),narration:ch[2],audioDurationSec:Number(ch[4]),sourceAudioId:ch[3],method:entry.method,cues:entry.cues});
      if(!verified.valid){audit.measuredAlignment.push(verified);continue;}
      const rows=data.visualPlan.slice(1).filter(r=>String(r?.[0])===n).sort((a,b)=>Number(a[1])-Number(b[1]));
      try{audit.measuredAlignment.push({chapter:n,verified:true,...compareBeatsToCues(rows,entry.cues)});}
      catch(e){audit.measuredAlignment.push({chapter:n,verified:false,reason:String(e.message||e)});}
    }
  }
  const ix=args.indexOf("--review");
  if(ix>=0)audit.review=validateEditorialReview(JSON.parse(fs.readFileSync(args[ix+1],"utf8")),audit);
  console.log(JSON.stringify(audit,null,2));
  if(!audit.technicalPass || (audit.review&&!audit.review.approved))process.exitCode=2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e);process.exitCode=1;});
