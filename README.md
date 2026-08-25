# ax-video — AmpCoreX new visual engine (Remotion)

This is a **new, parallel** system. It does not touch Agents 6–9 or ax-render.
Run it side by side; cut over only when you're happy.

## The idea (one line)

One video = one manifest = one render. No per-beat files, no concat, no
re-timing. A card reused twice is just two sequences — the freeze bug can't happen.

## Run it (2 minutes, on your dev machine)

```bash
npm install
npm run studio      # opens Remotion Studio in the browser
```

You'll see the `AmpCoreX` composition. It plays two beats built from real
AX-017 data — and **VC-SF-004 is used twice on purpose** (the exact case that
froze before). Scrub the timeline: the teal bar wipes, the kicker rises, the
hook rises, captions highlight word-by-word. Same look as your card, drawn
properly instead of screenshotted.

Render a file:

```bash
npm run render      # -> out/video.mp4
```

## What's here

| File | What it is |
|---|---|
| `src/cards/VC-SF-004.tsx` | Your real Hook card, ported 1:1 from the `.py` |
| `src/manifest.ts` | The `VideoManifest` contract (the single source of truth) |
| `src/registry.ts` | card_id → component + Zod schema; add a card = add a line |
| `src/Video.tsx` | Renders the whole manifest timeline in one pass |
| `src/Captions.tsx` | Karaoke captions from ElevenLabs word timings (no whisper) |
| `src/builder.ts` | Stub: cadence + ElevenLabs → manifest (Phase 2) |
| `src/sample-manifest.ts` | Real AX-017 demo data |

## Roadmap

- **Phase 0 (done):** engine runs, one real card ported, contract + registry set.
- **Phase 1:** port the other ~25 cards (mechanical — CSS copies over, `seek(t)`
  math becomes frame math like in VC-SF-004). Register each in `registry.ts`.
- **Phase 2:** wire `builder.ts` to `/plan-cadence` + ElevenLabs `with-timestamps`.
- **Phase 3:** deploy the render (Remotion Lambda on AWS, or Cloud Run next to
  ax-render). One HTTP endpoint that takes a manifest, returns the MP4.
- **Phase 4:** thin new Make scenario: plan → build manifest → POST render →
  save to Drive → publish. Then retire Agents 6–9 when the new path wins.

## Notes

- Font: Space Grotesk via `@remotion/google-fonts` (loads before render).
- Brand background: drop your `background.png` in `/public` and set
  `HAS_BG = true` in `src/Frame.tsx`.
- Licensing: Remotion is free for individuals / for-profit orgs up to 3 people,
  commercial use and self-hosted Lambda included. Confirm the automation clause
  for your exact entity before you scale headcount.

## Cloud Run render service (built)

- `server/index.mjs` — POST `/render-video` with `{manifest}`, returns base64 MP4 (same contract as old ax-render).
- `Dockerfile` — Remotion + headless Chrome, ready for Cloud Run.
- See `DEPLOY_CLOUDRUN.md` for the one-line deploy.

## Make scenario (built, live)

- Name: **10_Assembly_Remotion (NEW)**, id **7039996**, team 1719689.
- On-demand + inactive — it will NOT auto-run or interfere with Agents 6-9.
- Flow: read row (status `ManifestReady`, PLACEHOLDER) -> POST manifest to Cloud Run
  (PLACEHOLDER url/key/manifest) -> save FINAL to Drive -> flip status to `RemotionAssembled`.
- Placeholders to fix later: Cloud Run URL, x-api-key, and the manifest body
  (currently an empty-timeline stub; wire it to the builder output).
