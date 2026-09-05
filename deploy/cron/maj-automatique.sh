#!/bin/bash
set -euo pipefail

RACINE="/var/www/elmed"
VERROU="/var/lock/elmed-maj.lock"
JOURNAL_MAJ="/var/log/elmed-maj.log"
JOURNAL_UPDATE="/var/log/elmed-update.log"
BRANCHE="${ELMED_BRANCHE:-main}"

ecrire_journal() {
  local ligne
  ligne="$(date '+%F %T') $*"
  echo "$ligne" | tee -a "$JOURNAL_MAJ" >> "$JOURNAL_UPDATE"
}

if [ -f /etc/elmed.env ]; then
  set -a
  # shellcheck disable=SC1091
  source /etc/elmed.env
  set +a
fi

touch "$JOURNAL_MAJ" "$JOURNAL_UPDATE"
chmod 640 "$JOURNAL_MAJ" "$JOURNAL_UPDATE" 2>/dev/null || true

exec 9>"$VERROU"
if ! flock -n 9; then
  ecrire_journal "déjà en cours, on attend la prochaine minute"
  exit 0
fi

if [ ! -d "$RACINE/.git" ]; then
  ecrire_journal "dépôt absent, installation requise"
  exit 0
fi

cd "$RACINE"
if ! git fetch --quiet origin "$BRANCHE"; then
  ecrire_journal "git fetch impossible"
  exit 0
fi

LOCAL="$(git rev-parse --short HEAD)"
DISTANT="$(git rev-parse --short "origin/$BRANCHE")"

if [ "$(git rev-parse HEAD)" = "$(git rev-parse "origin/$BRANCHE")" ]; then
  ecrire_journal "à jour ($LOCAL) — rien à déployer"
  exit 0
fi

ecrire_journal "nouvelle version $LOCAL -> $DISTANT — déploiement en cours"

git checkout -f "$BRANCHE"
git pull --ff-only origin "$BRANCHE"

export NODE_ENV=production
export NEXT_PUBLIC_URL_API="/api"

ecrire_journal "installation des dépendances"
npm install --prefix backend --omit=dev=false
npm install --prefix frontend --omit=dev=false

cd "$RACINE/backend"
ecrire_journal "migrations PostgreSQL"
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/enrichir-catalogue.ts

ecrire_journal "build API"
npm run build

cd "$RACINE/frontend"
ecrire_journal "build frontend"
npm run build

if command -v pm2 >/dev/null 2>&1; then
  ecrire_journal "redémarrage PM2"
  pm2 restart elmed-api elmed-web --update-env
  pm2 save
fi

ecrire_journal "déploiement terminé $(git rev-parse --short HEAD)"
