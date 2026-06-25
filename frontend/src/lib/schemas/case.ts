import { z } from 'zod';

// Mirrors app/src/cases/case.validation.ts. caseType is a strict enum;
// currentStage is validated server-side as a non-empty string (not an enum),
// so the known stages below are a UX convenience, not a hard contract.
// courtId is omitted: the courts collection is Tier 2 and unseeded.

export const caseTypes = [
  'employment_visa', 'student_visa', 'asylum', 'green_card',
  'naturalization', 'removal_defense', 'family_petition', 'other',
] as const;

export const caseStages = [
  'consultation', 'preparing', 'filed', 'rfe_received',
  'interview_scheduled', 'approved', 'denied', 'appeal',
] as const;

export const caseStatuses = ['open', 'closed', 'on_hold'] as const;

export const caseSchema = z.object({
  caseNumber:         z.string().trim().min(1, 'Case number is required'),
  title:              z.string().trim().min(1, 'Title is required'),
  clientId:           z.string().min(1, 'Select a client'),
  responsibleStaffId: z.string().min(1, 'Select a responsible staff member'),
  caseType:           z.enum(caseTypes),
  currentStage:       z.string().trim().min(1, 'Stage is required'),
  status:             z.enum(caseStatuses).optional(),
  receiptNumber:      z.string().trim().optional().or(z.literal('')),
  priorityDate:       z.string().optional().or(z.literal('')),
  filingDate:         z.string().optional().or(z.literal('')),
  dateOpened:         z.string().optional().or(z.literal('')),
  dateClosed:         z.string().optional().or(z.literal('')),
});

export type CaseFormValues = z.infer<typeof caseSchema>;