import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../services/store';
import { EmptyState, SeverityBadge, StatusPill, Button } from '../components/ui';
import { FindingStatus } from '../types';

export default function FindingDetail() {
  const { id } = useParams();
  const { findings, updateFindingStatus } = useStore();
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<string[]>([]);

  const finding = findings.find((f) => f.id === id);
  if (!finding) return <EmptyState title="Finding not found" body="This finding is not present in the current dataset." />;

  const setStatus = (s: FindingStatus) => updateFindingStatus(finding.id, s);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-1">
        <SeverityBadge severity={finding.severity} />
        <span className="font-mono text-ink-400 text-sm">{finding.id}</span>
        {finding.synthetic && <StatusPill label="Synthetic (Demo)" tone="accent" />}
      </div>
      <h1 className="text-xl font-semibold text-ink-100 mb-4">{finding.title}</h1>

      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <MetaBlock label="Affected Asset" value={`${finding.hostIp}${finding.port ? ':' + finding.port : ''}`} />
        <MetaBlock label="Confidence" value={finding.confidence} />
        <MetaBlock label="CVSS" value={finding.cvss ?? '—'} />
      </div>

      <Section title="Description" body={finding.description} />
      <Section title="Evidence" body={finding.evidence} mono />
      <Section title="Impact" body={finding.impact} />
      <Section title="Remediation" body={finding.remediation} />

      {finding.references.length > 0 && (
        <div className="mb-5">
          <div className="text-sm font-medium text-ink-100 mb-1.5">References</div>
          <ul className="text-sm space-y-1">
            {finding.references.map((r) => (
              <li key={r}>
                <a href={r} target="_blank" rel="noreferrer" className="text-signal-accent hover:underline break-all">{r}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-4 mb-5">
        <div className="text-sm font-medium text-ink-100 mb-3">Status: <StatusPill label={finding.status} tone="neutral" /></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setStatus('Confirmed')}>Mark Confirmed</Button>
          <Button variant="secondary" onClick={() => setStatus('False Positive')}>Mark False Positive</Button>
          <Button variant="secondary" onClick={() => setStatus('Remediated')}>Mark Remediated</Button>
          <Button variant="secondary" onClick={() => setStatus('Retest Required')}>Retest Required</Button>
          <Button variant="secondary" onClick={() => setStatus('Accepted Risk')}>Accept Risk</Button>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm font-medium text-ink-100 mb-3">Analyst Notes</div>
        <div className="flex gap-2 mb-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            className="flex-1 bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100 placeholder:text-ink-500"
          />
          <Button
            onClick={() => {
              if (!note.trim()) return;
              setNotes((prev) => [note, ...prev]);
              setNote('');
            }}
          >
            Add Note
          </Button>
        </div>
        {notes.length === 0 ? (
          <div className="text-xs text-ink-400">No analyst notes recorded yet.</div>
        ) : (
          <ul className="space-y-2">
            {notes.map((n, i) => (
              <li key={i} className="text-sm text-ink-200 border-l-2 border-ink-700 pl-3">{n}</li>
            ))}
          </ul>
        )}
      </div>

      <Link to="/findings" className="inline-block mt-5 text-sm text-ink-400 hover:text-ink-100">← Back to Findings</Link>
    </div>
  );
}

function MetaBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-ink-400 mb-1">{label}</div>
      <div className="text-sm font-medium text-ink-100 font-mono">{value}</div>
    </div>
  );
}

function Section({ title, body, mono }: { title: string; body: string; mono?: boolean }) {
  if (!body) return null;
  return (
    <div className="mb-5">
      <div className="text-sm font-medium text-ink-100 mb-1.5">{title}</div>
      <div className={`text-sm text-ink-300 leading-relaxed ${mono ? 'font-mono bg-ink-900 border border-ink-800 rounded p-3' : ''}`}>{body}</div>
    </div>
  );
}
