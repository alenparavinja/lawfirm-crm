import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Task, PaginatedResponse } from '@/types';

export function useCaseTasks(caseId: string) {
  return useQuery({
    queryKey: ['cases', caseId, 'tasks'],
    queryFn: () =>
      api
        .get<PaginatedResponse<Task>>(`/cases/${caseId}/tasks`, { params: { limit: 50 } })
        .then((r) => r.data.data),
    enabled: !!caseId,
  });
}