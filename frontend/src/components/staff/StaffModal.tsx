import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { StaffMember } from '@/hooks/useStaff';

const ROLE_LABELS: Record<string, string> = {
  attorney:  'Attorney',
  paralegal: 'Paralegal',
  admin:     'Admin',
};

interface Props {
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

export default function StaffModal({ member, onClose }: Props) {
  if (!member) return null;

  const initials = member.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
            {/* TODO: wire to staff.biography field once added to the database */}
            <p className="text-sm text-muted-foreground italic">
              Biography not yet available.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}