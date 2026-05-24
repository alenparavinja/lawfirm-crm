#!/usr/bin/env bash
# scaffold-cases-children.sh
# Writes routes, controllers, and validation for cases, documents, notes, tasks.
# Run with sudo on the App Server.

set -euo pipefail

echo "[scaffold-cases-children] starting at $(date -Iseconds)"

SRC="/opt/lawfirm-crm/src"

# ---- cases/case.validation.ts ----

cat > "$SRC/cases/case.validation.ts" <<'EOF'
import { body, query } from 'express-validator';

export const createCaseRules = [
  body('caseNumber').trim().notEmpty(),
  body('title').trim().notEmpty(),
  body('clientId').isMongoId(),
  body('responsibleStaffId').isMongoId(),
  body('caseType').isIn([
    'employment_visa', 'student_visa', 'asylum', 'green_card',
    'naturalization', 'removal_defense', 'family_petition', 'other',
  ]),
  body('receiptNumber').optional().trim().notEmpty(),
  body('priorityDate').optional().isISO8601(),
  body('filingDate').optional().isISO8601(),
  body('currentStage').trim().notEmpty(),
  body('status').optional().isIn(['open', 'closed', 'on_hold']),
  body('dateOpened').optional().isISO8601(),
  body('dateClosed').optional().isISO8601(),
  body('courtId').optional().isMongoId(),
];

export const updateCaseRules = [
  body('caseNumber').optional().trim().notEmpty(),
  body('title').optional().trim().notEmpty(),
  body('clientId').optional().isMongoId(),
  body('responsibleStaffId').optional().isMongoId(),
  body('caseType').optional().isIn([
    'employment_visa', 'student_visa', 'asylum', 'green_card',
    'naturalization', 'removal_defense', 'family_petition', 'other',
  ]),
  body('receiptNumber').optional().trim().notEmpty(),
  body('priorityDate').optional().isISO8601(),
  body('filingDate').optional().isISO8601(),
  body('currentStage').optional().trim().notEmpty(),
  body('status').optional().isIn(['open', 'closed', 'on_hold']),
  body('dateClosed').optional().isISO8601(),
  body('courtId').optional().isMongoId(),
];

