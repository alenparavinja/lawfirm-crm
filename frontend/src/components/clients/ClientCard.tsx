import { Badge } from '@/components/ui/badge';
import type { Client } from '@/types';

interface Props {
  client: Client;
  onClick: (client: Client) => void;
}

export default function ClientCard({ client, onClick }: Props) {
  const initials = client.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const onboarded = new Date(client.dateOnboarded).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <button
      onClick={() => onClick(client)}
      className="w-full rounded-lg border bg-card p-5 text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium">{client.fullName}</p>
            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
              {client.status}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {client.countryOfOrigin}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {client.currentImmigrationStatus}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Client since {onboarded}
          </p>
        </div>
      </div>
    </button>
  );
}