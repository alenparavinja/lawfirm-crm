import { Router } from 'express';
import { listAllTasks } from './task.controller';

const router = Router();
router.get('/', listAllTasks);
export default router;
