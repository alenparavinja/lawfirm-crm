// db.ts
// Mongoose connection. MONGO_URI is injected by the host start script at
// container launch time after fetching the credential from Secrets Manager.
// The app itself has no AWS dependency.

import mongoose from 'mongoose';
import config from './config';
import logger from './logger';

export const connectDb = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection failed', { err });
    process.exit(1);
  }
};
