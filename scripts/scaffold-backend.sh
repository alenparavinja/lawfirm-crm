#!/usr/bin/env bash
# scaffold-backend.sh
# Creates the Node.js/TypeScript project structure under /opt/lawfirm-crm
# on the App Server. Accepts the DB Server private IP as the first argument.
# Run with sudo on the App Server.

set -euo pipefail

echo "[scaffold] starting at $(date -Iseconds)"

DB_IP="${1:-}"
if [[ -z "$DB_IP" ]]; then
  echo "Usage: $0 <db-server-private-ip>" >&2
  exit 1
fi

APP_DIR="/opt/lawfirm-crm"

# ---- Directory structure ----

mkdir -p "$APP_DIR"/src/{clients,cases,documents,staff,notes,tasks,auth,common}
chown -R ubuntu:ubuntu "$APP_DIR"

# ---- package.json ----

cat > "$APP_DIR/package.json" <<'EOF'
{
  "name": "lawfirm-crm-api",
  "version": "1.0.0",
  "description": "Immigration law firm CRM REST API",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node src/server.ts"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.2",
    "typescript": "^5.4.5"
  }
}
EOF

# ---- tsconfig.json ----

cat > "$APP_DIR/tsconfig.json" <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
EOF

# ---- src/common/config.ts ----

cat > "$APP_DIR/src/common/config.ts" <<'EOF'
// config.ts
// Single source of truth for environment variables. Fails fast at startup
// if required vars are missing rather than surfacing cryptic errors later.

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongoUri: required('MONGO_URI'),
  jwtSecret: required('JWT_SECRET'),
  nodeEnv: process.env.NODE_ENV ?? 'production',
};

export default config;
EOF

# ---- src/common/logger.ts ----

cat > "$APP_DIR/src/common/logger.ts" <<'EOF'
// logger.ts
// Minimal structured logger. Wraps console so output format can be
// swapped later without touching call sites.

type Level = 'info' | 'warn' | 'error';

const log = (level: Level, message: string, meta?: Record<string, unknown>) => {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
};

const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};

export default logger;
EOF

# ---- src/common/db.ts ----

cat > "$APP_DIR/src/common/db.ts" <<EOF
// db.ts
// Mongoose connection. MONGO_URI is injected by the host start script at
// container launch time after fetching the credential from Secrets Manager.
// The app itself has no AWS dependency.

import mongoose from 'mongoose';
import config from './config';
import logger from './common/logger'

export const connectDb = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection failed', { err });
    process.exit(1);
  }
};
EOF

# ---- src/common/errorHandler.ts ----

cat > "$APP_DIR/src/common/errorHandler.ts" <<'EOF'
// errorHandler.ts
// Central Express error middleware. Keeps error serialization out of
// individual controllers and ensures a consistent response shape.

import { Request, Response, NextFunction } from 'express';
import logger from './logger';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.statusCode ?? 500;
  logger.error(err.message, { stack: err.stack });
  res.status(status).json({ error: err.message ?? 'Internal server error' });
};
EOF

# ---- src/app.ts ----

cat > "$APP_DIR/src/app.ts" <<'EOF'
// app.ts
// Express application setup. Middleware and route mounting only.
// Server startup (listen + db connect) lives in server.ts.

import express from 'express';
import { errorHandler } from './common/errorHandler';

const app = express();

app.use(express.json());

// Health check - useful for verifying the container is up before
// wiring up the full route set.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes mounted here in later sessions.

app.use(errorHandler);

export default app;
EOF

# ---- src/server.ts ----

cat > "$APP_DIR/src/server.ts" <<'EOF'
// server.ts
// Entry point. Connects to MongoDB then starts the HTTP server.
// Keeping this separate from app.ts makes the app easier to test
// without binding a port.

import { connectDb } from './common/db';
import config from './common/config';
import logger from './logger';
import app from './app';

const start = async (): Promise<void> => {
  await connectDb();
  app.listen(config.port, () => {
    logger.info('API server listening', { port: config.port });
  });
};

start();
EOF

# ---- .env.example ----
# Not used at runtime - the start script injects real values.
# Documents what the container expects.

cat > "$APP_DIR/.env.example" <<EOF
MONGO_URI=mongodb://appuser:password@${DB_IP}:27017/lawfirm?authSource=lawfirm
JWT_SECRET=change-me
PORT=3000
NODE_ENV=production
EOF

echo "[scaffold] directory structure and source files written"
echo "[scaffold] finished at $(date -Iseconds)"