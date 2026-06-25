import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import StaffForm from './StaffForm';
import { useCreateStaff, useUpdateStaff } from '@/hooks/useStaffMutations';
import type { StaffMember } from '@/hooks/useStaff';
import type { StaffFormValues } from '@/lib/schemas/staff';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: StaffMember;
}

export default function StaffFormDialog({ open, onOpenChange, member }: Props) {
  const { toast } = useToast();
  const create = useCreateStaff();
  const update = useUpdateStaff(member?._id ?? '');
  const mutation = member ? update : create;

  function handleSubmit(values: StaffFormValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast({ description: member ? 'Staff updated.' : 'Staff added.' });
        onOpenChange(false);
      },
      onError: () => {
        toast({ variant: 'destructive', description: 'Could not save. Check the fields and try again.' });
      },
    });
  }

  useEffect(() => { if (!open) { create.reset(); update.reset(); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit staff' : 'Add staff'}</DialogTitle>
        </DialogHeader>
        <StaffForm
          member={member}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitting={mutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}