import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
import { VideoManifest } from "./manifest";
import { registry } from "./registry";
import { Frame } from "./Frame";
import { Captions } from "./Captions";

/**
 * ONE composition = the whole video. Each beat is a <Sequence> on an absolute
 * timeline; audio sits underneath at exact frames; captions overlay on top.
 * There is no per-beat file, no concat, no re-timing. A card reused twice is
 * just two Sequences — the freeze / reused-card bug cannot occur here.
 */
export const Video: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
  return (
    <AbsoluteFill>
      <Frame />

      {manifest.timeline.map((item, i) => {
        const entry = registry[item.component];
        if (!entry) return null; // unknown card: skip (builder should have caught it)
        const Card = entry.component;
        return (
          <Sequence
            key={`beat-${item.beat}-${i}`}
            from={item.startFrame}
            durationInFrames={item.durationFrames}
            name={`${item.beat}: ${item.component}`}
          >
            <Card {...item.props} />
          </Sequence>
        );
      })}

      {manifest.audio
        .filter((a) => a.src)
        .map((a, i) => (
          <Sequence
            key={`audio-${i}`}
            from={a.startFrame}
            durationInFrames={a.durationFrames}
          >
            <Audio src={a.src.startsWith("http") ? a.src : staticFile(a.src)} />
          </Sequence>
        ))}

      <Captions captions={manifest.captions} />
    </AbsoluteFill>
  );
};
