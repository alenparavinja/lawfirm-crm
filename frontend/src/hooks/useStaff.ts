import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginatedResponse } from '@/types';

export interface StaffMember {
  _id: string;
  fullName: string;
  role: 'attorney' | 'paralegal' | 'admin';
  email: string;
  barNumber?: string;
  active: boolean;
}

export interface StaffFilters {
  role?: string;
  active?: string;
  page?: number;
  limit?: number;
}

export function useStaff(filters: StaffFilters = {}) {
  const params = Object.fromEntries(
    Object.entries({ limit: 20, ...filters }).filter(([, v]) => v !== '' && v !== undefined)
  );

  return useQuery({
    queryKey: ['staff', params],
    queryFn: () =>
      api
        .get<PaginatedResponse<StaffMember>>('/staff', { params })
        .then((r) => r.data),
  });
}