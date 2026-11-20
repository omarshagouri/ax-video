#!/usr/bin/env bash
# Regenerate short-form Remotion cards from local Python card source.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 "$ROOT/services/SF_Video/scripts/extract_cards.py" "$ROOT/services/SF_Video/src/cards"
echo 'Short-form cards synchronized from their single editable directory.'
