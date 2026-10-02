export const lfTheme = {
  navy: "#0A1628",
  navySurface: "#142440",
  navyLine: "#24375A",
  teal: "#00D4AA",
  white: "#FFFFFF",
  slate: "#8CA0B8",
  heat: "#FF8A4C",
  heatDeep: "#FF4D4D",
  cold: "#4DA6FF",
};

export const toneColor = (tone?: string) => {
  if (tone === "heat") return lfTheme.heat;
  if (tone === "cold") return lfTheme.cold;
  if (tone === "white") return lfTheme.white;
  return lfTheme.teal;
};
