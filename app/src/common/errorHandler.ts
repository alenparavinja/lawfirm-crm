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
