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
