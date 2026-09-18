import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Button, EmptyState, SectionHeading } from '../components/ui';
import { Play, Pause, Square } from 'lucide-react';

const PHASES = ['Scope Validation', 'Discovery', 'Service Enumeration', 'Vulnerability Assessment', 'Correlation', 'Findings', 'Report'];

export default function Automation() {
  const { activeAssessment } = useStore();
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(-1);

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to view the automation workflow." />;
  }

  const start = () => {
    setRunning(true);
    setPhaseIdx(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setPhaseIdx(i);
      if (i >= PHASES.length - 1) {
        clearInterval(t);
        setRunning(false);
      }
    }, 700);
  };

  return (
    <div>
      <SectionHeading
        title="Automation"
        subtitle="Assessment workflow orchestration."
        action={
          <div className="flex gap-2">
            <Button onClick={start} disabled={running}><Play size={14} /> Start Workflow</Button>
            <Button variant="secondary" disabled><Pause size={14} /> Pause</Button>
            <Button variant="secondary" disabled><Square size={14} /> Cancel</Button>
          </div>
        }
      />

      <div className="mb-4 text-xs px-3 py-2 rounded border border-signal-accent/30 bg-signal-accent/10 text-signal-accent inline-block">
        Execution Mode: DEMO — no network traffic generated.
      </div>

      <div className="card p-6">
        <div className="flex flex-col gap-0">
          {PHASES.map((phase, i) => (
            <div key={phase} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    i < phaseIdx ? 'bg-signal-ok border-signal-ok' : i === phaseIdx ? 'bg-signal-accent border-signal-accent' : 'border-ink-600'
                  }`}
                />
                {i < PHASES.length - 1 && <div className={`w-px h-8 ${i < phaseIdx ? 'bg-signal-ok' : 'bg-ink-700'}`} />}
              </div>
              <div className={`text-sm pb-8 ${i <= phaseIdx ? 'text-ink-100' : 'text-ink-400'}`}>{phase}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
