import React from 'react';
import { useStore } from '../services/store';
import { EmptyState, SectionHeading, StatusPill } from '../components/ui';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Targets() {
  const { activeAssessment, targets } = useStore();

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to manage its targets." />;
  }

  const aTargets = targets.filter((t) => t.assessmentId === activeAssessment.id);
  const included = aTargets.filter((t) => t.scopeStatus === 'Included');
  const excluded = aTargets.filter((t) => t.scopeStatus === 'Excluded');

  return (
    <div>
      <SectionHeading title="Targets" subtitle={`Scope for ${activeAssessment.name}`} />

      <div className="card p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-signal-ok" />
          <div className="text-sm font-medium text-ink-100">Scope Review</div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-ink-400 mb-1">Included</div>
            <div className="font-mono text-ink-100">{activeAssessment.scope || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-ink-400 mb-1">Excluded</div>
            <div className="font-mono text-ink-100">{activeAssessment.excluded || 'None'}</div>
          </div>
          <div>
            <div className="text-xs text-ink-400 mb-1">Authorization</div>
            <StatusPill
              label={activeAssessment.authorizationStatus}
              tone={activeAssessment.authorizationStatus === 'Confirmed' ? 'ok' : 'warn'}
            />
          </div>
          <div>
            <div className="text-xs text-ink-400 mb-1">Assessment Profile</div>
            <div className="text-ink-100">{activeAssessment.profile}</div>
          </div>
        </div>
        {activeAssessment.authorizationStatus !== 'Confirmed' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-signal-med bg-signal-med/10 border border-signal-med/30 rounded px-3 py-2">
            <AlertTriangle size={14} />
            Authorization has not been confirmed for this assessment. Confirm authorization before starting scanning or importing results.
          </div>
        )}
      </div>

      {aTargets.length === 0 ? (
        <EmptyState title="No targets recorded" body="Targets are populated automatically from demo data or scope entries. Add targets via the Assessments form or import scan results." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Target</th>
                <th>Type</th>
                <th>Scope Status</th>
                <th>Authorization</th>
                <th>Last Assessment</th>
              </tr>
            </thead>
            <tbody>
              {[...included, ...excluded].map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-ink-100">{t.value}</td>
                  <td>{t.type}</td>
                  <td>
                    <StatusPill label={t.scopeStatus} tone={t.scopeStatus === 'Included' ? 'ok' : 'neutral'} />
                  </td>
                  <td>
                    <StatusPill label={t.authorization} tone={t.authorization === 'Confirmed' ? 'ok' : 'warn'} />
                  </td>
                  <td className="text-ink-300">{t.lastAssessment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
