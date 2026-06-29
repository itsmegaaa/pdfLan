const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 700,
    height: 450,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for PM2 commands
// When packaged as a portable exe, __dirname is in a Temp folder.
// We must use PORTABLE_EXECUTABLE_DIR to get the folder where the .exe actually sits.
const projectDir = process.env.PORTABLE_EXECUTABLE_DIR 
  ? process.env.PORTABLE_EXECUTABLE_DIR 
  : (app.isPackaged ? require('path').dirname(process.execPath) : path.join(__dirname, '..'));

const executeCommand = (command, callback) => {
  exec(command, { cwd: projectDir }, (error, stdout, stderr) => {
    callback({ error: error ? error.message : null, stdout, stderr });
  });
};

ipcMain.handle('pm2-start', async () => {
  return new Promise((resolve) => {
    // Also build the frontend first to be safe, or just start backend
    // Since it's a manager, we assume frontend is built or we just run pm2 start
    const cmd = `pm2 start backend/index.js --name "pdfvault-server"`;
    executeCommand(cmd, resolve);
  });
});

ipcMain.handle('pm2-stop', async () => {
  return new Promise((resolve) => {
    const cmd = `pm2 stop pdfvault-server`;
    executeCommand(cmd, resolve);
  });
});

ipcMain.handle('pm2-restart', async () => {
  return new Promise((resolve) => {
    const cmd = `pm2 restart pdfvault-server`;
    executeCommand(cmd, resolve);
  });
});

ipcMain.handle('pm2-status', async () => {
  return new Promise((resolve) => {
    const cmd = `pm2 jlist`;
    executeCommand(cmd, (result) => {
      try {
        if (result.stdout) {
          const list = JSON.parse(result.stdout);
          const pdfvault = list.find(item => item.name === 'pdfvault-server');
          if (pdfvault) {
            resolve({ status: pdfvault.pm2_env.status });
          } else {
            resolve({ status: 'stopped' });
          }
        } else {
          resolve({ status: 'stopped' });
        }
      } catch (e) {
        resolve({ status: 'unknown' });
      }
    });
  });
});
