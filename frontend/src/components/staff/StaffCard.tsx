import { Badge } from '@/components/ui/badge';
import type { StaffMember } from '@/hooks/useStaff';

const ROLE_LABELS: Record<string, string> = {
  attorney:  'Attorney',
  paralegal: 'Paralegal',
  admin:     'Admin',
};

interface Props {
  member: StaffMember;
  onClick: (member: StaffMember) => void;
}

export default function StaffCard({ member, onClick }: Props) {
  const initials = member.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      onClick={() => onClick(member)}
      className="w-full rounded-lg border bg-card p-5 text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium">{member.fullName}</p>
            <Badge variant={member.active ? 'default' : 'secondary'}>
              {member.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ROLE_LABELS[member.role] ?? member.role}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {member.email}
          </p>
          {member.barNumber && (
            <p className="mt-1 text-xs text-muted-foreground">
              Bar: {member.barNumber}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}