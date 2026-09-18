import { Host, ServiceEntry, Finding } from '../types';
import { uid } from './storage';

export interface ImportResult {
  hosts: Host[];
  services: ServiceEntry[];
  findings: Finding[];
  warnings: string[];
}

function riskForService(service: string, version: string): ServiceEntry['risk'] {
  const s = (service + ' ' + version).toLowerCase();
  if (s.includes('smbv1') || s.includes('smb 1')) return 'Critical';
  if (s.includes('telnet') || s.includes('ftp')) return 'High';
  if (s.includes('http') && !s.includes('https')) return 'Medium';
  if (s.includes('rdp') || s.includes('vnc')) return 'High';
  return 'Low';
}

export function parseNmapXml(xmlText: string, assessmentId: string): ImportResult {
  const warnings: string[] = [];
  const hosts: Host[] = [];
  const services: ServiceEntry[] = [];

  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(xmlText, 'application/xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      throw new Error('XML parse error');
    }
  } catch {
    throw new Error('The selected file could not be parsed. Check that it is a valid Nmap XML export.');
  }

  const hostNodes = Array.from(doc.getElementsByTagName('host'));
  if (hostNodes.length === 0) {
    warnings.push('No <host> elements were found in the Nmap XML file.');
  }

  for (const hostNode of hostNodes) {
    const statusEl = hostNode.getElementsByTagName('status')[0];
    const state = statusEl?.getAttribute('state') || 'unknown';

    const addressEls = Array.from(hostNode.getElementsByTagName('address'));
    const ipv4 = addressEls.find((a) => a.getAttribute('addrtype') === 'ipv4');
    const ip = ipv4?.getAttribute('addr') || addressEls[0]?.getAttribute('addr') || 'unknown';

    const hostnameEl = hostNode.getElementsByTagName('hostname')[0];
    const hostname = hostnameEl?.getAttribute('name') || '';

    const osEl = hostNode.getElementsByTagName('osmatch')[0];
    const osHint = osEl?.getAttribute('name') || 'Unknown';

    const host: Host = {
      id: uid('HOST'),
      assessmentId,
      ip,
      hostname,
      status: state === 'up' ? 'Online' : state === 'down' ? 'Offline' : 'Unknown',
      osHint,
      lastSeen: new Date().toISOString(),
    };
    hosts.push(host);

    const portNodes = Array.from(hostNode.getElementsByTagName('port'));
    for (const portNode of portNodes) {
      const portId = parseInt(portNode.getAttribute('portid') || '0', 10);
      const protocol = (portNode.getAttribute('protocol') || 'tcp').toUpperCase() as 'TCP' | 'UDP';
      const stateEl = portNode.getElementsByTagName('state')[0];
      const portState = stateEl?.getAttribute('state') || 'unknown';
      const serviceEl = portNode.getElementsByTagName('service')[0];
      const serviceName = serviceEl?.getAttribute('name') || 'unknown';
      const product = serviceEl?.getAttribute('product') || '';
      const versionAttr = serviceEl?.getAttribute('version') || '';
      const version = [product, versionAttr].filter(Boolean).join(' ') || 'Unknown';
      const tls = serviceEl?.getAttribute('tunnel') === 'ssl';

      if (!portId) {
        warnings.push(`Skipped a port entry with missing or invalid port number on host ${ip}.`);
        continue;
      }

      services.push({
        id: uid('SVC'),
        assessmentId,
        hostId: host.id,
        hostIp: ip,
        port: portId,
        protocol,
        service: serviceName,
        version,
        state: portState === 'open' ? 'Open' : portState === 'closed' ? 'Closed' : 'Filtered',
        risk: riskForService(serviceName, version),
        tls,
      });
    }
  }

  return { hosts, services, findings: [], warnings };
}

export function parseAnptJson(jsonText: string, assessmentId: string): ImportResult {
  const warnings: string[] = [];
  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('The selected file is not valid JSON. Check the file and try again.');
  }

  const hosts: Host[] = Array.isArray(parsed.hosts)
    ? parsed.hosts.map((h: any) => {
        if (!h.ip) warnings.push('A host entry was missing an "ip" field and was skipped.');
        return {
          id: uid('HOST'),
          assessmentId,
          ip: h.ip || 'unknown',
          hostname: h.hostname || '',
          status: h.status === 'Online' || h.status === 'Offline' ? h.status : 'Unknown',
          osHint: h.osHint || 'Unknown',
          lastSeen: h.lastSeen || new Date().toISOString(),
        };
      })
    : (warnings.push('No "hosts" array found in the JSON payload.'), []);

  const hostByIp = new Map(hosts.map((h) => [h.ip, h]));

  const services: ServiceEntry[] = Array.isArray(parsed.services)
    ? parsed.services.map((s: any) => {
        const host = hostByIp.get(s.hostIp);
        if (!host) warnings.push(`Service on port ${s.port} references an unknown host IP (${s.hostIp}).`);
        return {
          id: uid('SVC'),
          assessmentId,
          hostId: host?.id || 'unknown',
          hostIp: s.hostIp || 'unknown',
          port: Number(s.port) || 0,
          protocol: s.protocol === 'UDP' ? 'UDP' : 'TCP',
          service: s.service || 'unknown',
          version: s.version || 'Unknown',
          state: s.state === 'Closed' || s.state === 'Filtered' ? s.state : 'Open',
          risk: s.risk || 'Low',
          tls: !!s.tls,
        };
      })
    : [];

  const findings: Finding[] = Array.isArray(parsed.findings)
    ? parsed.findings.map((f: any) => {
        const host = hostByIp.get(f.hostIp);
        return {
          id: uid('ANPT'),
          assessmentId,
          title: f.title || 'Untitled finding',
          severity: ['Critical', 'High', 'Medium', 'Low', 'Informational'].includes(f.severity) ? f.severity : 'Informational',
          cvss: typeof f.cvss === 'number' ? f.cvss : undefined,
          hostId: host?.id || 'unknown',
          hostIp: f.hostIp || 'unknown',
          port: f.port,
          service: f.service,
          description: f.description || '',
          evidence: f.evidence || '',
          impact: f.impact || '',
          remediation: f.remediation || '',
          references: Array.isArray(f.references) ? f.references : [],
          status: 'Open',
          confidence: ['Confirmed', 'Potential', 'Informational'].includes(f.confidence) ? f.confidence : 'Potential',
          createdAt: new Date().toISOString(),
          synthetic: false,
        };
      })
    : [];

  return { hosts, services, findings, warnings };
}
