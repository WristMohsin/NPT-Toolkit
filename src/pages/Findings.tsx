import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../services/store';
import { EmptyState, SectionHeading, SeverityBadge, StatusPill } from '../components/ui';
import { Severity, FindingStatus } from '../types';

const STATUS_TONE: Record<FindingStatus, 'ok' | 'warn' | 'crit' | 'neutral'> = {
  Open: 'warn',
  Confirmed: 'crit',
  'False Positive': 'neutral',
  'Accepted Risk': 'neutral',
  Remediated: 'ok',
  'Retest Required': 'warn',
};

export default function Findings() {
  const { activeAssessment, findings } = useStore();
  const [q, setQ] = useState('');
  const [severity, setSeverity] = useState<'All' | Severity>('All');
  const [status, setStatus] = useState<'All' | FindingStatus>('All');

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to view findings." />;
  }

  const aFindings = findings
    .filter((f) => f.assessmentId === activeAssessment.id)
    .filter((f) => (q ? (f.title + f.hostIp).toLowerCase().includes(q.toLowerCase()) : true))
    .filter((f) => (severity === 'All' ? true : f.severity === severity))
    .filter((f) => (status === 'All' ? true : f.status === status))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div>
      <SectionHeading title="Findings" subtitle="Vulnerabilities and security observations identified during this assessment." />
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search findings…"
          className="flex-1 min-w-[200px] max-w-sm bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100 placeholder:text-ink-500"
        />
        <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} className="bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100">
          {['All', 'Critical', 'High', 'Medium', 'Low', 'Informational'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100">
          {['All', 'Open', 'Confirmed', 'False Positive', 'Accepted Risk', 'Remediated', 'Retest Required'].map((s) => <option key={s}>{s}</option>)}
        </select>
        {(q || severity !== 'All' || status !== 'All') && (
          <button onClick={() => { setQ(''); setSeverity('All'); setStatus('All'); }} className="text-xs text-ink-400 hover:text-ink-100">
            Clear filters
          </button>
        )}
      </div>

      {aFindings.length === 0 ? (
        <EmptyState title="No findings match" body="Adjust your filters, or import authorized scan results to populate findings." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Finding</th>
                <th>Host</th>
                <th>Service</th>
                <th>Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {aFindings.map((f) => (
                <tr key={f.id}>
                  <td className="font-mono text-ink-400">{f.id}</td>
                  <td><SeverityBadge severity={f.severity} /></td>
                  <td>
                    <Link to={`/findings/${f.id}`} className="hover:text-signal-accent font-medium text-ink-100">{f.title}</Link>
                  </td>
                  <td className="font-mono text-ink-300">{f.hostIp}</td>
                  <td className="text-ink-300">{f.service || '—'}</td>
                  <td className="text-ink-300">{f.confidence}</td>
                  <td><StatusPill label={f.status} tone={STATUS_TONE[f.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
