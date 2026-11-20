import React from "react";
import { useCurrentFrame } from "remotion";
import { theme, CAPTION_BAND } from "./theme";
import { Caption } from "./manifest";

/**
 * Karaoke captions. Word timings come straight from ElevenLabs
 * (text-to-speech with-timestamps) at synthesis time — no whisper pass.
 * Active word teal, rest white, in the reserved caption band.
 * Shows a small window of words around the active one.
 */
const WINDOW = 4; // words shown on each side of the active word

export const Captions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  if (!captions || captions.length === 0) return null;

  let active = captions.findIndex(
    (c) => frame >= c.startFrame && frame < c.endFrame
  );
  if (active === -1) {
    // between words: attach to the most recent word so captions don't flicker
    for (let i = captions.length - 1; i >= 0; i--) {
      if (frame >= captions[i].startFrame) {
        active = i;
        break;
      }
    }
  }
  if (active === -1) return null;

  const start = Math.max(0, active - WINDOW);
  const end = Math.min(captions.length, active + WINDOW + 1);
  const shown = captions.slice(start, end);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: CAPTION_BAND.top,
        height: CAPTION_BAND.height,
        display: "flex",
        flexWrap: "wrap",
        alignContent: "flex-start",
        justifyContent: "center",
        gap: "0 18px",
        padding: "0 96px",
        fontFamily: theme.font,
        fontWeight: 800,
        fontSize: 56,
        lineHeight: 1.15,
      }}
    >
      {shown.map((c, i) => {
        const isActive = start + i === active;
        return (
          <span
            key={start + i}
            style={{
              color: isActive ? theme.tealCaption : theme.white,
              textShadow: "0 2px 8px rgba(0,0,0,0.55)",
            }}
          >
            {c.word}
          </span>
        );
      })}
    </div>
  );
};
