#!/usr/bin/env bash
# Deploy one existing Cloud Run service from the unified repository.
# This intentionally keeps Python and Node services in separate containers.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-}"
case "$TARGET" in
  longform-video)   DIR="services/longform-video"; SERVICE="ax-longform-render" ;;
  longform-cards)   DIR="services/longform-cards"; SERVICE="ax-longform-card" ;;
  shortform-video)  DIR="services/shortform-video"; SERVICE="ax-video-render" ;;
  shortform-render) DIR="services/shortform-render"; SERVICE="ax-render" ;;
  *) echo "Usage: $0 {longform-video|longform-cards|shortform-video|shortform-render}" >&2; exit 2 ;;
esac

if [[ "${CONFIRM_PRODUCTION_DEPLOY:-}" != "yes" ]]; then
  echo "Refusing live deployment. Review docs/SYSTEM_GUIDE.md and set CONFIRM_PRODUCTION_DEPLOY=yes." >&2
  exit 1
fi
PROJECT="${GCP_PROJECT:?Set GCP_PROJECT to the verified Cloud Run project ID}"
REGION="${GCP_REGION:-europe-west1}"
command -v gcloud >/dev/null || { echo "gcloud CLI required" >&2; exit 1; }
# Never silently create a new service with an assumed name or authentication policy.
gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" >/dev/null
SOURCE="$ROOT/$DIR"
# A disposable build context includes the shared cards without duplicating their
# editable source directory inside the repository.
if [[ "$TARGET" == "longform-cards" || "$TARGET" == "shortform-render" ]]; then
  STAGING="$(mktemp -d)"
  cp -a "$SOURCE/." "$STAGING/"
  if [[ "$TARGET" == "longform-cards" ]]; then
    cp -a "$ROOT/services/longform-video/Cards" "$STAGING/Cards"
  else
    cp -a "$ROOT/assets/shortform-cards/Cards" "$STAGING/Cards"
  fi
  SOURCE="$STAGING"
  echo "Prepared temporary build context at $STAGING; it is not a second source of truth."
fi
echo "Deploying $TARGET from $DIR to EXISTING $SERVICE ($PROJECT/$REGION)"
gcloud run deploy "$SERVICE" --source "$SOURCE" --project "$PROJECT" --region "$REGION"
