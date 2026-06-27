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
import { useDeleteClient, useUpdateClient } from '@/hooks/useClientMutations';
import ClientForm from './ClientForm';
import type { Client } from '@/types';
import type { ClientFormValues } from '@/lib/schemas/client';

interface Props {
  client: Client | null;
  onClose: () => void;
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

export default function ClientDetailDialog({ client, onClose }: Props) {
  const { toast } = useToast();
  const del = useDeleteClient();
  const [confirming, setConfirming] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // The dialog keeps its own copy of the client so a save can refresh the
  // displayed data in place without closing. Seeded from the prop and updated
  // on successful edit.
  const [current, setCurrent] = useState<Client | null>(client);

  const update = useUpdateClient(current?._id ?? '');

  // Re-seed and reset to view mode whenever a different client is opened, so a
  // primed delete or a left-open edit form does not carry into the next one.
  useEffect(() => {
    setCurrent(client);
    setMode('view');
    setConfirming(false);
  }, [client]);

  if (!current) return null;

  function handleDelete() {
    if (!current) return;
    del.mutate(current._id, {
      onSuccess: () => {
        toast({ description: 'Client deleted.' });
        onClose();
      },
      onError: () => {
        toast({ variant: 'destructive', description: 'Could not delete the client. Try again.' });
      },
    });
  }

  function handleSave(values: ClientFormValues) {
    update.mutate(values, {
      onSuccess: (updated) => {
        toast({ description: 'Client updated.' });
        // Prefer the server's returned client; fall back to merging the form
        // values onto the existing object if the mutation resolves without a
        // body.
        setCurrent((prev) => (updated as Client) ?? (prev ? { ...prev, ...values } : prev));
        setMode('view');
      },
      onError: () => {
        toast({ variant: 'destructive', description: 'Could not save the client. Check the fields and try again.' });
      },
    });
  }

  const dob = new Date(current.dateOfBirth ?? '').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const onboarded = new Date(current.dateOnboarded).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const dateOfEntry = current.dateOfEntry
    ? new Date(current.dateOfEntry).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null;

  return (
    <Dialog open={!!client} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {current.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <DialogTitle>{mode === 'edit' ? 'Edit client' : current.fullName}</DialogTitle>
              {mode === 'view' && (
                <Badge
                  variant={current.status === 'active' ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {current.status}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {mode === 'edit' ? (
          <ClientForm
            client={current}
            onSubmit={handleSave}
            onCancel={() => setMode('view')}
            submitting={update.isPending}
          />
        ) : (
          <>
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </h3>
                <Field label="Email" value={current.email} />
                <Field label="Phone" value={current.phone} />
                <Field label="Mailing Address" value={current.mailingAddress} />
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Immigration
                </h3>
                <Field label="A-Number" value={current.aNumber} />
                <Field label="Country of Origin" value={current.countryOfOrigin} />
                <Field label="Current Immigration Status" value={current.currentImmigrationStatus} />
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
                  <Button onClick={() => setMode('edit')}>Edit</Button>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
