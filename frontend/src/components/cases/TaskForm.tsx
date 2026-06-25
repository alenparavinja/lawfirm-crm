import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, taskPriorities, taskStatuses } from '@/lib/schemas/task';
import type { TaskFormValues } from '@/lib/schemas/task';
import type { Task } from '@/types';
import { useStaff } from '@/hooks/useStaff';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function toDateInput(v?: string | null): string { return v ? v.slice(0, 10) : ''; }
function refId(ref: unknown): string {
  if (typeof ref === 'string') return ref;
  if (ref && typeof ref === 'object' && '_id' in ref) return (ref as { _id: string })._id;
  return '';
}

interface Props {
  task?: Task;
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export default function TaskForm({ task, onSubmit, onCancel, submitting }: Props) {
  const { data: staffData } = useStaff({ limit: 100 });
  const staffOptions = (staffData?.data ?? []).map((s) => ({ value: s._id, label: `${s.fullName} (${s.role})` }));

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title:           task?.title ?? '',
      assignedStaffId: refId(task?.assignedStaffId),
      dueDate:         toDateInput(task?.dueDate),
      priority:        (task?.priority as TaskFormValues['priority']) ?? 'medium',
      status:          (task?.status as TaskFormValues['status']) ?? 'pending',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="assignedStaffId" render={({ field }) => (
          <FormItem>
            <FormLabel>Assigned to</FormLabel>
            <Combobox
              options={staffOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select a staff member"
              searchPlaceholder="Search staff..."
              emptyText="No staff found."
            />
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField control={form.control} name="dueDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Due date</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="priority" render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {taskPriorities.map((p) => (
                    <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {taskStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : task ? 'Save changes' : 'Add task'}
          </Button>
        </div>
      </form>
    </Form>
  );
}