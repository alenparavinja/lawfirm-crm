import { Badge } from '@/components/ui/badge';
import type { Case } from '@/types';

interface Props {
  case_: Case;
  onClick: (case_: Case) => void;
}

const STAGE_LABELS: Record<string, string> = {
  consultation:        'Consultation',
  preparing:           'Preparing',
  filed:               'Filed',
  rfe_received:        'RFE Received',
  interview_scheduled: 'Interview Scheduled',
  approved:            'Approved',
  denied:              'Denied',
  appeal:              'Appeal',
};

const TYPE_LABELS: Record<string, string> = {
  employment_visa: 'Employment Visa',
  student_visa:    'Student Visa',
  asylum:          'Asylum',
  green_card:      'Green Card',
  naturalization:  'Naturalization',
  removal_defense: 'Removal Defense',
  family_petition: 'Family Petition',
  other:           'Other',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open:    'default',
  on_hold: 'secondary',
  closed:  'outline',
};

function getClientName(clientId: Case['clientId']): string {
  if (typeof clientId === 'object' && clientId !== null) return clientId.fullName;
  return '';
}

export default function CaseCard({ case_, onClick }: Props) {
  const dateOpened = new Date(case_.dateOpened).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <button
      onClick={() => onClick(case_)}
      className="w-full rounded-lg border bg-card p-5 text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-mono text-muted-foreground">{case_.caseNumber}</p>
        <Badge variant={STATUS_VARIANT[case_.status] ?? 'secondary'}>
          {case_.status.replace('_', ' ')}
        </Badge>
      </div>
      <p className="mt-2 font-medium leading-snug">{case_.title}</p>
      {getClientName(case_.clientId) && (
        <p className="mt-1 text-sm text-muted-foreground">
          {getClientName(case_.clientId)}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
          {TYPE_LABELS[case_.caseType] ?? case_.caseType}
        </span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
          {STAGE_LABELS[case_.currentStage] ?? case_.currentStage}
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Opened {dateOpened}</p>
    </button>
  );
}