import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { noteSchema } from '@/lib/schemas/note';
import type { NoteFormValues } from '@/lib/schemas/note';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Props {
  defaultBody?: string;
  onSubmit: (values: NoteFormValues) => void;
  onCancel?: () => void;
  submitting?: boolean;
  submitLabel?: string;
}

export default function NoteForm({ defaultBody = '', onSubmit, onCancel, submitting, submitLabel = 'Add note' }: Props) {
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { body: defaultBody },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <FormField control={form.control} name="body" render={({ field }) => (
          <FormItem>
            <FormControl><Textarea rows={3} placeholder="Add a note..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex justify-end gap-2">
          {onCancel && <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}