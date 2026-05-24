import { body, query } from 'express-validator';

export const createClientRules = [
  body('fullName').trim().notEmpty(),
  body('dateOfBirth').isISO8601(),
  body('countryOfOrigin').trim().notEmpty(),
  body('aNumber').trim().notEmpty(),
  body('currentImmigrationStatus').trim().notEmpty(),
  body('dateOfEntry').isISO8601(),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().notEmpty(),
  body('mailingAddress').trim().notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'closed']),
];

export const updateClientRules = [
  body('fullName').optional().trim().notEmpty(),
  body('dateOfBirth').optional().isISO8601(),
  body('countryOfOrigin').optional().trim().notEmpty(),
  body('aNumber').optional().trim().notEmpty(),
  body('currentImmigrationStatus').optional().trim().notEmpty(),
  body('dateOfEntry').optional().isISO8601(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().notEmpty(),
  body('mailingAddress').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'closed']),
];

export const listClientRules = [
  query('status').optional().isIn(['active', 'inactive', 'closed']),
  query('countryOfOrigin').optional().trim().notEmpty(),
  query('currentImmigrationStatus').optional().trim().notEmpty(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
