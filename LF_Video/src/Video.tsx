import React from "react";
import { AbsoluteFill, Sequence, Audio, Img, OffthreadVideo, staticFile } from "remotion";
import { VideoManifest } from "./manifest";
import { registry, bannedVisualIds } from "./registry";
import { Frame } from "./Frame";
import { theme } from "../shared_system/theme";
import { LFAnimationTimingProvider } from "../shared_system/Timing";
import { normalizeBoundedAnimationValues } from "./clampNumeric";

const asset = (s: string) => (s.startsWith("http") || s.startsWith("data:") ? s : staticFile(s));

/** A single 16:9 long-form chapter. Full videos will later stitch chapter MP4s. */
export const Video: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
  return (
    <AbsoluteFill>
      <Frame />
      {manifest.timeline.map((item, i) => {
        const key = `t-${item.beat}-${i}`;
        if (bannedVisualIds.has(item.component)) {
          throw new Error("Retired AX card VC-LF-016 is permanently prohibited");
        }
        if (item.track === "image" && item.src) {
          return (
            <Sequence key={key} from={item.startFrame} durationInFrames={item.durationFrames}>
              <AbsoluteFill style={{ backgroundColor: theme.navy }}>
                <Img src={asset(item.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </AbsoluteFill>
            </Sequence>
          );
        }
        if ((item.track === "clip" || item.track === "anim") && item.src) {
          return (
            <Sequence key={key} from={item.startFrame} durationInFrames={item.durationFrames}>
              <AbsoluteFill style={{ backgroundColor: theme.navy }}>
                <OffthreadVideo src={asset(item.src)} muted style={{ width: "100%", height: "100%", objectFit: (item.props as any)?.fit === "contain" ? "contain" : "cover" }} />
              </AbsoluteFill>
            </Sequence>
          );
        }
        if (item.track === "clip") throw new Error(`Drive footage ${item.component} was not resolved to a real MP4 source`);
        const entry = registry[item.component];
        if (!entry) return null;
        const Card = entry.component;
        // Use the clamped Zod result for the actual visual, not only for validation.
        const renderedProps = item.track === "anim"
          ? normalizeBoundedAnimationValues(entry.schema, item.props)
          : item.props;
        const customBg = item.track === "anim" ? String((item.props as any)?.backgroundSrc || "") : "";
        const rawBgOpacity = Number((item.props as any)?.backgroundOpacity ?? 0.72);
        const bgOpacity = Math.max(0, Math.min(1, Number.isFinite(rawBgOpacity) ? rawBgOpacity : 0.72));
        return (
          <Sequence key={key} from={item.startFrame} durationInFrames={item.durationFrames} name={`${item.beat}: ${item.component}`}>
            {item.track === "anim" ? <Frame background={entry.background} dim={entry.backgroundDim} /> : null}
            {customBg ? (
              <AbsoluteFill>
                <Img src={asset(customBg)} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: bgOpacity }} />
                <AbsoluteFill style={{ backgroundColor: "rgba(10,22,40,0.40)" }} />
              </AbsoluteFill>
            ) : null}
            {item.track === "anim" ? (
              <LFAnimationTimingProvider animationId={item.component} durationFrames={item.durationFrames} authoredEndFrame={entry.authoredEndFrame}>
                <Card {...renderedProps} __holdFrames={item.durationFrames} />
              </LFAnimationTimingProvider>
            ) : (
              <Card {...renderedProps} __holdFrames={item.durationFrames} />
            )}
          </Sequence>
        );
      })}
      {manifest.audio.filter((a) => a.src).map((a, i) => (
        <Sequence key={`audio-${i}`} from={a.startFrame} durationInFrames={a.durationFrames}>
          <Audio src={asset(a.src)} startFrom={a.startFrom ?? 0} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
