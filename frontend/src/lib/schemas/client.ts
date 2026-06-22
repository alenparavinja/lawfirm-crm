import { z } from 'zod';

// Mirrors the express-validator rules in app/src/clients/client.validation.ts.
// Keep the two in sync. This schema is the single source of truth for the
// client form; a forker hardening the backend can derive server rules from it.

export const clientStatuses = ['active', 'inactive', 'closed'] as const;

export const clientSchema = z.object({
  fullName:                 z.string().trim().min(1, 'Full name is required'),
  dateOfBirth:              z.string().min(1, 'Date of birth is required'),
  countryOfOrigin:          z.string().trim().min(1, 'Country of origin is required'),
  aNumber:                  z.string().trim().min(1, 'A-number is required'),
  currentImmigrationStatus: z.string().trim().min(1, 'Immigration status is required'),
  dateOfEntry:              z.string().min(1, 'Date of entry is required'),
  email:                    z.string().trim().email('Enter a valid email'),
  phone:                    z.string().trim().min(1, 'Phone is required'),
  mailingAddress:           z.string().trim().min(1, 'Mailing address is required'),
  status:                   z.enum(clientStatuses).optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;