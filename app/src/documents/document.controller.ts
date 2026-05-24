import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CaseDocument } from './document.model';

const PAGE_DEFAULT  = 1;
const LIMIT_DEFAULT = 20;

export const listDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const page  = parseInt(req.query.page  as string ?? String(PAGE_DEFAULT),  10);
    const limit = parseInt(req.query.limit as string ?? String(LIMIT_DEFAULT), 10);

    const filter: Record<string, unknown> = { caseId: req.params.caseId };
    if (req.query.documentType) filter.documentType = req.query.documentType;

    const [docs, total] = await Promise.all([
      CaseDocument.find(filter).skip((page - 1) * limit).limit(limit).sort({ uploadDate: -1 }),
      CaseDocument.countDocuments(filter),
    ]);

    res.json({ data: docs, page, limit, total });
  } catch (err) {
    next(err);
  }
};

export const getDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await CaseDocument.findOne({ _id: req.params.id, caseId: req.params.caseId });
    if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const createDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const doc = await CaseDocument.create({ ...req.body, caseId: req.params.caseId });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const updateDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const doc = await CaseDocument.findOneAndUpdate(
      { _id: req.params.id, caseId: req.params.caseId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await CaseDocument.findOneAndDelete({ _id: req.params.id, caseId: req.params.caseId });
    if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
