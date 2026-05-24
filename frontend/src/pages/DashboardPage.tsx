import { useDashboard } from '@/hooks/useDashboard';
import type { Note } from '@/types';

// Label maps for enum values from the data model.
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
  employment_visa:  'Employment Visa',
  student_visa:     'Student Visa',
  asylum:           'Asylum',
  green_card:       'Green Card',
  naturalization:   'Naturalization',
  removal_defense:  'Removal Defense',
  family_petition:  'Family Petition',
  other:            'Other',
};

// Stage ordering for the bar chart.
const STAGE_ORDER = [
  'consultation',
  'preparing',
  'filed',
  'rfe_received',
  'interview_scheduled',
  'approved',
  'denied',
  'appeal',
];

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      )}
    </div>
  );
}

function BarChart({
  data,
  labelMap,
  orderBy,
  loading,
}: {
  data: { key: string; count: number }[];
  labelMap: Record<string, string>;
  orderBy?: string[];
  loading: boolean;
}) {
  const sorted = orderBy
    ? [...data].sort((a, b) => orderBy.indexOf(a.key) - orderBy.indexOf(b.key))
    : [...data].sort((a, b) => b.count - a.count);

  const max = Math.max(...sorted.map((d) => d.count), 1);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-36 h-3 animate-pulse rounded bg-muted" />
            <div className="h-5 animate-pulse rounded bg-muted" style={{ width: `${(i + 1) * 12}%` }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {sorted.map(({ key, count }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-right text-xs text-muted-foreground">
            {labelMap[key] ?? key}
          </span>
          <div className="flex flex-1 items-center gap-2">
            <div
              className="h-5 rounded-sm bg-primary transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
            <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({
  data,
  labelMap,
  loading,
}: {
  data: { key: string; count: number }[];
  labelMap: Record<string, string>;
  loading: boolean;
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const sorted = [...data].sort((a, b) => b.count - a.count);

  // Simple CSS conic-gradient donut.
  const COLORS = [
    'hsl(222.2 47.4% 11.2%)',
    'hsl(215.4 16.3% 46.9%)',
    'hsl(214.3 31.8% 71.4%)',
    'hsl(214.3 31.8% 81.4%)',
    'hsl(210 40% 90%)',
    'hsl(210 40% 80%)',
    'hsl(210 40% 70%)',
    'hsl(210 40% 60%)',
  ];

  let cumulative = 0;
  const segments = sorted.map((d, i) => {
    const pct = (d.count / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start, color: COLORS[i % COLORS.length] };
  });

  const gradient = segments
    .map((s) => `${s.color} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`)
    .join(', ');

  if (loading) {
    return <div className="mx-auto h-40 w-40 animate-pulse rounded-full bg-muted" />;
  }

  return (
    <div className="flex items-center gap-8">
      <div
        className="h-40 w-40 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${gradient})`,
          WebkitMask: 'radial-gradient(circle, transparent 45%, black 45%)',
          mask: 'radial-gradient(circle, transparent 45%, black 45%)',
        }}
      />
      <div className="space-y-1.5">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: s.color }}
            />
            <span className="text-xs text-muted-foreground">
              {labelMap[s.key] ?? s.key}
            </span>
            <span className="text-xs tabular-nums font-medium">{s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoteItem({ note }: { note: Note }) {
  const date = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug line-clamp-2">{note.body}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {note.authorStaffId.fullName} - {date}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    isLoading,
    activeClients,
    openCases,
    pendingCases,
    pendingTasks,
    recentNotes,
    stageDistribution,
    typeDistribution,
  } = useDashboard();

  const stageData = stageDistribution.map((d) => ({ key: d.stage, count: d.count }));
  const typeData  = typeDistribution.map((d) => ({ key: d.type,  count: d.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Firm overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Clients"  value={activeClients} loading={isLoading} />
        <StatCard label="Open Cases"      value={openCases}     loading={isLoading} />
        <StatCard label="Pending Cases"   value={pendingCases}  loading={isLoading} />
        <StatCard label="Pending Tasks"   value={pendingTasks}  loading={isLoading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium">Cases by Stage</h2>
          <BarChart
            data={stageData}
            labelMap={STAGE_LABELS}
            orderBy={STAGE_ORDER}
            loading={isLoading}
          />
        </div>
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium">Cases by Type</h2>
          <DonutChart
            data={typeData}
            labelMap={TYPE_LABELS}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="mb-2 text-sm font-medium">Recent Activity</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5 py-3 border-b">
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : recentNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent notes.</p>
        ) : (
          <div>
            {recentNotes.map((note) => (
              <NoteItem key={note._id} note={note} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}