import { describe, it, expect } from 'vitest';
import { parseNmapXml, parseAnptJson } from '../src/services/importParsers';

const VALID_XML = `<?xml version="1.0"?>
<nmaprun>
  <host>
    <status state="up"/>
    <address addr="10.0.0.5" addrtype="ipv4"/>
    <hostnames><hostname name="test.local"/></hostnames>
    <ports>
      <port protocol="tcp" portid="22">
        <state state="open"/>
        <service name="ssh" product="OpenSSH" version="8.9"/>
      </port>
    </ports>
  </host>
</nmaprun>`;

describe('parseNmapXml', () => {
  it('parses a valid Nmap XML document', () => {
    const result = parseNmapXml(VALID_XML, 'ANPT-TEST');
    expect(result.hosts).toHaveLength(1);
    expect(result.hosts[0].ip).toBe('10.0.0.5');
    expect(result.services).toHaveLength(1);
    expect(result.services[0].port).toBe(22);
    expect(result.services[0].service).toBe('ssh');
  });

  it('throws a descriptive error on malformed XML', () => {
    expect(() => parseNmapXml('<nmaprun><host', 'ANPT-TEST')).toThrow();
  });

  it('warns when no hosts are present', () => {
    const result = parseNmapXml('<nmaprun></nmaprun>', 'ANPT-TEST');
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('parseAnptJson', () => {
  it('parses a valid ANPT JSON payload', () => {
    const payload = JSON.stringify({
      hosts: [{ ip: '10.0.0.1', hostname: 'a' }],
      services: [{ hostIp: '10.0.0.1', port: 80, service: 'http' }],
      findings: [{ title: 'Test finding', severity: 'High', hostIp: '10.0.0.1' }],
    });
    const result = parseAnptJson(payload, 'ANPT-TEST');
    expect(result.hosts).toHaveLength(1);
    expect(result.services).toHaveLength(1);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].status).toBe('Open');
  });

  it('throws a descriptive error on invalid JSON', () => {
    expect(() => parseAnptJson('{not valid', 'ANPT-TEST')).toThrow();
  });
});
