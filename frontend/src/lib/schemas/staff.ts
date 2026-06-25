import { z } from 'zod';

// Mirrors app/src/staff/staff.validation.ts. passwordHash is not handled here;
// new staff get no login password through this form (a production seam).
export const staffRoles = ['attorney', 'paralegal', 'admin'] as const;

export const staffSchema = z.object({
  fullName:  z.string().trim().min(1, 'Full name is required'),
  role:      z.enum(staffRoles),
  email:     z.string().trim().email('Enter a valid email'),
  barNumber: z.string().trim().optional().or(z.literal('')),
  biography: z.string().trim().optional().or(z.literal('')),
  active:    z.boolean().optional(),
});

export type StaffFormValues = z.infer<typeof staffSchema>;