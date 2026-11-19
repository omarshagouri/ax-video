#!/usr/bin/env python3
"""Regenerate src/cards/generated/allCards.ts from local VC-LF-*.py cards."""
import glob
import json
import os
import sys

src_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "Cards")
cards = {}
for path in sorted(glob.glob(os.path.join(src_dir, "VC-LF-*.py"))):
    stem = os.path.basename(path)[:-3]
    if stem == "VC-LF-016":
        raise SystemExit("VC-LF-016 has been permanently retired from AX; delete this source card before regenerating.")
    ns = {}
    with open(path, encoding="utf-8") as f:
        exec(f.read(), ns)
    c = ns["CARD"]
    if c.get("id") != stem:
        raise SystemExit(f"{path}: CARD.id={c.get('id')} does not match filename {stem}")
    cards[stem] = {
        "slots": c.get("slots", []),
        "css": c.get("css", ""),
        "body": c.get("body", ""),
        "seek": c.get("seek", ""),
        "default_duration": float(c.get("default_duration", 4.0)),
    }

hdr = (
    "// AUTO-GENERATED from Cards/VC-LF-*.py - do not edit by hand.\n"
    'import type { CardData } from "../../HtmlCard";\n\n'
    "export const allCards: Record<string, CardData> = "
)
out = os.path.join(os.path.dirname(__file__), "..", "src", "cards", "generated", "allCards.ts")
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    f.write(hdr + json.dumps(cards, ensure_ascii=False) + " as Record<string, CardData>;\n")
print(f"wrote {len(cards)} card(s) -> {os.path.normpath(out)}")
