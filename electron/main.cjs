const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Windows 7 compatible Electron (v22)
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'ANPT Toolkit - Authorized Network Security Assessment',
    backgroundColor: '#0a0e17',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
  });

  // Load the built React app
  const isDev = !app.isPackaged;

  if (isDev) {
    // Development: load Vite dev server
    mainWindow.loadURL('http://localhost:1420');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load from dist
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
