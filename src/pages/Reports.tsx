import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Button, EmptyState, SectionHeading, SeverityBadge } from '../components/ui';
import { Printer, Download } from 'lucide-react';
import { Severity } from '../types';

export default function Reports() {
  const { activeAssessment, hosts, services, findings } = useStore();
  const [reportType, setReportType] = useState<'Executive Summary' | 'Technical Report'>('Executive Summary');

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to generate a report." />;
  }

  const aHosts = hosts.filter((h) => h.assessmentId === activeAssessment.id);
  const aServices = services.filter((s) => s.assessmentId === activeAssessment.id);
  const aFindings = findings.filter((f) => f.assessmentId === activeAssessment.id);
  const bySeverity = (sev: Severity) => aFindings.filter((f) => f.severity === sev);

  const exportJson = () => {
    const payload = { assessment: activeAssessment, hosts: aHosts, services: aServices, findings: aFindings };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeAssessment.id}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionHeading
        title="Reports"
        subtitle="Generate a professional security assessment report."
        action={
          <div className="flex gap-2 no-print">
            <select value={reportType} onChange={(e) => setReportType(e.target.value as any)} className="bg-ink-800 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-ink-100">
              <option>Executive Summary</option>
              <option>Technical Report</option>
            </select>
            <Button variant="secondary" onClick={() => window.print()}><Printer size={14} /> Print</Button>
            <Button variant="secondary" onClick={exportJson}><Download size={14} /> Export JSON</Button>
          </div>
        }
      />

      <div className="card p-8 max-w-3xl mx-auto bg-ink-900 print:bg-white print:text-black print:shadow-none">
        {activeAssessment.executionMode === 'Demo' && (
          <div className="text-center text-xs font-semibold tracking-wide text-signal-accent border border-signal-accent/40 bg-signal-accent/10 rounded py-1.5 mb-6 no-print">
            DEMO DATA — NOT A REAL SECURITY ASSESSMENT
          </div>
        )}

        <div className="text-center mb-8">
          <div className="text-xs tracking-widest text-ink-400 mb-1">ANPT TOOLKIT</div>
          <div className="text-lg font-semibold text-ink-100">Automated Network Penetration Testing Toolkit</div>
          <div className="text-sm text-ink-300 mt-1">Security Assessment Report</div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-8 border-y border-ink-800 py-3">
          <div><span className="text-ink-400">Assessment ID:</span> <span className="font-mono text-ink-100">{activeAssessment.id}</span></div>
          <div><span className="text-ink-400">Date:</span> <span className="text-ink-100">{new Date().toLocaleDateString()}</span></div>
          <div><span className="text-ink-400">Analyst:</span> <span className="text-ink-100">{activeAssessment.owner}</span></div>
          <div><span className="text-ink-400">Authorization:</span> <span className="text-ink-100">{activeAssessment.authorizationStatus}</span></div>
          <div className="col-span-2"><span className="text-ink-400">Scope:</span> <span className="font-mono text-ink-100">{activeAssessment.scope}</span></div>
        </div>

        <ReportSection num={1} title="Executive Summary">
          <p className="text-sm text-ink-300 leading-relaxed">
            This assessment covered {aHosts.length} host(s) within the authorized scope {activeAssessment.scope}, identifying{' '}
            {aFindings.length} finding(s) across {aServices.length} enumerated service(s). {bySeverity('Critical').length} finding(s)
            were rated Critical and {bySeverity('High').length} were rated High, warranting prioritized remediation.
          </p>
        </ReportSection>

        <ReportSection num={2} title="Scope">
          <p className="text-sm text-ink-300">Included: <span className="font-mono">{activeAssessment.scope}</span></p>
          <p className="text-sm text-ink-300">Excluded: <span className="font-mono">{activeAssessment.excluded || 'None'}</span></p>
          <p className="text-sm text-ink-300">Profile: {activeAssessment.profile}</p>
        </ReportSection>

        <ReportSection num={3} title="Methodology">
          <p className="text-sm text-ink-300 leading-relaxed">
            Assessment activities followed a standard discovery → service enumeration → vulnerability assessment → correlation → reporting
            workflow, restricted to the authorized scope above. No destructive exploitation was performed.
          </p>
        </ReportSection>

        <ReportSection num={4} title="Risk Summary">
          <div className="flex gap-2 flex-wrap">
            {(['Critical', 'High', 'Medium', 'Low', 'Informational'] as Severity[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <SeverityBadge severity={s} /> <span className="text-sm font-mono text-ink-100">{bySeverity(s).length}</span>
              </div>
            ))}
          </div>
        </ReportSection>

        {reportType === 'Technical Report' && (
          <>
            <ReportSection num={5} title="Attack Surface">
              <p className="text-sm text-ink-300">{aHosts.length} hosts, {aServices.length} services enumerated.</p>
            </ReportSection>
            <ReportSection num={6} title="Findings">
              <div className="space-y-3">
                {aFindings.map((f) => (
                  <div key={f.id} className="border border-ink-800 rounded p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={f.severity} />
                      <span className="text-sm font-medium text-ink-100">{f.title}</span>
                    </div>
                    <div className="text-xs text-ink-400 font-mono mb-1">{f.hostIp}{f.port ? `:${f.port}` : ''} · {f.status}</div>
                    <p className="text-xs text-ink-300">{f.description}</p>
                  </div>
                ))}
              </div>
            </ReportSection>
            <ReportSection num={7} title="Remediation Recommendations">
              <ul className="text-sm text-ink-300 list-disc list-inside space-y-1">
                {aFindings.slice(0, 8).map((f) => <li key={f.id}>{f.remediation}</li>)}
              </ul>
            </ReportSection>
          </>
        )}

        <ReportSection num={reportType === 'Technical Report' ? 8 : 5} title="Appendix">
          <p className="text-sm text-ink-300">Generated by ANPT Toolkit on {new Date().toLocaleString()}.</p>
        </ReportSection>
      </div>
    </div>
  );
}

function ReportSection({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-sm font-semibold text-ink-100 mb-2">{num}. {title}</div>
      {children}
    </div>
  );
}
