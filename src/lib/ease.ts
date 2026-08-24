// Exact ports of the helpers the old cards used inside seek(t).
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
