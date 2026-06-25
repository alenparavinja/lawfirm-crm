import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Task } from '@/types';
import type { TaskFormValues } from '@/lib/schemas/task';

export function useCreateTask(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: TaskFormValues) =>
      api.post<Task>(`/cases/${caseId}/tasks`, values).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases', caseId, 'tasks'] }),
  });
}

export function useUpdateTask(caseId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<TaskFormValues>) =>
      api.patch<Task>(`/cases/${caseId}/tasks/${id}`, values).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases', caseId, 'tasks'] }),
  });
}

export function useDeleteTask(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cases/${caseId}/tasks/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases', caseId, 'tasks'] }),
  });
}