# AmpCoreX Long-Form Renderer — Phase 1

This folder is intentionally isolated from the functioning Shorts renderer.

## Goal

Reproduce the successful visual language of **AX-002-LF** automatically before
building a general long-form production system.

The first target is the opening ~40 seconds:

1. Hook — ONE EV / ONE MODEL / TWO CHEMISTRIES
2. Beat — A PATTERN RUNS BACKWARDS
3. Versus — LONGER LIFE → BIGGER DROP / SHORTER LIFE → BARELY MOVES
4. Mystery beat — durability numbers vs dashboard interpretation
5. Chapter beat — THE CYCLE-LIFE GAP
6. Versus — LFP 3,000–6,000 vs NMC 1,000–2,000

## Long-form workflow rules

- Thumbnail is produced by its own agent. It is **not** prepended to the video.
- Script is divided into chapters.
- Audio is divided into the same chapters.
- No chapter audio should be longer than roughly 1–2 minutes.
- Visual planning is chapter-based.
- During the first production phase, every visual chapter is reviewed manually
  before the next stage.
- Each chapter renders to its own 1920×1080 MP4.
- Final assembly concatenates approved chapter MP4s.
- The common AmpCoreX end clip is appended only at final assembly, using the same
  concept as the Shorts system.
- Existing VC-SF-* cards, Shorts composition, Shorts endpoint and Shorts Make
  scenarios remain untouched.

## Development rule

Do not add a new LF card family merely because one shot can be custom-built.
First try to express it as a reusable Hook / Beat / Versus / Stat / Health /
Chart / Columns / Note / Cluster variant.

## Phase 1 card types implemented

- LF Hook
- LF Beat / chapter title
- LF Versus

Next after visual approval of the opening:

- Health — buffer variant
- Versus — matrix variant
- Gauge / meter
- Cluster single + dual readout

## Render target

Remotion composition:

`AmpCoreXLongFormChapter`

Development sample:

`ax002OpeningManifest`

The sample intentionally contains no narration file. The production manifest
will set `audio_src` to the approved chapter audio.
