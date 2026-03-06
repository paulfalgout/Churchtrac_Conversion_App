const accountingConverter = require('./converter');
const accountingWriter = require('./writer');
const accountingPath = require('path');

function handleAcctFile(file) {
  if (!file.name.endsWith('.txt')) {
    setErrorState('Unsupported accounting file', 'Upload a HanaBank text export ending in .txt.');
    return;
  }

  const reader = new FileReader();
  setProcessingState('Processing accounting export', `Reading ${file.name} and preparing OFX output.`);

  reader.onload = async(event) => {
    try {
      const data = await accountingConverter.processFile(event.target.result);
      const outputPath = await accountingWriter.writeFile('accounting', 'ofx', data);

      setSuccessState({
        title: 'Accounting OFX generated',
        detail: `Saved ${accountingPath.basename(outputPath)} from ${file.name}.`,
        outputPath,
        pills: [
          { label: 'OFX ready', icon: 'fa-file-waveform' },
          { label: 'HanaBank source', icon: 'fa-building-columns' }
        ]
      });
    } catch (error) {
      setErrorState('Accounting conversion failed', error.message || 'Failed to process accounting file.');
    }
  };

  reader.readAsText(file);
}

function attachAccoungingEventListeners() {
  bindFileDropZone({
    onFile: handleAcctFile
  });
}
