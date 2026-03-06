const SettingsStore = require('electron-store');
const settingsPath = require('path');
const { dialog: settingsDialog } = require('@electron/remote');

const settingsStore = new SettingsStore();

function renderDefaultPath(selectedPath) {
  const defaultPathElement = document.getElementById('default-path');
  if (!defaultPathElement) return;

  defaultPathElement.textContent = selectedPath || 'No default path selected.';
}

function attachSettingsEventListeners() {
  const choosePathButton = document.getElementById('choose-path');

  renderDefaultPath(settingsStore.get('defaultPath'));

  choosePathButton?.addEventListener('click', async () => {
    const { canceled, filePaths } = await settingsDialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (canceled || filePaths.length === 0) {
      setWorkspaceStatus('Folder selection cancelled', 'ready');
      return;
    }

    const selectedPath = settingsPath.normalize(filePaths[0]);

    settingsStore.set('defaultPath', selectedPath);
    renderDefaultPath(selectedPath);
    setWorkspaceStatus('Output folder updated', 'success');
  });
}
