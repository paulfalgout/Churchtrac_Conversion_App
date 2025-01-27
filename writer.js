
const fs = require('fs');
function writeFile(outputPath, data) {
  fs.writeFileSync(outputPath, data, { encoding: 'utf8' });
  return outputPath;
}

module.exports = { writeFile };
