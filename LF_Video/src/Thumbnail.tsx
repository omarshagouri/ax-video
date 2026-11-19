import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { theme } from "../shared system/theme";

export type ThumbnailProps = {
  backgroundSrc: string;
  logoSrc?: string;
  series?: string;
  headline: string;
  subhead?: string;
};

export const Thumbnail: React.FC<ThumbnailProps> = ({
  backgroundSrc,
  logoSrc = "",
  series = "BATTERY INTELLIGENCE",
  headline,
  subhead = "",
}) => {
  const len = String(headline || "").length;
  const headlineSize = len > 58 ? 64 : len > 42 ? 72 : 82;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.navy, fontFamily: theme.font, overflow: "hidden" }}>
      {backgroundSrc ? (
        <Img src={backgroundSrc} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.02)" }} />
      ) : null}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(10,22,40,0.98) 0%, rgba(10,22,40,0.92) 37%, rgba(10,22,40,0.45) 62%, rgba(10,22,40,0.08) 100%)",
        }}
      />

      <div style={{ position: "absolute", left: 72, top: 54, right: 72, bottom: 54, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, minHeight: 54 }}>
          {logoSrc ? <Img src={logoSrc} style={{ height: 44, width: "auto", objectFit: "contain" }} /> : null}
          <div style={{ color: theme.teal, fontSize: 24, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" }}>
            {series}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ width: 760, transform: "translateY(-6px)" }}>
            <div
              style={{
                color: theme.white,
                fontSize: headlineSize,
                lineHeight: 0.96,
                fontWeight: 700,
                letterSpacing: -2.6,
                textShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              {headline}
            </div>
            {subhead ? (
              <div style={{ marginTop: 26, color: "#DCE6F2", fontSize: 31, lineHeight: 1.14, fontWeight: 500, width: 700 }}>
                {subhead}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ height: 9, width: 180, borderRadius: 9, background: theme.teal }} />
      </div>
    </AbsoluteFill>
  );
};
