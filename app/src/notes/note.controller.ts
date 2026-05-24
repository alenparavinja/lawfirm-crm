import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Note } from './note.model';

const PAGE_DEFAULT  = 1;
const LIMIT_DEFAULT = 20;

const POPULATE = { path: 'authorStaffId', select: 'fullName role -_id' };

export const listNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const page  = parseInt(req.query.page  as string ?? String(PAGE_DEFAULT),  10);
    const limit = parseInt(req.query.limit as string ?? String(LIMIT_DEFAULT), 10);

    const [notes, total] = await Promise.all([
      Note.find({ caseId: req.params.caseId }).populate(POPULATE).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
      Note.countDocuments({ caseId: req.params.caseId }),
    ]);

    res.json({ data: notes, page, limit, total });
  } catch (err) {
    next(err);
  }
};

export const getNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const note = await Note.findOne({ _id: req.params.id, caseId: req.params.caseId }).populate(POPULATE);
    if (!note) { res.status(404).json({ error: 'Note not found' }); return; }
    res.json(note);
  } catch (err) {
    next(err);
  }
};

export const createNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const note = await Note.create({ ...req.body, caseId: req.params.caseId });
    res.status(201).json(await note.populate(POPULATE));
  } catch (err) {
    next(err);
  }
};

export const updateNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, caseId: req.params.caseId },
      { body: req.body.body },
      { new: true, runValidators: true }
    ).populate(POPULATE);
    if (!note) { res.status(404).json({ error: 'Note not found' }); return; }
    res.json(note);
  } catch (err) {
    next(err);
  }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, caseId: req.params.caseId });
    if (!note) { res.status(404).json({ error: 'Note not found' }); return; }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const listAllNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page  = parseInt(req.query.page  as string ?? String(PAGE_DEFAULT),  10);
    const limit = Math.min(parseInt(req.query.limit as string ?? String(LIMIT_DEFAULT), 10), 100);
    const [notes, total] = await Promise.all([
      Note.find().populate(POPULATE).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
      Note.countDocuments(),
    ]);
    res.json({ data: notes, page, limit, total });
  } catch (err) {
    next(err);
  }
};
