// LF measured narration subtitles. Never estimate timestamps from word counts.
import { createHash } from "node:crypto";

const hash = s => createHash("sha256").update(String(s)).digest("hex");
const validNum = n => typeof n === "number" && Number.isFinite(n);
const timecode = seconds => {
  const ms = Math.max(0,Math.round(seconds*1000));
  const p = (n,w=2)=>String(n).padStart(w,"0");
  return [p(Math.floor(ms/3600000)),p(Math.floor(ms/60000)%60),p(Math.floor(ms/1000)%60)].join(":")+","+p(ms%1000,3);
};
export function wordsFromElevenLabs(tts) {
  if(!tts || typeof tts !== "object") throw Error("ElevenLabs response JSON missing");
  const picks = [tts.normalized_alignment,tts.alignment].filter(Boolean);
  for(const a of picks){
    const chars=a.characters,start=a.character_start_times_seconds,end=a.character_end_times_seconds;
    if(!Array.isArray(chars)||!Array.isArray(start)||!Array.isArray(end)||
       !chars.length||chars.length>100000||start.length!==chars.length||end.length!==chars.length)continue;
    const words=[];let buffer="",begin=null,lastEnd=0;let valid=true;
    const flush=()=>{if(buffer.trim()) words.push({text:buffer.trim(),start:begin,end:lastEnd});buffer="";begin=null;};
    for(let i=0;i<chars.length;i++){
      const ch=chars[i],s=Number(start[i]),e=Number(end[i]);
      if(typeof ch!=="string"||!Number.isFinite(s)||!Number.isFinite(e)||s<0||e<s||
         e>36000||(i>0 && s < Number(start[i-1])-0.03)){valid=false;break;}
      if(/\s/u.test(ch)){flush();continue;}
      if(begin===null)begin=s;
      buffer+=ch;lastEnd=e;
    }
    flush();
    if(valid&&words.length&&words.every(w=>validNum(w.start)&&validNum(w.end)&&w.end>w.start))
      return {words,method:a===tts.normalized_alignment?"elevenlabs_normalized_char_timing":"elevenlabs_char_timing"};
  }
  throw Error("ElevenLabs character alignment missing or invalid; cannot create timed subtitles");
}
export function prepareChapterSidecar({video_id,chapter,narration,tts,audio_file_id=""}) {
  const n=Number(chapter);
  if(!Number.isInteger(n)||n<1||n>50)throw Error("Subtitle chapter must be an integer 1..50");
  const {words,method}=wordsFromElevenLabs(tts);
  const out={schema:"ax.lf.word-timing.v1",video_id:String(video_id||"").trim(),
    chapter:n,method,audio_file_id:String(audio_file_id||"").trim(),
    narration_sha256:hash(narration||""),duration_seconds:words.at(-1).end,words};
  if(!/^AX-LF-[0-9A-Za-z_-]+$/i.test(out.video_id))throw Error("Invalid LF video ID");
  return out;
}
export function validateSidecar(sidecar,videoId,chapter) {
  if(sidecar?.schema!=="ax.lf.word-timing.v1"||sidecar.video_id!==videoId||
     sidecar.chapter!==chapter||!Array.isArray(sidecar.words)||!sidecar.words.length)
    throw Error("Missing, mismatched or invalid measured word-timing sidecar for chapter "+chapter);
  let prevStart=-1;
  for(const w of sidecar.words){
    if(typeof w.text!=="string"||!w.text.trim()||!validNum(w.start)||!validNum(w.end)||
       w.start<0||w.end<=w.start||w.start<prevStart-0.001) throw Error("Invalid word timing in chapter "+chapter);
    prevStart=w.start;
  }
  return sidecar.words;
}
const wrappedText = words => {
  const lines=[""];let current=0;
  for(const word of words) {
    const candidate=lines[current]?lines[current]+" "+word:word;
    if(candidate.length>42 && lines[current] && current===0){lines.push(word);current=1;}
    else lines[current]=candidate;
  }
  return lines.join("\n");
};
export function captionsForChapter(words,{offset=0,maxDuration=Infinity}={}) {
  const result=[];let group=[];
  const push=()=>{
    if(!group.length)return;
    const start=offset+group[0].start;
    const end=offset+Math.min(maxDuration,group.at(-1).end);
    if(end<=start)throw Error("Subtitle ends after chapter video segment");
    result.push({start,end,text:wrappedText(group.map(w=>w.text))});
    group=[];
  };
  for(const word of words){
    if(word.start>maxDuration+0.8)throw Error("Subtitle word timestamp beyond chapter video duration");
    if(group.length && (word.start-group.at(-1).end>0.58 ||
        word.end-group[0].start>4.1 || group.length>=10 ||
        group.reduce((n,w)=>n+w.text.length+1,0)+word.text.length>82))push();
    group.push(word);
    if(/[.!?]["'”’)]?$/u.test(word.text) && group.length>=3)push();
  }
  push();return result;
}
export function buildFinalSrt({video_id,parts,sidecars,thumbnail_intro_seconds=0}){
  if(!Array.isArray(parts)||!parts.length)throw Error("No assembly parts for SRT");
  const ordered=[...parts].sort((a,b)=>a.chapter-b.chapter);
  const chapters=new Map();let elapsed=Number(thumbnail_intro_seconds)||0;
  for(const part of ordered){
    const chapter=Math.floor(part.chapter);
    const duration=Number(part.duration);
    if(!Number.isFinite(duration)||duration<=0)throw Error("Part duration missing for subtitles");
    if(!chapters.has(chapter))chapters.set(chapter,{offset:elapsed,duration:0});
    chapters.get(chapter).duration+=duration;
    elapsed+=duration;
  }
  const captions=[];
  for(const [chapter,v] of chapters){
    const words=validateSidecar(sidecars.get(chapter),video_id,chapter);
    if(words.at(-1).end>v.duration+0.8)throw Error("Narration exceeds rendered duration in chapter "+chapter);
    captions.push(...captionsForChapter(words,{offset:v.offset,maxDuration:v.duration}));
  }
  captions.sort((a,b)=>a.start-b.start);
  const lines=captions.map((c,i)=>String(i+1)+"\n"+timecode(c.start)+" --> "+timecode(c.end)+"\n"+c.text);
  return {text:lines.join("\n\n")+"\n",caption_count:captions.length,chapter_count:chapters.size};
}
