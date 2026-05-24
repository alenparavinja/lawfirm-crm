import { Router } from 'express';
import { listAllNotes } from './note.controller';

const router = Router();
router.get('/', listAllNotes);
export default router;
