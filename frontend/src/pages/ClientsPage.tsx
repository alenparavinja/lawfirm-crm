import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import type { ClientFilters } from '@/hooks/useClients';
import ClientCard from '@/components/clients/ClientCard';
import ClientFiltersBar from '@/components/clients/ClientFilters';
import ClientSheet from '@/components/clients/ClientSheet';
import type { Client } from '@/types';

function paramsToFilters(params: URLSearchParams): ClientFilters {
  return {
    status:                   params.get('status')                   ?? undefined,
    countryOfOrigin:          params.get('countryOfOrigin')          ?? undefined,
    currentImmigrationStatus: params.get('currentImmigrationStatus') ?? undefined,
    page:                     params.get('page') ? parseInt(params.get('page')!, 10) : 1,
  };
}

function filtersToParams(filters: ClientFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (filters.status)                   out.status                   = filters.status;
  if (filters.countryOfOrigin)          out.countryOfOrigin          = filters.countryOfOrigin;
  if (filters.currentImmigrationStatus) out.currentImmigrationStatus = filters.currentImmigrationStatus;
  if (filters.page && filters.page > 1) out.page                     = String(filters.page);
  return out;
}

export default function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<Client | null>(null);
  const filters = paramsToFilters(searchParams);
  const { data, isLoading, isError } = useClients(filters);

  const totalPages = data ? Math.ceil(data.total / 12) : 0;

  function handleFilterChange(next: ClientFilters) {
    setSearchParams(filtersToParams(next));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Clients</h1>
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.total} {data.total === 1 ? 'client' : 'clients'}
            </p>
          )}
        </div>
      </div>

      <ClientFiltersBar filters={filters} onChange={handleFilterChange} />

      {isError && (
        <p className="text-sm text-destructive">Failed to load clients.</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((client) => (
            <ClientCard
              key={client._id}
              client={client}
              onClick={setSelected}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={filters.page === 1}
            onClick={() => handleFilterChange({ ...filters, page: (filters.page ?? 1) - 1 })}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {filters.page} of {totalPages}
          </span>
          <button
            disabled={filters.page === totalPages}
            onClick={() => handleFilterChange({ ...filters, page: (filters.page ?? 1) + 1 })}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent transition-colors"
          >
            Next
          </button>
        </div>
      )}

      <ClientSheet client={selected} onClose={() => setSelected(null)} />
    </div>
  );
}