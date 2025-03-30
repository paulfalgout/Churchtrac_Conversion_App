function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
          insideQuotes = !insideQuotes; // Toggle insideQuotes state
      } else if (char === "," && !insideQuotes) {
          result.push(current.trim());
          current = "";
      } else {
          current += char;
      }
  }

  result.push(current.trim()); // Push last column
  return result;
}

// Allows for Korean and English.  Assumes set columns
const firstRow = 'No|Transaction Date & Time|Remarks|Applicant/Beneficiary|Deposit|Withdraw|Post-Transaction Balance|Type|Branch|Transaction Remarks';

function parseCSV(data) {
  const rows = data.split('\n');
  const keys = firstRow?.split('|').map((key) => key.trim()) || [];
  return  rows.slice(1, -1)
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

const namespace = 'd55c9ce1-da8f-4f8f-ab97-9f8e12c63857';

const { v5: uuidv5 } = require('uuid'); // Import UUID library

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
      uuidv5(name, namespace), // Column A: Unique identifier (UUID)
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

const allowedStatuses = ['succeeded', 'pending'];

function parseTithely(csvString, conversionRate) {
    const lines = csvString.split("\n").map(line => line.trim()).filter(line => line);
    const headers = lines.shift().split(",").map(h => h.replace(/"/g, '').trim()); // Remove quotes and trim spaces

    const requiredFields = {
        "Email": null,
        "Amount": null,
        "Transaction Date": null,
        "Status": null,
        "First Name": null,
        "Last Name": null,
        "Memo": null
    };

    // Map column indexes dynamically
    headers.forEach((header, index) => {
        if (Object.prototype.hasOwnProperty.call(requiredFields, header)) {
            requiredFields[header] = index;
        }
    });

    // Ensure required fields exist
    if (Object.values(requiredFields).some(index => index === null)) {
        console.error("Missing required fields in CSV.");
        return [];
    }

    let output = [
      "Email/Member Number,Amount,Category,Tax Deductible,Memo,Date,Contribution Type,First Name,Last Name"
  ];

  lines.forEach(line => {
      const cols = parseCSVLine(line).map(col => col.replace(/"/g, '').trim()); // Remove quotes and trim spaces
      const status = cols[requiredFields["Status"]];

      if (!allowedStatuses.includes(status)) return; // Skip rows with unallowed statuses

      let amount = parseFloat(cols[requiredFields["Amount"]].replace(/,/g, "")); // Remove commas in numbers
      if (!isNaN(amount)) {
        amount = Math.round(amount * conversionRate).toString(); // Apply conversion rate
      } else {
        console.log('ERROR', amount);
      }

      // Convert transaction date format
      const dateParts = cols[requiredFields["Transaction Date"]].split(".");
      const formattedDate = `20${dateParts[0].trim()}-${dateParts[1].trim().padStart(2, '0')}-${dateParts[2].trim().padStart(2, '0')}`;

      const row = [
          escapeCSVValue(cols[requiredFields["Email"]]), // Email/Member Number
          escapeCSVValue(amount), // Amount in cents
          "General Offerings", // Category
          "no", // Tax Deductible
          escapeCSVValue(cols[requiredFields["Memo"]] || ""), // Memo
          escapeCSVValue(formattedDate), // Date
          "Card", // Contribution Type
          escapeCSVValue(cols[requiredFields["First Name"]]), // First Name
          escapeCSVValue(cols[requiredFields["Last Name"]]), // Last Name
      ].join(",");

      output.push(row);
  });

  return output.join("\n");
}

module.exports = { processFile, processGivingFile, parseTithely };

