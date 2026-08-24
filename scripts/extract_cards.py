#!/usr/bin/env python3
"""Regenerate src/cards/generated/allCards.ts from a folder of ax-cards *.py.
Usage: python3 scripts/extract_cards.py /path/to/ax-cards/Cards
"""
import glob, os, json, sys

src_dir = sys.argv[1] if len(sys.argv) > 1 else "/tmp/ax-cards/Cards"
cards = {}
for path in sorted(glob.glob(os.path.join(src_dir, "VC-SF-*.py"))):
    stem = os.path.basename(path)[:-3]
    ns = {}
    exec(open(path).read(), ns)
    c = ns["CARD"]
    cards[stem] = {
        "slots": c.get("slots", []),
        "css": c.get("css", ""),
        "body": c.get("body", ""),
        "seek": c.get("seek", ""),
        "default_duration": float(c.get("default_duration", 4.0)),
    }

hdr = (
    "// AUTO-GENERATED from ax-cards/Cards/*.py - do not edit by hand.\n"
    "// Each card's original css/body/seek is preserved verbatim and rendered\n"
    "// faithfully by HtmlCard (same runtime the old ax-render used).\n"
    'import type { CardData } from "../../HtmlCard";\n\n'
    "export const allCards: Record<string, CardData> = "
)
out = os.path.join(os.path.dirname(__file__), "..", "src", "cards", "generated", "allCards.ts")
open(out, "w").write(hdr + json.dumps(cards, ensure_ascii=False) + " as Record<string, CardData>;\n")
print(f"wrote {len(cards)} cards -> {os.path.normpath(out)}")
