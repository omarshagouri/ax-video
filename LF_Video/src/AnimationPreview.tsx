import React from "react";
import { AbsoluteFill } from "remotion";
import { Frame } from "./Frame";
import { animationRegistry } from "../shared_system/registry";
import { LFAnimationTimingProvider } from "../shared_system/Timing";
import { normalizeBoundedAnimationValues } from "./clampNumeric";

export type AnimationPreviewProps = {
  animationId: string;
  values: Record<string, unknown>;
  durationFrames: number;
};

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({
  animationId,
  values,
  durationFrames,
}) => {
  const entry = animationRegistry[animationId];
  if (!entry) {
    return (
      <AbsoluteFill
        style={{
          background: "#0A1628",
          color: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          fontSize: 54,
        }}
      >
        Unknown animation: {animationId}
      </AbsoluteFill>
    );
  }

  const Anim = entry.component;
  const renderedValues = normalizeBoundedAnimationValues(entry.schema, values);
  return (
    <AbsoluteFill>
      <Frame background={entry.background} dim={entry.backgroundDim} />
      <LFAnimationTimingProvider animationId={animationId} durationFrames={durationFrames} authoredEndFrame={entry.authoredEndFrame}>
        <Anim {...renderedValues} __holdFrames={durationFrames} />
      </LFAnimationTimingProvider>
    </AbsoluteFill>
  );
};
