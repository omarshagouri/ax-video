#!/usr/bin/env python3
"""Regenerate src/cards/generated/allCards.ts from local Python cards.
Usage: python3 scripts/extract_cards.py src/cards
"""
import glob, os, json, sys

src_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "src", "cards")
cards = {}
for path in sorted(glob.glob(os.path.join(src_dir, "VC_SF_*.py"))):
    stem = os.path.basename(path)[:-3].replace("_", "-")
    if stem == "VC-SF-016":
        raise SystemExit("VC-SF-016 has been permanently retired from AX; delete this source card before regenerating.")
    if stem == "VC-SF-028":
        continue  # separate thumbnail card; not in the active 001-018 Shorts renderer library
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
    "// AUTO-GENERATED from src/cards/VC_SF_*.py - do not edit by hand.\n"
    "// Each card's original css/body/seek is preserved verbatim and rendered\n"
    "// faithfully by HtmlCard (same runtime the old ax-render used).\n"
    'import type { CardData } from "../../HtmlCard";\n\n'
    "export const allCards: Record<string, CardData> = "
)
out = os.path.join(os.path.dirname(__file__), "..", "src", "cards", "generated", "allCards.ts")
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as target:
    target.write(hdr + json.dumps(cards, ensure_ascii=False) + " as Record<string, CardData>;\n")
print(f"wrote {len(cards)} cards -> {os.path.normpath(out)}")
