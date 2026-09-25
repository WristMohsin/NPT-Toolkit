const { contextBridge, ipcRenderer } = require('electron');

// Safe bridge between renderer and main process
contextBridge.exposeInMainWorld('anptAgent', {
  isElectron: true,

  checkNmap: () => ipcRenderer.invoke('nmap:check'),

  runScan: (options) => ipcRenderer.invoke('nmap:run', options),

  cancelScan: (scanId) => ipcRenderer.invoke('nmap:cancel', scanId),

  onScanProgress: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('nmap:progress', listener);
    return () => ipcRenderer.removeListener('nmap:progress', listener);
  },
});
