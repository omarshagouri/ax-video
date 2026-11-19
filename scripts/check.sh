#!/usr/bin/env bash
# Checks that do not deploy or modify any external system.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node "$ROOT/services/longform-video/scripts/test-lf-animation-file-layout.mjs"
for folder in "$ROOT/services/longform-video/server" "$ROOT/services/shortform-video/server"; do
  for file in "$folder"/*.mjs; do node --check "$file"; done
done
python3 -m compileall -q "$ROOT/services/longform-cards" "$ROOT/services/shortform-render"
echo "PASS: animation layout, Node syntax and Python syntax"
