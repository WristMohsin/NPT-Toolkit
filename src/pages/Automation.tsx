import React, { useEffect, useState } from 'react';
import { useStore } from '../services/store';
import { Button, EmptyState, SectionHeading } from '../components/ui';
import { Play, Square, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  checkNmap,
  runAuthorizedScan,
  onScanProgress,
  isDesktopAgent,
  NmapCheckResult,
} from '../services/nmapAgent';
import { parseNmapXml } from '../services/importParsers';
import { correlateFindings } from '../services/findingsEngine';

const PHASES = [
  'Scope Validation',
  'Discovery',
  'Service Enumeration',
  'Vulnerability Correlation',
  'Finding Generation',
  'Report Ready',
];

export default function Automation() {
  const { activeAssessment, targets, importDataset, updateAssessment, appendLog } = useStore();

  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(-1);
  const [nmap, setNmap] = useState<NmapCheckResult | null>(null);
  const [profileId, setProfileId] = useState('standard');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  const assessmentTargets = targets.filter(
    (t) => activeAssessment && t.assessmentId === activeAssessment.id && t.scopeStatus === 'Included'
  );

  useEffect(() => {
    checkNmap().then(setNmap);
    const off = onScanProgress((data) => setStatusMsg(data.message));
    return off;
  }, []);

  if (!activeAssessment) {
    return (
      <EmptyState
        title="No assessment loaded"
        body="Select or create an assessment to view the automation workflow."
      />
    );
  }

  const selectedTarget = assessmentTargets.find((t) => t.id === selectedTargetId);
  const canScan =
    isDesktopAgent() &&
    !!nmap?.installed &&
    !!selectedTarget &&
    selectedTarget.authorization === 'Confirmed' &&
    activeAssessment.authorizationStatus === 'Confirmed' &&
    !running;

  const startDemo = () => {
    setRunning(true);
    setPhaseIdx(0);
    setError('');
    appendLog('Demo workflow started');
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setPhaseIdx(i);
      if (i >= PHASES.length - 1) {
        clearInterval(t);
        setRunning(false);
        appendLog('Demo workflow completed');
      }
    }, 700);
  };

  const startRealScan = async () => {
    if (!selectedTarget) return;
    setError('');
    setStatusMsg('Starting authorized scan...');
    setRunning(true);
    setPhaseIdx(0);
    appendLog(`Authorized scan requested for ${selectedTarget.value} (profile=${profileId})`);

    updateAssessment(activeAssessment.id, {
      status: 'Running',
      executionMode: 'Agent',
      phase: 'Discovery',
      progress: 15,
    });

    setPhaseIdx(1);
    const id = `scan-${Date.now()}`;

    const result = await runAuthorizedScan({
      target: selectedTarget.value,
      profileId,
      authorizationConfirmed:
        selectedTarget.authorization === 'Confirmed' &&
        activeAssessment.authorizationStatus === 'Confirmed',
      scanId: id,
    });

    if (!result.ok || !result.xml) {
      setError(result.error || 'Scan failed');
      setRunning(false);
      setPhaseIdx(-1);
      appendLog(`Scan failed: ${result.error || 'unknown error'}`);
      updateAssessment(activeAssessment.id, { status: 'Ready', progress: 0 });
      return;
    }

    try {
      setPhaseIdx(2);
      setStatusMsg('Parsing Nmap XML...');
      appendLog('Parsing Nmap XML output');
      const parsed = parseNmapXml(result.xml, activeAssessment.id);

      setPhaseIdx(3);
      setStatusMsg('Correlating findings...');
      appendLog('Running findings correlation engine');
      const correlated = correlateFindings(activeAssessment.id, parsed.hosts, parsed.services);

      setPhaseIdx(4);
      importDataset({
        hosts: parsed.hosts,
        services: parsed.services,
        findings: [...parsed.findings, ...correlated],
      });

      setPhaseIdx(5);
      const msg = `Scan complete: ${parsed.hosts.length} host(s), ${parsed.services.length} service(s), ${correlated.length} finding(s).`;
      setStatusMsg(msg);
      appendLog(msg);

      updateAssessment(activeAssessment.id, {
        status: 'Completed',
        phase: 'Report Generation',
        progress: 100,
        executionMode: 'Agent',
      });
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : 'Failed to process scan output';
      setError(m);
      appendLog(`Post-scan processing error: ${m}`);
    }

    setRunning(false);
  };

  return (
    <div>
      <SectionHeading
        title="Automation"
        subtitle="Authorized assessment workflow and local Nmap agent."
      />

      <div className="card p-4 mb-4">
        <div className="text-sm font-medium text-ink-100 mb-2 flex items-center gap-2">
          <ShieldCheck size={16} className="text-signal-accent" />
          Local Assessment Agent
        </div>
        {!isDesktopAgent() ? (
          <p className="text-sm text-ink-400">
            Open the <strong>Tauri</strong> or <strong>Electron</strong> desktop app for real Nmap scanning.
            Browser mode supports Demo + Import only.
          </p>
        ) : nmap?.installed ? (
          <p className="text-sm text-signal-ok">Nmap {nmap.version} detected — authorized scans available.</p>
        ) : (
          <p className="text-sm text-amber-400 flex items-center gap-2">
            <AlertTriangle size={14} />
            {nmap?.message || 'Nmap not found. Install Nmap and add it to PATH.'}
          </p>
        )}
      </div>

      {isDesktopAgent() && (
        <div className="card p-4 mb-4 space-y-3">
          <div className="text-sm font-medium text-ink-100">Authorized Scan Pipeline</div>

          <div>
            <label className="text-xs text-ink-400 block mb-1">Target (Authorization = Confirmed)</label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100"
            >
              <option value="">Select target...</option>
              {assessmentTargets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.value} [{t.authorization}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-ink-400 block mb-1">Scan Profile (safe allow-list)</label>
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="w-full bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100"
            >
              <option value="quick">Quick Discovery</option>
              <option value="standard">Standard Service Scan</option>
              <option value="top100">Top 100 Ports + Version</option>
            </select>
          </div>

          {(selectedTarget?.authorization !== 'Confirmed' ||
            activeAssessment.authorizationStatus !== 'Confirmed') && (
            <div className="text-xs text-red-400 border border-red-500/40 bg-red-500/10 rounded px-3 py-2">
              Confirm authorization on the Targets page before scanning.
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={startRealScan} disabled={!canScan}>
              <Play size={14} /> Start Authorized Scan
            </Button>
            <Button variant="secondary" disabled={!running}>
              <Square size={14} /> Cancel
            </Button>
          </div>

          {statusMsg && <p className="text-xs text-ink-300">{statusMsg}</p>}
          {error && (
            <p className="text-xs text-red-400 border border-red-500/40 bg-red-500/10 rounded px-3 py-2">{error}</p>
          )}
        </div>
      )}

      <div className="mb-4 text-xs px-3 py-2 rounded border border-signal-accent/30 bg-signal-accent/10 text-signal-accent inline-block">
        {isDesktopAgent() && nmap?.installed
          ? 'Execution Mode: AGENT — authorized local Nmap + findings correlation'
          : 'Execution Mode: DEMO — no network traffic generated'}
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={startDemo} disabled={running} variant="secondary">
          <Play size={14} /> Run Demo Workflow
        </Button>
      </div>

      <div className="card p-6">
        <div className="flex flex-col gap-0">
          {PHASES.map((phase, i) => (
            <div key={phase} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    i < phaseIdx
                      ? 'bg-signal-ok border-signal-ok'
                      : i === phaseIdx
                        ? 'bg-signal-accent border-signal-accent'
                        : 'border-ink-600'
                  }`}
                />
                {i < PHASES.length - 1 && (
                  <div className={`w-px h-8 ${i < phaseIdx ? 'bg-signal-ok' : 'bg-ink-700'}`} />
                )}
              </div>
              <div className={`text-sm pb-8 ${i <= phaseIdx ? 'text-ink-100' : 'text-ink-400'}`}>{phase}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
