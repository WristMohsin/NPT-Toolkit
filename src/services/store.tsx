import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Assessment, Host, ServiceEntry, Finding, Target, LogEntry } from '../types';
import { StorageProvider, uid } from './storage';
import { buildDemoDataset } from '../data/demoData';

interface StoreShape {
  assessments: Assessment[];
  targets: Target[];
  hosts: Host[];
  services: ServiceEntry[];
  findings: Finding[];
  logs: LogEntry[];
  activeAssessmentId: string | null;
}

interface StoreApi extends StoreShape {
  setActiveAssessmentId: (id: string | null) => void;
  activeAssessment: Assessment | undefined;
  loadDemoData: () => void;
  clearDemoData: () => void;
  resetAll: () => void;
  updateFindingStatus: (id: string, status: Finding['status']) => void;
  addAssessment: (a: Assessment) => void;
  updateAssessment: (id: string, patch: Partial<Assessment>) => void;
  confirmAuthorization: (assessmentId: string) => void;
  importDataset: (payload: { hosts: Host[]; services: ServiceEntry[]; findings: Finding[]; assessment?: Assessment }) => void;
  exportAll: () => string;
}

const StoreContext = createContext<StoreApi | null>(null);

const COLLECTIONS = {
  assessments: 'assessments',
  targets: 'targets',
  hosts: 'hosts',
  services: 'services',
  findings: 'findings',
  logs: 'logs',
};

