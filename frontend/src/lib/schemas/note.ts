import { z } from 'zod';

// Mirrors app/src/notes/note.validation.ts. authorStaffId is NOT here:
// the server derives the author from the authenticated user (JWT), so the
// client only submits the body.
export const noteSchema = z.object({
  body: z.string().trim().min(1, 'Note cannot be empty'),
});

export type NoteFormValues = z.infer<typeof noteSchema>;