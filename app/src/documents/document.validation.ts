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
