# Cards — all 29 available

| How rendered | Cards | Notes |
|---|---|---|
| **Native** (hand-ported, type-safe) | VC-SF-002, 003, 004, 011 | The "target" form. Reference for porting the rest. |
| **HtmlCard** (original css/body/seek, verbatim) | the other 25 | Runs the exact same code the old renderer ran, frame-accurate, inside the single-pass timeline. |

Both kinds live on the same timeline and are fixed by the same architecture —
a card reused twice is just two Sequences, so the freeze bug can't occur for
any of the 29.

## Why HtmlCard is faithful, not a shortcut
The old ax-render built a 1080x1920 stage, injected each card's css + body,
defined `clamp()`/`easeOutCubic()`, then called `seek(t)` per frame and
screenshotted. `HtmlCard` does the identical thing, except `t` comes from
`useCurrentFrame()` — so it's the same pixels, but frame-accurate and with no
per-beat file or reassembly.

## Porting a card to native (optional, later)
Only worth doing where you want type-safe props or to tweak motion. Pattern is
in `src/cards/VC-SF-004.tsx`: copy the CSS to inline styles, turn each
`seek(t)` timing into frame math. Register it in `src/registry.ts` (native wins
over the HtmlCard version automatically).

## Regenerate the card data (after editing ax-cards)
```bash
git clone --depth 1 https://github.com/omarshagouri/ax-cards.git /tmp/ax-cards
python3 scripts/extract_cards.py /tmp/ax-cards/Cards
```

## One thing to verify on first Studio run
HtmlCard runs each card's `seek` via `new Function(...)`. Remotion's Chrome
allows this; if your environment ever blocks eval, the fix is to port that card
to native. (The 4 native cards never use eval.)
