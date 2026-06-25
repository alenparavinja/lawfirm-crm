import { z } from 'zod';

// Mirrors app/src/tasks/task.validation.ts. Uses only backend-valid enum
// values; the frontend Task type carries extra legacy values (normal, open,
// done) that the validator would reject on write.
export const taskPriorities = ['low', 'medium', 'high'] as const;
export const taskStatuses = ['pending', 'in_progress', 'complete'] as const;

export const taskSchema = z.object({
  title:           z.string().trim().min(1, 'Title is required'),
  assignedStaffId: z.string().min(1, 'Assign a staff member'),
  dueDate:         z.string().min(1, 'Due date is required'),
  priority:        z.enum(taskPriorities).optional(),
  status:          z.enum(taskStatuses).optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;