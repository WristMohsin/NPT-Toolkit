import React from 'react';
import { useStore } from '../services/store';
import { Button, SectionHeading, EmptyState } from '../components/ui';
import { Download } from 'lucide-react';

export default function ExportCenter() {
  const { exportAll, assessments } = useStore();

  const download = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anpt-full-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionHeading title="Export Center" subtitle="Export assessment data for archival or transfer to other authorized tools." />
      {assessments.length === 0 ? (
        <EmptyState title="Nothing to export yet" body="Create or load an assessment before exporting data." />
      ) : (
        <div className="card p-4">
          <div className="text-sm text-ink-300 mb-3">Export all assessments, hosts, services, and findings as a single ANPT JSON file.</div>
          <Button onClick={download}><Download size={14} /> Export All Data (JSON)</Button>
        </div>
      )}
    </div>
  );
}
