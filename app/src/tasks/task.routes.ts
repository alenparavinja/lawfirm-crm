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
