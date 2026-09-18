import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../services/store';
import { EmptyState, SeverityBadge, StatusPill } from '../components/ui';

const TABS = ['Overview', 'Services', 'Findings'] as const;

export default function HostDetail() {
  const { id } = useParams();
  const { hosts, services, findings } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');

  const host = hosts.find((h) => h.id === id);
  if (!host) return <EmptyState title="Host not found" body="This host is not present in the current dataset." />;

  const hostServices = services.filter((s) => s.hostId === host.id);
  const hostFindings = findings.filter((f) => f.hostId === host.id);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-mono font-semibold text-ink-100">{host.ip}</h1>
        <span className="text-ink-400">{host.hostname}</span>
        <StatusPill label={host.status} tone={host.status === 'Online' ? 'ok' : 'neutral'} />
      </div>
      <div className="text-sm text-ink-400 mb-5">{host.osHint}</div>

      <div className="flex gap-1 border-b border-ink-800 mb-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-2 text-sm border-b-2 -mb-px ${
              tab === t ? 'border-signal-accent text-ink-100' : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid md:grid-cols-3 gap-3">
          <StatBlock label="Operating System" value={host.osHint} />
          <StatBlock label="Open Ports" value={hostServices.length} />
          <StatBlock label="Findings" value={hostFindings.length} />
        </div>
      )}

      {tab === 'Services' && (
        <div className="card overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Port</th>
                <th>Protocol</th>
                <th>Service</th>
                <th>Version</th>
                <th>State</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {hostServices.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono">{s.port}</td>
                  <td>{s.protocol}</td>
                  <td>{s.service}</td>
                  <td className="text-ink-300">{s.version}</td>
                  <td>{s.state}</td>
                  <td>{s.risk !== 'None' ? <SeverityBadge severity={s.risk} /> : <span className="text-ink-500">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Findings' && (
        <div className="card overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Finding</th>
                <th>Service</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {hostFindings.map((f) => (
                <tr key={f.id}>
                  <td><SeverityBadge severity={f.severity} /></td>
                  <td>
                    <Link to={`/findings/${f.id}`} className="hover:text-signal-accent">{f.title}</Link>
                  </td>
                  <td className="text-ink-300">{f.service || '—'}</td>
                  <td className="text-ink-300">{f.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-ink-400 mb-1">{label}</div>
      <div className="text-lg font-medium text-ink-100">{value}</div>
    </div>
  );
}
