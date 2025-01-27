var today = new Date();
fileTimeStamp = today.toISOString().substring(0, 10);
function handleFile(file) {
  if (file.name.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = async(e) => {
      const data = await window.electronAPI.processFile(e.target.result);
      const outputPath = await window.electronAPI.writeFile(`accounting-${fileTimeStamp }.ofx`, data);
      const output = document.getElementById('output');
      output.innerHTML = `File written to: <a href="#" onclick="window.electronAPI.showFile('${outputPath}')">${outputPath}</a>`;
    }
    reader.readAsText(file);
  } else {
    alert('Please upload a .txt file.');
  }
}

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
    attachEventListeners();
  } else {
    document.getElementById('content').innerHTML = `<div class="card"><h1>${appName}</h1><p>Content for ${appName} goes here.</p></div>`;
  }
}

function attachEventListeners() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });
}

document.getElementById('menu-accounting').click();
