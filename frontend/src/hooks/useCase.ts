import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Case } from '@/types';

export function useCase(id: string) {
  return useQuery({
    queryKey: ['cases', id],
    queryFn: () => api.get<Case>(`/cases/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}