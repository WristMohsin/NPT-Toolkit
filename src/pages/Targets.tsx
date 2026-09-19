import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Button, EmptyState, SectionHeading, StatusPill } from '../components/ui';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Targets() {
  const { activeAssessment, targets, confirmAuthorization } = useStore();
  const [confirming, setConfirming] = useState(false);

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to manage its targets." />;
  }

  const aTargets = targets.filter((t) => t.assessmentId === activeAssessment.id);
  const included = aTargets.filter((t) => t.scopeStatus === 'Included');
  const excluded = aTargets.filter((t) => t.scopeStatus === 'Excluded');
  const isConfirmed = activeAssessment.authorizationStatus === 'Confirmed';

  const handleConfirm = () => {
    confirmAuthorization(activeAssessment.id);
    setConfirming(false);
  };

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
              tone={isConfirmed ? 'ok' : 'warn'}
            />
          </div>
          <div>
            <div className="text-xs text-ink-400 mb-1">Assessment Profile</div>
            <div className="text-ink-100">{activeAssessment.profile}</div>
          </div>
        </div>

        {!isConfirmed && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
              <AlertTriangle size={14} />
              Authorization has not been confirmed. Confirm only if you own this scope or have written permission to assess it.
            </div>

            {!confirming ? (
              <Button onClick={() => setConfirming(true)}>
                <ShieldCheck size={14} /> Confirm Authorization
              </Button>
            ) : (
              <div className="border border-signal-accent/40 bg-signal-accent/10 rounded p-3">
                <p className="text-sm text-ink-100 mb-2">
                  I confirm that I am authorized to assess the scope listed above (systems I own or have written permission for).
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleConfirm}>Yes, Confirm Authorization</Button>
                  <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isConfirmed && (
          <div className="mt-3 text-xs text-signal-ok border border-signal-ok/30 bg-signal-ok/10 rounded px-3 py-2">
            Authorization confirmed. Targets are ready for authorized scanning on the Automation page.
          </div>
        )}
      </div>

      {aTargets.length === 0 ? (
        <EmptyState
          title="No targets recorded"
          body={
            isConfirmed
              ? 'No target rows yet. Re-confirm authorization if scope was updated, or add targets when creating the assessment.'
              : 'Click "Confirm Authorization" above to register scope entries as targets and unlock scanning.'
          }
        />
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
