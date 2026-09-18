import React from 'react';
import { useStore } from '../services/store';
import { EmptyState, SectionHeading } from '../components/ui';

export default function Evidence() {
  const { activeAssessment, findings } = useStore();

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to view evidence." />;
  }

  const aFindings = findings.filter((f) => f.assessmentId === activeAssessment.id && f.evidence);

  return (
    <div>
      <SectionHeading title="Evidence" subtitle="Supporting evidence collected for each finding." />
      {aFindings.length === 0 ? (
        <EmptyState title="No evidence recorded" body="Evidence is captured automatically during assessment or attached to imported findings." />
      ) : (
        <div className="space-y-3">
          {aFindings.map((f) => (
            <div key={f.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-ink-100">{f.title}</div>
                <div className="text-xs text-ink-400 font-mono">{f.hostIp}{f.port ? `:${f.port}` : ''}</div>
              </div>
              <pre className="text-xs font-mono text-ink-300 bg-ink-900 border border-ink-800 rounded p-3 whitespace-pre-wrap">{f.evidence}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
