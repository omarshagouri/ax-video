import { useLayoutEffect, useRef, useState } from "react";
import { delayRender, continueRender } from "remotion";

/**
 * Shrinks a text element until it fits a box. This is the faithful port of the
 * old cards' `__fit()` routine (shrink font by 2px until it no longer overflows).
 * delayRender() makes headless renders wait for the fit to settle on frame 0.
 */
export function useFittedText(
  basePx: number,
  opts: { maxWidth: number; maxHeight?: number; singleLine?: boolean }
) {
  const ref = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(basePx);
  const [handle] = useState(() => delayRender(`fit-${basePx}`));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      continueRender(handle);
      return;
    }
    let size = basePx;
    el.style.fontSize = size + "px";
    let guard = 0;
    while (
      size > 16 &&
      guard < 240 &&
      (el.scrollWidth > opts.maxWidth + 0.5 ||
        (opts.maxHeight ? el.scrollHeight > opts.maxHeight + 0.5 : false))
    ) {
      size -= 2;
      el.style.fontSize = size + "px";
      guard++;
    }
    setFontSize(size);
    continueRender(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, fontSize };
}
