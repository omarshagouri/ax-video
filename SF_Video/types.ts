import { z } from "zod";

export const lfToneSchema = z.enum(["teal", "heat", "cold", "white"]).default("teal");

const hookPropsSchema = z.object({
  eyebrow: z.string().optional(),
  lines: z.array(z.string()).min(1).max(3),
  footer: z.string().optional(),
});

const beatPropsSchema = z.object({
  kicker: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  tone: lfToneSchema.optional(),
});

const sideSchema = z.object({
  label: z.string(),
  value: z.string(),
  caption: z.string().optional(),
  tone: lfToneSchema.optional(),
});

const versusPropsSchema = z.object({
  title: z.string().optional(),
  left: sideSchema,
  right: sideSchema,
  source: z.string().optional(),
});

export const lfSceneSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("hook"),
    startFrame: z.number().int().nonnegative(),
    durationFrames: z.number().int().positive(),
    props: hookPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("beat"),
    startFrame: z.number().int().nonnegative(),
    durationFrames: z.number().int().positive(),
    props: beatPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("versus"),
    startFrame: z.number().int().nonnegative(),
    durationFrames: z.number().int().positive(),
    props: versusPropsSchema,
  }),
]);

export type LFScene = z.infer<typeof lfSceneSchema>;

export const lfChapterManifestSchema = z.object({
  video_id: z.string(),
  chapter: z.number().int().positive(),
  chapter_title: z.string(),
  fps: z.number().default(30),
  width: z.number().default(1920),
  height: z.number().default(1080),
  audio_src: z.string().optional().default(""),
  timeline: z.array(lfSceneSchema).min(1),
});

export type LFChapterManifest = z.infer<typeof lfChapterManifestSchema>;

export function totalLongFormFrames(m: LFChapterManifest): number {
  return Math.max(...m.timeline.map((s) => s.startFrame + s.durationFrames), 1);
}

export type LFSceneInput = Omit<LFScene, "startFrame" | "durationFrames"> & {
  durationSec: number;
};

export function buildLongFormChapter(
  input: Omit<LFChapterManifest, "timeline"> & { scenes: LFSceneInput[] }
): LFChapterManifest {
  let cursor = 0;
  const timeline = input.scenes.map((scene) => {
    const durationFrames = Math.max(1, Math.round(scene.durationSec * input.fps));
    const built = {
      id: scene.id,
      type: scene.type,
      props: scene.props,
      startFrame: cursor,
      durationFrames,
    } as LFScene;
    cursor += durationFrames;
    return built;
  });

  return lfChapterManifestSchema.parse({
    video_id: input.video_id,
    chapter: input.chapter,
    chapter_title: input.chapter_title,
    fps: input.fps,
    width: input.width,
    height: input.height,
    audio_src: input.audio_src,
    timeline,
  });
}
