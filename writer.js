const fs = require('fs');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

const today = new Date();
fileTimeStamp = today.toISOString().substring(0, 10);
function writeFile(fileName, fileType, data) {
  const savedPath = store.get('defaultPath') || './';
  const outputPath = path.join(savedPath, `${ fileName }-${ fileTimeStamp }.${ fileType }`);
  fs.writeFileSync(outputPath, data, { encoding: 'utf8' });
  return outputPath;
}

module.exports = { writeFile };
