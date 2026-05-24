#!/usr/bin/env bash
# start.sh
# Fetches the MongoDB app credential from Secrets Manager using the instance
# role, writes a .env file for Docker Compose, then starts the containers.
# Idempotent - does nothing if containers are already running.
#
# Usage:
#   MONGO_HOST=<db-private-ip> sudo -E bash /opt/lawfirm-crm/start.sh

set -euo pipefail

REGION="us-east-1"
APP_DIR="/opt/lawfirm-crm"

echo "[start] fetching app credential from Secrets Manager"

SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "lawfirm-crm/mongo-app" \
  --region "$REGION" \
  --query SecretString \
  --output text)

APP_USER=$(echo "$SECRET_JSON" | jq -r .username)
APP_PASS=$(echo "$SECRET_JSON" | jq -r .password)
DB_HOST="${MONGO_HOST:-}"

if [[ -z "$DB_HOST" ]]; then
  echo "[start] MONGO_HOST not set - pass it as an env var" >&2
  exit 1
fi

APP_USER_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$APP_USER")
APP_PASS_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$APP_PASS")
MONGO_URI="mongodb://${APP_USER_ENC}:${APP_PASS_ENC}@${DB_HOST}:27017/lawfirm?authSource=lawfirm"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"

# Write .env file for Docker Compose. Avoids relying on sudo -E env passthrough.
# File is chmod 600 - readable by root only.
cat > "$APP_DIR/.env" <<EOF
MONGO_URI=$MONGO_URI
JWT_SECRET=$JWT_SECRET
EOF
chmod 600 "$APP_DIR/.env"

sudo chmod 644 /opt/lawfirm-crm/.env

echo "[start] starting containers"
cd "$APP_DIR"
docker compose up -d --build

echo "[start] done"