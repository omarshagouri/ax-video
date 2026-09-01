import React, { useLayoutEffect, useMemo, useRef } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { clamp, easeOutCubic } from "./lib/ease";
import { heldSeconds, motionEndOf } from "./lib/held";
import { theme } from "./theme";

export type CardData = {
  slots: string[];
  css: string;
  body: string;
  seek: string;
  default_duration: number;
};

/** Replace every __SLOT__ token across a string, exactly like the old renderer. */
function substitute(s: string, values: Record<string, unknown>): string {
  let out = s;
  for (const key of Object.keys(values)) {
    out = out.split(`__${key}__`).join(String(values[key] ?? ""));
  }
  return out;
}

/**
 * Runs a card's ORIGINAL css + body + seek(t), unchanged, inside Remotion.
 * This is the same environment ax-render gave the card: a 1080x1920 stage,
 * clamp()/easeOutCubic() in scope, and seek(t) called every frame — except
 * here t comes from useCurrentFrame() instead of a screenshot loop, so it's
 * frame-accurate and part of the single-pass timeline.
 */
export const HtmlCard: React.FC<{
  data: CardData;
  values: Record<string, unknown>;
  /** Length (frames) of the Sequence this card is rendered in. When a card is
   *  held across several cells the server coalesces them, so this is longer than
   *  the card's own animation and we stretch the entrance to fill it. */
  holdFrames?: number;
}> = ({ data, values, holdFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vkey = JSON.stringify(values);

  const css = useMemo(() => substitute(data.css, values), [data.css, vkey]);
  const body = useMemo(() => substitute(data.body, values), [data.body, vkey]);

  // When the card's own entrance finishes (s). +0.3 margin so a late element is
  // never clipped by the stretch. 0 = static card -> heldSeconds leaves it alone.
  const motionEnd = useMemo(() => {
    const e = motionEndOf(data.seek);
    return e > 0 ? e + 0.3 : 0;
  }, [data.seek]);

  const seekFn = useMemo(() => {
    const src = substitute(data.seek, values);
    try {
      // eslint-disable-next-line no-new-func
      return new Function("t", "clamp", "easeOutCubic", src) as (
        t: number,
        c: typeof clamp,
        e: typeof easeOutCubic
      ) => void;
    } catch {
      return () => {};
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.seek, vkey]);

  // Mutate the DOM before paint so Remotion captures the right frame.
  useLayoutEffect(() => {
    try {
      seekFn(heldSeconds(frame, fps, holdFrames ?? 0, motionEnd), clamp, easeOutCubic);
    } catch {
      /* keep rendering even if a card's seek throws on an edge frame */
    }
  });

  return (
    <AbsoluteFill style={{ fontFamily: theme.font }}>
      <style>{css}</style>
      <div
        style={{ position: "absolute", inset: 0 }}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </AbsoluteFill>
  );
};

/** Bind a card's data into a plain component the registry can render. */
export function makeHtmlCard(
  data: CardData
): React.FC<Record<string, unknown>> {
  const Card: React.FC<Record<string, unknown>> = (props) => {
    // __holdFrames is injected by Video.tsx; keep it out of the slot values so it
    // is never substituted into the card's body/seek.
    const { __holdFrames, ...values } = props;
    return (
      <HtmlCard
        data={data}
        values={values}
        holdFrames={typeof __holdFrames === "number" ? __holdFrames : undefined}
      />
    );
  };
  return Card;
}

/** Build a lenient Zod schema (all slots optional strings) from a card's slots. */
export function schemaFromSlots(slots: string[]): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const s of slots) {
    shape[s] = z.union([z.string(), z.number()]).optional().default("");
  }
  return z.object(shape);
}
