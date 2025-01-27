
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  processFile: (filePath, fileType) => ipcRenderer.invoke('process-file', filePath, fileType),
  writeFile: (fileName, fileType, data) => ipcRenderer.invoke('write-file', fileName, fileType, data),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  showFile: (filePath) => ipcRenderer.invoke('show-file', filePath)
});
