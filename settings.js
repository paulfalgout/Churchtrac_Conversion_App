function attachSettingsEventListeners() {
  const choosePathButton = document.getElementById('choose-path');
  const defaultPathElement = document.getElementById('default-path');

  choosePathButton?.addEventListener('click', async () => {
    const { canceled, filePaths } = await window.electron.showOpenDialog({
      properties: ['openDirectory']
    });
    if (!canceled && filePaths.length > 0) {
      let selectedPath = filePaths[0];
      if (!selectedPath.endsWith('/')) {
        selectedPath += '/'; // Add a trailing slash if it's missing
      }
      localStorage.setItem('defaultPath', selectedPath);
      defaultPathElement.textContent = `Default Path: ${selectedPath}`;
    }
  });

  const savedPath = localStorage.getItem('defaultPath');
  if (savedPath) {
    defaultPathElement.textContent = `Default Path: ${savedPath}`;
  }
}


