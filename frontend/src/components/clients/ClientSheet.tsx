import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDeleteClient } from '@/hooks/useClientMutations';
import type { Client } from '@/types';

interface Props {
  client: Client | null;
  onClose: () => void;
  onEdit?: (client: Client) => void;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}

export default function ClientSheet({ client, onClose, onEdit }: Props) {
  const { toast } = useToast();
  const del = useDeleteClient();
  const [confirming, setConfirming] = useState(false);

  // Reset the confirm state whenever the sheet target changes or closes, so a
  // primed delete does not carry over to the next client opened.
  useEffect(() => { setConfirming(false); }, [client]);

  if (!client) return null;

  function handleDelete() {
    if (!client) return;
    del.mutate(client._id, {
      onSuccess: () => {
        toast({ description: 'Client deleted.' });
        onClose();
      },
      onError: () => {
        toast({ variant: 'destructive', description: 'Could not delete the client. Try again.' });
      },
    });
  }

  const dob = new Date(client.dateOfBirth ?? '').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const onboarded = new Date(client.dateOnboarded).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const dateOfEntry = client.dateOfEntry
    ? new Date(client.dateOfEntry).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null;

  return (
    <Dialog open={!!client} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {client.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <DialogTitle>{client.fullName}</DialogTitle>
              <Badge
                variant={client.status === 'active' ? 'default' : 'secondary'}
                className="mt-1"
              >
                {client.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact
            </h3>
            <Field label="Email" value={client.email} />
            <Field label="Phone" value={client.phone} />
            <Field label="Mailing Address" value={client.mailingAddress} />
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Immigration
            </h3>
            <Field label="A-Number" value={client.aNumber} />
            <Field label="Country of Origin" value={client.countryOfOrigin} />
            <Field label="Current Immigration Status" value={client.currentImmigrationStatus} />
            <Field label="Date of Entry" value={dateOfEntry} />
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personal
            </h3>
            <Field label="Date of Birth" value={dob} />
            <Field label="Client Since" value={onboarded} />
          </section>
        </div>

        <div className="mt-8 flex items-center justify-between border-t pt-4">
          {!confirming ? (
            <>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirming(true)}
              >
                Delete
              </Button>
              <Button onClick={() => onEdit?.(client)}>Edit</Button>
            </>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Delete this client permanently?</span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={del.isPending}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={del.isPending}>
                  {del.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}