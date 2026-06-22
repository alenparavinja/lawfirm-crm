import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, clientStatuses } from '@/lib/schemas/client';
import type { ClientFormValues } from '@/lib/schemas/client';
import type { Client } from '@/types';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Trims an ISO datetime ("1990-05-12T00:00:00.000Z") to the "YYYY-MM-DD" a
// native date input expects. Returns '' for missing values.
function toDateInput(value?: string): string {
  return value ? value.slice(0, 10) : '';
}

interface Props {
  // When present, the form is in edit mode and pre-fills from this client.
  client?: Client;
  onSubmit: (values: ClientFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export default function ClientForm({ client, onSubmit, onCancel, submitting }: Props) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName:                 client?.fullName ?? '',
      dateOfBirth:              toDateInput(client?.dateOfBirth),
      countryOfOrigin:          client?.countryOfOrigin ?? '',
      aNumber:                  client?.aNumber ?? '',
      currentImmigrationStatus: client?.currentImmigrationStatus ?? '',
      dateOfEntry:              toDateInput(client?.dateOfEntry),
      email:                    client?.email ?? '',
      phone:                    client?.phone ?? '',
      mailingAddress:           client?.mailingAddress ?? '',
      status:                   client?.status ?? 'active',
    },
  });

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

          <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
            <FormItem>
              <FormLabel>Date of birth</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="dateOfEntry" render={({ field }) => (
            <FormItem>
              <FormLabel>Date of entry</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="countryOfOrigin" render={({ field }) => (
            <FormItem>
              <FormLabel>Country of origin</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="aNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>A-number</FormLabel>
              <FormControl><Input placeholder="A123456789" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="currentImmigrationStatus" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Current immigration status</FormLabel>
              <FormControl><Input placeholder="F-1 student, none / undocumented, ..." {...field} /></FormControl>
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

          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="mailingAddress" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Mailing address</FormLabel>
              <FormControl><Textarea rows={2} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clientStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
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
            {submitting ? 'Saving...' : client ? 'Save changes' : 'Add client'}
          </Button>
        </div>
      </form>
    </Form>
  );
}