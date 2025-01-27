const converter = require('./converter');
const writer = require('./writer');
const { shell } = require('@electron/remote');
const path = require('path');

let outputPath;
function addButton(text, handler) {
  const button = document.createElement('button');
  button.innerText = text;
  button.style.padding = '2px 8px';
  button.style.marginTop = '10px';
  button.style.marginLeft = '5px';
  button.addEventListener('click', handler);
  return button;
}

const showButton = addButton('SHOW', () => {
  shell.showItemInFolder(outputPath);
});

const openButton = addButton('OPEN', () => {
  shell.openPath(outputPath);
});

function handleAcctFile(file) {
  if (file.name.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = async(e) => {
      const data = await converter.processFile(e.target.result);
      outputPath = await writer.writeFile('accounting', 'ofx', data);
      const output = document.getElementById('output');
      output.innerHTML = `File written to: ${ path.basename(outputPath) } `;
      output.appendChild(openButton);
      output.appendChild(showButton);
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
