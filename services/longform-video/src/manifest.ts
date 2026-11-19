import { z } from "zod";

export const timelineItemSchema = z.object({
  beat: z.number(),
  component: z.string().optional().default(""),
  props: z.record(z.any()).default({}),
  src: z.string().optional(),
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
  startFrom: z.number().int().nonnegative().optional(),
});

export const videoManifestSchema = z.object({
  video_id: z.string(),
  fps: z.number().default(30),
  width: z.number().default(1920),
  height: z.number().default(1080),
  audio: z.array(audioTrackSchema).default([]),
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
