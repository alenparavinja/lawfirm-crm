import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Note, PaginatedResponse } from '@/types';

export function useCaseNotes(caseId: string) {
  return useQuery({
    queryKey: ['cases', caseId, 'notes'],
    queryFn: () =>
      api
        .get<PaginatedResponse<Note>>(`/cases/${caseId}/notes`, { params: { limit: 50 } })
        .then((r) => r.data.data),
    enabled: !!caseId,
  });
}