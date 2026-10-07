# AmpCoreX Long-Form Animation Library V1

Reference source: AX-003-LF BMS software reference video.
Purpose: reusable motion graphics for 1920x1080 long-form chapters.
ID family: VA-LF-*.
These are renderer-generated animations, not stock clips and not static cards.

| ID | Name | Best use | Required / main slots | Default |
|---|---|---|---|---:|
| VA-LF-001 | Battery Buffer Reveal | Usable-vs-reserve capacity, hidden buffer, software-accessible window | title, usablePct, bufferPct, usableLabel, bufferLabel, footer | 8s |
| VA-LF-002 | Before / After Battery | Capacity loss, usable-window change, SOC comparison, old-vs-new setting | title, beforeLabel, beforePct, afterLabel, afterPct, deltaLabel, footer | 8s |
| VA-LF-003 | Animated Line Chart | Degradation, range, capacity, voltage, charge-rate, trend comparison | title, seriesALabel, seriesA, seriesBLabel, seriesB, xLabel, yLabel, footer | 9s |
| VA-LF-004 | Process / Energy Flow | Charging path, regen path, BMS decision chain, thermal path, material flow | title, nodes, centerLabel, direction, footer | 8s |
| VA-LF-005 | Milestone Timeline | Software updates, recalls, legal events, product generations, development stages | title, milestones, footer | 9s |
| VA-LF-006 | Number Count-Up | Fleet size, percentage, capacity, money, cycle count, range | title, value, decimals, prefix, suffix, label, tone, footer | 7s |
| VA-LF-007 | System Before / After | Software behavior, BMS strategy, pack architecture, ownership-rule change | title, beforeLabel, afterLabel, beforeItems, afterItems, footer | 9s |

## Selection rules

Use VA-LF when the narration explains motion, change, process, progression, comparison over time, or a mechanism that benefits from movement.

Prefer:
- VA-LF-001 for hidden/usable/reserve battery capacity.
- VA-LF-002 when two battery states are directly compared.
- VA-LF-003 when the claim depends on a trend or curve.
- VA-LF-004 when energy, ions, data, heat, or control logic moves through stages.
- VA-LF-005 when chronology is the story.
- VA-LF-006 when one number deserves a strong visual reveal.
- VA-LF-007 when software/system behavior changes from one state to another.

Do not use an animation simply to create variety.
Do not add facts, values, labels, rankings, mechanisms, or causal claims that are not supported by narration/evidence.
Animation display text must be shorter than narration.
For a physical mechanism, prefer a VA-LF diagram over a text-heavy VC-LF card.
Avoid adjacent use of the same VA-LF ID unless the second beat genuinely continues the same animation.
