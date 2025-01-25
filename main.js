const { app, BrowserWindow, Menu } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: true,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 10, y: 10 },
    vibrancy: 'ultra-dark',
    visualEffectState: 'active',
    icon: __dirname + '/assets/app-icon.ico', // Path to your app icon
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
      { role: 'quit' }
    ]
  },
  {
    label: 'Apps',
    submenu: [
      { label: 'Accounting', click: () => loadApp('Accounting') },
      { label: 'Giving', click: () => loadApp('Giving') },
      { label: 'Tithe.ly', click: () => loadApp('Tithe.ly') },
      { label: 'Hanacard', click: () => loadApp('Hanacard') }
    ]
  }
];

function loadApp(appName) {
  mainWindow.webContents.send('load-app', appName);
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