function detectTargetType(value: string): Target['type'] {
  if (/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(value)) return 'CIDR';
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) return 'IPv4';
  if (value.includes(':')) return 'IPv6';
  return 'Hostname';
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [assessments, setAssessments] = useState<Assessment[]>(() => StorageProvider.getAll(COLLECTIONS.assessments));
  const [targets, setTargets] = useState<Target[]>(() => StorageProvider.getAll(COLLECTIONS.targets));
  const [hosts, setHosts] = useState<Host[]>(() => StorageProvider.getAll(COLLECTIONS.hosts));
  const [services, setServices] = useState<ServiceEntry[]>(() => StorageProvider.getAll(COLLECTIONS.services));
  const [findings, setFindings] = useState<Finding[]>(() => StorageProvider.getAll(COLLECTIONS.findings));
  const [logs, setLogs] = useState<LogEntry[]>(() => StorageProvider.getAll(COLLECTIONS.logs));
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(
    () => localStorage.getItem('anpt:active') || null
  );

  useEffect(() => StorageProvider.setAll(COLLECTIONS.assessments, assessments), [assessments]);
  useEffect(() => StorageProvider.setAll(COLLECTIONS.targets, targets), [targets]);
  useEffect(() => StorageProvider.setAll(COLLECTIONS.hosts, hosts), [hosts]);
  useEffect(() => StorageProvider.setAll(COLLECTIONS.services, services), [services]);
  useEffect(() => StorageProvider.setAll(COLLECTIONS.findings, findings), [findings]);
  useEffect(() => StorageProvider.setAll(COLLECTIONS.logs, logs), [logs]);
  useEffect(() => {
    if (activeAssessmentId) localStorage.setItem('anpt:active', activeAssessmentId);
  }, [activeAssessmentId]);

  const loadDemoData = useCallback(() => {
    const demo = buildDemoDataset();
    setAssessments((prev) => [demo.assessment, ...prev.filter((a) => a.id !== demo.assessment.id)]);
    setTargets((prev) => [...demo.targets, ...prev.filter((t) => t.assessmentId !== demo.assessment.id)]);
    setHosts((prev) => [...demo.hosts, ...prev.filter((h) => h.assessmentId !== demo.assessment.id)]);
    setServices((prev) => [...demo.services, ...prev.filter((s) => s.assessmentId !== demo.assessment.id)]);
    setFindings((prev) => [...demo.findings, ...prev.filter((f) => f.assessmentId !== demo.assessment.id)]);
    setLogs(demo.logs);
    setActiveAssessmentId(demo.assessment.id);
  }, []);

  const clearDemoData = useCallback(() => {
    setAssessments((prev) => prev.filter((a) => a.executionMode !== 'Demo'));
    const demoIds = new Set(assessments.filter((a) => a.executionMode === 'Demo').map((a) => a.id));
    setTargets((prev) => prev.filter((t) => !demoIds.has(t.assessmentId)));
    setHosts((prev) => prev.filter((h) => !demoIds.has(h.assessmentId)));
    setServices((prev) => prev.filter((s) => !demoIds.has(s.assessmentId)));
    setFindings((prev) => prev.filter((f) => !demoIds.has(f.assessmentId)));
    setLogs([]);
  }, [assessments]);

  const resetAll = useCallback(() => {
    StorageProvider.clearAll();
    localStorage.removeItem('anpt:active');
    setAssessments([]);
    setTargets([]);
    setHosts([]);
    setServices([]);
    setFindings([]);
    setLogs([]);
    setActiveAssessmentId(null);
  }, []);

  const updateFindingStatus = useCallback((id: string, status: Finding['status']) => {
    setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  }, []);

  const addAssessment = useCallback((a: Assessment) => {
    setAssessments((prev) => [a, ...prev]);
    setActiveAssessmentId(a.id);
  }, []);

  const updateAssessment = useCallback((id: string, patch: Partial<Assessment>) => {
    setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  /** Confirm authorization + create Target rows from scope/excluded strings */
  const confirmAuthorization = useCallback((assessmentId: string) => {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (!assessment) return;

    setAssessments((prev) =>
      prev.map((a) =>
        a.id === assessmentId
          ? { ...a, authorizationStatus: 'Confirmed', status: a.status === 'Draft' ? 'Ready' : a.status }
          : a
      )
    );

    const included = assessment.scope
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const excluded = assessment.excluded
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newTargets: Target[] = [
      ...included.map((value) => ({
        id: uid('TGT'),
        assessmentId,
        value,
        type: detectTargetType(value),
        scopeStatus: 'Included' as const,
        authorization: 'Confirmed' as const,
        lastAssessment: new Date().toISOString().slice(0, 10),
      })),
      ...excluded.map((value) => ({
        id: uid('TGT'),
        assessmentId,
        value,
        type: detectTargetType(value),
        scopeStatus: 'Excluded' as const,
        authorization: 'Confirmed' as const,
        lastAssessment: new Date().toISOString().slice(0, 10),
      })),
    ];

    setTargets((prev) => {
      const others = prev.filter((t) => t.assessmentId !== assessmentId);
      return [...newTargets, ...others];
    });
  }, [assessments]);

  const importDataset = useCallback(
    (payload: { hosts: Host[]; services: ServiceEntry[]; findings: Finding[]; assessment?: Assessment }) => {
      if (payload.assessment) setAssessments((prev) => [payload.assessment as Assessment, ...prev]);
      setHosts((prev) => [...payload.hosts, ...prev]);
      setServices((prev) => [...payload.services, ...prev]);
      setFindings((prev) => [...payload.findings, ...prev]);
    },
    []
  );

  const exportAll = useCallback(() => {
    return JSON.stringify({ assessments, targets, hosts, services, findings, logs }, null, 2);
  }, [assessments, targets, hosts, services, findings, logs]);

  const activeAssessment = useMemo(
    () => assessments.find((a) => a.id === activeAssessmentId),
    [assessments, activeAssessmentId]
  );

  const value: StoreApi = {
    assessments,
    targets,
    hosts,
    services,
    findings,
    logs,
    activeAssessmentId,
    setActiveAssessmentId,
    activeAssessment,
    loadDemoData,
    clearDemoData,
    resetAll,
    updateFindingStatus,
    addAssessment,
    updateAssessment,
    confirmAuthorization,
    importDataset,
    exportAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
