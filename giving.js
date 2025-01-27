// imports in accounting.js

function handleGivingFile(file) {
  if (file.name.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = async(e) => {
      const data = await converter.processGivingFile(e.target.result);
      const outputPath = await writer.writeFile('giving', 'csv', data);
      const output = document.getElementById('output');
      output.innerHTML = `File written to: ${ path.basename(outputPath) } `;
      openButton.path = outputPath;
      showButton.path = outputPath;
      output.appendChild(openButton);
      output.appendChild(showButton);
    }
    reader.readAsText(file);
  } else {
    alert('Please upload a .txt file.');
  }
}

function attachGivingEventListeners() {
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
    if (file) handleGivingFile(file);
  });

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleGivingFile(file);
  });
}
