#!/usr/bin/env bash
# Regenerate the short-form renderer's baked card catalog from this SAME repository.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 "$ROOT/services/shortform-video/scripts/extract_cards.py" \
  "$ROOT/assets/shortform-cards/Cards"
echo "Short-form card catalog regenerated locally. Review the diff before deployment."
