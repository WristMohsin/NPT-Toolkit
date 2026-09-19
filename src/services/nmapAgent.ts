export interface NmapCheckResult {
  installed: boolean;
  version: string | null;
  path: string | null;
  profiles?: Array<{ id: string; label: string }>;
  message: string;
}

export interface NmapRunOptions {
  target: string;
  profileId: string;
  authorizationConfirmed: boolean;
  scanId?: string;
}

export interface NmapRunResult {
  ok: boolean;
  error?: string;
  scanId?: string;
  target?: string;
  profile?: string;
  xml?: string;
  stderr?: string;
}

declare global {
  interface Window {
    anptAgent?: {
      isElectron: boolean;
      checkNmap: () => Promise<NmapCheckResult>;
      runScan: (options: NmapRunOptions) => Promise<NmapRunResult>;
      cancelScan: (scanId: string) => Promise<{ ok: boolean; error?: string }>;
      onScanProgress: (cb: (data: { scanId: string; status: string; message: string }) => void) => () => void;
    };
  }
}

export function isElectronAgent(): boolean {
  return typeof window !== 'undefined' && !!window.anptAgent?.isElectron;
}

export async function checkNmap(): Promise<NmapCheckResult> {
  if (!window.anptAgent) {
    return {
      installed: false,
      version: null,
      path: null,
      message: 'Not running inside Electron desktop app. Use Import mode or run the desktop build.',
    };
  }
  return window.anptAgent.checkNmap();
}

export async function runAuthorizedScan(options: NmapRunOptions): Promise<NmapRunResult> {
  if (!window.anptAgent) {
    return { ok: false, error: 'Local agent not available (open the Electron desktop app).' };
  }
  if (!options.authorizationConfirmed) {
    return { ok: false, error: 'Authorization not confirmed. Scan blocked.' };
  }
  return window.anptAgent.runScan(options);
}

export async function cancelScan(scanId: string) {
  if (!window.anptAgent) return { ok: false, error: 'Agent not available' };
  return window.anptAgent.cancelScan(scanId);
}

export function onScanProgress(cb: (data: { scanId: string; status: string; message: string }) => void) {
  if (!window.anptAgent) return () => {};
  return window.anptAgent.onScanProgress(cb);
}
