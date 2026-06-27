import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDeleteStaff, useUpdateStaff } from '@/hooks/useStaffMutations';
import { useStaffMember } from '@/hooks/useStaffMember';
import StaffForm from './StaffForm';
import type { StaffMember } from '@/hooks/useStaff';
import type { StaffFormValues } from '@/lib/schemas/staff';

const ROLE_LABELS: Record<string, string> = {
  attorney:  'Attorney',
  paralegal: 'Paralegal',
  admin:     'Admin',
};

interface Props {
  // The list-row member, used for the header while the detail (with biography)
  // loads. Null when nothing is selected.
  member: StaffMember | null;
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

export default function StaffDetailDialog({ member, onClose }: Props) {
  const { toast } = useToast();
  const del = useDeleteStaff();
  const [confirming, setConfirming] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // The detail fetch carries biography, which the list row omits. Falls back to
  // the list-row member for the header while loading. After a save,
  // useUpdateStaff writes the fresh member into this query key, so view mode
  // re-renders with updated data without a refetch.
  const { data: detail } = useStaffMember(member?._id ?? null);
  const shown = detail ?? member;

  const update = useUpdateStaff(member?._id ?? '');

  // Reset to view mode and clear a primed delete whenever a different member is
  // opened, so state does not carry into the next one.
  useEffect(() => {
    setMode('view');
    setConfirming(false);
  }, [member]);

  if (!member || !shown) return null;

  const initials = shown.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function handleDelete() {
    if (!member) return;
    const id = member._id;
    onClose();                       // clear selection first so the detail query unmounts
    del.mutate(id, {
      onSuccess: () => {
        toast({ description: 'Staff deleted.' });
      },
      onError: () => {
        toast({ variant: 'destructive', description: 'Could not delete. Try again.' });
      },
    });
  }

  function handleSave(values: StaffFormValues) {
    update.mutate(values, {
      onSuccess: () => {
        toast({ description: 'Staff updated.' });
        setMode('view');             // detail query already refreshed via setQueryData
      },
      onError: () => {
        toast({ variant: 'destructive', description: 'Could not save. Check the fields and try again.' });
      },
    });
  }

  return (
    <Dialog open={!!member} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </div>
            <div>
              <DialogTitle>{mode === 'edit' ? 'Edit staff' : shown.fullName}</DialogTitle>
              {mode === 'view' && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {ROLE_LABELS[shown.role] ?? shown.role}
                  </span>
                  <Badge variant={shown.active ? 'default' : 'secondary'}>
                    {shown.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {mode === 'edit' ? (
          <StaffForm
            member={shown}
            onSubmit={handleSave}
            onCancel={() => setMode('view')}
            submitting={update.isPending}
          />
        ) : (
          <>
            <div className="space-y-4">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </h3>
                <Field label="Email" value={shown.email} />
                {shown.barNumber && (
                  <Field label="Bar Number" value={shown.barNumber} />
                )}
              </section>

              <Separator />

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Biography
                </h3>
                {shown.biography ? (
                  <p className="whitespace-pre-line text-sm">{shown.biography}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    No biography on file.
                  </p>
                )}
              </section>
            </div>

            <div className="mt-2 flex items-center justify-between border-t pt-4">
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
                  <span className="text-sm text-muted-foreground">Delete this staff member permanently?</span>
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
