import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../services/store';
import { EmptyState, SectionHeading, SeverityBadge, StatusPill } from '../components/ui';
import { Confidence } from '../types';

const confTone: Record<Confidence, 'ok' | 'warn' | 'neutral'> = {
  Confirmed: 'ok',
  Potential: 'warn',
  Informational: 'neutral',
};

export default function Vulnerabilities() {
  const { activeAssessment, findings } = useStore();

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to view vulnerability correlation." />;
  }

  const aFindings = findings.filter((f) => f.assessmentId === activeAssessment.id);
  const confirmed = aFindings.filter((f) => f.confidence === 'Confirmed');
  const potential = aFindings.filter((f) => f.confidence === 'Potential');
  const info = aFindings.filter((f) => f.confidence === 'Informational');

  return (
    <div>
      <SectionHeading
        title="Vulnerability Assessment"
        subtitle="Service → version → known issue correlation. Confidence reflects how well evidence supports each finding."
      />

      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <ConfidenceCard label="Confirmed" count={confirmed.length} desc="Evidence directly supports the finding." tone="ok" />
        <ConfidenceCard label="Potential" count={potential.length} desc="Service/version suggests a vulnerability; requires validation." tone="warn" />
        <ConfidenceCard label="Informational" count={info.length} desc="Configuration or exposure info, no confirmed vulnerability." tone="neutral" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Finding</th>
              <th>Host / Service</th>
              <th>Confidence</th>
              <th>CVSS</th>
            </tr>
          </thead>
          <tbody>
            {aFindings.map((f) => (
              <tr key={f.id}>
                <td><SeverityBadge severity={f.severity} /></td>
                <td>
                  <Link to={`/findings/${f.id}`} className="hover:text-signal-accent">{f.title}</Link>
                </td>
                <td className="font-mono text-ink-300">{f.hostIp}{f.port ? `:${f.port}` : ''}</td>
                <td><StatusPill label={f.confidence} tone={confTone[f.confidence]} /></td>
                <td className="font-mono text-ink-300">{f.cvss ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfidenceCard({ label, count, desc, tone }: { label: string; count: number; desc: string; tone: 'ok' | 'warn' | 'neutral' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <StatusPill label={label} tone={tone} />
        <span className="font-mono text-lg text-ink-100">{count}</span>
      </div>
      <div className="text-xs text-ink-400">{desc}</div>
    </div>
  );
}
