import { useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ClientForm from './ClientForm';
import { useCreateClient, useUpdateClient } from '@/hooks/useClientMutations';
import type { Client } from '@/types';
import type { ClientFormValues } from '@/lib/schemas/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Present = edit that client; absent = create a new one.
  client?: Client;
}

export default function ClientFormDialog({ open, onOpenChange, client }: Props) {
  const { toast } = useToast();
  const create = useCreateClient();
  const update = useUpdateClient(client?._id ?? '');
  const mutation = client ? update : create;

  function handleSubmit(values: ClientFormValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast({ description: client ? 'Client updated.' : 'Client added.' });
        onOpenChange(false);
      },
      onError: () => {
        toast({ variant: 'destructive', description: 'Could not save the client. Check the fields and try again.' });
      },
    });
  }

  // Reset mutation state when the dialog closes so a prior error does not
  // linger into the next open.
  useEffect(() => { if (!open) { create.reset(); update.reset(); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit client' : 'Add client'}</DialogTitle>
        </DialogHeader>
        <ClientForm
          client={client}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitting={mutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}