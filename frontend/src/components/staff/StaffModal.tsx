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
import { useDeleteStaff } from '@/hooks/useStaffMutations';
import type { StaffMember } from '@/hooks/useStaff';

const ROLE_LABELS: Record<string, string> = {
  attorney:  'Attorney',
  paralegal: 'Paralegal',
  admin:     'Admin',
};

interface Props {
  member: StaffMember | null;
  onClose: () => void;
  onEdit?: (member: StaffMember) => void;
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

export default function StaffModal({ member, onClose, onEdit }: Props) {
  const { toast } = useToast();
  const del = useDeleteStaff();
  const [confirming, setConfirming] = useState(false);

  // Reset the confirm state when the target changes or the modal closes.
  useEffect(() => { setConfirming(false); }, [member]);

  if (!member) return null;

  const initials = member.fullName
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

  return (
    <Dialog open={!!member} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </div>
            <div>
              <DialogTitle>{member.fullName}</DialogTitle>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
                <Badge variant={member.active ? 'default' : 'secondary'}>
                  {member.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="space-y-4">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact
            </h3>
            <Field label="Email" value={member.email} />
            {member.barNumber && (
              <Field label="Bar Number" value={member.barNumber} />
            )}
          </section>

          <Separator />

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Biography
            </h3>
            {member.biography ? (
              <p className="whitespace-pre-line text-sm">{member.biography}</p>
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
              <Button onClick={() => onEdit?.(member)}>Edit</Button>
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
      </DialogContent>
    </Dialog>
  );
}