import React from "react";
import { AbsoluteFill, Sequence, Audio, Img, OffthreadVideo, staticFile } from "remotion";
import { VideoManifest } from "./manifest";
import { registry } from "./registry";
import { Frame } from "./Frame";
import { Captions } from "./Captions";
import { theme } from "./theme";

const asset = (s: string) => (s.startsWith("http") || s.startsWith("data:") ? s : staticFile(s));

/**
 * Merge consecutive timeline items that are the SAME card with the SAME props
 * into one contiguous span. Without this, Agent 6 splitting a chapter across
 * 2-3 identical beats makes each beat its own <Sequence>, whose local frame
 * clock resets to 0 -> the card replays its intro animation on every beat
 * (the "repeat with fade" bug). Merging = one mount, one continuous seek(t):
 * the intro plays once and then holds (or reveals continuously over the span).
 * Beats with DIFFERENT props are left separate (they are genuinely new states).
 */
function coalesce(timeline: VideoManifest["timeline"]): VideoManifest["timeline"] {
  const out: VideoManifest["timeline"] = [];
  for (const item of timeline) {
    const prev = out[out.length - 1];
    const sameRender =
      prev &&
      prev.track === item.track &&
      prev.component === item.component &&
      (prev.src ?? "") === (item.src ?? "") &&
      JSON.stringify(prev.props ?? {}) === JSON.stringify(item.props ?? {}) &&
      prev.startFrame + prev.durationFrames === item.startFrame; // truly adjacent
    if (sameRender) {
      prev!.durationFrames += item.durationFrames; // extend the held span
    } else {
      out.push({ ...item });
    }
  }
  return out;
}

/**
 * ONE composition = the whole assembled video:
 *   intro thumbnail still  ->  card beats + narration  ->  end clip (own audio)
 * No per-beat files, no concat, no re-timing.
 */
export const Video: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
  return (
    <AbsoluteFill>
      <Frame />

      {coalesce(manifest.timeline).map((item, i) => {
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
                <OffthreadVideo src={asset(item.src)} muted={(item as { muted?: boolean }).muted === true} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
