import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../common/config';

export interface AuthRequest extends Request {
  staffId?: string;
  staffRole?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; role: string };
    req.staffId   = payload.sub;
    req.staffRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
