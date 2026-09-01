import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { theme } from "../theme";
import { clamp, easeOutCubic } from "../lib/ease";
import { heldSeconds } from "../lib/held";
import { useFittedText } from "../lib/useFittedText";

/**
 * VC-SF-011  "List"  — slots HEADER, ITEM1..4, REVEAL.
 * Ported 1:1 from ax-cards/Cards/VC-SF-011.py, including the REVEAL behaviour:
 *   - blank / placeholder items are hidden
 *   - REVEAL=N: items < N sit static, item N animates in, items > N hidden
 *   - REVEAL blank: cascade all filled items in
 * This is the card that gets reused across beats with a rising REVEAL — which
 * is exactly what broke before. Here each beat is its own Sequence; no freeze.
 */
export const VCSF011Schema = z.object({
  HEADER: z.string(),
  ITEM1: z.string().optional().default(""),
  ITEM2: z.string().optional().default(""),
  ITEM3: z.string().optional().default(""),
  ITEM4: z.string().optional().default(""),
  REVEAL: z.union([z.string(), z.number()]).optional().default(""),
});
export type VCSF011Props = z.infer<typeof VCSF011Schema>;

const isFilled = (v?: string) => !!v && v.trim().length > 0 && v.indexOf("__") < 0;

export const VCSF011: React.FC<VCSF011Props & { __holdFrames?: number }> = ({
  
  __holdFrames,HEADER,
  ITEM1,
  ITEM2,
  ITEM3,
  ITEM4,
  REVEAL,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = heldSeconds(frame, fps, __holdFrames ?? 0, 3.0);

  const items = [ITEM1, ITEM2, ITEM3, ITEM4];
  const filled = items
    .map((v, i) => ({ v, n: i + 1 }))
    .filter((x) => isFilled(x.v));

  const revMatch = String(REVEAL ?? "").match(/\d+/);
  const noRev = !revMatch;
  const rev = revMatch ? parseInt(revMatch[0], 10) : filled.length;

  const show = (a: number, b: number, dy: number) => {
    const e = easeOutCubic(clamp((t - a) / (b - a)));
    return { opacity: e, transform: `translateY(${dy * (1 - e)}px)` };
  };

  const header = useFittedText(58, { maxWidth: 888, maxHeight: 150 });
  const fit1 = useFittedText(46, { maxWidth: 740, maxHeight: 140 });
  const fit2 = useFittedText(46, { maxWidth: 740, maxHeight: 140 });
  const fit3 = useFittedText(46, { maxWidth: 740, maxHeight: 140 });
  const fit4 = useFittedText(46, { maxWidth: 740, maxHeight: 140 });
  const fits = [fit1, fit2, fit3, fit4];

  const hStyle = show(0.1, 0.8, 28);

  let k = 0;
  const rowStyleFor = (n: number): React.CSSProperties | null => {
    // only filled items are shown; respect REVEAL count
    if (!filled.some((f) => f.n === n)) return null;
    if (n > rev) return null; // hidden beyond reveal
    if (noRev) {
      const s = show(0.6 + k * 0.4, 1.3 + k * 0.4, 30);
      k++;
      return s;
    }
    if (n < rev) return { opacity: 1, transform: "none" }; // already revealed, static
    return show(0.45, 1.15, 30); // the newest item animates in
  };

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 192,
          width: 888,
          height: 988,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          ref={header.ref}
          style={{
            fontFamily: theme.font,
            fontWeight: 700,
            fontSize: header.fontSize,
            color: theme.white,
            marginBottom: 44,
            maxWidth: 888,
            ...hStyle,
          }}
        >
          {HEADER}
        </div>

        {[1, 2, 3, 4].map((n) => {
          const rs = rowStyleFor(n);
          if (!rs) return null;
          const text = items[n - 1];
          const fit = fits[n - 1];
          return (
            <div
              key={n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                marginBottom: 34,
                ...rs,
              }}
            >
              <div
                style={{
                  flex: "0 0 auto",
                  width: 66,
                  height: 66,
                  borderRadius: 16,
                  background: theme.teal,
                  color: theme.navy,
                  fontFamily: theme.font,
                  fontWeight: 700,
                  fontSize: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {n}
              </div>
              <div
                ref={fit.ref}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  fontSize: fit.fontSize,
                  color: theme.white,
                  lineHeight: 1.2,
                  maxWidth: 740,
                }}
              >
                {text}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
