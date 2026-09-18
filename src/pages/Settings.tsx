import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Button, SectionHeading, StatusPill } from '../components/ui';

export default function Settings() {
  const { resetAll, clearDemoData, exportAll } = useStore();
  const [agentEndpoint, setAgentEndpoint] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anpt-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl">
      <SectionHeading title="Settings" />

      <div className="card p-4 mb-4">
        <div className="text-sm font-medium text-ink-100 mb-3">Agent</div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-ink-300">Agent Mode</span>
          <span className="text-ink-100">Demo / Import</span>
        </div>
        <div className="mb-2">
          <div className="text-xs text-ink-400 mb-1">Agent Endpoint</div>
          <input
            value={agentEndpoint}
            onChange={(e) => setAgentEndpoint(e.target.value)}
            placeholder="https://agent.internal.lab:8443"
            className="w-full bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100 placeholder:text-ink-500"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-300">Connection</span>
          <StatusPill label="Disconnected" tone="neutral" />
        </div>
        <p className="text-xs text-ink-500 mt-2">
          The application never connects to an agent endpoint automatically. A future local agent must be explicitly configured and connected.
        </p>
      </div>

      <div className="card p-4 mb-4">
        <div className="text-sm font-medium text-ink-100 mb-3">Data</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={download}>Export All Data</Button>
          <Button variant="secondary" onClick={clearDemoData}>Clear Demo Data</Button>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>Reset Application</Button>
        </div>
        {confirmReset && (
          <div className="mt-3 border border-signal-crit/40 bg-signal-crit/10 rounded p-3">
            <div className="text-sm text-ink-100 mb-2">This will permanently delete all local assessment data. Continue?</div>
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => { resetAll(); setConfirmReset(false); }}>Yes, Reset Everything</Button>
              <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="text-sm font-medium text-ink-100 mb-1">About</div>
        <p className="text-sm text-ink-300">ANPT Toolkit — Automated Network Penetration Testing Toolkit. Frontend hosted on GitHub Pages; scanning requires an authorized local agent, self-hosted backend, or imported scan results.</p>
      </div>
    </div>
  );
}
