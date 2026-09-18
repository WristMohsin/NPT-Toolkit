import React from 'react';
import { useStore } from '../services/store';
import { EmptyState, SectionHeading } from '../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Severity } from '../types';

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: '#E5484D',
  High: '#F2994A',
  Medium: '#E9B949',
  Low: '#4C9AFF',
  Informational: '#8792A8',
};

const tooltipStyle = { background: '#161C29', border: '1px solid #1E2637', borderRadius: 6, fontSize: 12 };

export default function Analytics() {
  const { activeAssessment, findings, services, hosts } = useStore();

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to view analytics." />;
  }

  const aFindings = findings.filter((f) => f.assessmentId === activeAssessment.id);
  const aServices = services.filter((s) => s.assessmentId === activeAssessment.id);
  const aHosts = hosts.filter((h) => h.assessmentId === activeAssessment.id);

  const severityData = (['Critical', 'High', 'Medium', 'Low', 'Informational'] as Severity[])
    .map((sev) => ({ name: sev, value: aFindings.filter((f) => f.severity === sev).length, fill: SEVERITY_COLORS[sev] }))
    .filter((d) => d.value > 0);

  const byDay = aFindings.reduce<Record<string, number>>((acc, f) => {
    const day = new Date(f.createdAt).toLocaleDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const timelineData = Object.entries(byDay)
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => (new Date(a.day).getTime() > new Date(b.day).getTime() ? 1 : -1));

  const serviceCategoryData = Object.entries(
    aServices.reduce<Record<string, number>>((acc, s) => {
      const cat = /http/i.test(s.service) ? 'Web' : /ssh|rdp|vnc|telnet/i.test(s.service) ? 'Remote Admin'
        : /mysql|postgres|mssql|mongo|oracle/i.test(s.service) ? 'Database' : /dns/i.test(s.service) ? 'DNS'
        : /smb/i.test(s.service) ? 'File Sharing' : 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([category, count]) => ({ category, count }));

  const hostRiskData = aHosts.map((h) => ({
    host: h.ip,
    findings: aFindings.filter((f) => f.hostId === h.id).length,
  })).sort((a, b) => b.findings - a.findings);

  const portExposureData = Object.entries(
    aServices.reduce<Record<string, number>>((acc, s) => {
      const key = `${s.port}/${s.protocol}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([port, count]) => ({ port, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div>
      <SectionHeading title="Analytics" subtitle="Visual breakdown of findings, services, and host risk for this assessment." />

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Severity Distribution">
          {severityData.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {severityData.map((d) => <Cell key={d.name} fill={d.fill} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Findings Over Time">
          {timelineData.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2637" />
                <XAxis dataKey="day" stroke="#5C6B85" fontSize={11} />
                <YAxis stroke="#5C6B85" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#7B6EF6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Services by Category">
          {serviceCategoryData.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serviceCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2637" />
                <XAxis dataKey="category" stroke="#5C6B85" fontSize={11} />
                <YAxis stroke="#5C6B85" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#161C29' }} />
                <Bar dataKey="count" fill="#4C9AFF" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Hosts by Risk (Finding Count)">
          {hostRiskData.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hostRiskData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2637" horizontal={false} />
                <XAxis type="number" stroke="#5C6B85" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="host" stroke="#5C6B85" fontSize={11} width={90} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#161C29' }} />
                <Bar dataKey="findings" fill="#F2994A" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Exposure by Port">
        {portExposureData.length === 0 ? <NoData /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={portExposureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2637" />
              <XAxis dataKey="port" stroke="#5C6B85" fontSize={11} />
              <YAxis stroke="#5C6B85" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#161C29' }} />
              <Bar dataKey="count" fill="#7B6EF6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-sm font-medium text-ink-100 mb-2">{title}</div>
      {children}
    </div>
  );
}

function NoData() {
  return <div className="text-sm text-ink-400 py-16 text-center">No data available yet.</div>;
}