export const listCaseRules = [
  query('status').optional().isIn(['open', 'closed', 'on_hold']),
  query('caseType').optional().isIn([
    'employment_visa', 'student_visa', 'asylum', 'green_card',
    'naturalization', 'removal_defense', 'family_petition', 'other',
  ]),
  query('currentStage').optional().trim().notEmpty(),
  query('clientId').optional().isMongoId(),
  query('responsibleStaffId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
EOF

# ---- cases/case.controller.ts ----

cat > "$SRC/cases/case.controller.ts" <<'EOF'
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
EOF

# ---- cases/case.routes.ts ----

cat > "$SRC/cases/case.routes.ts" <<'EOF'
import { Router } from 'express';
import { listCases, getCase, createCase, updateCase, deleteCase } from './case.controller';
import { createCaseRules, updateCaseRules, listCaseRules } from './case.validation';
import documentRoutes from '../documents/document.routes';
import noteRoutes from '../notes/note.routes';
import taskRoutes from '../tasks/task.routes';

const router = Router();

router.get('/',      listCaseRules,   listCases);
router.get('/:id',                    getCase);
router.post('/',     createCaseRules, createCase);
router.patch('/:id', updateCaseRules, updateCase);
router.delete('/:id',                 deleteCase);

// Child resources nested under a case.
router.use('/:caseId/documents', documentRoutes);
router.use('/:caseId/notes',     noteRoutes);
router.use('/:caseId/tasks',     taskRoutes);

export default router;
EOF

# ---- documents/document.validation.ts ----

cat > "$SRC/documents/document.validation.ts" <<'EOF'
import { body, query } from 'express-validator';

export const createDocumentRules = [
  body('title').trim().notEmpty(),
  body('documentType').isIn([
    'court_filing', 'evidence', 'correspondence',
    'identity', 'immigration_form', 'other',
  ]),
  body('author').trim().notEmpty(),
  body('filePath').trim().notEmpty(),
  body('fileSizeBytes').isInt({ min: 0 }),
  body('uploadDate').optional().isISO8601(),
];

export const updateDocumentRules = [
  body('title').optional().trim().notEmpty(),
  body('documentType').optional().isIn([
    'court_filing', 'evidence', 'correspondence',
    'identity', 'immigration_form', 'other',
  ]),
  body('author').optional().trim().notEmpty(),
  body('filePath').optional().trim().notEmpty(),
  body('fileSizeBytes').optional().isInt({ min: 0 }),
];

export const listDocumentRules = [
  query('documentType').optional().isIn([
    'court_filing', 'evidence', 'correspondence',
    'identity', 'immigration_form', 'other',
  ]),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
EOF

# ---- documents/document.controller.ts ----

cat > "$SRC/documents/document.controller.ts" <<'EOF'
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
EOF

# ---- documents/document.routes.ts ----

cat > "$SRC/documents/document.routes.ts" <<'EOF'
import { Router } from 'express';
import {
  listDocuments, getDocument, createDocument, updateDocument, deleteDocument,
} from './document.controller';
import { createDocumentRules, updateDocumentRules, listDocumentRules } from './document.validation';

// mergeParams exposes :caseId from the parent case router.
const router = Router({ mergeParams: true });

router.get('/',      listDocumentRules,   listDocuments);
router.get('/:id',                        getDocument);
router.post('/',     createDocumentRules, createDocument);
router.patch('/:id', updateDocumentRules, updateDocument);
router.delete('/:id',                     deleteDocument);

export default router;
EOF

# ---- notes/note.validation.ts ----

cat > "$SRC/notes/note.validation.ts" <<'EOF'
import { body, query } from 'express-validator';

export const createNoteRules = [
  body('authorStaffId').isMongoId(),
  body('body').trim().notEmpty(),
];

export const updateNoteRules = [
  body('body').optional().trim().notEmpty(),
];

export const listNoteRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
EOF

# ---- notes/note.controller.ts ----

cat > "$SRC/notes/note.controller.ts" <<'EOF'
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
EOF

# ---- notes/note.routes.ts ----

cat > "$SRC/notes/note.routes.ts" <<'EOF'
import { Router } from 'express';
import { listNotes, getNote, createNote, updateNote, deleteNote } from './note.controller';
import { createNoteRules, updateNoteRules, listNoteRules } from './note.validation';

const router = Router({ mergeParams: true });

router.get('/',      listNoteRules,   listNotes);
router.get('/:id',                    getNote);
router.post('/',     createNoteRules, createNote);
router.patch('/:id', updateNoteRules, updateNote);
router.delete('/:id',                 deleteNote);

export default router;
EOF

# ---- tasks/task.validation.ts ----

cat > "$SRC/tasks/task.validation.ts" <<'EOF'
import { body, query } from 'express-validator';

export const createTaskRules = [
  body('title').trim().notEmpty(),
  body('assignedStaffId').isMongoId(),
  body('dueDate').isISO8601(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['pending', 'in_progress', 'complete']),
];

export const updateTaskRules = [
  body('title').optional().trim().notEmpty(),
  body('assignedStaffId').optional().isMongoId(),
  body('dueDate').optional().isISO8601(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['pending', 'in_progress', 'complete']),
];

export const listTaskRules = [
  query('status').optional().isIn(['pending', 'in_progress', 'complete']),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
EOF

# ---- tasks/task.controller.ts ----

cat > "$SRC/tasks/task.controller.ts" <<'EOF'
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
EOF

# ---- tasks/task.routes.ts ----

cat > "$SRC/tasks/task.routes.ts" <<'EOF'
import { Router } from 'express';
import { listTasks, getTask, createTask, updateTask, deleteTask } from './task.controller';
import { createTaskRules, updateTaskRules, listTaskRules } from './task.validation';

const router = Router({ mergeParams: true });

router.get('/',      listTaskRules,   listTasks);
router.get('/:id',                    getTask);
router.post('/',     createTaskRules, createTask);
router.patch('/:id', updateTaskRules, updateTask);
router.delete('/:id',                 deleteTask);

export default router;
EOF

chown -R ubuntu:ubuntu /opt/lawfirm-crm

echo "[scaffold-cases-children] finished at $(date -Iseconds)"