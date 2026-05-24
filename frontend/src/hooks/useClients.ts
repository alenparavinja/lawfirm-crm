import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Client, PaginatedResponse } from '@/types';

export interface ClientFilters {
  status?: string;
  countryOfOrigin?: string;
  currentImmigrationStatus?: string;
  page?: number;
  limit?: number;
}

export function useClients(filters: ClientFilters = {}) {
  const params = Object.fromEntries(
    Object.entries({ limit: 12, ...filters }).filter(([, v]) => v !== '' && v !== undefined)
  );

  return useQuery({
    queryKey: ['clients', params],
    queryFn: () =>
      api
        .get<PaginatedResponse<Client>>('/clients', { params })
        .then((r) => r.data),
  });
}