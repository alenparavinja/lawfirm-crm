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
