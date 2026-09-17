#!/usr/bin/env bash
# Publish-on-OK only. Never watch Desktop saves. Run when Andrea says "pubblica".
# Local preview stays: python3 -m http.server 43123 --bind 127.0.0.1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PUBLISH="${PUBLISH_DIR:-$HOME/Desktop/Website-netlify-drop}"
ZIP="${ZIP_PATH:-$HOME/Desktop/Website-netlify-drop.zip}"
NETLIFY=(npx --yes netlify-cli)

mkdir -p "$PUBLISH"
rsync -a --delete \
  --exclude '.git/' \
  --exclude '.gitignore' \
  --exclude '.DS_Store' \
  --exclude '**/.DS_Store' \
  --exclude '.claude/' \
  --exclude '.impeccable/' \
  --exclude '.cursor/' \
  --exclude '.netlify/' \
  --exclude 'internal/' \
  --exclude 'scripts/' \
  --exclude 'CLAUDE.md' \
  --exclude 'README.md' \
  --exclude 'package.json' \
  --exclude 'publish-netlify.sh' \
  --exclude '*.env' \
  --exclude '*.pem' \
  --exclude '*.key' \
  --exclude '*credentials*' \
  --exclude '*secret*' \
  "$ROOT/" "$PUBLISH/"

find "$PUBLISH" -name '.DS_Store' -delete
(cd "$PUBLISH" && zip -r -q "$ZIP" .)

STATUS="$("${NETLIFY[@]}" status 2>&1 || true)"
if printf '%s\n' "$STATUS" | grep -qi 'not logged in'; then
  echo "Netlify CLI is not logged in. Public URL does not update from this script."
  echo "Once: ${NETLIFY[*]} login"
  echo "Then: $ROOT/publish-netlify.sh"
  echo "Or drag $ZIP onto https://app.netlify.com/drop"
  exit 1
fi

exec "${NETLIFY[@]}" deploy --prod --dir="$PUBLISH"
