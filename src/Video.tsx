import React from "react";
import { AbsoluteFill, Sequence, Audio, Img, OffthreadVideo, staticFile } from "remotion";
import { VideoManifest } from "./manifest";
import { registry } from "./registry";
import { Frame } from "./Frame";
import { Captions } from "./Captions";
import { theme } from "./theme";

const asset = (s: string) => (s.startsWith("http") || s.startsWith("data:") ? s : staticFile(s));

/**
 * ONE composition = the whole assembled video:
 *   intro thumbnail still  ->  card beats + narration  ->  end clip (own audio)
 * No per-beat files, no concat, no re-timing.
 */
export const Video: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
  return (
    <AbsoluteFill>
      <Frame />

      {manifest.timeline.map((item, i) => {
        const key = `t-${item.beat}-${i}`;

        // Intro thumbnail: silent still, navy letterbox.
        if (item.track === "image" && item.src) {
          return (
            <Sequence key={key} from={item.startFrame} durationInFrames={item.durationFrames} name={`intro:${item.beat}`}>
              <AbsoluteFill style={{ backgroundColor: theme.navy }}>
                <Img src={asset(item.src)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </AbsoluteFill>
            </Sequence>
          );
        }

        // End clip (or any clip beat): plays with its own audio.
        if (item.track === "clip" && item.src) {
          return (
            <Sequence key={key} from={item.startFrame} durationInFrames={item.durationFrames} name={`clip:${item.beat}`}>
              <AbsoluteFill style={{ backgroundColor: theme.navy }}>
                <OffthreadVideo src={asset(item.src)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </AbsoluteFill>
            </Sequence>
          );
        }

        // Card beat.
        const entry = registry[item.component];
        if (!entry) return null;
        const Card = entry.component;
        return (
          <Sequence key={key} from={item.startFrame} durationInFrames={item.durationFrames} name={`${item.beat}: ${item.component}`}>
            <Card {...item.props} />
          </Sequence>
        );
      })}

      {/* Narration: chapter mp3s under the card section */}
      {manifest.audio
        .filter((a) => a.src)
        .map((a, i) => (
          <Sequence key={`audio-${i}`} from={a.startFrame} durationInFrames={a.durationFrames}>
            <Audio src={asset(a.src)} />
          </Sequence>
        ))}

      <Captions captions={manifest.captions} />
    </AbsoluteFill>
  );
};
