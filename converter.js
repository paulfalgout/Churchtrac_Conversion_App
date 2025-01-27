
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

module.exports = { processFile };
