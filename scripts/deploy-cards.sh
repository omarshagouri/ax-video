#!/usr/bin/env bash
# deploy-cards.sh — the ONE command to ship a card edit.
# Run this AFTER you've saved your VC-SF-###.py edit on GitHub.
#
#   cd ~/ax-video && ./scripts/deploy-cards.sh
#
# It: pulls ax-cards -> regenerates allCards.ts -> refuses to deploy if your
# edit didn't actually propagate -> commits -> deploys ax-video-render.

set -euo pipefail

AXCARDS_URL="https://github.com/omarshagouri/ax-cards.git"
AXCARDS_DIR="/tmp/ax-cards"

# Always operate on the tree this script lives in (kills the nested-clone coin-flip).
AXVIDEO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GEN="$AXVIDEO_DIR/src/cards/generated/allCards.ts"
cd "$AXVIDEO_DIR"
echo "== ax-video root: $AXVIDEO_DIR =="

# make sure a commit won't fail on a fresh Cloud Shell
git config user.email >/dev/null 2>&1 || git config user.email "omarshagouri@gmail.com"
git config user.name  >/dev/null 2>&1 || git config user.name  "Omar Shagouri"

# 1. Pull the latest card source from GitHub (/tmp is wiped between sessions, so clone fresh)
echo "== [1/4] cloning ax-cards =="
rm -rf "$AXCARDS_DIR"
git clone --depth 1 "$AXCARDS_URL" "$AXCARDS_DIR"

# 2. Regenerate the baked file the renderer actually reads
echo "== [2/4] regenerating allCards.ts =="
python3 "$AXVIDEO_DIR/scripts/extract_cards.py" "$AXCARDS_DIR/Cards"

# 3. GUARD: if nothing changed, your GitHub edit never made it into the clone — stop here.
if git diff --quiet -- "$GEN"; then
  echo "!! allCards.ts is UNCHANGED."
  echo "   Your .py edit is not in ax-cards on GitHub (did you commit it?),"
  echo "   or you edited a card the renderer doesn't use. Aborting — nothing to deploy."
  exit 1
fi
echo "== change detected: =="
git --no-pager diff --stat -- "$GEN"

# 4. Commit locally + deploy. (deploy ships the LOCAL tree, so a failed push never blocks it.)
echo "== [3/4] committing =="
git add "$GEN"
git commit -m "regen cards $(date +%F_%H:%M)"

echo "== [4/4] deploying ax-video-render =="
gcloud run deploy ax-video-render --source . --region europe-west1 \
  --memory 8Gi --cpu 4 --timeout 900 --concurrency 1

echo "== live revision =="
gcloud run services describe ax-video-render --region europe-west1 \
  --format='value(status.latestReadyRevisionName)'

# best-effort sync to GitHub; auth issues here do NOT affect the deploy above
git push 2>/dev/null || echo "(push skipped/failed — deploy still shipped from local. fix GitHub auth when convenient.)"

echo "DONE. New revision is serving. Give it ~60s, then render."
