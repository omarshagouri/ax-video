import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { LFChapterManifest } from "./types";
import { LFBackground } from "./Background";
import { LFBeat, LFHook, LFVersus } from "./cards";

const asset = (s: string) =>
  s.startsWith("http") || s.startsWith("data:") ? s : staticFile(s);

const Scene: React.FC<{ scene: any }> = ({ scene }) => {
  if (scene.type === "hook") return <LFHook {...scene.props} />;
  if (scene.type === "beat") return <LFBeat {...scene.props} />;
  if (scene.type === "versus") return <LFVersus {...scene.props} />;
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
          name={`LF:${manifest.chapter}:${scene.id}`}
        >
          <Scene scene={scene} />
        </Sequence>
      ))}

      {manifest.audio_src ? <Audio src={asset(manifest.audio_src)} /> : null}
    </AbsoluteFill>
  );
};
