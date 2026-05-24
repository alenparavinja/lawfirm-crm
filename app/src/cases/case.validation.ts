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
