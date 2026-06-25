import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { caseSchema, caseTypes, caseStages, caseStatuses } from '@/lib/schemas/case';
import type { CaseFormValues } from '@/lib/schemas/case';
import type { Case } from '@/types';
import { useClients } from '@/hooks/useClients';
import { useStaff } from '@/hooks/useStaff';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const TYPE_LABELS: Record<string, string> = {
  employment_visa: 'Employment Visa', student_visa: 'Student Visa', asylum: 'Asylum',
  green_card: 'Green Card', naturalization: 'Naturalization', removal_defense: 'Removal Defense',
  family_petition: 'Family Petition', other: 'Other',
};
const STAGE_LABELS: Record<string, string> = {
  consultation: 'Consultation', preparing: 'Preparing', filed: 'Filed',
  rfe_received: 'RFE Received', interview_scheduled: 'Interview Scheduled',
  approved: 'Approved', denied: 'Denied', appeal: 'Appeal',
};

function toDateInput(v?: string | null): string {
  return v ? v.slice(0, 10) : '';
}

// A populated case reference may be an object or a bare id string.
function refId(ref: unknown): string {
  if (typeof ref === 'string') return ref;
  if (ref && typeof ref === 'object' && '_id' in ref) return (ref as { _id: string })._id;
  return '';
}

interface Props {
  case_?: Case;
  onSubmit: (values: CaseFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export default function CaseForm({ case_, onSubmit, onCancel, submitting }: Props) {
  // Load all clients and staff for the pickers. At seed scale this is fine;
  // server-side search is a production seam.
  const { data: clientData } = useClients({ limit: 100 });
  const { data: staffData } = useStaff({ limit: 100 });

  const clientOptions = (clientData?.data ?? []).map((c) => ({ value: c._id, label: c.fullName }));
  const staffOptions = (staffData?.data ?? []).map((s) => ({
    value: s._id, label: `${s.fullName} (${s.role})`,
  }));

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      caseNumber:         case_?.caseNumber ?? '',
      title:              case_?.title ?? '',
      clientId:           refId(case_?.clientId),
      responsibleStaffId: refId(case_?.responsibleStaffId),
      caseType:           case_?.caseType ?? 'employment_visa',
      currentStage:       case_?.currentStage ?? 'consultation',
      status:             case_?.status ?? 'open',
      receiptNumber:      case_?.receiptNumber ?? '',
      priorityDate:       toDateInput(case_?.priorityDate),
      filingDate:         toDateInput(case_?.filingDate),
      dateOpened:         toDateInput(case_?.dateOpened),
      dateClosed:         toDateInput(case_?.dateClosed),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="caseNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>Case number</FormLabel>
              <FormControl><Input placeholder="2024-0042" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="clientId" render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Combobox
                options={clientOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select a client"
                searchPlaceholder="Search clients..."
                emptyText="No clients found."
              />
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="responsibleStaffId" render={({ field }) => (
            <FormItem>
              <FormLabel>Responsible staff</FormLabel>
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

          <FormField control={form.control} name="caseType" render={({ field }) => (
            <FormItem>
              <FormLabel>Case type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {caseTypes.map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="currentStage" render={({ field }) => (
            <FormItem>
              <FormLabel>Stage</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {caseStages.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
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
                  {caseStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="receiptNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>Receipt number</FormLabel>
              <FormControl><Input placeholder="MSC2190012345" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="priorityDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Priority date</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="filingDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Filing date</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="dateOpened" render={({ field }) => (
            <FormItem>
              <FormLabel>Date opened</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="dateClosed" render={({ field }) => (
            <FormItem>
              <FormLabel>Date closed</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : case_ ? 'Save changes' : 'Add case'}
          </Button>
        </div>
      </form>
    </Form>
  );
}