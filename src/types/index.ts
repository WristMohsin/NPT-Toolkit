export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
export type Confidence = 'Confirmed' | 'Potential' | 'Informational';
export type FindingStatus = 'Open' | 'Confirmed' | 'False Positive' | 'Accepted Risk' | 'Remediated' | 'Retest Required';
export type AssessmentStatus = 'Draft' | 'Ready' | 'Running' | 'Paused' | 'Completed' | 'Archived';
export type ExecutionMode = 'Demo' | 'Import' | 'Agent';
export type HostStatus = 'Online' | 'Offline' | 'Unknown';

export interface Assessment {
  id: string;
  name: string;
  client: string;
  owner: string;
  scope: string;
  excluded: string;
  startDate: string;
  endDate: string;
  description: string;
  authorizationStatus: 'Confirmed' | 'Pending';
  profile: string;
  status: AssessmentStatus;
  executionMode: ExecutionMode;
  progress: number;
  phase: string;
  createdAt: string;
}

export interface Host {
  id: string;
  assessmentId: string;
  ip: string;
  hostname: string;
  status: HostStatus;
  osHint: string;
  lastSeen: string;
}

export interface ServiceEntry {
  id: string;
  assessmentId: string;
  hostId: string;
  hostIp: string;
  port: number;
  protocol: 'TCP' | 'UDP';
  service: string;
  version: string;
  state: 'Open' | 'Closed' | 'Filtered';
  risk: Severity | 'None';
  tls?: boolean;
}

export interface Finding {
  id: string;
  assessmentId: string;
  title: string;
  severity: Severity;
  cvss?: number;
  hostId: string;
  hostIp: string;
  port?: number;
  service?: string;
  description: string;
  evidence: string;
  impact: string;
  remediation: string;
  references: string[];
  status: FindingStatus;
  confidence: Confidence;
  createdAt: string;
  synthetic: boolean;
}

export interface EvidenceItem {
  id: string;
  findingId: string;
  timestamp: string;
  source: string;
  type: 'Screenshot' | 'Text output' | 'JSON' | 'XML' | 'Service metadata' | 'Scan result' | 'Analyst note';
  description: string;
  content: string;
}

export interface LogEntry {
  time: string;
  message: string;
}

export interface Target {
  id: string;
  assessmentId: string;
  value: string;
  type: 'IPv4' | 'IPv6' | 'Hostname' | 'CIDR' | 'Domain';
  scopeStatus: 'Included' | 'Excluded';
  authorization: 'Confirmed' | 'Pending';
  lastAssessment: string;
}
