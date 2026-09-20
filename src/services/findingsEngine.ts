import { Finding, ServiceEntry, Host } from '../types';
import { uid } from './storage';

/**
 * Correlate open services into professional security findings.
 * Rule-based risk engine for authorized assessments (FYP-safe, no exploitation).
 */
export function correlateFindings(
  assessmentId: string,
  hosts: Host[],
  services: ServiceEntry[]
): Finding[] {
  const findings: Finding[] = [];
  const open = services.filter((s) => s.state === 'Open');
  const now = new Date().toISOString();

  for (const s of open) {
    const host = hosts.find((h) => h.id === s.hostId);
    const svc = (s.service || '').toLowerCase();
    const ver = (s.version || '').toLowerCase();
    const base = {
      assessmentId,
      hostId: s.hostId,
      hostIp: s.hostIp,
      port: s.port,
      service: s.service,
      status: 'Open' as const,
      confidence: 'Potential' as const,
      createdAt: now,
      synthetic: false,
      references: [] as string[],
    };

    // Telnet
    if (svc.includes('telnet') || s.port === 23) {
      findings.push({
        ...base,
        id: uid('ANPT'),
        title: 'Cleartext Telnet Service Exposed',
        severity: 'High',
        description: `Telnet was detected on ${s.hostIp}:${s.port}. Telnet transmits credentials in cleartext and is obsolete.`,
        evidence: `Nmap service: ${s.service} ${s.version} state=${s.state}`,
        impact: 'Credentials and session data may be intercepted by network attackers.',
        remediation: 'Disable Telnet. Migrate remote administration to SSH with key-based authentication.',
        references: ['https://owasp.org/www-community/vulnerabilities/Using_a_broken_or_risky_cryptographic_algorithm'],
      });
    }

    // FTP
    if (svc.includes('ftp') && !svc.includes('sftp') && s.port === 21) {
      findings.push({
        ...base,
        id: uid('ANPT'),
        title: 'Unencrypted FTP Service',
        severity: 'High',
        description: `FTP on ${s.hostIp}:${s.port} transfers files and credentials without encryption.`,
        evidence: `Service ${s.service} ${s.version}`,
        impact: 'Credentials and file contents may be captured on the network path.',
        remediation: 'Replace FTP with SFTP or FTPS. Restrict access by firewall.',
        references: [],
      });
    }

    // HTTP without TLS
    if ((svc.includes('http') && !svc.includes('https') && !s.tls) || (s.port === 80 && !s.tls)) {
      findings.push({
        ...base,
        id: uid('ANPT'),
        title: 'HTTP Service Without Transport Encryption',
        severity: 'Medium',
        description: `An HTTP service is reachable on ${s.hostIp}:${s.port} without TLS.`,
        evidence: `port=${s.port} service=${s.service} tls=${!!s.tls}`,
        impact: 'Session tokens and form data may be exposed to passive network observers.',
        remediation: 'Enable HTTPS with a valid certificate. Redirect HTTP to HTTPS and enable HSTS.',
        references: ['https://owasp.org/www-project-web-security-testing-guide/'],
      });
    }

    // RDP
    if (svc.includes('ms-wbt-server') || svc.includes('rdp') || s.port === 3389) {
      findings.push({
        ...base,
        id: uid('ANPT'),
        title: 'Remote Desktop (RDP) Exposed',
        severity: 'High',
        description: `RDP is exposed on ${s.hostIp}:${s.port}. Internet-facing RDP is a frequent brute-force target.`,
        evidence: `Service ${s.service} ${s.version}`,
        impact: 'Successful brute force or credential stuffing may yield full system access.',
        remediation: 'Restrict RDP to VPN or jump hosts. Enforce MFA/NLA. Monitor failed logons.',
        references: [],
      });
    }

    // SMB
    if (svc.includes('microsoft-ds') || svc.includes('netbios') || svc.includes('smb') || s.port === 445) {
      findings.push({
        ...base,
        id: uid('ANPT'),
        title: 'SMB File Sharing Exposed',
        severity: ver.includes('smbv1') || ver.includes('smb 1') ? 'Critical' : 'Medium',
        description: `SMB is available on ${s.hostIp}:${s.port}. Legacy SMBv1 significantly increases risk.`,
        evidence: `Service ${s.service} ${s.version}`,
        impact: 'May enable lateral movement, ransomware propagation, or information disclosure.',
        remediation: 'Disable SMBv1. Restrict SMB to internal segments. Apply latest patches.',
        references: ['https://www.cisa.gov/news-events/cybersecurity-advisories'],
      });
    }

    // SSH
    if (svc.includes('ssh') || s.port === 22) {
      findings.push({
        ...base,
        id: uid('ANPT'),
        title: 'SSH Management Interface Reachable',
        severity: 'Low',
        confidence: 'Informational',
        description: `SSH is listening on ${s.hostIp}:${s.port}. Ensure strong authentication and limited source IPs.`,
        evidence: `Service ${s.service} ${s.version}`,
        impact: 'Weak credentials or outdated algorithms may allow unauthorized remote access.',
        remediation: 'Use key-based auth, disable password login where possible, restrict by firewall.',
        references: [],
      });
    }

    // Databases
    if (/mysql|postgres|mssql|mongo|redis|oracle|memcached/.test(svc) || [1433, 3306, 5432, 27017, 6379].includes(s.port)) {
      findings.push({
        ...base,
        id: uid('ANPT'),
        title: 'Database Service Exposed on Network',
        severity: 'High',
        description: `Database-related service ${s.service} is reachable on ${s.hostIp}:${s.port}.`,
        evidence: `Service ${s.service} ${s.version}`,
        impact: 'Unauthorized access may lead to data breach or ransomware.',
        remediation: 'Bind database to localhost or private network only. Require strong auth and TLS.',
        references: [],
      });
    }

    // VNC
    if (svc.includes('vnc') || s.port === 5900) {
      findings.push({
        ...base,
        id: uid('ANPT'),
        title: 'VNC Remote Access Exposed',
        severity: 'High',
        description: `VNC detected on ${s.hostIp}:${s.port}. Often poorly authenticated.`,
        evidence: `Service ${s.service} ${s.version}`,
        impact: 'May allow interactive desktop control by unauthorized parties.',
        remediation: 'Disable VNC if unused; otherwise tunnel over VPN/SSH and enforce strong passwords.',
        references: [],
      });
    }
  }

  // Host without hostname
  for (const h of hosts) {
    if (h.status === 'Online' && !h.hostname) {
      findings.push({
        id: uid('ANPT'),
        assessmentId,
        title: 'Host Discovered Without Resolvable Hostname',
        severity: 'Informational',
        hostId: h.id,
        hostIp: h.ip,
        description: `Host ${h.ip} responded during discovery but no hostname was identified.`,
        evidence: `status=${h.status} osHint=${h.osHint}`,
        impact: 'Informational inventory gap for asset management.',
        remediation: 'Ensure DNS/reverse DNS is maintained for production assets.',
        references: [],
        status: 'Open',
        confidence: 'Informational',
        createdAt: now,
        synthetic: false,
      });
    }
  }

  // De-duplicate by title+host+port
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = `${f.title}|${f.hostIp}|${f.port || 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
