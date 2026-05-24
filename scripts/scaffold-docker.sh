#!/usr/bin/env bash
# scaffold-docker.sh
# Writes Dockerfile, docker-compose.yml, Nginx config, and the host start
# script for the App Server. Run with sudo on the App Server.

set -euo pipefail

echo "[scaffold-docker] starting at $(date -Iseconds)"

APP_DIR="/opt/lawfirm-crm"

# ---- Dockerfile ----

cat > "$APP_DIR/Dockerfile" <<'EOF'
# Build stage - compiles TypeScript to JS. The output is copied to the
# production stage; dev dependencies and source files do not make it
# into the final image.
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production stage - only the compiled output and runtime dependencies.
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Non-root user for the process. Alpine's node image ships with a 'node'
# user already created.
USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
EOF

# ---- nginx/nginx.conf ----

mkdir -p "$APP_DIR/nginx"

cat > "$APP_DIR/nginx/nginx.conf" <<'EOF'
# Reverse proxy for the Node.js API. Listens on 80, forwards to the
# app container on port 3000. No TLS for the proof of concept.

events {
  worker_connections 1024;
}

http {
  access_log /var/log/nginx/access.log;
  error_log  /var/log/nginx/error.log;

  # Disable version disclosure in error pages and headers.
  server_tokens off;

  upstream api {
    server app:3000;
  }

  server {
    listen 80;

    # Forward all requests to the Node.js app. The app handles its own
    # routing; Nginx is a pass-through with buffering and header cleanup.
    location / {
      proxy_pass         http://api;
      proxy_http_version 1.1;
      proxy_set_header   Host              $host;
      proxy_set_header   X-Real-IP         $remote_addr;
      proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
      proxy_set_header   Connection        '';
      proxy_read_timeout 30s;
    }
  }
}
EOF

# ---- docker-compose.yml ----

cat > "$APP_DIR/docker-compose.yml" <<'EOF'
# Two containers: the Node.js API and Nginx reverse proxy.
# MONGO_URI and JWT_SECRET are injected by start.sh from the host environment
# before this file is evaluated by Docker Compose.

services:
  app:
    build:
      context: .
      target: production
    image: lawfirm-crm-api:latest
    restart: unless-stopped
    environment:
      MONGO_URI:  ${MONGO_URI}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV:   production
      PORT:       3000
    expose:
      - "3000"
    networks:
      - internal

  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    networks:
      - internal

networks:
  internal:
    driver: bridge
EOF

# ---- start.sh ----
# Fetches the app credential from Secrets Manager using the instance role,
# constructs MONGO_URI, and starts the containers. Idempotent - does nothing
# if containers are already running.

cat > "$APP_DIR/start.sh" <<'EOF'
#!/usr/bin/env bash
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
DB_HOST=$(echo "$SECRET_JSON"  | jq -r .host 2>/dev/null || echo "${MONGO_HOST:-}")

if [[ -z "$DB_HOST" ]]; then
  echo "[start] MONGO_HOST not set and not in secret - pass it as an env var" >&2
  exit 1
fi

export MONGO_URI="mongodb://${APP_USER}:${APP_PASS}@${DB_HOST}:27017/lawfirm?authSource=lawfirm"
export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"

echo "[start] starting containers"
cd "$APP_DIR"
docker compose up -d --build

echo "[start] done"
EOF

chmod +x "$APP_DIR/start.sh"
chown -R ubuntu:ubuntu "$APP_DIR"

echo "[scaffold-docker] finished at $(date -Iseconds)"