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
    __TAURI_INTERNALS__?: unknown;
  }
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && typeof window.__TAURI_INTERNALS__ !== 'undefined';
}

/** True when running inside Electron or Tauri desktop shell */
export function isDesktopAgent(): boolean {
  return isElectronAgent() || isTauri();
}

/** @deprecated use isDesktopAgent */
export function isElectronAgent(): boolean {
  return typeof window !== 'undefined' && !!window.anptAgent?.isElectron;
}

export async function checkNmap(): Promise<NmapCheckResult> {
  // Electron bridge
  if (window.anptAgent) {
    return window.anptAgent.checkNmap();
  }

  // Tauri invoke
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const res = await invoke<{
        installed: boolean;
        version: string | null;
        path: string | null;
        message: string;
        profiles: Array<{ id: string; label: string }>;
      }>('nmap_check');
      return {
        installed: res.installed,
        version: res.version,
        path: res.path,
        message: res.message,
        profiles: res.profiles,
      };
    } catch (e) {
      return {
        installed: false,
        version: null,
        path: null,
        message: `Tauri agent error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  return {
    installed: false,
    version: null,
    path: null,
    message: 'Not running inside a desktop app. Use Electron or Tauri build for real scanning.',
  };
}

export async function runAuthorizedScan(options: NmapRunOptions): Promise<NmapRunResult> {
  if (!options.authorizationConfirmed) {
    return { ok: false, error: 'Authorization not confirmed. Scan blocked.' };
  }

  if (window.anptAgent) {
    return window.anptAgent.runScan(options);
  }

  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const res = await invoke<{
        ok: boolean;
        error: string | null;
        scan_id: string | null;
        target: string | null;
        profile: string | null;
        xml: string | null;
        stderr: string | null;
      }>('nmap_run', {
        target: options.target,
        profileId: options.profileId,
        authorizationConfirmed: options.authorizationConfirmed,
        scanId: options.scanId ?? null,
      });
      return {
        ok: res.ok,
        error: res.error ?? undefined,
        scanId: res.scan_id ?? undefined,
        target: res.target ?? undefined,
        profile: res.profile ?? undefined,
        xml: res.xml ?? undefined,
        stderr: res.stderr ?? undefined,
      };
    } catch (e) {
      return {
        ok: false,
        error: `Tauri scan error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  return { ok: false, error: 'Local agent not available. Open the Tauri or Electron desktop app.' };
}

export async function cancelScan(scanId: string) {
  if (window.anptAgent) return window.anptAgent.cancelScan(scanId);
  return { ok: false, error: 'Cancel not supported on this runtime' };
}

export function onScanProgress(cb: (data: { scanId: string; status: string; message: string }) => void) {
  if (window.anptAgent) return window.anptAgent.onScanProgress(cb);
  return () => {};
}
