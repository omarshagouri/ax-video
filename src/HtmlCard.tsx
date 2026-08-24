import React, { useLayoutEffect, useMemo, useRef } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { clamp, easeOutCubic } from "./lib/ease";
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
}> = ({ data, values }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vkey = JSON.stringify(values);

  const css = useMemo(() => substitute(data.css, values), [data.css, vkey]);
  const body = useMemo(() => substitute(data.body, values), [data.body, vkey]);

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
      seekFn(frame / fps, clamp, easeOutCubic);
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
  const Card: React.FC<Record<string, unknown>> = (props) => (
    <HtmlCard data={data} values={props} />
  );
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
