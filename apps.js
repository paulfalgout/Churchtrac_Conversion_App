function loadApp(appName, menuItem) {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => item.classList.remove('active'));
  menuItem.classList.add('active');

  if (appName === 'Accounting') {
    document.getElementById('content').innerHTML = `
      <div class="card">
        <h1>Welcome to ${appName}</h1>
        <p>Drag and drop a file or select one to get started.</p>
        <div class="drop-zone" id="drop-zone">Drag and drop a .txt file here or click to upload</div>
        <input type="file" id="file-input" accept=".txt" style="display: none;">
        <pre id="output">Waiting for file...</pre>
      </div>`;
    attachAccoungingEventListeners();
  } else if (appName === 'Settings') {
    document.getElementById('content').innerHTML = `
      <div class="card">
        <h1>Settings</h1>
        <p>Select a default path for saving files:</p>
        <button class="button" id="choose-path">Choose Path</button>
        <div class="file-path" id="default-path"></div>
      </div>`;
    attachSettingsEventListeners();
  } else {
    document.getElementById('content').innerHTML = `<div class="card"><h1>${appName}</h1><p>Content for ${appName} goes here.</p></div>`;
  }
}

document.getElementById('menu-accounting').click();
