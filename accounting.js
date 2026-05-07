const accountingConverter = require('./converter');
const accountingWriter = require('./writer');
const accountingPath = require('path');

function handleAcctFile(file) {
  const normalizedName = file.name.toLowerCase();
  const isHanaExport = normalizedName.endsWith('.txt');
  const isNhExport = normalizedName.endsWith('.xls');

  if (!isHanaExport && !isNhExport) {
    setErrorState('Unsupported accounting file', 'Upload a HanaBank .txt export or Nonghyup .xls export.');
    return;
  }

  const reader = new FileReader();
  setProcessingState('Processing accounting export', `Reading ${file.name} and preparing OFX output.`);

  reader.onload = async(event) => {
    try {
      const data = isNhExport
        ? await accountingConverter.processNhFile(Buffer.from(event.target.result))
        : await accountingConverter.processFile(event.target.result);
      const outputName = isNhExport ? 'accounting-NH' : 'accounting-HANA';
      const outputPath = await accountingWriter.writeFile(outputName, 'ofx', data);
      const sourceLabel = isNhExport ? 'Nonghyup source' : 'HanaBank source';

      setSuccessState({
        title: 'Accounting OFX generated',
        detail: `Saved ${accountingPath.basename(outputPath)} from ${file.name}.`,
        outputPath,
        pills: [
          { label: 'OFX ready', icon: 'fa-file-waveform' },
          { label: sourceLabel, icon: 'fa-building-columns' }
        ]
      });
    } catch (error) {
      setErrorState('Accounting conversion failed', error.message || 'Failed to process accounting file.');
    }
  };

  if (isNhExport) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
}

function attachAccountingEventListeners() {
  bindFileDropZone({
    onFile: handleAcctFile
  });
}
