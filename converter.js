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
const ofxHeader = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<?OFX OFXHEADER="200" VERSION="211" SECURITY="NONE">
<OFX>
<BANKMSGSRSV1>
  <STMTTRNRS>
    <TRNUID>1</TRNUID>
    <STATUS>
      <CODE>0</CODE>
      <SEVERITY>INFO</SEVERITY>
    </STATUS>
    <STMTRS>
      <CURDEF>USD</CURDEF>
      <BANKACCTFROM>
        <ACCTID>174-890020-19904</ACCTID>
      </BANKACCTFROM>
      <BANKTRANLIST>
`;

const ofxFooter = `
      </BANKTRANLIST>
    </STMTRS>
  </STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

const escapeXml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const ofxTransactions = transactions.map((transaction) => {
  const type = transaction.Deposit ? "CREDIT" : "DEBIT";
  const amount = Number(transaction.Deposit.replace(/,/g, '')) || -Number(transaction.Withdraw.replace(/,/g, ''));
  const date = transaction["Transaction Date & Time"].replace(/[-:\s]/g, "").slice(0, 8); // Convert to YYYYMMDD

  return `          <STMTTRN>
          <TRNTYPE>${type}</TRNTYPE>
          <DTPOSTED>${date}</DTPOSTED>
          <TRNAMT>${amount}</TRNAMT>
          <FITID>${date}${transaction.No}</FITID>
          <NAME>${escapeXml(transaction["Applicant/Beneficiary"] || "Unknown")}</NAME>
          <MEMO>${escapeXml(transaction["Remarks"] || "")} ${escapeXml(transaction["Type"] || "")} ${escapeXml(transaction["Branch"] || "")} ${escapeXml(transaction["Transaction Remarks"] || "")}</MEMO>
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
