import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCase } from '@/hooks/useCase';
import { useCaseNotes } from '@/hooks/useCaseNotes';
import { useCaseTasks } from '@/hooks/useCaseTasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Note, Task } from '@/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDeleteCase } from '@/hooks/useCaseMutations';
import CaseFormDialog from '@/components/cases/CaseFormDialog';
import NoteForm from '@/components/cases/NoteForm';
import TaskFormDialog from '@/components/cases/TaskFormDialog';
import { useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useNoteMutations';
import { useDeleteTask } from '@/hooks/useTaskMutations';
import type { NoteFormValues } from '@/lib/schemas/note';

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

function NoteRow({ note, caseId }: { note: Note; caseId: string }) {
  const { toast } = useToast();
  const update = useUpdateNote(caseId, note._id);
  const del = useDeleteNote(caseId);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const date = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  function handleUpdate(values: NoteFormValues) {
    update.mutate(values, {
      onSuccess: () => { toast({ description: 'Note updated.' }); setEditing(false); },
      onError: () => toast({ variant: 'destructive', description: 'Could not update the note.' }),
    });
  }

  function handleDelete() {
    del.mutate(note._id, {
      onSuccess: () => toast({ description: 'Note deleted.' }),
      onError: () => toast({ variant: 'destructive', description: 'Could not delete the note.' }),
    });
  }

  if (editing) {
    return (
      <div className="py-4 border-b last:border-0">
        <NoteForm
          defaultBody={note.body}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitting={update.isPending}
          submitLabel="Save changes"
        />
      </div>
    );
  }

  return (
    <div className="group py-4 border-b last:border-0">
      <p className="text-sm leading-relaxed">{note.body}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {note.authorStaffId.fullName} - {date}
        </p>
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {!confirming ? (
            <>
              <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
              <button onClick={() => setConfirming(true)} className="text-xs text-destructive hover:underline">Delete</button>
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">Delete?</span>
              <button onClick={() => setConfirming(false)} className="text-xs text-muted-foreground hover:text-foreground" disabled={del.isPending}>Cancel</button>
              <button onClick={handleDelete} className="text-xs text-destructive hover:underline" disabled={del.isPending}>{del.isPending ? '...' : 'Confirm'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  high:   'destructive',
  medium: 'default',
  normal: 'default',
  low:    'secondary',
};

function TaskRow({ task, caseId, onEdit }: { task: Task; caseId: string; onEdit: (t: Task) => void }) {
  const { toast } = useToast();
  const del = useDeleteTask(caseId);
  const [confirming, setConfirming] = useState(false);

  const due = new Date(task.dueDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  function handleDelete() {
    del.mutate(task._id, {
      onSuccess: () => toast({ description: 'Task deleted.' }),
      onError: () => toast({ variant: 'destructive', description: 'Could not delete the task.' }),
    });
  }

  return (
    <div className="group flex items-start justify-between gap-4 py-4 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{task.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {task.assignedStaffId.fullName} - due {due}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'}>{task.priority}</Badge>
        <span className="text-xs text-muted-foreground capitalize">{task.status.replace('_', ' ')}</span>
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {!confirming ? (
            <>
              <button onClick={() => onEdit(task)} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
              <button onClick={() => setConfirming(true)} className="text-xs text-destructive hover:underline">Delete</button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirming(false)} className="text-xs text-muted-foreground hover:text-foreground" disabled={del.isPending}>Cancel</button>
              <button onClick={handleDelete} className="text-xs text-destructive hover:underline" disabled={del.isPending}>{del.isPending ? '...' : 'Confirm'}</button>
            </>
          )}
        </div>
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
  const { toast } = useToast();
  const del = useDeleteCase();
  const [editOpen, setEditOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const createNote = useCreateNote(id!);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  function handleAddNote(values: NoteFormValues) {
    createNote.mutate(values, {
      onSuccess: () => toast({ description: 'Note added.' }),
      onError: () => toast({ variant: 'destructive', description: 'Could not add the note.' }),
    });
  }

  useEffect(() => { setConfirming(false); }, [id]);

  function handleDelete() {
    if (!id) return;
    del.mutate(id, {
      onSuccess: () => {
        toast({ description: 'Case deleted.' });
        navigate(`/cases${fromSearch}`);
      },
      onError: () => {
        toast({ variant: 'destructive', description: 'Could not delete the case. Try again.' });
      },
    });
  }

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
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[case_.status] ?? 'secondary'}>
              {case_.status.replace('_', ' ')}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
            {!confirming ? (
              <Button
                variant="ghost" size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirming(true)}
              >
                Delete
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Delete permanently?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={del.isPending}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={del.isPending}>
                  {del.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            )}
          </div>
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
          <div className="mb-6">
            <NoteForm onSubmit={handleAddNote} submitting={createNote.isPending} />
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes on this case.</p>
          ) : (
            <div>
              {notes.map((note) => (
                <NoteRow key={note._id} note={note} caseId={id!} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}>Add task</Button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks on this case.</p>
          ) : (
            <div>
              {tasks.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  caseId={id!}
                  onEdit={(t) => { setEditingTask(t); setTaskDialogOpen(true); }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <CaseFormDialog open={editOpen} onOpenChange={setEditOpen} case_={case_} />
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        caseId={id!}
        task={editingTask ?? undefined}
      />
    </div>
  );
}