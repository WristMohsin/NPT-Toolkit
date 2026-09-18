import React, { useRef, useState } from 'react';
import { useStore } from '../services/store';
import { SectionHeading } from '../components/ui';
import { parseNmapXml, parseAnptJson, ImportResult } from '../services/importParsers';
import { Upload, FileWarning, CheckCircle2 } from 'lucide-react';

export default function ImportCenter() {
  const { activeAssessment, importDataset } = useStore();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);
    if (!activeAssessment) {
      setError('Select or create an active assessment before importing results.');
      return;
    }
    const text = await file.text();
    try {
      let res: ImportResult;
      if (file.name.toLowerCase().endsWith('.xml')) {
        res = parseNmapXml(text, activeAssessment.id);
      } else if (file.name.toLowerCase().endsWith('.json')) {
        res = parseAnptJson(text, activeAssessment.id);
      } else {
        throw new Error('Unsupported file type. Upload a Nmap XML (.xml) export or an ANPT JSON (.json) file.');
      }
      importDataset({ hosts: res.hosts, services: res.services, findings: res.findings });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Import failed. The file could not be processed.');
    }
  };

  return (
    <div>
      <SectionHeading title="Import Center" subtitle="Import authorized scan results from external tools. Imported data is treated as untrusted input." />

      {!activeAssessment && (
        <div className="mb-4 text-sm text-signal-med bg-signal-med/10 border border-signal-med/30 rounded px-3 py-2">
          No active assessment selected. Imported hosts and services will be attached to the currently active assessment — select one first.
        </div>
      )}

      <div
        className="card border-dashed p-10 flex flex-col items-center justify-center text-center mb-5 cursor-pointer hover:border-signal-accent/50"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
      >
        <Upload size={22} className="text-ink-400 mb-2" />
        <div className="text-sm text-ink-100 font-medium mb-1">Upload scan results</div>
        <div className="text-xs text-ink-400">Nmap XML (.xml) or ANPT JSON (.json) — drag & drop or click to browse</div>
        <input
          ref={fileRef}
          type="file"
          accept=".xml,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {error && (
        <div className="card p-4 mb-5 border-signal-crit/40">
          <div className="flex items-center gap-2 text-signal-crit text-sm font-medium mb-1">
            <FileWarning size={15} /> Import failed
          </div>
          <div className="text-sm text-ink-300">{error}</div>
        </div>
      )}

      {result && (
        <div className="card p-4 mb-5">
          <div className="flex items-center gap-2 text-signal-ok text-sm font-medium mb-3">
            <CheckCircle2 size={15} /> Import Summary
          </div>
          <div className="grid grid-cols-3 gap-4 text-center mb-3">
            <div>
              <div className="text-2xl font-mono font-semibold text-ink-100">{result.hosts.length}</div>
              <div className="text-xs text-ink-400">Hosts</div>
            </div>
            <div>
              <div className="text-2xl font-mono font-semibold text-ink-100">{result.services.length}</div>
              <div className="text-xs text-ink-400">Services</div>
            </div>
            <div>
              <div className="text-2xl font-mono font-semibold text-ink-100">{result.findings.length}</div>
              <div className="text-xs text-ink-400">Findings</div>
            </div>
          </div>
          {result.warnings.length > 0 && (
            <div className="border-t border-ink-800 pt-3">
              <div className="text-xs text-signal-med mb-1.5">{result.warnings.length} warning(s)</div>
              <ul className="text-xs text-ink-400 space-y-1 list-disc list-inside">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="card p-4">
        <div className="text-sm font-medium text-ink-100 mb-2">Supported formats</div>
        <ul className="text-sm text-ink-300 space-y-1.5">
          <li><span className="font-mono text-ink-100">Nmap XML</span> — standard <code className="font-mono text-xs bg-ink-800 px-1 rounded">nmap -oX</code> export; hosts, ports, service/version and OS hints are parsed.</li>
          <li><span className="font-mono text-ink-100">ANPT JSON</span> — custom format with <code className="font-mono text-xs bg-ink-800 px-1 rounded">hosts</code>, <code className="font-mono text-xs bg-ink-800 px-1 rounded">services</code>, and <code className="font-mono text-xs bg-ink-800 px-1 rounded">findings</code> arrays.</li>
        </ul>
      </div>
    </div>
  );
}
