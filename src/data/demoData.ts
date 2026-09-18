import { Assessment, Host, ServiceEntry, Finding, Target, LogEntry } from '../types';
import { uid } from '../services/storage';

const now = new Date();
const iso = (offsetMin: number) => new Date(now.getTime() + offsetMin * 60000).toISOString();

export function buildDemoDataset() {
  const assessmentId = 'ANPT-DEMO-001';

  const assessment: Assessment = {
    id: assessmentId,
    name: 'Internal Lab Assessment',
    client: 'ANPT Labs (Internal)',
    owner: 'Security Analyst',
    scope: '192.168.56.0/24',
    excluded: '192.168.56.1, 192.168.56.254',
    startDate: iso(-120),
    endDate: iso(360),
    description: 'Synthetic demo assessment used to showcase the ANPT Toolkit interface. Not a real security assessment.',
    authorizationStatus: 'Confirmed',
    profile: 'Standard Internal Assessment',
    status: 'Completed',
    executionMode: 'Demo',
    progress: 100,
    phase: 'Report Generation',
    createdAt: iso(-130),
  };

  const targets: Target[] = [
    { id: uid('TGT'), assessmentId, value: '192.168.56.0/24', type: 'CIDR', scopeStatus: 'Included', authorization: 'Confirmed', lastAssessment: iso(-2) },
    { id: uid('TGT'), assessmentId, value: '192.168.56.1', type: 'IPv4', scopeStatus: 'Excluded', authorization: 'Confirmed', lastAssessment: '—' },
    { id: uid('TGT'), assessmentId, value: '192.168.56.254', type: 'IPv4', scopeStatus: 'Excluded', authorization: 'Confirmed', lastAssessment: '—' },
  ];

  const hostSeed = [
    { ip: '192.168.56.10', hostname: 'DC01.lab.local', os: 'Windows Server 2019' },
    { ip: '192.168.56.20', hostname: 'WEB01.lab.local', os: 'Linux (Ubuntu 22.04 likely)' },
    { ip: '192.168.56.30', hostname: 'DB01.lab.local', os: 'Linux (Debian likely)' },
    { ip: '192.168.56.40', hostname: 'FILE01.lab.local', os: 'Windows Server 2016' },
    { ip: '192.168.56.50', hostname: 'JUMP01.lab.local', os: 'Linux (Ubuntu likely)' },
  ];

  const hosts: Host[] = hostSeed.map((h) => ({
    id: uid('HOST'),
    assessmentId,
    ip: h.ip,
    hostname: h.hostname,
    status: 'Online',
    osHint: h.os,
    lastSeen: iso(-5),
  }));

  const byIp = (ip: string) => hosts.find((h) => h.ip === ip)!;

  const serviceSeed: Array<[string, number, 'TCP' | 'UDP', string, string, Severity | 'None', boolean?]> = [
    ['192.168.56.10', 53, 'UDP', 'DNS', 'BIND-like 9.x', 'Low'],
    ['192.168.56.10', 88, 'TCP', 'Kerberos', 'MIT Kerberos', 'None'],
    ['192.168.56.10', 445, 'TCP', 'SMB', 'SMB 3.1.1', 'Medium'],
    ['192.168.56.20', 22, 'TCP', 'SSH', 'OpenSSH 8.2', 'Low'],
    ['192.168.56.20', 80, 'TCP', 'HTTP', 'nginx 1.18', 'Medium'],
    ['192.168.56.20', 443, 'TCP', 'HTTPS', 'nginx 1.18', 'High', true],
    ['192.168.56.30', 22, 'TCP', 'SSH', 'OpenSSH 8.9', 'None'],
    ['192.168.56.30', 3306, 'TCP', 'MySQL', 'MySQL 5.7.31', 'Critical'],
    ['192.168.56.40', 445, 'TCP', 'SMB', 'SMB 1.0 (legacy)', 'Critical'],
    ['192.168.56.40', 3389, 'TCP', 'RDP', 'Microsoft Terminal Services', 'High'],
    ['192.168.56.50', 22, 'TCP', 'SSH', 'OpenSSH 9.0', 'None'],
    ['192.168.56.50', 8080, 'TCP', 'HTTP-Proxy', 'Squid 4.13', 'Low'],
  ];

  const services: ServiceEntry[] = serviceSeed.map(([ip, port, protocol, service, version, risk, tls]) => ({
    id: uid('SVC'),
    assessmentId,
    hostId: byIp(ip).id,
    hostIp: ip,
    port,
    protocol,
    service,
    version,
    state: 'Open',
    risk,
    tls,
  }));

  const findingSeed: Array<Omit<Finding, 'id' | 'assessmentId' | 'hostId' | 'createdAt' | 'synthetic'>> = [
    {
      title: 'SMBv1 Protocol Enabled (Legacy, Unsupported)',
      severity: 'Critical',
      cvss: 9.8,
      hostIp: '192.168.56.40',
      port: 445,
      service: 'SMB',
      description: 'The host advertises support for the deprecated SMBv1 protocol, which has known remote code execution vulnerabilities (e.g. the class of issues exploited by EternalBlue) in unpatched deployments.',
      evidence: 'Service banner and protocol negotiation response captured during service enumeration indicate SMBv1 dialect support.',
      impact: 'If unpatched, SMBv1 exposure can allow unauthenticated remote code execution or facilitate lateral movement within the lab network.',
      remediation: 'Disable SMBv1 via Windows Features / registry policy and enforce SMBv2/3 minimum. Apply latest vendor security updates.',
      references: ['https://learn.microsoft.com/windows-server/storage/file-server/troubleshoot/detect-enable-and-disable-smbv1-v2-v3'],
      status: 'Confirmed',
      confidence: 'Confirmed',
    },
    {
      title: 'MySQL Service Exposed with Outdated Version',
      severity: 'Critical',
      cvss: 9.1,
      hostIp: '192.168.56.30',
      port: 3306,
      service: 'MySQL',
      description: 'A MySQL 5.7.31 instance is reachable from the internal network segment. This version predates several published security fixes.',
      evidence: 'Version string returned during service enumeration: "5.7.31-log".',
      impact: 'An outdated database service increases the attack surface for known vulnerabilities and unauthorized data access if combined with weak credentials.',
      remediation: 'Upgrade to a supported MySQL release, restrict network exposure to only application hosts, and enforce strong authentication.',
      references: ['https://dev.mysql.com/doc/relnotes/mysql/5.7/en/'],
      status: 'Open',
      confidence: 'Potential',
    },
    {
      title: 'RDP Exposed to Internal Segment Without Network Level Authentication Confirmation',
      severity: 'High',
      cvss: 7.5,
      hostIp: '192.168.56.40',
      port: 3389,
      service: 'RDP',
      description: 'Remote Desktop Protocol is reachable on the host. NLA enforcement could not be confirmed via passive enumeration alone.',
      evidence: 'TCP handshake and RDP negotiation response observed on port 3389.',
      impact: 'Exposed RDP services are a common target for credential attacks and, if unpatched, remote code execution vulnerabilities.',
      remediation: 'Restrict RDP to a jump host, enforce Network Level Authentication, enable account lockout policies, and apply latest patches.',
      references: ['https://learn.microsoft.com/windows-server/remote/remote-desktop-services/clients/remote-desktop-allow-access'],
      status: 'Open',
      confidence: 'Potential',
    },
    {
      title: 'TLS Configuration Allows Legacy Cipher Suites',
      severity: 'High',
      cvss: 6.5,
      hostIp: '192.168.56.20',
      port: 443,
      service: 'HTTPS',
      description: 'The web server accepts connections using cipher suites considered weak by current guidance.',
      evidence: 'TLS handshake enumeration captured supported cipher list including legacy CBC-mode suites.',
      impact: 'Weak cipher suites can, under certain conditions, be leveraged to weaken confidentiality of data in transit.',
      remediation: 'Update TLS configuration to disable legacy ciphers and enforce TLS 1.2+ with modern cipher suites (e.g. AEAD ciphers).',
      references: ['https://ssl-config.mozilla.org/'],
      status: 'Open',
      confidence: 'Confirmed',
    },
    {
      title: 'HTTP Security Headers Missing',
      severity: 'Medium',
      cvss: 4.3,
      hostIp: '192.168.56.20',
      port: 80,
      service: 'HTTP',
      description: 'The web service response does not include recommended security headers such as Content-Security-Policy and X-Content-Type-Options.',
      evidence: 'HTTP response headers captured during web service assessment.',
      impact: 'Missing headers can make client-side attacks such as clickjacking or MIME sniffing easier to carry out.',
      remediation: 'Add Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, and Strict-Transport-Security headers.',
      references: ['https://owasp.org/www-project-secure-headers/'],
      status: 'Open',
      confidence: 'Confirmed',
    },
    {
      title: 'SMB Signing Not Enforced',
      severity: 'Medium',
      cvss: 5.3,
      hostIp: '192.168.56.10',
      port: 445,
      service: 'SMB',
      description: 'SMB signing does not appear to be required on this host, based on protocol negotiation responses.',
      evidence: 'SMB negotiation flags captured during service enumeration indicate signing is not enforced.',
      impact: 'Without signing, SMB traffic may be more susceptible to relay-style attacks within the local network.',
      remediation: 'Enforce SMB signing via Group Policy for all domain-joined hosts.',
      references: ['https://learn.microsoft.com/windows-server/storage/file-server/smb-signing'],
      status: 'Open',
      confidence: 'Potential',
    },
    {
      title: 'DNS Server Allows Recursive Queries from Internal Hosts',
      severity: 'Low',
      cvss: 3.1,
      hostIp: '192.168.56.10',
      port: 53,
      service: 'DNS',
      description: 'The DNS service responds to recursive queries originating from arbitrary hosts within the internal segment.',
      evidence: 'Recursive query test returned a resolved response during discovery.',
      impact: 'Overly permissive recursion can be used for internal reconnaissance or amplification if reachable more broadly.',
      remediation: 'Restrict recursion to authorized internal resolvers only.',
      references: ['https://www.cisa.gov/'],
      status: 'Open',
      confidence: 'Confirmed',
    },
    {
      title: 'HTTP Proxy Exposes Server Version Banner',
      severity: 'Low',
      cvss: 2.6,
      hostIp: '192.168.56.50',
      port: 8080,
      service: 'HTTP-Proxy',
      description: 'The proxy service response discloses the exact software name and version.',
      evidence: 'Server header returned: "Squid/4.13".',
      impact: 'Version disclosure narrows the field for an attacker researching known issues for that exact release.',
      remediation: 'Suppress or generalize version banners in the proxy configuration.',
      references: [],
      status: 'Open',
      confidence: 'Confirmed',
    },
    {
      title: 'SSH Host Key Algorithm List Includes Deprecated Options',
      severity: 'Low',
      cvss: 2.2,
      hostIp: '192.168.56.20',
      port: 22,
      service: 'SSH',
      description: 'The SSH service offers some host key and key-exchange algorithms considered legacy by current hardening guides.',
      evidence: 'Algorithm negotiation list captured during service enumeration.',
      impact: 'Legacy algorithms slightly widen the theoretical attack surface for cryptographic downgrade scenarios.',
      remediation: 'Restrict sshd_config to modern key exchange, cipher, and MAC algorithms only.',
      references: ['https://www.ssh.com/academy/ssh/sshd_config'],
      status: 'Open',
      confidence: 'Confirmed',
    },
    {
      title: 'Informational: Web Technology Fingerprint',
      severity: 'Informational',
      hostIp: '192.168.56.20',
      port: 443,
      service: 'HTTPS',
      description: 'Passive fingerprinting identified the underlying web server and a common reverse-proxy pattern.',
      evidence: 'Response headers and TLS certificate metadata reviewed during web service assessment.',
      impact: 'No direct security impact; recorded for situational awareness and future correlation.',
      remediation: 'No action required.',
      references: [],
      status: 'Open',
      confidence: 'Informational',
    },
  ];

  const findings: Finding[] = findingSeed.map((f) => ({
    ...f,
    id: uid('ANPT'),
    assessmentId,
    hostId: byIp(f.hostIp).id,
    createdAt: iso(-30 + Math.floor(Math.random() * 20)),
    synthetic: true,
  }));

  const logs: LogEntry[] = [
    { time: iso(-118), message: 'Assessment initialized (DEMO MODE — simulated execution)' },
    { time: iso(-117), message: 'Scope validation completed: 192.168.56.0/24' },
    { time: iso(-115), message: 'Discovery phase started' },
    { time: iso(-108), message: `${hosts.length} hosts identified` },
    { time: iso(-100), message: 'Service enumeration started' },
    { time: iso(-85), message: `${services.length} services identified` },
    { time: iso(-60), message: 'Vulnerability correlation completed' },
    { time: iso(-40), message: `${findings.length} findings generated` },
    { time: iso(-5), message: 'Assessment completed' },
  ];

  return { assessment, targets, hosts, services, findings, logs };
}

type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
