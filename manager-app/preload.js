const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startServer: () => ipcRenderer.invoke('pm2-start'),
  stopServer: () => ipcRenderer.invoke('pm2-stop'),
  restartServer: () => ipcRenderer.invoke('pm2-restart'),
  getServerStatus: () => ipcRenderer.invoke('pm2-status'),
});
