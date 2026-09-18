import React from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useStore } from '../services/store';
import { StatCard, SeverityBadge, EmptyState, Button, SectionHeading } from '../components/ui';
import { Severity } from '../types';
import { Check, Circle, CircleDot } from 'lucide-react';

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: '#E5484D',
  High: '#F2994A',
  Medium: '#E9B949',
  Low: '#4C9AFF',
  Informational: '#8792A8',
};

const PHASES = ['Target Validation', 'Discovery', 'Service Enumeration', 'Vulnerability Assessment', 'Finding Correlation', 'Report Generation'];

export default function Dashboard() {
  const { activeAssessment, hosts, services, findings, loadDemoData } = useStore();

  if (!activeAssessment) {
    return (
      <EmptyState
        title="No assessment loaded"
        body="Load the demo dataset to explore the ANPT Toolkit interface, or create an authorized assessment to begin."
        action={
          <div className="flex gap-2">
            <Button onClick={loadDemoData}>Load Demo Assessment</Button>
            <Link to="/assessments">
              <Button variant="secondary">Create Assessment</Button>
            </Link>
          </div>
        }
      />
    );
  }

  const aFindings = findings.filter((f) => f.assessmentId === activeAssessment.id);
  const aHosts = hosts.filter((h) => h.assessmentId === activeAssessment.id);
  const aServices = services.filter((s) => s.assessmentId === activeAssessment.id);

  const bySeverity = (sev: Severity) => aFindings.filter((f) => f.severity === sev).length;
  const chartData = (['Critical', 'High', 'Medium', 'Low', 'Informational'] as Severity[])
    .map((sev) => ({ name: sev, value: bySeverity(sev), fill: SEVERITY_COLORS[sev] }))
    .filter((d) => d.value > 0);

  const webServices = aServices.filter((s) => /http/i.test(s.service)).length;
  const remoteAdmin = aServices.filter((s) => /ssh|rdp|vnc|telnet/i.test(s.service)).length;
  const dbServices = aServices.filter((s) => /mysql|postgres|mssql|mongo|oracle/i.test(s.service)).length;

  const currentPhaseIndex = PHASES.indexOf(activeAssessment.phase);
  const recent = [...aFindings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6);

  const portExposure = Object.entries(
    aServices.reduce<Record<string, number>>((acc, s) => {
      acc[s.service] = (acc[s.service] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div>
      <SectionHeading
        title="Command Center"
        subtitle={`${activeAssessment.name} · ${activeAssessment.scope}`}
        action={
          activeAssessment.executionMode === 'Demo' ? (
            <span className="text-xs px-2.5 py-1 rounded-sm border border-signal-accent/30 bg-signal-accent/10 text-signal-accent">
              DEMO DATA — not a real security assessment
            </span>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <StatCard label="Hosts Discovered" value={aHosts.length} />
        <StatCard label="Open Services" value={aServices.filter((s) => s.state === 'Open').length} />
        <StatCard label="Potential Vulnerabilities" value={aFindings.filter((f) => f.confidence !== 'Confirmed').length} tone="warn" />
        <StatCard label="Critical Findings" value={bySeverity('Critical')} tone="crit" />
        <StatCard label="High Findings" value={bySeverity('High')} tone="crit" />
        <StatCard label="Medium Findings" value={bySeverity('Medium')} tone="warn" />
        <StatCard label="Low Findings" value={bySeverity('Low')} tone="ok" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-sm font-medium text-ink-100 mb-3">Risk Overview</div>
          {chartData.length === 0 ? (
            <div className="text-sm text-ink-400 py-10 text-center">No findings recorded yet.</div>
          ) : (
            <div className="flex items-center gap-6">
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                      {chartData.map((d) => (
                        <Cell key={d.name} fill={d.fill} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#161C29', border: '1px solid #1E2637', borderRadius: 6, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 flex-1">
                {chartData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink-200">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                      {d.name}
                    </span>
                    <span className="font-mono text-ink-100">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="text-sm font-medium text-ink-100 mb-3">Assessment Progress</div>
          <div className="space-y-2.5">
            {PHASES.map((phase, i) => (
              <div key={phase} className="flex items-center gap-2.5 text-sm">
                {i < currentPhaseIndex || activeAssessment.status === 'Completed' ? (
                  <Check size={15} className="text-signal-ok shrink-0" />
                ) : i === currentPhaseIndex ? (
                  <CircleDot size={15} className="text-signal-accent shrink-0" />
                ) : (
                  <Circle size={15} className="text-ink-500 shrink-0" />
                )}
                <span
                  className={
                    i < currentPhaseIndex || activeAssessment.status === 'Completed'
                      ? 'text-ink-200'
                      : i === currentPhaseIndex
                      ? 'text-ink-100 font-medium'
                      : 'text-ink-400'
                  }
                >
                  {phase}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-ink-800 text-xs text-ink-400">
            {activeAssessment.progress}% complete · Status: {activeAssessment.status}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 lg:col-span-1">
          <div className="text-sm font-medium text-ink-100 mb-3">Attack Surface</div>
          <div className="space-y-2 text-sm">
            <Row label="Total hosts" value={aHosts.length} />
            <Row label="Active hosts" value={aHosts.filter((h) => h.status === 'Online').length} />
            <Row label="Hosts with exposed services" value={new Set(aServices.map((s) => s.hostIp)).size} />
            <Row label="Web services" value={webServices} />
            <Row label="Remote administration services" value={remoteAdmin} />
            <Row label="Database services" value={dbServices} />
          </div>
        </div>

        <div className="card p-4 lg:col-span-2">
          <div className="text-sm font-medium text-ink-100 mb-3">Exposure by Service</div>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <BarChart data={portExposure} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2637" horizontal={false} />
                <XAxis type="number" stroke="#5C6B85" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="service" stroke="#5C6B85" fontSize={11} width={90} />
                <Tooltip contentStyle={{ background: '#161C29', border: '1px solid #1E2637', borderRadius: 6, fontSize: 12 }} cursor={{ fill: '#161C29' }} />
                <Bar dataKey="count" fill="#7B6EF6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-ink-100">Recent Findings</div>
          <Link to="/findings" className="text-xs text-signal-accent hover:underline">
            View all findings
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-sm text-ink-400 py-6 text-center">No findings yet.</div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Finding</th>
                <th>Host</th>
                <th>Service</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((f) => (
                <tr key={f.id}>
                  <td>
                    <SeverityBadge severity={f.severity} />
                  </td>
                  <td>
                    <Link to={`/findings/${f.id}`} className="hover:text-signal-accent">
                      {f.title}
                    </Link>
                  </td>
                  <td className="font-mono text-ink-300">{f.hostIp}</td>
                  <td className="text-ink-300">{f.service || '—'}</td>
                  <td className="text-ink-300">{f.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-300">{label}</span>
      <span className="font-mono text-ink-100">{value}</span>
    </div>
  );
}
