#!/usr/bin/env bash
# scaffold-auth.sh
# Writes auth routes, controller, and middleware under /opt/lawfirm-crm/src/auth.
# Run with sudo on the App Server.

set -euo pipefail

echo "[scaffold-auth] starting at $(date -Iseconds)"

SRC="/opt/lawfirm-crm/src"

# ---- auth/auth.middleware.ts ----

cat > "$SRC/auth/auth.middleware.ts" <<'EOF'
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
EOF

# ---- auth/auth.controller.ts ----

cat > "$SRC/auth/auth.controller.ts" <<'EOF'
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Staff } from '../staff/staff.model';
import config from '../common/config';

const TOKEN_TTL = '24h';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const { email, password } = req.body as { email: string; password: string };

    // Select passwordHash explicitly - it is excluded from all other queries.
    const staff = await Staff.findOne({ email }).select('+passwordHash');
    if (!staff || !staff.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!staff.active) {
      res.status(403).json({ error: 'Account is inactive' });
      return;
    }

    const match = await bcrypt.compare(password, staff.passwordHash);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { sub: staff._id.toString(), role: staff.role },
      config.jwtSecret,
      { expiresIn: TOKEN_TTL }
    );

    res.json({
      token,
      staff: {
        id:       staff._id,
        fullName: staff.fullName,
        role:     staff.role,
        email:    staff.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // staffId is set by requireAuth middleware.
    const staffId = (req as any).staffId;
    const staff = await Staff.findById(staffId);
    if (!staff) { res.status(404).json({ error: 'Staff member not found' }); return; }
    res.json(staff);
  } catch (err) {
    next(err);
  }
};
EOF

# ---- auth/auth.routes.ts ----

cat > "$SRC/auth/auth.routes.ts" <<'EOF'
import { Router } from 'express';
import { body } from 'express-validator';
import { login, me } from './auth.controller';
import { requireAuth } from './auth.middleware';

const router = Router();

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

// Returns the authenticated staff member's own record.
router.get('/me', requireAuth, me);

export default router;
EOF

chown -R ubuntu:ubuntu /opt/lawfirm-crm

echo "[scaffold-auth] finished at $(date -Iseconds)"