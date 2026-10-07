import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { LFChapterManifest } from "./types";
import { LFBackground } from "./Background";
import { LFBeat, LFHook, LFVersus } from "./cards";
import { animationRegistry } from "./animations";

const asset = (s: string) =>
  s.startsWith("http") || s.startsWith("data:") ? s : staticFile(s);

const Scene: React.FC<{ scene: any }> = ({ scene }) => {
  if (scene.type === "hook") return <LFHook {...scene.props} />;
  if (scene.type === "beat") return <LFBeat {...scene.props} />;
  if (scene.type === "versus") return <LFVersus {...scene.props} />;
  if (scene.type === "animation") {
    const entry = animationRegistry[scene.component];
    if (!entry) return null;
    const Anim = entry.component;
    return <Anim {...scene.props} __holdFrames={scene.durationFrames} />;
  }
  return null;
};

export const LongFormChapter: React.FC<{ manifest: LFChapterManifest }> = ({ manifest }) => {
  return (
    <AbsoluteFill>
      <LFBackground />

      {manifest.timeline.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.startFrame}
          durationInFrames={scene.durationFrames}
          name={scene.type === "animation"
            ? `LF:${manifest.chapter}:${scene.id}:${scene.component}`
            : `LF:${manifest.chapter}:${scene.id}`}
        >
          <Scene scene={scene} />
        </Sequence>
      ))}

      {manifest.audio_src ? <Audio src={asset(manifest.audio_src)} /> : null}
    </AbsoluteFill>
  );
};
