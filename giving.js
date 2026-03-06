const givingConverter = require('./converter');
const givingWriter = require('./writer');
const givingPath = require('path');

function handleGivingFile(file) {
  if (!file.name.endsWith('.txt')) {
    setErrorState('Unsupported giving file', 'Upload a HanaBank text export ending in .txt.');
    return;
  }

  const reader = new FileReader();
  setProcessingState('Processing giving export', `Reading ${file.name} and preparing ChurchTrac CSV output.`);

  reader.onload = async(event) => {
    try {
      const data = await givingConverter.processGivingFile(event.target.result);
      const outputPath = await givingWriter.writeFile('giving', 'csv', data);

      setSuccessState({
        title: 'Giving CSV generated',
        detail: `Saved ${givingPath.basename(outputPath)} from ${file.name}.`,
        outputPath,
        pills: [
          { label: 'ChurchTrac import', icon: 'fa-table' },
          { label: 'Deposits only', icon: 'fa-filter' }
        ]
      });
    } catch (error) {
      setErrorState('Giving conversion failed', error.message || 'Failed to process giving file.');
    }
  };

  reader.readAsText(file);
}

function attachGivingEventListeners() {
  bindFileDropZone({
    onFile: handleGivingFile
  });
}
