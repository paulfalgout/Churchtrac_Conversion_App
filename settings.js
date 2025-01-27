const Store = require('electron-store');
const { dialog } = require('@electron/remote');
const store = new Store();

function attachSettingsEventListeners() {
  const choosePathButton = document.getElementById('choose-path');
  const defaultPathElement = document.getElementById('default-path');

  choosePathButton?.addEventListener('click', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (!canceled && filePaths.length > 0) {
      let selectedPath = filePaths[0];
      if (!selectedPath.endsWith('/')) {
        selectedPath += '/'; // Add a trailing slash if it's missing
      }
      store.set('defaultPath', selectedPath);
      defaultPathElement.textContent = `Default Path: ${selectedPath}`;
    }
  });

  const savedPath = store.get('defaultPath');
  if (savedPath) {
    defaultPathElement.textContent = `Default Path: ${savedPath}`;
  }
}


