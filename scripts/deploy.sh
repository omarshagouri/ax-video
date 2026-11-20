#!/usr/bin/env bash
# Deploy one of four existing Cloud Run services from two editable service folders.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
case "${1:-}" in
  LF_Video) DIR="services/LF_Video"; SERVICE="ax-longform-render"; IMAGE="Dockerfile_Node" ;;
  LF_Cards) DIR="services/LF_Video"; SERVICE="ax-longform-card"; IMAGE="Dockerfile" ;;
  SF_Video) DIR="services/SF_Video"; SERVICE="ax-video-render"; IMAGE="Dockerfile_Node" ;;
  SF_Cards) DIR="services/SF_Video"; SERVICE="ax-render"; IMAGE="Dockerfile" ;;
  *) echo "Usage: $0 {LF_Video|LF_Cards|SF_Video|SF_Cards}" >&2; exit 2 ;;
esac
if [[ "${CONFIRM_PRODUCTION_DEPLOY:-}" != "yes" ]]; then
  echo "Deployment blocked. Set CONFIRM_PRODUCTION_DEPLOY=yes after validation." >&2
  exit 1
fi
PROJECT="${GCP_PROJECT:?Set GCP_PROJECT to the verified Cloud Run project ID}"
REGION="${GCP_REGION:-europe-west1}"
command -v gcloud >/dev/null || { echo "gcloud CLI required" >&2; exit 1; }
gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" >/dev/null
# Cloud Run --source uses Dockerfile: select it in a disposable build context.
STAGING="$(mktemp -d)"
trap 'rm -rf -- "$STAGING"' EXIT
cp -a "$ROOT/$DIR/." "$STAGING/"
cp "$ROOT/$DIR/$IMAGE" "$STAGING/Dockerfile"
echo "Deploying existing $SERVICE using $DIR/$IMAGE"
gcloud run deploy "$SERVICE" --source "$STAGING" --project "$PROJECT" --region "$REGION"
