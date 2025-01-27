const fs = require('fs');
const savedPath = localStorage.getItem('defaultPath') || './';
const today = new Date();
fileTimeStamp = today.toISOString().substring(0, 10);
function writeFile(fileName, fileType, data) {
  fs.writeFileSync(`${ savedPath }${ fileName }-${ fileTimeStamp }.${ fileType }`, data, { encoding: 'utf8' });
  return outputPath;
}

module.exports = { writeFile };
