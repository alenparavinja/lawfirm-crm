import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { StaffMember } from '@/hooks/useStaff';
import type { StaffFormValues } from '@/lib/schemas/staff';

function clean(values: Partial<StaffFormValues>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== '' && v !== undefined)
  );
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: StaffFormValues) =>
      api.post<StaffMember>('/staff', clean(values)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateStaff(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<StaffFormValues>) =>
      api.patch<StaffMember>(`/staff/${id}`, clean(values)).then((r) => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.setQueryData(['staff', id], updated);
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}