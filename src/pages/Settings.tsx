import React, { useEffect, useState } from 'react';
import { useStore } from '../services/store';
import { useAuth } from '../services/auth';
import { Button, SectionHeading, StatusPill } from '../components/ui';
import { checkNmap, isElectronAgent, NmapCheckResult } from '../services/nmapAgent';

export default function Settings() {
  const { resetAll, clearDemoData, exportAll } = useStore();
  const { user, changePassword, logout } = useAuth();
  const [confirmReset, setConfirmReset] = useState(false);
  const [nmap, setNmap] = useState<NmapCheckResult | null>(null);
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');

  useEffect(() => {
    checkNmap().then(setNmap);
  }, []);

  const download = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anpt-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await changePassword(curPass, newPass);
    if (res.ok) {
      setPassMsg('Password updated successfully.');
      setCurPass('');
      setNewPass('');
    } else {
      setPassMsg(res.error || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-2xl">
      <SectionHeading title="Settings" subtitle="Agent, security, and data controls." />

      <div className="card p-4 mb-4">
        <div className="text-sm font-medium text-ink-100 mb-3">Session</div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-ink-300">Signed in as</span>
          <span className="font-mono text-ink-100">{user?.username || '—'}</span>
        </div>
        <Button variant="secondary" onClick={logout}>Sign out</Button>
      </div>

      <div className="card p-4 mb-4">
        <div className="text-sm font-medium text-ink-100 mb-3">Change Password</div>
        <form onSubmit={onChangePassword} className="space-y-2">
          <input
            type="password"
            placeholder="Current password"
            value={curPass}
            onChange={(e) => setCurPass(e.target.value)}
            className="w-full bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100"
            required
          />
          <input
            type="password"
            placeholder="New password (min 8 chars)"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="w-full bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100"
            required
            minLength={8}
          />
          <Button type="submit">Update Password</Button>
        </form>
        {passMsg && <p className="text-xs text-ink-300 mt-2">{passMsg}</p>}
      </div>

      <div className="card p-4 mb-4">
        <div className="text-sm font-medium text-ink-100 mb-3">Local Assessment Agent</div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-ink-300">Runtime</span>
          <StatusPill label={isElectronAgent() ? 'Electron Desktop' : 'Browser / Web'} tone={isElectronAgent() ? 'ok' : 'neutral'} />
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-ink-300">Nmap</span>
          <StatusPill
            label={nmap?.installed ? `v${nmap.version}` : 'Not detected'}
            tone={nmap?.installed ? 'ok' : 'warn'}
          />
        </div>
        <p className="text-xs text-ink-500 mt-2">{nmap?.message}</p>
        <p className="text-xs text-ink-500 mt-1">
          Real scanning requires the desktop app, Nmap on PATH, and Confirmed authorization on targets.
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
          <div className="mt-3 border border-red-500/40 bg-red-500/10 rounded p-3">
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
        <p className="text-sm text-ink-300">
          ANPT Toolkit v0.1.0 — Automated Network Penetration Testing Toolkit for authorized security assessments.
          Workflow: authorize scope → discover hosts → enumerate services → correlate findings → report.
        </p>
        <p className="text-xs text-ink-500 mt-2">
          Use only on systems you own or have explicit written authorization to test.
        </p>
      </div>
    </div>
  );
}
