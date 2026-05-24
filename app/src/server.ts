// server.ts
// Entry point. Connects to MongoDB then starts the HTTP server.
// Keeping this separate from app.ts makes the app easier to test
// without binding a port.

import { connectDb } from './common/db';
import config from './common/config';
import logger from './common/logger';
import app from './app';

const start = async (): Promise<void> => {
  await connectDb();
  app.listen(config.port, () => {
    logger.info('API server listening', { port: config.port });
  });
};

start();
