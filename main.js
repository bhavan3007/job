const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  win.loadFile('loginpage/index.html');

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(createWindow);

// Handle page navigation
ipcMain.on('navigate-to', (event, role) => {
  if (role === 'principal') {
    win.loadFile('principal/principal_dashboard.html');
  } else if (role === 'admin') {
    win.loadFile('admin/admin.html');
  } else {
    win.loadFile('staff/staff_dashboard.html');
  }
});
