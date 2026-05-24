import { useQueries } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Case, Note, PaginatedResponse } from '@/types';

// All dashboard data in one hook. Six requests fire in parallel.
// staleTime inherited from queryClient defaults (5 min).
export function useDashboard() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['clients', 'active-count'],
        queryFn: () =>
          api
            .get<PaginatedResponse<unknown>>('/clients', { params: { status: 'active', limit: 1 } })
            .then((r) => r.data.total),
      },
      {
        queryKey: ['cases', 'open-count'],
        queryFn: () =>
          api
            .get<PaginatedResponse<unknown>>('/cases', { params: { status: 'open', limit: 1 } })
            .then((r) => r.data.total),
      },
      {
        queryKey: ['cases', 'pending-count'],
        queryFn: () =>
          api
            .get<PaginatedResponse<unknown>>('/cases', { params: { status: 'on_hold', limit: 1 } })
            .then((r) => r.data.total),
      },
      {
        queryKey: ['cases', 'all-for-charts'],
        queryFn: () =>
          api
            .get<PaginatedResponse<Case>>('/cases', { params: { limit: 100 } })
            .then((r) => r.data.data),
      },
      {
        queryKey: ['tasks', 'pending-count'],
        queryFn: () =>
          api
            .get<PaginatedResponse<unknown>>('/tasks', { params: { status: 'pending', limit: 1 } })
            .then((r) => r.data.total),
      },
      {
        queryKey: ['notes', 'recent'],
        queryFn: () =>
          api
            .get<PaginatedResponse<Note>>('/notes', { params: { limit: 8 } })
            .then((r) => r.data.data),
      },
    ],
  });

  const [activeClients, openCases, pendingCases, allCases, pendingTasks, recentNotes] = results;

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  // Derive stage distribution from all cases.
  const stageDistribution = allCases.data
    ? Object.entries(
        allCases.data.reduce<Record<string, number>>((acc, c) => {
          acc[c.currentStage] = (acc[c.currentStage] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([stage, count]) => ({ stage, count }))
    : [];

  // Derive type distribution from all cases.
  const typeDistribution = allCases.data
    ? Object.entries(
        allCases.data.reduce<Record<string, number>>((acc, c) => {
          acc[c.caseType] = (acc[c.caseType] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([type, count]) => ({ type, count }))
    : [];

  return {
    isLoading,
    isError,
    activeClients: activeClients.data ?? 0,
    openCases: openCases.data ?? 0,
    pendingCases: pendingCases.data ?? 0,
    pendingTasks: pendingTasks.data ?? 0,
    recentNotes: recentNotes.data ?? [],
    stageDistribution,
    typeDistribution,
  };
}