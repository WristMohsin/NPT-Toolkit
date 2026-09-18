import React, { useState } from 'react';
import { useStore } from '../services/store';
import { EmptyState, SectionHeading, SeverityBadge } from '../components/ui';

export default function Services() {
  const { activeAssessment, services } = useStore();
  const [q, setQ] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to view enumerated services." />;
  }

  const aServices = services
    .filter((s) => s.assessmentId === activeAssessment.id)
    .filter((s) => (q ? (s.hostIp + s.service + s.version).toLowerCase().includes(q.toLowerCase()) : true))
    .filter((s) => (riskFilter === 'All' ? true : s.risk === riskFilter));

  return (
    <div>
      <SectionHeading title="Services" subtitle="Enumerated services across all discovered hosts." />
      <div className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by host, service, version…"
          className="flex-1 max-w-sm bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100 placeholder:text-ink-500"
        />
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100"
        >
          {['All', 'Critical', 'High', 'Medium', 'Low', 'None'].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      {aServices.length === 0 ? (
        <EmptyState title="No services found" body="Adjust filters or import scan results to populate service data." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Host</th>
                <th>Port</th>
                <th>Protocol</th>
                <th>Service</th>
                <th>Version</th>
                <th>State</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {aServices.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono">{s.hostIp}</td>
                  <td className="font-mono">{s.port}</td>
                  <td>{s.protocol}</td>
                  <td>{s.service}{s.tls && <span className="ml-1.5 text-[10px] text-signal-ok">TLS</span>}</td>
                  <td className="text-ink-300">{s.version}</td>
                  <td className="text-ink-300">{s.state}</td>
                  <td>{s.risk !== 'None' ? <SeverityBadge severity={s.risk} /> : <span className="text-ink-500">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
