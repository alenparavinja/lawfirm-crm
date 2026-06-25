import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Case } from '@/types';
import type { CaseFormValues } from '@/lib/schemas/case';

// Strip empty-string optionals so they are omitted from the payload rather
// than sent as '' (which fails the backend isISO8601 / notEmpty checks).
function clean(values: Partial<CaseFormValues>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== '' && v !== undefined)
  );
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CaseFormValues) =>
      api.post<Case>('/cases', clean(values)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useUpdateCase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<CaseFormValues>) =>
      api.patch<Case>(`/cases/${id}`, clean(values)).then((r) => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['cases'] });
      qc.setQueryData(['cases', id], updated);
    },
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cases/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}