// Measured sentence timing context for the LF Visual Agent, based on the
// saved ElevenLabs word-time sidecar (not word-count estimations).
import {createHash} from "node:crypto";
import {validateSidecar} from "./subtitles.mjs";
const hash=s=>createHash("sha256").update(String(s||"").replace(/\s+/g," ").trim()).digest("hex");
export function makeVisualTimingContext({sidecar,video_id,chapter,narration}){
  const n=Number(chapter);
  if(!Number.isInteger(n)||n<1)throw Error("Visual timing requires integer chapter");
  const words=validateSidecar(sidecar,video_id,n);
  if(narration!==undefined && hash(narration)!==sidecar.narration_sha256)
    throw Error("Visual timing sidecar does not match approved narration");
  const sentences=[];
  let group=[];
  function push(){
    if(!group.length)return;
    const text=group.map(x=>x.text).join(" ").trim();
    sentences.push({sentence:sentences.length+1,start_seconds:Math.round(group[0].start*1000)/1000,
      end_seconds:Math.round(group.at(-1).end*1000)/1000,text});
    group=[];
  }
  for(const word of words){
    if(group.length && (word.start-group.at(-1).end>0.8 ||
      word.end-group[0].start>13.5))push();
    group.push(word);
    if(/[.!?]["'”’)]?$/.test(word.text))push();
  }
  push();
  return {video_id,chapter:n,source:"measured_elevenlabs_word_timings",
    audio_file_id:sidecar.audio_file_id||"",
    audio_duration_seconds:sidecar.audio_duration_seconds??sidecar.duration_seconds,
    measured_word_count:words.length,sentence_cues:sentences,
    rules:"All times are chapter-local seconds from the beginning of its complete narration MP3. Do not estimate words-per-second. Build beats within these measured sentence spans. Keep exact chapter duration and P1/P2 renderer split policy."};
}
