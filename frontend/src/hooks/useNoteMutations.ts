import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Note } from '@/types';
import type { NoteFormValues } from '@/lib/schemas/note';

export function useCreateNote(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: NoteFormValues) =>
      api.post<Note>(`/cases/${caseId}/notes`, values).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases', caseId, 'notes'] }),
  });
}

export function useUpdateNote(caseId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: NoteFormValues) =>
      api.patch<Note>(`/cases/${caseId}/notes/${id}`, values).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases', caseId, 'notes'] }),
  });
}

export function useDeleteNote(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cases/${caseId}/notes/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases', caseId, 'notes'] }),
  });
}