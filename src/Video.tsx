import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
import { VideoManifest } from "./manifest";
import { registry } from "./registry";
import { Frame } from "./Frame";
import { Captions } from "./Captions";

// If the next beat uses the SAME card, we don't want it to replay its entrance
// (that reads as a fade between two identical cards). For a continuation beat we
// start the card already-settled by giving the inner sequence a negative offset,
// so its internal frame begins past the entrance window. Hard cut, no fade.
const SETTLE = 90; // frames (~3s) - longer than any card entrance

export const Video: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
  const items = manifest.timeline;
  return (
    <AbsoluteFill>
      <Frame />

      {items.map((item, i) => {
        const entry = registry[item.component];
        if (!entry) return null;
        const Card = entry.component;
        const prev = items[i - 1];
        const isContinuation = !!prev && prev.component === item.component;

        return (
          <Sequence
            key={`beat-${item.beat}-${i}`}
            from={item.startFrame}
            durationInFrames={item.durationFrames}
            name={`${item.beat}: ${item.component}${isContinuation ? " (cont)" : ""}`}
          >
            {isContinuation ? (
              <Sequence from={-SETTLE}>
                <Card {...item.props} />
              </Sequence>
            ) : (
              <Card {...item.props} />
            )}
          </Sequence>
        );
      })}

      {manifest.audio
        .filter((a) => a.src)
        .map((a, i) => (
          <Sequence key={`audio-${i}`} from={a.startFrame} durationInFrames={a.durationFrames}>
            <Audio src={a.src.startsWith("http") ? a.src : staticFile(a.src)} />
          </Sequence>
        ))}

      <Captions captions={manifest.captions} />
    </AbsoluteFill>
  );
};
