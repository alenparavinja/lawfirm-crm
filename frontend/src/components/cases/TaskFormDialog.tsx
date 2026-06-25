import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import TaskForm from './TaskForm';
import { useCreateTask, useUpdateTask } from '@/hooks/useTaskMutations';
import type { Task } from '@/types';
import type { TaskFormValues } from '@/lib/schemas/task';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  task?: Task;
}

export default function TaskFormDialog({ open, onOpenChange, caseId, task }: Props) {
  const { toast } = useToast();
  const create = useCreateTask(caseId);
  const update = useUpdateTask(caseId, task?._id ?? '');
  const mutation = task ? update : create;

  function handleSubmit(values: TaskFormValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast({ description: task ? 'Task updated.' : 'Task added.' });
        onOpenChange(false);
      },
      onError: () => {
        toast({ variant: 'destructive', description: 'Could not save the task. Check the fields and try again.' });
      },
    });
  }

  useEffect(() => { if (!open) { create.reset(); update.reset(); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'Add task'}</DialogTitle>
        </DialogHeader>
        <TaskForm
          task={task}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitting={mutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}