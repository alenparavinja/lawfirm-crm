import { body, query } from 'express-validator';

export const createStaffRules = [
  body('fullName').trim().notEmpty(),
  body('role').isIn(['attorney', 'paralegal', 'admin']),
  body('email').isEmail().normalizeEmail(),
  body('barNumber').optional().trim().notEmpty(),
  body('active').optional().isBoolean(),
];

export const updateStaffRules = [
  body('fullName').optional().trim().notEmpty(),
  body('role').optional().isIn(['attorney', 'paralegal', 'admin']),
  body('email').optional().isEmail().normalizeEmail(),
  body('barNumber').optional().trim().notEmpty(),
  body('active').optional().isBoolean(),
];

export const listStaffRules = [
  query('role').optional().isIn(['attorney', 'paralegal', 'admin']),
  query('active').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
