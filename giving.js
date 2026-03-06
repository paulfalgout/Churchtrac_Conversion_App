const givingConverter = require('./converter');
const givingWriter = require('./writer');
const givingPath = require('path');

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
    reader.readAsText(file);
  });
}

function isSupportedGivingFile(file) {
  return file.name.endsWith('.csv') || file.name.endsWith('.txt');
}

async function handleGivingFiles(files) {
  const unsupportedFile = files.find((file) => !isSupportedGivingFile(file));
  if (unsupportedFile) {
    setErrorState('Unsupported giving file', `Use .csv or .txt files only. Problem file: ${unsupportedFile.name}.`);
    return;
  }

  const fileLabel = files.length === 1 ? files[0].name : `${files.length} files`;
  setProcessingState('Processing giving export', `Reading ${fileLabel} and preparing a merged ChurchTrac CSV output.`);

  try {
    const loadedFiles = await Promise.all(files.map(async(file) => ({
      name: file.name,
      data: await readFileAsText(file)
    })));
    const result = await givingConverter.processGivingFiles(loadedFiles);
    const outputPath = await givingWriter.writeFile('giving', 'csv', result.data);
    const categorySummary = result.summary.categories.join(', ');

    setSuccessState({
      title: 'Giving CSV generated',
      detail: `Saved ${givingPath.basename(outputPath)} from ${fileLabel}. ${result.summary.rowCount} rows across ${categorySummary}.`,
      outputPath,
      pills: [
        { label: 'ChurchTrac import', icon: 'fa-table' },
        { label: `${result.summary.fileCount} source files`, icon: 'fa-layer-group' },
        { label: `${result.summary.rowCount} merged rows`, icon: 'fa-list-check' }
      ]
    });
  } catch (error) {
    setErrorState('Giving conversion failed', error.message || 'Failed to process giving file.');
  }
}

function attachGivingEventListeners() {
  bindFileDropZone({
    multiple: true,
    onFiles: handleGivingFiles
  });
}
