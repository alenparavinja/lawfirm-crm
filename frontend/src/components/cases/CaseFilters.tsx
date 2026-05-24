import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CaseFilters } from '@/hooks/useCases';

interface Props {
  filters: CaseFilters;
  onChange: (filters: CaseFilters) => void;
}

export default function CaseFilters({ filters, onChange }: Props) {
  function set(key: keyof CaseFilters, value: string) {
    onChange({ ...filters, [key]: value, page: 1 });
  }

  function clear() {
    onChange({ page: 1 });
  }

  const hasFilters = filters.status || filters.caseType || filters.currentStage;

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
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="on_hold">On Hold</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.caseType ?? 'all'}
        onValueChange={(v) => set('caseType', v === 'all' ? '' : v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Case type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="employment_visa">Employment Visa</SelectItem>
          <SelectItem value="student_visa">Student Visa</SelectItem>
          <SelectItem value="asylum">Asylum</SelectItem>
          <SelectItem value="green_card">Green Card</SelectItem>
          <SelectItem value="naturalization">Naturalization</SelectItem>
          <SelectItem value="removal_defense">Removal Defense</SelectItem>
          <SelectItem value="family_petition">Family Petition</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.currentStage ?? 'all'}
        onValueChange={(v) => set('currentStage', v === 'all' ? '' : v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          <SelectItem value="consultation">Consultation</SelectItem>
          <SelectItem value="preparing">Preparing</SelectItem>
          <SelectItem value="filed">Filed</SelectItem>
          <SelectItem value="rfe_received">RFE Received</SelectItem>
          <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="denied">Denied</SelectItem>
          <SelectItem value="appeal">Appeal</SelectItem>
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
  );
}