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
