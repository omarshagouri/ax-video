// AmpCoreX brand tokens. Single place to keep colours/fonts consistent.
export const theme = {
  navy: "#0A1628",
  teal: "#00D4AA",
  tealCaption: "#5EEAD4", // active caption word (matches old Agent 9)
  white: "#FFFFFF",
  font: "'Space Grotesk', sans-serif",
} as const;

// Caption safe band (matches the cards' reserved zone y1180-1540).
export const CAPTION_BAND = { top: 1180, height: 360 };
