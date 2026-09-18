import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../services/store';
import { EmptyState, SectionHeading, StatusPill } from '../components/ui';

export default function Hosts() {
  const { activeAssessment, hosts, services } = useStore();
  const [q, setQ] = useState('');

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to view discovered hosts." />;
  }

  const aHosts = hosts
    .filter((h) => h.assessmentId === activeAssessment.id)
    .filter((h) => (q ? (h.ip + h.hostname).toLowerCase().includes(q.toLowerCase()) : true));

  const svcCount = (hostId: string) => services.filter((s) => s.hostId === hostId).length;

  return (
    <div>
      <SectionHeading title="Hosts" subtitle="Discovered hosts within the authorized assessment scope." />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter by IP or hostname…"
        className="w-full max-w-sm mb-4 bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100 placeholder:text-ink-500"
      />
      {aHosts.length === 0 ? (
        <EmptyState title="No hosts discovered" body="Run demo discovery or import scan results to populate host data." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>IP</th>
                <th>Hostname</th>
                <th>Status</th>
                <th>OS Hint</th>
                <th>Services</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {aHosts.map((h) => (
                <tr key={h.id}>
                  <td className="font-mono">
                    <Link to={`/hosts/${h.id}`} className="hover:text-signal-accent">{h.ip}</Link>
                  </td>
                  <td className="text-ink-300">{h.hostname || '—'}</td>
                  <td>
                    <StatusPill label={h.status} tone={h.status === 'Online' ? 'ok' : h.status === 'Offline' ? 'neutral' : 'warn'} />
                  </td>
                  <td className="text-ink-300">{h.osHint}</td>
                  <td className="font-mono">{svcCount(h.id)}</td>
                  <td className="text-ink-300">{new Date(h.lastSeen).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
