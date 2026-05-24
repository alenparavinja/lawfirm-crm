import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCases } from '@/hooks/useCases';
import type { CaseFilters } from '@/hooks/useCases';
import CaseCard from '@/components/cases/CaseCard';
import CaseFiltersBar from '@/components/cases/CaseFilters';
import type { Case } from '@/types';

function paramsToFilters(params: URLSearchParams): CaseFilters {
  return {
    status:       params.get('status')       ?? undefined,
    caseType:     params.get('caseType')     ?? undefined,
    currentStage: params.get('currentStage') ?? undefined,
    page:         params.get('page') ? parseInt(params.get('page')!, 10) : 1,
  };
}

function filtersToParams(filters: CaseFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (filters.status)       out.status       = filters.status;
  if (filters.caseType)     out.caseType     = filters.caseType;
  if (filters.currentStage) out.currentStage = filters.currentStage;
  if (filters.page && filters.page > 1) out.page = String(filters.page);
  return out;
}

export default function CasesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = paramsToFilters(searchParams);
  const { data, isLoading, isError } = useCases(filters);
  const navigate = useNavigate();

  const totalPages = data ? Math.ceil(data.total / 12) : 0;

  function handleFilterChange(next: CaseFilters) {
    setSearchParams(filtersToParams(next));
  }

  function handleClick(case_: Case) {
    navigate(`/cases/${case_._id}`, { state: { from: window.location.search } });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Cases</h1>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.total} {data.total === 1 ? 'case' : 'cases'}
          </p>
        )}
      </div>

      <CaseFiltersBar filters={filters} onChange={handleFilterChange} />

      {isError && (
        <p className="text-sm text-destructive">Failed to load cases.</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((case_) => (
            <CaseCard
              key={case_._id}
              case_={case_}
              onClick={handleClick}
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
    </div>
  );
}