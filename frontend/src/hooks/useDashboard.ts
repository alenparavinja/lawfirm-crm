import { useQueries } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Case, Note, Task, PaginatedResponse } from '@/types';

// All dashboard data in one hook. Requests fire in parallel.
// staleTime inherited from queryClient defaults (5 min).
//
// Pending tasks are defined as pending plus in_progress (everything not
// complete). The API filters by a single status value, so the count is two
// queries summed, and the upcoming-tasks strip fetches by due date and drops
// complete client-side. Both halves use the same definition so the count and
// the list cannot disagree.
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
        queryKey: ['cases', 'on-hold-count'],
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
        queryKey: ['tasks', 'in-progress-count'],
        queryFn: () =>
          api
            .get<PaginatedResponse<unknown>>('/tasks', { params: { status: 'in_progress', limit: 1 } })
            .then((r) => r.data.total),
      },
      {
        queryKey: ['notes', 'recent'],
        queryFn: () =>
          api
            .get<PaginatedResponse<Note>>('/notes', { params: { limit: 8 } })
            .then((r) => r.data.data),
      },
      {
        // Fetch a page sorted by due date and drop complete below. Pull more
        // than the strip shows so filtering out complete still leaves enough.
        queryKey: ['tasks', 'upcoming'],
        queryFn: () =>
          api
            .get<PaginatedResponse<Task>>('/tasks', { params: { limit: 25 } })
            .then((r) => r.data.data),
      },
    ],
  });

  const [
    activeClients,
    openCases,
    onHoldCases,
    allCases,
    pendingTaskCount,
    inProgressTaskCount,
    recentNotes,
    upcomingTasksRaw,
  ] = results;

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

  // Not-complete tasks, soonest due first, capped for the strip. The endpoint
  // already sorts by due date ascending; the filter just removes complete.
  const upcomingTasks = (upcomingTasksRaw.data ?? [])
    .filter((t) => t.status !== 'complete')
    .slice(0, 6);

  return {
    isLoading,
    isError,
    activeClients: activeClients.data ?? 0,
    openCases: openCases.data ?? 0,
    onHoldCases: onHoldCases.data ?? 0,
    pendingTasks: (pendingTaskCount.data ?? 0) + (inProgressTaskCount.data ?? 0),
    recentNotes: recentNotes.data ?? [],
    upcomingTasks,
    stageDistribution,
    typeDistribution,
  };
}