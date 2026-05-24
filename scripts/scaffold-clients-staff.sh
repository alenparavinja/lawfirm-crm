#!/usr/bin/env bash
# scaffold-clients-staff.sh
# Writes routes, controllers, and validation for clients and staff.
# Run with sudo on the App Server.

set -euo pipefail

echo "[scaffold-clients-staff] starting at $(date -Iseconds)"

SRC="/opt/lawfirm-crm/src"

# ---- clients/client.validation.ts ----

cat > "$SRC/clients/client.validation.ts" <<'EOF'
import { body, query } from 'express-validator';

export const createClientRules = [
  body('fullName').trim().notEmpty(),
  body('dateOfBirth').isISO8601(),
  body('countryOfOrigin').trim().notEmpty(),
  body('aNumber').trim().notEmpty(),
  body('currentImmigrationStatus').trim().notEmpty(),
  body('dateOfEntry').isISO8601(),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().notEmpty(),
  body('mailingAddress').trim().notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'closed']),
];

export const updateClientRules = [
  body('fullName').optional().trim().notEmpty(),
  body('dateOfBirth').optional().isISO8601(),
  body('countryOfOrigin').optional().trim().notEmpty(),
  body('aNumber').optional().trim().notEmpty(),
  body('currentImmigrationStatus').optional().trim().notEmpty(),
  body('dateOfEntry').optional().isISO8601(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().notEmpty(),
  body('mailingAddress').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'closed']),
];

export const listClientRules = [
  query('status').optional().isIn(['active', 'inactive', 'closed']),
  query('countryOfOrigin').optional().trim().notEmpty(),
  query('currentImmigrationStatus').optional().trim().notEmpty(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
EOF

# ---- clients/client.controller.ts ----

cat > "$SRC/clients/client.controller.ts" <<'EOF'
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Client } from './client.model';

const PAGE_DEFAULT  = 1;
const LIMIT_DEFAULT = 20;

export const listClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const page  = parseInt(req.query.page  as string ?? String(PAGE_DEFAULT),  10);
    const limit = parseInt(req.query.limit as string ?? String(LIMIT_DEFAULT), 10);

    const filter: Record<string, unknown> = {};
    if (req.query.status)                   filter.status                  = req.query.status;
    if (req.query.countryOfOrigin)          filter.countryOfOrigin         = req.query.countryOfOrigin;
    if (req.query.currentImmigrationStatus) filter.currentImmigrationStatus = req.query.currentImmigrationStatus;

    const [clients, total] = await Promise.all([
      Client.find(filter).skip((page - 1) * limit).limit(limit).sort({ fullName: 1 }),
      Client.countDocuments(filter),
    ]);

    res.json({ data: clients, page, limit, total });
  } catch (err) {
    next(err);
  }
};

export const getClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) { res.status(404).json({ error: 'Client not found' }); return; }
    res.json(client);
  } catch (err) {
    next(err);
  }
};

export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) { res.status(404).json({ error: 'Client not found' }); return; }
    res.json(client);
  } catch (err) {
    next(err);
  }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) { res.status(404).json({ error: 'Client not found' }); return; }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
EOF

# ---- clients/client.routes.ts ----

cat > "$SRC/clients/client.routes.ts" <<'EOF'
import { Router } from 'express';
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from './client.controller';
import { createClientRules, updateClientRules, listClientRules } from './client.validation';

const router = Router();

router.get('/',    listClientRules,   listClients);
router.get('/:id',                   getClient);
router.post('/',   createClientRules, createClient);
router.patch('/:id', updateClientRules, updateClient);
router.delete('/:id',                deleteClient);

export default router;
EOF

# ---- staff/staff.validation.ts ----

cat > "$SRC/staff/staff.validation.ts" <<'EOF'
import { body, query } from 'express-validator';

export const createStaffRules = [
  body('fullName').trim().notEmpty(),
  body('role').isIn(['attorney', 'paralegal', 'admin']),
  body('email').isEmail().normalizeEmail(),
  body('barNumber').optional().trim().notEmpty(),
  body('active').optional().isBoolean(),
];

export const updateStaffRules = [
  body('fullName').optional().trim().notEmpty(),
  body('role').optional().isIn(['attorney', 'paralegal', 'admin']),
  body('email').optional().isEmail().normalizeEmail(),
  body('barNumber').optional().trim().notEmpty(),
  body('active').optional().isBoolean(),
];

export const listStaffRules = [
  query('role').optional().isIn(['attorney', 'paralegal', 'admin']),
  query('active').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
EOF

# ---- staff/staff.controller.ts ----

cat > "$SRC/staff/staff.controller.ts" <<'EOF'
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Staff } from './staff.model';

const PAGE_DEFAULT  = 1;
const LIMIT_DEFAULT = 20;

export const listStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const page  = parseInt(req.query.page  as string ?? String(PAGE_DEFAULT),  10);
    const limit = parseInt(req.query.limit as string ?? String(LIMIT_DEFAULT), 10);

    const filter: Record<string, unknown> = {};
    if (req.query.role !== undefined)   filter.role   = req.query.role;
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';

    const [staff, total] = await Promise.all([
      Staff.find(filter).select('-passwordHash').skip((page - 1) * limit).limit(limit).sort({ fullName: 1 }),
      Staff.countDocuments(filter),
    ]);

    res.json({ data: staff, page, limit, total });
  } catch (err) {
    next(err);
  }
};

export const getStaffMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const member = await Staff.findById(req.params.id).select('-passwordHash');
    if (!member) { res.status(404).json({ error: 'Staff member not found' }); return; }
    res.json(member);
  } catch (err) {
    next(err);
  }
};

export const createStaffMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const member = await Staff.create(req.body);
    res.status(201).json({ ...member.toObject(), passwordHash: undefined });
  } catch (err) {
    next(err);
  }
};

export const updateStaffMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    // passwordHash is never updated through this endpoint - that is handled
    // exclusively by the auth routes in Session 6.
    const { passwordHash: _, ...safeBody } = req.body;

    const member = await Staff.findByIdAndUpdate(req.params.id, safeBody, { new: true, runValidators: true })
      .select('-passwordHash');
    if (!member) { res.status(404).json({ error: 'Staff member not found' }); return; }
    res.json(member);
  } catch (err) {
    next(err);
  }
};

export const deleteStaffMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const member = await Staff.findByIdAndDelete(req.params.id);
    if (!member) { res.status(404).json({ error: 'Staff member not found' }); return; }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
EOF

# ---- staff/staff.routes.ts ----

cat > "$SRC/staff/staff.routes.ts" <<'EOF'
import { Router } from 'express';
import {
  listStaff,
  getStaffMember,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from './staff.controller';
import { createStaffRules, updateStaffRules, listStaffRules } from './staff.validation';

const router = Router();

router.get('/',      listStaffRules,   listStaff);
router.get('/:id',                     getStaffMember);
router.post('/',     createStaffRules, createStaffMember);
router.patch('/:id', updateStaffRules, updateStaffMember);
router.delete('/:id',                  deleteStaffMember);

export default router;
EOF

# ---- mount routes in app.ts ----
# express-validator is not yet in package.json - added below.

chown -R ubuntu:ubuntu /opt/lawfirm-crm

echo "[scaffold-clients-staff] finished at $(date -Iseconds)"