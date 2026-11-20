// Two independently rendered MP4s for one coherent narrative chapter.
// Each audio-enabled part plays only its original narration segment; no join in Renderer 5.
export const PAIRED_FPS = 30;
export const MAX_PART_FRAMES = 55 * PAIRED_FPS;
export function chooseSplitFrame(timeline, {maxPartFrames=MAX_PART_FRAMES, minPartFrames=8*PAIRED_FPS,requireClipPerPart=false}={}) {
  if (!Array.isArray(timeline) || timeline.length<2) throw new Error("paired chapter needs at least two visual beats");
  let previousEnd=0;
  for(const x of timeline) {
    if(!Number.isInteger(x.startFrame)||!Number.isInteger(x.durationFrames)||x.durationFrames<1||x.startFrame!==previousEnd) throw new Error("paired chapter timeline contains a gap, overlap or noninteger frame");
    previousEnd+=x.durationFrames;
  }
  const totalFrames=previousEnd;
  if(totalFrames>2*maxPartFrames) throw new Error("chapter exceeds two 55s parts; shorten coherent chapter");
  const legal=timeline.slice(0,-1).map(x=>x.startFrame+x.durationFrames).filter(x=>x>=minPartFrames&&totalFrames-x>=minPartFrames&&x<=maxPartFrames&&totalFrames-x<=maxPartFrames).filter(x=>!requireClipPerPart||(timeline.some(y=>y.track==='clip'&&y.startFrame<x)&&timeline.some(y=>y.track==='clip'&&y.startFrame>=x)));
  if(!legal.length)throw new Error("no legal split at a visual beat boundary");
  legal.sort((a,b)=>Math.abs(a-totalFrames/2)-Math.abs(b-totalFrames/2)||a-b);
  return {splitFrame:legal[0],totalFrames,part1Frames:legal[0],part2Frames:totalFrames-legal[0]};
}
export function makeSilentPartManifest(manifest,part,split=chooseSplitFrame(manifest.timeline)){
  if(part!==1&&part!==2)throw new Error("part must be exactly 1 or 2");
  if(manifest.fps!==PAIRED_FPS)throw new Error("paired chapter only supports 30 fps");
  if(!Array.isArray(manifest.audio)||manifest.audio.length!==1||manifest.audio[0].startFrame!==0)throw new Error("paired chapter requires one complete continuous narration audio track");
  const start=part===1?0:split.splitFrame,end=part===1?split.splitFrame:split.totalFrames;
  const timeline=manifest.timeline.filter(x=>x.startFrame>=start&&x.startFrame<end).map(x=>({...x,startFrame:x.startFrame-start}));
  if(!timeline.length||timeline[0].startFrame!==0||timeline.at(-1).startFrame+timeline.at(-1).durationFrames!==end-start)throw new Error("part partition lost timeline coverage");
  return {...manifest,video_id:manifest.video_id+"_P"+part,timeline,audio:[]};
}
// Preserve single-recorded narration without re-recording or duplicating words.
// startFrom is interpreted by Remotion Audio in composition frames.
export function makeAudioPartManifest(manifest, part, split=chooseSplitFrame(manifest.timeline)) {
  const silent = makeSilentPartManifest(manifest, part, split);
  const fromFrame = part===1 ? 0 : split.splitFrame;
  const durationFrames = part===1 ? split.part1Frames : split.part2Frames;
  const source = manifest.audio[0];
  if (source.durationFrames !== split.totalFrames) {
    throw new Error("paired audio/visual timeline must match exactly in frames");
  }
  return { ...silent, audio: [{...source, chapter:part, startFrame:0, durationFrames, startFrom:fromFrame}] };
}
export function validatePairedJoin({part1Frames,part2Frames,splitFrame,totalFrames,audioDurationSec,fps=PAIRED_FPS}){
  if(fps!==PAIRED_FPS||![part1Frames,part2Frames,splitFrame,totalFrames].every(Number.isInteger))throw new Error("invalid paired join frame metadata");
  if(part1Frames<1||part2Frames<1||part1Frames!==splitFrame||part1Frames+part2Frames!==totalFrames)throw new Error("part files do not match the expected single continuous chapter timeline");
  if(!Number.isFinite(audioDurationSec)||audioDurationSec<=0||Math.abs(audioDurationSec-totalFrames/fps)>0.25)throw new Error("audio and joined video differ by over 0.25s");
  return {duration_seconds:totalFrames/fps};
}
