
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const converter = require('./converter');
const writer = require('./writer');
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true, // Allow ipcRenderer
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 10, y: 10 },
    vibrancy: 'ultra-dark',
    visualEffectState: 'active',
    icon: __dirname + '/assets/app-icon.ico',
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const menuTemplate = [
  {
    label: 'Menu',
    submenu: [
      { role: 'quit' },
      {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Command+Option+I' : 'Ctrl+Shift+I',
        click: () => {
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.toggleDevTools();
          } else {
            console.error('No active webContents to toggle Developer Tools');
          }
        },
      },
    ],
  },
  {
    label: 'Apps',
    submenu: [
      { label: 'Accounting', click: () => loadApp('Accounting') },
      { label: 'Giving', click: () => loadApp('Giving') },
      { label: 'Tithe.ly', click: () => loadApp('Tithe.ly') },
      { label: 'Hanacard', click: () => loadApp('Hanacard') },
      { label: 'Settings', click: () => loadApp('Settings') },
    ],
  },
];

function loadApp(appName) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('load-app', appName);
  } else {
    console.error('Main window or webContents not available for app:', appName);
  }
}

app.on('ready', () => {
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('process-file', async (event, filePath, fileType) => {
  const outputPath = await converter.processFile(filePath, fileType);
  return outputPath;
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  const outputPath = await writer.writeFile(filePath, data);
  return outputPath;
});

ipcMain.handle('open-file', async (event, filePath, fileType) => {
  shell.openPath(filePath);
});

ipcMain.handle('show-file', async (event, filePath, fileType) => {
  shell.showItemInFolder(filePath);
});
