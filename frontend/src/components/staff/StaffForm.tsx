import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { staffSchema, staffRoles } from '@/lib/schemas/staff';
import type { StaffFormValues } from '@/lib/schemas/staff';
import type { StaffMember } from '@/hooks/useStaff';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const ROLE_LABELS: Record<string, string> = {
  attorney: 'Attorney', paralegal: 'Paralegal', admin: 'Admin',
};

interface Props {
  member?: StaffMember;
  onSubmit: (values: StaffFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export default function StaffForm({ member, onSubmit, onCancel, submitting }: Props) {
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      fullName:  member?.fullName ?? '',
      role:      member?.role ?? 'attorney',
      email:     member?.email ?? '',
      barNumber: member?.barNumber ?? '',
      biography: member?.biography ?? '',
      active:    member?.active ?? true,
    },
  });

  const role = form.watch('role');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Full name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {staffRoles.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {role === 'attorney' && (
            <FormField control={form.control} name="barNumber" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Bar number</FormLabel>
                <FormControl><Input placeholder="NY-2018-44521" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}

          <FormField control={form.control} name="biography" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Biography</FormLabel>
              <FormControl><Textarea rows={4} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : member ? 'Save changes' : 'Add staff'}
          </Button>
        </div>
      </form>
    </Form>
  );
}