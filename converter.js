
function parseCSV(data) {
  const rows = data.split('\n');
  const keys = rows[0]?.split('|').map((key) => key.trim()) || [];
  return  rows.slice(1)
    .filter((row) => !row.includes('Sum Total') && row.trim())
    .map((row) => row.split('|').reduce((acc, value, index) => {
      acc[keys[index]] = value.trim();
      return acc;
    }, {}));
}

function convertToOFX(transactions) {
const ofxHeader = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:UTF-8
CHARSET:UTF-8
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<BANKMSGSRSV1>
  <STMTTRNRS>
    <TRNUID>1
    <STATUS>
      <CODE>0
      <SEVERITY>INFO
    </STATUS>
    <STMTRS>
      <CURDEF>USD
      <BANKTRANLIST>
`;

const ofxFooter = `
      </BANKTRANLIST>
    </STMTRS>
  </STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

const ofxTransactions = transactions.map((transaction) => {
  const type = transaction.Deposit ? "CREDIT" : "DEBIT";
  const amount = transaction.Deposit || transaction.Withdraw;
  const date = transaction["Transaction Date & Time"].replace(/[-:\s]/g, "").slice(0, 14); // Convert to YYYYMMDDHHMMSS

  return `          <STMTTRN>
          <TRNTYPE>${type}
          <DTPOSTED>${date}
          <TRNAMT>${amount.replace(/,/g, "")}
          <FITID>${transaction.No}
          <NAME>${transaction["Applicant/Beneficiary"] || ""}
          <MEMO>${transaction["Remarks"] || ""} ${transaction["Type"] || ""} ${transaction["Branch"] || ""} ${transaction["Transaction Remarks"] || ""}
        </STMTTRN>`;
});

return ofxHeader + ofxTransactions.join("\n") + ofxFooter;
}
function processFile(data) {
  const transactions = parseCSV(data);
  return convertToOFX(transactions);
}

const escapeCSVValue = (value) => {
  if (typeof value === 'string' && value.includes(',')) {
      return `"${value.replace(/"/g, '""')}"`; // Escape double quotes inside the value
  }
  return value;
};

const { v4: uuidv4 } = require('uuid'); // Import UUID library

const processGivingFile = (data) => {
  const transactions = parseCSV(data);
  const headers = [
    'Email/Member Number',
    'Amount',
    'Category',
    'Tax Deductible',
    'Memo',
    'Date',
    'Contribution Type',
    'First Name',
    'Last Name'
  ];

  const rows = transactions.map((item) => {
    const deposit = item.Deposit ? parseInt(item.Deposit.replace(/,/g, '')) : 0;

    // Skip rows with no deposit amount
    if (deposit === 0) return null;

    const name = item['Applicant/Beneficiary'] || '';

    return [
      uuidv4(), // Column A: Unique identifier (UUID)
      escapeCSVValue(deposit), // Column B: Amount
      'General Offerings',
      'yes', // Column D: Tax Deductible
      escapeCSVValue(item.Remarks.substring(0, 64) || ''), // Column E: Memo (trimmed to 64 characters)
      escapeCSVValue(item['Transaction Date & Time']), // Column F: Date
      'ACH', // Column G: Contribution Type
      escapeCSVValue(name.split(' ')[1] ? name.split(' ')[1] : ''),
      escapeCSVValue(name.split(' ')[0]),
    ];
  }).filter(Boolean); // Remove null rows

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
};

module.exports = { processFile, processGivingFile };
