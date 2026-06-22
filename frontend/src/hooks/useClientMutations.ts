import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Client } from '@/types';
import type { ClientFormValues } from '@/lib/schemas/client';

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ClientFormValues) =>
      api.post<Client>('/clients', values).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<ClientFormValues>) =>
      api.patch<Client>(`/clients/${id}`, values).then((r) => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.setQueryData(['clients', id], updated);
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}