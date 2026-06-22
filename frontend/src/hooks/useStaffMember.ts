import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { StaffMember } from '@/hooks/useStaff';

// Fetches a single staff member's full detail, which includes biography.
// The list endpoint omits biography, so the modal needs this separate fetch.
export function useStaffMember(id: string | null) {
  return useQuery({
    queryKey: ['staff', id],
    queryFn: () => api.get<StaffMember>(`/staff/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}