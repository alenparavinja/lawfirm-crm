import { useState } from 'react';
import { useStaff } from '@/hooks/useStaff';
import type { StaffFilters } from '@/hooks/useStaff';
import StaffCard from '@/components/staff/StaffCard';
import StaffModal from '@/components/staff/StaffModal';
import type { StaffMember } from '@/hooks/useStaff';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function StaffPage() {
  const [filters, setFilters] = useState<StaffFilters>({ page: 1 });
  const { data, isLoading, isError } = useStaff(filters);
  const [selected, setSelected] = useState<StaffMember | null>(null);

  function set(key: keyof StaffFilters, value: string) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  function clear() {
    setFilters({ page: 1 });
  }

  const hasFilters = filters.role || filters.active;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Staff</h1>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.total} {data.total === 1 ? 'member' : 'members'}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.role ?? 'all'}
          onValueChange={(v) => set('role', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="attorney">Attorney</SelectItem>
            <SelectItem value="paralegal">Paralegal</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.active ?? 'all'}
          onValueChange={(v) => set('active', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <button
            onClick={clear}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {isError && (
        <p className="text-sm text-destructive">Failed to load staff.</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((member) => (
            <StaffCard key={member._id} member={member} onClick={setSelected} />
          ))}
        </div>
      )}
      <StaffModal member={selected} onClose={() => setSelected(null)} />
    </div>
  );
}