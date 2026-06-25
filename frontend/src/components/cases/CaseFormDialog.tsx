import { useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import CaseForm from './CaseForm';
import { useCreateCase, useUpdateCase } from '@/hooks/useCaseMutations';
import type { Case } from '@/types';
import type { CaseFormValues } from '@/lib/schemas/case';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  case_?: Case;
}

export default function CaseFormDialog({ open, onOpenChange, case_ }: Props) {
  const { toast } = useToast();
  const create = useCreateCase();
  const update = useUpdateCase(case_?._id ?? '');
  const mutation = case_ ? update : create;

  function handleSubmit(values: CaseFormValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast({ description: case_ ? 'Case updated.' : 'Case added.' });
        onOpenChange(false);
      },
      onError: () => {
        toast({ variant: 'destructive', description: 'Could not save the case. Check the fields and try again.' });
      },
    });
  }

  useEffect(() => { if (!open) { create.reset(); update.reset(); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{case_ ? 'Edit case' : 'Add case'}</DialogTitle>
        </DialogHeader>
        <CaseForm
          case_={case_}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitting={mutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}