import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Case, PaginatedResponse } from '@/types';

export interface CaseFilters {
  status?: string;
  caseType?: string;
  currentStage?: string;
  page?: number;
  limit?: number;
}

export function useCases(filters: CaseFilters = {}) {
  const params = Object.fromEntries(
    Object.entries({ limit: 12, ...filters }).filter(([, v]) => v !== '' && v !== undefined)
  );

  return useQuery({
    queryKey: ['cases', params],
    queryFn: () =>
      api
        .get<PaginatedResponse<Case>>('/cases', { params })
        .then((r) => r.data),
  });
}