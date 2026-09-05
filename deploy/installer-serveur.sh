#!/bin/bash
# Installation Contabo — à lancer en root sur 185.202.236.210
# curl ou: bash deploy/installer-serveur.sh
set -euo pipefail

DOMAINE="elmedical.duckdns.org"
DEPOT="${ELMED_DEPOT:-https://github.com/belvieb210/elmed.git}"
RACINE="/var/www/elmed"
BRANCHE="${ELMED_BRANCHE:-main}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script en root."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y apache2 postgresql postgresql-contrib curl git ca-certificates \
  certbot python3-certbot-apache ufw

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

npm install -g pm2

a2enmod proxy proxy_http proxy_wstunnel headers ssl rewrite
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable || true

if [ ! -d "$RACINE/.git" ]; then
  mkdir -p /var/www
  git clone --branch "$BRANCHE" "$DEPOT" "$RACINE"
else
  cd "$RACINE"
  git fetch origin
  git checkout "$BRANCHE"
  git pull --ff-only origin "$BRANCHE"
fi

chmod +x "$RACINE/deploy/cron/maj-automatique.sh"

JWT="$(openssl rand -hex 48)"
MDP_PG="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
MDP_CLIENT="$(openssl rand -base64 18 | tr -d '/+=' | head -c 14)Aa1"
MDP_ADMIN="$(openssl rand -base64 18 | tr -d '/+=' | head -c 14)Aa1"

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'elmed') THEN
    CREATE ROLE elmed LOGIN PASSWORD '${MDP_PG}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE matemedical OWNER elmed'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'matemedical')\gexec
GRANT ALL PRIVILEGES ON DATABASE matemedical TO elmed;
SQL

cat > "$RACINE/backend/.env" <<ENV
DATABASE_URL="postgresql://elmed:${MDP_PG}@127.0.0.1:5432/matemedical?schema=public"
PORT_API=4000
URL_FRONTEND=https://${DOMAINE}
JWT_SECRET=${JWT}
JWT_EXPIRATION=8h
NODE_ENV=production
MOT_DE_PASSE_COMPTE_CLIENT=${MDP_CLIENT}
MOT_DE_PASSE_COMPTE_ADMIN=${MDP_ADMIN}
ENV
chmod 600 "$RACINE/backend/.env"

cat > "$RACINE/frontend/.env.local" <<ENV
NEXT_PUBLIC_URL_API=/api
ENV

cd "$RACINE/backend"
npm install
npx prisma generate
npx prisma migrate deploy
if [ ! -f /var/lib/elmed.seeded ]; then
  mkdir -p /var/lib
  npx tsx prisma/graine.ts
  touch /var/lib/elmed.seeded
fi
npm run build

cd "$RACINE/frontend"
npm install
export NEXT_PUBLIC_URL_API=/api
npm run build

cp "$RACINE/deploy/apache/elmedical.conf" /etc/apache2/sites-available/elmedical.conf
a2dissite 000-default.conf || true
a2ensite elmedical.conf
systemctl reload apache2

cd "$RACINE"
pm2 start deploy/pm2/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root | tail -n 1 | bash || true

certbot --apache -d "$DOMAINE" --non-interactive --agree-tos --register-unsafely-without-email --redirect || true

mkdir -p /var/log
touch /var/log/elmed-maj.log
chmod 640 /var/log/elmed-maj.log

CRON_LIGNE="* * * * * /bin/bash $RACINE/deploy/cron/maj-automatique.sh >> /var/log/elmed-maj.log 2>&1"
(crontab -l 2>/dev/null | grep -v "maj-automatique.sh"; echo "$CRON_LIGNE") | crontab -

cat > /root/elmed-comptes.txt <<INFO
Domaine : https://${DOMAINE}
Client  : jean.victor@matemedical.cd
Admin   : admin@matemedical.cd
INFO
echo "Client mot de passe : ${MDP_CLIENT}" >> /root/elmed-comptes.txt
echo "Admin mot de passe  : ${MDP_ADMIN}" >> /root/elmed-comptes.txt
chmod 600 /root/elmed-comptes.txt

echo "Installation terminée. Comptes dans /root/elmed-comptes.txt"
echo "Cron : mise à jour git + migrations chaque minute."
