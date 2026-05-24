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
