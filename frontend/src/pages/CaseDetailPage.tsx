import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCase } from '@/hooks/useCase';
import { useCaseNotes } from '@/hooks/useCaseNotes';
import { useCaseTasks } from '@/hooks/useCaseTasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Note, Task } from '@/types';

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

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  open:    'default',
  on_hold: 'secondary',
  closed:  'outline',
};

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}

function NoteRow({ note }: { note: Note }) {
  const date = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  return (
    <div className="py-4 border-b last:border-0">
      <p className="text-sm leading-relaxed">{note.body}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {note.authorStaffId.fullName} - {date}
      </p>
    </div>
  );
}

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  high:   'destructive',
  medium: 'default',
  normal: 'default',
  low:    'secondary',
};

function TaskRow({ task }: { task: Task }) {
  const due = new Date(task.dueDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{task.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {task.assignedStaffId.fullName} - due {due}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'}>
          {task.priority}
        </Badge>
        <span className="text-xs text-muted-foreground capitalize">
          {task.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: case_, isLoading, isError } = useCase(id!);
  const { data: notes = [] } = useCaseNotes(id!);
  const { data: tasks = [] } = useCaseTasks(id!);
  const location = useLocation();
  const fromSearch = (location.state as { from?: string })?.from ?? '';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-64 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }

  if (isError || !case_) {
    return <p className="text-sm text-destructive">Case not found.</p>;
  }

  const clientName =
    typeof case_.clientId === 'object' && case_.clientId !== null
      ? case_.clientId.fullName
      : '';

  const staffName =
    typeof case_.responsibleStaffId === 'object' && case_.responsibleStaffId !== null
      ? case_.responsibleStaffId.fullName
      : '';

  const staffRole =
    typeof case_.responsibleStaffId === 'object' && case_.responsibleStaffId !== null
      ? case_.responsibleStaffId.role
      : '';

  const dateOpened = new Date(case_.dateOpened).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const dateClosed = case_.dateClosed
    ? new Date(case_.dateClosed).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(`/cases${fromSearch}`)}
          className="mb-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to cases
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{case_.caseNumber}</p>
            <h1 className="mt-0.5 text-lg font-semibold">{case_.title}</h1>
          </div>
          <Badge variant={STATUS_VARIANT[case_.status] ?? 'secondary'}>
            {case_.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
            {TYPE_LABELS[case_.caseType] ?? case_.caseType}
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
            {STAGE_LABELS[case_.currentStage] ?? case_.currentStage}
          </span>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">
            Notes {notes.length > 0 && `(${notes.length})`}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks {tasks.length > 0 && `(${tasks.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Case Info
              </h2>
              <Field label="Client" value={clientName} />
              <Field label="Responsible Staff" value={staffName ? `${staffName} (${staffRole})` : null} />
              <Field label="Date Opened" value={dateOpened} />
              <Field label="Date Closed" value={dateClosed} />
              <Field label="Filing Date" value={case_.filingDate ? new Date(case_.filingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} />
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Government
              </h2>
              <Field label="Receipt Number" value={case_.receiptNumber} />
              <Field label="Priority Date" value={case_.priorityDate ? new Date(case_.priorityDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} />
            </section>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes on this case.</p>
          ) : (
            <div>
              {notes.map((note) => (
                <NoteRow key={note._id} note={note} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks on this case.</p>
          ) : (
            <div>
              {tasks.map((task) => (
                <TaskRow key={task._id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}