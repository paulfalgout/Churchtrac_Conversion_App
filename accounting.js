function handleAcctFile(file) {
  if (file.name.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = async(e) => {
      const data = await window.electronAPI.processFile(e.target.result);
      const outputPath = await window.electronAPI.writeFile('accounting', 'ofx', data);
      const output = document.getElementById('output');
      output.innerHTML = `File written to: <a href="#" onclick="window.electronAPI.showFile('${outputPath}')">${outputPath}</a>`;
    }
    reader.readAsText(file);
  } else {
    alert('Please upload a .txt file.');
  }
}

function attachAccoungingEventListeners() {
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
    if (file) handleAcctFile(file);
  });

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleAcctFile(file);
  });
}
