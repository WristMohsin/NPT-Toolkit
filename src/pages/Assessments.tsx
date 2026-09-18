import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Button, EmptyState, SectionHeading, StatusPill } from '../components/ui';
import { uid } from '../services/storage';
import { Assessment } from '../types';
import { Plus, X } from 'lucide-react';

const PROFILES = ['Quick Discovery', 'Standard Internal Assessment', 'Web Service Assessment', 'Infrastructure Assessment', 'Custom'];

const statusTone: Record<Assessment['status'], 'ok' | 'warn' | 'crit' | 'neutral' | 'accent'> = {
  Draft: 'neutral',
  Ready: 'accent',
  Running: 'accent',
  Paused: 'warn',
  Completed: 'ok',
  Archived: 'neutral',
};

export default function Assessments() {
  const { assessments, addAssessment, setActiveAssessmentId, activeAssessmentId, loadDemoData } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', client: '', owner: '', scope: '', excluded: '', description: '', profile: PROFILES[1],
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.scope.trim()) return;
    const a: Assessment = {
      id: uid('ANPT'),
      name: form.name,
      client: form.client || 'Unspecified',
      owner: form.owner || 'Unassigned',
      scope: form.scope,
      excluded: form.excluded,
      startDate: new Date().toISOString(),
      endDate: '',
      description: form.description,
      authorizationStatus: 'Pending',
      profile: form.profile,
      status: 'Draft',
      executionMode: 'Import',
      progress: 0,
      phase: 'Target Validation',
      createdAt: new Date().toISOString(),
    };
    addAssessment(a);
    setShowForm(false);
    setForm({ name: '', client: '', owner: '', scope: '', excluded: '', description: '', profile: PROFILES[1] });
  };

  return (
    <div>
      <SectionHeading
        title="Assessments"
        subtitle="Create and manage authorized security assessments."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadDemoData}>Load Demo</Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus size={14} /> Create Assessment
            </Button>
          </div>
        }
      />

      {showForm && (
        <form onSubmit={submit} className="card p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-ink-100">New Assessment</div>
            <button type="button" onClick={() => setShowForm(false)} className="text-ink-400 hover:text-ink-100">
              <X size={16} />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Assessment Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Client / Organization" value={form.client} onChange={(v) => setForm({ ...form, client: v })} />
            <Field label="Assessment Owner" value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} />
            <div>
              <Label>Assessment Profile</Label>
              <select
                value={form.profile}
                onChange={(e) => setForm({ ...form, profile: e.target.value })}
                className="w-full bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100"
              >
                {PROFILES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <Field label="Scope (targets, comma-separated)" required value={form.scope} onChange={(v) => setForm({ ...form, scope: v })} placeholder="192.168.1.0/24, server01.lab.local" />
            <Field label="Excluded Targets" value={form.excluded} onChange={(v) => setForm({ ...form, excluded: v })} placeholder="192.168.1.1" />
          </div>
          <div className="mt-3">
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Save Assessment</Button>
          </div>
        </form>
      )}

      {assessments.length === 0 ? (
        <EmptyState
          title="No assessments yet"
          body="Create an assessment to begin an authorized security review, or load the demo dataset to explore the toolkit."
          action={<Button onClick={() => setShowForm(true)}>Create Assessment</Button>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Client</th>
                <th>Owner</th>
                <th>Profile</th>
                <th>Status</th>
                <th>Mode</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className={a.id === activeAssessmentId ? 'bg-signal-accent/5' : ''}>
                  <td className="font-medium text-ink-100">{a.name}</td>
                  <td className="font-mono text-ink-300">{a.id}</td>
                  <td>{a.client}</td>
                  <td>{a.owner}</td>
                  <td>{a.profile}</td>
                  <td><StatusPill label={a.status} tone={statusTone[a.status]} /></td>
                  <td>{a.executionMode}</td>
                  <td>
                    <Button variant={a.id === activeAssessmentId ? 'secondary' : 'ghost'} onClick={() => setActiveAssessmentId(a.id)}>
                      {a.id === activeAssessmentId ? 'Active' : 'Set Active'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-ink-300 mb-1">{children}</div>;
}

function Field({
  label, value, onChange, required, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <Label>{label}{required && <span className="text-signal-crit"> *</span>}</Label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100 placeholder:text-ink-500"
      />
    </div>
  );
}
