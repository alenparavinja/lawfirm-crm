import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClientFilters } from '@/hooks/useClients';

interface Props {
  filters: ClientFilters;
  onChange: (filters: ClientFilters) => void;
}

export default function ClientFilters({ filters, onChange }: Props) {
  function set(key: keyof ClientFilters, value: string) {
    onChange({ ...filters, [key]: value, page: 1 });
  }

  function clear() {
    onChange({ page: 1 });
  }

  const hasFilters =
    filters.status || filters.countryOfOrigin || filters.currentImmigrationStatus;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={filters.status ?? 'all'}
        onValueChange={(v) => set('status', v === 'all' ? '' : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <input
        type="text"
        placeholder="Country of origin"
        value={filters.countryOfOrigin ?? ''}
        onChange={(e) => set('countryOfOrigin', e.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring w-44"
      />

      <input
        type="text"
        placeholder="Immigration status"
        value={filters.currentImmigrationStatus ?? ''}
        onChange={(e) => set('currentImmigrationStatus', e.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring w-44"
      />

      {hasFilters && (
        <button
          onClick={clear}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}