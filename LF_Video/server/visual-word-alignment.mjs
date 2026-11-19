// Optional measured word-time alignment contract. Never manufactures speech timestamps.
// Word cues must come from a real authorized ASR/forced-aligner pass over original MP3.
const normalized=s=>String(s??"").normalize("NFKC").toLowerCase().replace(/[’‘]/g,"'")
  .replace(/[^a-z0-9']+/g," ").trim().split(/\s+/).filter(Boolean);
export function verifyMeasuredWordCues({chapterNumber,narration,audioDurationSec,cues,method,sourceAudioId}) {
  const errors=[],expected=normalized(narration);
  if(!Array.isArray(cues)||!cues.length)errors.push("Missing actual measured word cues");
  if(!method||/estimate|word.?count|guess|approx/i.test(method))errors.push("Need identified real transcription/alignment method");
  if(!sourceAudioId)errors.push("Source MP3 Drive File_ID is required");
  if(!(Number(audioDurationSec)>0))errors.push("Measured MP3 duration required");
  const flattened=[];
  let previous=0;
  for(const [i,c] of (cues||[]).entries()){
    const s=Number(c.start),e=Number(c.end),words=normalized(c.word);
    if(!Number.isFinite(s)||!Number.isFinite(e)||s<0||e<=s||s<previous-0.00001||e>Number(audioDurationSec)+0.05)
      errors.push("Cue "+(i+1)+" has impossible/nonmonotonic timing");
    if(words.length!==1)errors.push("Cue "+(i+1)+" must contain exactly one spoken word");
    flattened.push(...words);previous=e;
  }
  if(flattened.join("|")!==expected.join("|"))errors.push("Word-cue content does not match approved chapter narration in order");
  return {valid:errors.length===0,chapterNumber,method,sourceAudioId,wordCount:expected.length,errors};
}
export function compareBeatsToCues(beatRows,cues,fps=30) {
  if(!Array.isArray(cues)||!cues.length)throw Error("Actual measured word cues required");
  const results=[];let offset=0,cursorFrame=0;
  for(const [i,b] of beatRows.entries()){
    const sentence=normalized(b[6]||"");
    const matching=cues.slice(offset,offset+sentence.length);
    if(sentence.length<1||matching.length!==sentence.length||
       matching.flatMap(c=>normalized(c.word)).join("|")!==sentence.join("|"))
      throw Error("Beat "+(i+1)+" does not align with measured word stream");
    const plannedStartFrame=cursorFrame,plannedEndFrame=cursorFrame+Math.round(Number(b[4])*fps);
    results.push({beat:Number(b[1]),plannedStartFrame,plannedEndFrame,
      measuredFirstWordFrame:Math.round(Number(matching[0].start)*fps),
      measuredLastWordEndFrame:Math.round(Number(matching.at(-1).end)*fps),
      entryDriftFrames:plannedStartFrame-Math.round(Number(matching[0].start)*fps),
      exitDriftFrames:plannedEndFrame-Math.round(Number(matching.at(-1).end)*fps)});
    cursorFrame=plannedEndFrame;offset+=sentence.length;
  }
  if(offset!==cues.length)throw Error("Not all recorded narration cues consumed");
  const worst=Math.max(0,...results.flatMap(r=>[Math.abs(r.entryDriftFrames),Math.abs(r.exitDriftFrames)]));
  return {measured:true,source:"provided verified MP3 word cues",maxAbsDriftFrames:worst,maxAbsDriftSec:worst/fps,
    within075Seconds:worst<=Math.floor(0.75*fps),beats:results};
}
