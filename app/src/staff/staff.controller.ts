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
