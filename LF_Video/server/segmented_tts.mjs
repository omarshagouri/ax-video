// Segmented long-form ElevenLabs generation. The final chapter MP3 is encoded once,
// and all measured character timestamps are shifted by decoded segment durations.
// Never synthesize or estimate word timings from length or word count.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { prepareChapterSidecar } from "./subtitles.mjs";

const MAX_CHUNK = 700;
const PREFERRED_CHUNK = 570;
const SAFE_MIN = 320;
const MAX_CHAPTER_CHARS = 12000;
const VOICE = "RwGCfIzuc2tIJySQj0fD";
const failed = (s,detail="") => new Error(s + (detail ? ": " + String(detail).slice(0,450) : ""));
const cleanText = s => String(s || "").replace(/\s+/g," ").trim();

export function splitNarration(text,{maxChars=MAX_CHUNK}={}) {
  const source=cleanText(text);
  if(!source || source.length>MAX_CHAPTER_CHARS) throw failed("Narration missing or exceeds maximum safe chapter length");
  if(maxChars<350 || maxChars>700) throw failed("Segment maximum must be between 350 and 700");
  const chunks=[];
  let rest=source;
  while(rest.length>maxChars) {
    const limit=Math.min(maxChars,rest.length-1);
    const boundaries=[];
    for(let i=SAFE_MIN;i<=limit;i++) {
      if(rest[i]!==" ")continue;
      const preceding=rest[i-1];
      // Prefer natural sentence boundaries, then clauses, then whitespace.
      let score=Math.abs(i-PREFERRED_CHUNK);
      if(/[.!?]["'”’)]?$/.test(rest.slice(Math.max(0,i-3),i))) score-=300;
      else if(/[,;:—–]$/.test(preceding))score-=120;
      boundaries.push({i,score});
    }
    if(!boundaries.length) throw failed("Narration contains a word longer than the segment limit");
    boundaries.sort((a,b)=>a.score-b.score || b.i-a.i);
    let cut=boundaries[0].i;
    // Keep the last segment reasonably sized by redistributing if necessary.
    const tail=rest.length-cut-1;
    if(tail<SAFE_MIN && rest.length<=2*maxChars) {
      const alternate=boundaries.filter(x=>rest.length-x.i-1>=SAFE_MIN)
        .sort((a,b)=>a.score-b.score)[0];
      if(alternate)cut=alternate.i;
    }
    chunks.push(rest.slice(0,cut).trim());
    rest=rest.slice(cut+1).trim();
    if(chunks.length>30)throw failed("Too many synthesis segments");
  }
  if(rest)chunks.push(rest);
  if(chunks.join(" ")!==source)throw failed("Segmented narration no longer equals approved narration");
  if(chunks.some(x=>!x || x.length>maxChars))throw failed("Invalid narration segment");
  return chunks;
}

export function mergeElevenLabsAlignments(results,durations) {
  if(results.length!==durations.length||!results.length)throw failed("Segment alignment input mismatch");
  const merged={};
  for(const name of ["alignment","normalized_alignment"]){
    if(name==="normalized_alignment" && !results.every(r=>r?.[name])) continue;
    const chars=[],starts=[],ends=[];
    let offset=0;
    for(let index=0;index<results.length;index++){
      const a=results[index]?.[name];
      if(!a || !Array.isArray(a.characters) ||
          !Array.isArray(a.character_start_times_seconds) ||
          !Array.isArray(a.character_end_times_seconds) ||
          a.characters.length!==a.character_start_times_seconds.length ||
          a.characters.length!==a.character_end_times_seconds.length ||
          a.characters.length===0)
        throw failed("ElevenLabs did not return measurable character alignment",name+" segment "+(index+1));
      let previous=-1;
      for(let j=0;j<a.characters.length;j++){
        const st=Number(a.character_start_times_seconds[j]);
        const en=Number(a.character_end_times_seconds[j]);
        if(!Number.isFinite(st)||!Number.isFinite(en)||st<0||en<st||st<previous-0.03||
           en>durations[index]+0.35)
          throw failed("Impossible ElevenLabs character timing",name+" segment "+(index+1));
        chars.push(a.characters[j]);starts.push(st+offset);ends.push(en+offset);
        previous=st;
      }
      if(!Number.isFinite(durations[index])||durations[index]<=0) throw failed("Invalid measured segment duration");
      offset+=durations[index];
    }
    merged[name]={characters:chars,character_start_times_seconds:starts,character_end_times_seconds:ends};
  }
  return merged;
}

function exec(bin,args) {
  const p=spawnSync(bin,args,{encoding:"utf8",maxBuffer:2*1024*1024,timeout:120000});
  if(p.status!==0)throw failed(bin+" failed",p.stderr||p.stdout||p.error?.message);
  return p.stdout.trim();
}
function decodedWav(mp3Path,wavPath){
  exec("ffmpeg",["-nostdin","-v","error","-y","-i",mp3Path,"-vn","-ac","1","-ar","44100","-c:a","pcm_s16le",wavPath]);
  const s=Number(exec("ffprobe",["-v","error","-show_entries","format=duration","-of",
    "default=noprint_wrappers=1:nokey=1",wavPath]));
  if(!Number.isFinite(s)||s<=0)throw failed("Decoded audio segment duration invalid");
  return s;
}
const sleep = ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function synthesize({text,previous_text,next_text,voice_id,model_id,voice_settings,apiKey}) {
  let lastError="";
  for(let attempt=0;attempt<3;attempt++){
    let response;
    try {
      response=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+encodeURIComponent(voice_id)+"/with-timestamps",{
        method:"POST",
        headers:{"xi-api-key":apiKey,"content-type":"application/json","accept":"application/json"},
        body:JSON.stringify({text,model_id,voice_settings,
          ...(previous_text?{previous_text}:{ } ),
          ...(next_text?{next_text}:{} )}),
        signal:AbortSignal.timeout(110000)
      });
    }catch(e){lastError=String(e?.message||e);if(attempt===2)break;await sleep(1200*(attempt+1));continue;}
    if(response.ok){
      const data=await response.json();
      if(!data?.audio_base64||!data?.alignment)throw failed("ElevenLabs response omitted audio or measured timings");
      return data;
    }
    const err=await response.text();
    lastError="HTTP "+response.status+" "+err.slice(0,300);
    if(![429,500,502,503,504].includes(response.status)) break;
    await sleep(1800*(attempt+1));
  }
  throw failed("ElevenLabs segment generation failed",lastError);
}

export async function generateSegmentedChapter({text,video_id,chapter,voice_id=VOICE,
  model_id="eleven_multilingual_v2",voice_settings={
    stability:0.4,similarity_boost:0.75,style:0.25,use_speaker_boost:true,speed:0.85
  },apiKey}) {
  if(typeof apiKey!=="string"||!apiKey.trim())throw failed("Missing ElevenLabs API authentication");
  if(!/^[a-zA-Z0-9]{10,64}$/.test(String(voice_id))) throw failed("Invalid voice_id");
  const chunks=splitNarration(text);
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"axlf-tts-"));
  try {
    const results=[],wavFiles=[],durations=[];
    for(let i=0;i<chunks.length;i++){
      const r=await synthesize({text:chunks[i],
        previous_text:i?chunks[i-1].slice(-500):undefined,
        next_text:i+1<chunks.length?chunks[i+1].slice(0,500):undefined,
        voice_id,model_id,voice_settings,apiKey});
      const mp3=path.join(tmp,"part"+i+".mp3"),wav=path.join(tmp,"part"+i+".wav");
      const buf=Buffer.from(r.audio_base64,"base64");
      if(!buf.length||buf.length>15*1024*1024)throw failed("Empty or oversize ElevenLabs MP3 segment");
      fs.writeFileSync(mp3,buf);
      durations.push(decodedWav(mp3,wav));
      results.push(r);wavFiles.push(wav);
    }
    // WAVs are decoded first so MP3 encoder padding is not repeated at seams.
    const list=path.join(tmp,"inputs.txt");
    fs.writeFileSync(list,wavFiles.map(f=>"file '"+f.replace(/'/g,"'\\''")+"'").join("\n"));
    const out=path.join(tmp,"chapter.mp3");
    exec("ffmpeg",["-nostdin","-v","error","-y","-f","concat","-safe","0","-i",list,
      "-ar","44100","-ac","1","-c:a","libmp3lame","-b:a","128k",out]);
    const finalSec=Number(exec("ffprobe",["-v","error","-show_entries","format=duration",
      "-of","default=noprint_wrappers=1:nokey=1",out]));
    if(!Number.isFinite(finalSec)||finalSec<=0)throw failed("Final joined chapter duration invalid");
    const audio_base64=fs.readFileSync(out).toString("base64");
    const merged=mergeElevenLabsAlignments(results,durations);
    const sidecar=prepareChapterSidecar({video_id,chapter,narration:cleanText(text),tts:merged});
    // Store exact per-segment boundary as metadata for future Visual Agent timing.
    sidecar.audio_duration_seconds=finalSec;
    sidecar.segments=chunks.map((part,i)=>({index:i+1,text_length:part.length,
      start_seconds:durations.slice(0,i).reduce((a,b)=>a+b,0),
      duration_seconds:durations[i]}));
    const filename=String(video_id).replace(/[^A-Za-z0-9_-]/g,"")+
      "_CH"+String(chapter).padStart(2,"0")+"_WordTimings.json";
    return {status:"ok",audio_base64,duration_seconds:finalSec,
      word_timings_base64:Buffer.from(JSON.stringify(sidecar),"utf8").toString("base64"),
      word_timings_filename:filename,segment_count:chunks.length,
      segment_character_counts:chunks.map(x=>x.length),
      measured_word_count:sidecar.words.length};
  }finally{
    fs.rmSync(tmp,{recursive:true,force:true});
  }
}
