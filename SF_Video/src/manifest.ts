import { z } from "zod";

/**
 * The VideoManifest IS the finished video (full assembly in one pass):
 *   intro thumbnail still  ->  card beats + narration  ->  end clip (own audio)
 * Frames, not seconds, so everything is exact and audio-locked.
 */
export const timelineItemSchema = z.object({
  beat: z.number(),
  component: z.string().optional().default(""), // card id (for track "card")
  props: z.record(z.any()).default({}),
  src: z.string().optional(),                    // for track "image" / "clip"
  startFrame: z.number(),
  durationFrames: z.number(),
  track: z.enum(["card", "clip", "anim", "image"]).default("card"),
});
export type TimelineItem = z.infer<typeof timelineItemSchema>;

export const audioTrackSchema = z.object({
  chapter: z.number(),
  src: z.string(),
  startFrame: z.number(),
  durationFrames: z.number(),
});

export const captionSchema = z.object({
  word: z.string(),
  startFrame: z.number(),
  endFrame: z.number(),
});
export type Caption = z.infer<typeof captionSchema>;

export const videoManifestSchema = z.object({
  video_id: z.string(),
  fps: z.number().default(30),
  width: z.number().default(1080),
  height: z.number().default(1920),
  audio: z.array(audioTrackSchema).default([]),
  captions: z.array(captionSchema).default([]),
  timeline: z.array(timelineItemSchema),
});
export type VideoManifest = z.infer<typeof videoManifestSchema>;

export function totalFrames(m: VideoManifest): number {
  const ends = [
    1,
    ...m.timeline.map((i) => i.startFrame + i.durationFrames),
    ...m.audio.map((a) => a.startFrame + a.durationFrames),
  ];
  return Math.max(...ends);
}
