import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Case } from './case.model';

const PAGE_DEFAULT  = 1;
const LIMIT_DEFAULT = 20;

const POPULATE = [
  { path: 'clientId',           select: '-__v' },
  { path: 'responsibleStaffId', select: '-__v -passwordHash' },
];

export const listCases = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const page  = parseInt(req.query.page  as string ?? String(PAGE_DEFAULT),  10);
    const limit = parseInt(req.query.limit as string ?? String(LIMIT_DEFAULT), 10);

    const filter: Record<string, unknown> = {};
    if (req.query.status)             filter.status             = req.query.status;
    if (req.query.caseType)           filter.caseType           = req.query.caseType;
    if (req.query.currentStage)       filter.currentStage       = req.query.currentStage;
    if (req.query.clientId)           filter.clientId           = req.query.clientId;
    if (req.query.responsibleStaffId) filter.responsibleStaffId = req.query.responsibleStaffId;

    const [cases, total] = await Promise.all([
      Case.find(filter).populate(POPULATE).skip((page - 1) * limit).limit(limit).sort({ dateOpened: -1 }),
      Case.countDocuments(filter),
    ]);

    res.json({ data: cases, page, limit, total });
  } catch (err) {
    next(err);
  }
};

export const getCase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await Case.findById(req.params.id).populate(POPULATE);
    if (!doc) { res.status(404).json({ error: 'Case not found' }); return; }
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const createCase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const doc = await Case.create(req.body);
    res.status(201).json(await doc.populate(POPULATE));
  } catch (err) {
    next(err);
  }
};

export const updateCase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const doc = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate(POPULATE);
    if (!doc) { res.status(404).json({ error: 'Case not found' }); return; }
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const deleteCase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await Case.findByIdAndDelete(req.params.id);
    if (!doc) { res.status(404).json({ error: 'Case not found' }); return; }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
