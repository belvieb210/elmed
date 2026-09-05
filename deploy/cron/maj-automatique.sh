#!/bin/bash
set -euo pipefail

RACINE="/var/www/elmed"
VERROU="/var/lock/elmed-maj.lock"
JOURNAL="/var/log/elmed-maj.log"
BRANCHE="${ELMED_BRANCHE:-main}"

exec 9>"$VERROU"
if ! flock -n 9; then
  exit 0
fi

if [ ! -d "$RACINE/.git" ]; then
  echo "$(date -Is) depot absent, installation requise." >> "$JOURNAL"
  exit 0
fi

cd "$RACINE"
git fetch --quiet origin "$BRANCHE" || exit 0

LOCAL="$(git rev-parse HEAD)"
DISTANT="$(git rev-parse "origin/$BRANCHE")"

if [ "$LOCAL" = "$DISTANT" ]; then
  exit 0
fi

echo "$(date -Is) nouvelle version $DISTANT — mise à jour" >> "$JOURNAL"

git checkout -f "$BRANCHE"
git pull --ff-only origin "$BRANCHE"

export NODE_ENV=production
export NEXT_PUBLIC_URL_API="/api"

npm install --prefix backend --omit=dev=false
npm install --prefix frontend --omit=dev=false

cd "$RACINE/backend"
npx prisma generate
npx prisma migrate deploy

npm run build

cd "$RACINE/frontend"
npm run build

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart elmed-api elmed-web --update-env
  pm2 save
fi

echo "$(date -Is) déploiement terminé $(git rev-parse --short HEAD)" >> "$JOURNAL"
