
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  processFile: (filePath, fileType) => ipcRenderer.invoke('process-file', filePath, fileType),
  writeFile: (filePath, fileType) => ipcRenderer.invoke('write-file', filePath, fileType),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  showFile: (filePath) => ipcRenderer.invoke('show-file', filePath)
});
