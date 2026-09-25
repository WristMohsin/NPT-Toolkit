const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow = null;
const runningScans = new Map();

// Allow-listed safe Nmap profiles only (no arbitrary user args)
const SCAN_PROFILES = {
  quick: {
    label: 'Quick Scan',
    args: ['-T4', '-F', '-oX', '-'],
  },
  standard: {
    label: 'Standard Service Scan',
    args: ['-T4', '-sV', '--version-light', '-oX', '-'],
  },
  top100: {
    label: 'Top 100 Ports + Version',
    args: ['-T4', '--top-ports', '100', '-sV', '--version-light', '-oX', '-'],
  },
};

function findNmap() {
  const candidates = process.platform === 'win32'
    ? [
        'nmap',
        'C:\\Program Files (x86)\\Nmap\\nmap.exe',
        'C:\\Program Files\\Nmap\\nmap.exe',
      ]
    : ['nmap', '/usr/bin/nmap', '/usr/local/bin/nmap'];

  for (const c of candidates) {
    try {
      // For simple name, rely on PATH via spawn later
      if (c === 'nmap') return c;
      if (fs.existsSync(c)) return c;
    } catch {
      // continue
    }
  }
  return 'nmap';
}

function isValidTarget(target) {
  if (!target || typeof target !== 'string') return false;
  const t = target.trim();
  // Basic validation: IPv4, hostname, simple CIDR
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const cidr = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  const hostname = /^[a-zA-Z0-9]([a-zA-Z0-9\-.]{0,253}[a-zA-Z0-9])?$/;
  return ipv4.test(t) || cidr.test(t) || hostname.test(t);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'ANPT Toolkit - Authorized Network Security Assessment',
    backgroundColor: '#0a0e17',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:1420');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- IPC: Nmap Agent ---

ipcMain.handle('nmap:check', async () => {
  return new Promise((resolve) => {
    const nmapPath = findNmap();
    const child = spawn(nmapPath, ['--version'], { shell: false });
    let out = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { out += d.toString(); });
    child.on('error', () => {
      resolve({ installed: false, version: null, path: null, message: 'Nmap not found. Install Nmap and ensure it is on PATH.' });
    });
    child.on('close', (code) => {
      if (code === 0 || out.toLowerCase().includes('nmap')) {
        const match = out.match(/Nmap version ([\d.]+)/i);
        resolve({
          installed: true,
          version: match ? match[1] : 'unknown',
          path: nmapPath,
          profiles: Object.keys(SCAN_PROFILES).map((k) => ({ id: k, label: SCAN_PROFILES[k].label })),
          message: 'Nmap is available',
        });
      } else {
        resolve({ installed: false, version: null, path: null, message: 'Nmap check failed' });
      }
    });
  });
});

ipcMain.handle('nmap:run', async (_event, options) => {
  const { target, profileId, authorizationConfirmed, scanId } = options || {};

  if (!authorizationConfirmed) {
    return { ok: false, error: 'Authorization not confirmed. Scan blocked.' };
  }

  if (!isValidTarget(target)) {
    return { ok: false, error: 'Invalid target. Use IPv4, hostname, or CIDR only.' };
  }

  const profile = SCAN_PROFILES[profileId] || SCAN_PROFILES.standard;
  const nmapPath = findNmap();
  const id = scanId || `scan-${Date.now()}`;

  // Args: profile only + target. No user-controlled switches.
  const args = [...profile.args, target.trim()];

  return new Promise((resolve) => {
    let xml = '';
    let stderr = '';
    let settled = false;

    const child = spawn(nmapPath, args, {
      shell: false,
      windowsHide: true,
    });

    runningScans.set(id, child);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('nmap:progress', { scanId: id, status: 'running', message: `Scanning ${target} (${profile.label})...` });
    }

    child.stdout.on('data', (d) => {
      xml += d.toString();
    });

    child.stderr.on('data', (d) => {
      stderr += d.toString();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('nmap:progress', {
          scanId: id,
          status: 'running',
          message: d.toString().trim().slice(0, 200),
        });
      }
    });

    child.on('error', (err) => {
      runningScans.delete(id);
      if (settled) return;
      settled = true;
      resolve({ ok: false, error: `Failed to start Nmap: ${err.message}. Is Nmap installed?` });
    });

    child.on('close', (code) => {
      runningScans.delete(id);
      if (settled) return;
      settled = true;

      if (code !== 0 && !xml.includes('<nmaprun')) {
        resolve({
          ok: false,
          error: `Nmap exited with code ${code}. ${stderr.slice(0, 300) || 'No output.'}`,
        });
        return;
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('nmap:progress', { scanId: id, status: 'completed', message: 'Scan completed' });
      }

      resolve({
        ok: true,
        scanId: id,
        target,
        profile: profileId,
        xml,
        stderr: stderr.slice(0, 2000),
      });
    });
  });
});

ipcMain.handle('nmap:cancel', async (_event, scanId) => {
  const child = runningScans.get(scanId);
  if (child) {
    try {
      child.kill();
      runningScans.delete(scanId);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e.message || e) };
    }
  }
  return { ok: false, error: 'Scan not found or already finished' };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  for (const child of runningScans.values()) {
    try { child.kill(); } catch { /* ignore */ }
  }
  runningScans.clear();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
