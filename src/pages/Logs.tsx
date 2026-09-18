import React, { useState } from 'react';
import { useStore } from '../services/store';
import { EmptyState, SectionHeading } from '../components/ui';

export default function Logs() {
  const { activeAssessment, logs } = useStore();
  const [q, setQ] = useState('');

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to view execution logs." />;
  }

  const filtered = logs.filter((l) => (q ? l.message.toLowerCase().includes(q.toLowerCase()) : true));

  return (
    <div>
      <SectionHeading title="Execution Logs" subtitle="Chronological assessment activity log." />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search logs…"
        className="w-full max-w-sm mb-4 bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100 placeholder:text-ink-500"
      />
      <div className="card p-4 font-mono text-xs text-ink-300 space-y-1 max-h-[560px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-ink-400">No log entries match.</div>
        ) : (
          filtered.map((l, i) => (
            <div key={i}>
              <span className="text-ink-500">[{new Date(l.time).toLocaleTimeString()}]</span> {l.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
