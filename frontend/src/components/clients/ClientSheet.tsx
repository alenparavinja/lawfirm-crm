import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { Client } from '@/types';

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

export default function ClientSheet({ client, onClose }: Props) {
  if (!client) return null;

  const dob = new Date(client.dateOfBirth ?? '').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const onboarded = new Date(client.dateOnboarded).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const dateOfEntry = client.dateOfEntry
    ? new Date(client.dateOfEntry).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Sheet open={!!client} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent aria-describedby={undefined} className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {client.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <SheetTitle>{client.fullName}</SheetTitle>
              <Badge
                variant={client.status === 'active' ? 'default' : 'secondary'}
                className="mt-1"
              >
                {client.status}
              </Badge>
            </div>
          </div>
        </SheetHeader>

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
      </SheetContent>
    </Sheet>
  );
}