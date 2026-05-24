import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Task } from './task.model';

const PAGE_DEFAULT  = 1;
const LIMIT_DEFAULT = 20;

const POPULATE = { path: 'assignedStaffId', select: 'fullName role -_id' };

export const listTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const page  = parseInt(req.query.page  as string ?? String(PAGE_DEFAULT),  10);
    const limit = parseInt(req.query.limit as string ?? String(LIMIT_DEFAULT), 10);

    const filter: Record<string, unknown> = { caseId: req.params.caseId };
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const [tasks, total] = await Promise.all([
      Task.find(filter).populate(POPULATE).skip((page - 1) * limit).limit(limit).sort({ dueDate: 1 }),
      Task.countDocuments(filter),
    ]);

    res.json({ data: tasks, page, limit, total });
  } catch (err) {
    next(err);
  }
};

export const getTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findOne({ _id: req.params.id, caseId: req.params.caseId }).populate(POPULATE);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const task = await Task.create({ ...req.body, caseId: req.params.caseId });
    res.status(201).json(await task.populate(POPULATE));
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, caseId: req.params.caseId },
      req.body,
      { new: true, runValidators: true }
    ).populate(POPULATE);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, caseId: req.params.caseId });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const listAllTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page  = parseInt(req.query.page  as string ?? String(PAGE_DEFAULT),  10);
    const limit = Math.min(parseInt(req.query.limit as string ?? String(LIMIT_DEFAULT), 10), 100);
    const filter: Record<string, unknown> = {};
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    const [tasks, total] = await Promise.all([
      Task.find(filter).populate(POPULATE).skip((page - 1) * limit).limit(limit).sort({ dueDate: 1 }),
      Task.countDocuments(filter),
    ]);
    res.json({ data: tasks, page, limit, total });
  } catch (err) {
    next(err);
  }
};
