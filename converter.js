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

// New Hana bank layout (Korean headers) as of 2026 exports.
const expectedNewLayoutHeaders = ['No', '거래일시', '적요', '추가메모', '의뢰인/수취인', '입금', '출금', '거래후잔액', '구분', '거래점', '거래특이사항'];
const bankAccountId = '174-890020-19904';
const bankCurrency = 'KRW';

function parseAmount(value) {
  const normalized = (value || '').replace(/,/g, '').trim();
  if (!normalized) return 0;

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeDateTime(value) {
  const match = (value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
  if (!match) return '';

  const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
  return `${year}${month}${day}${hour}${minute}${second}`;
}

function collapseWhitespace(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function joinUniqueParts(parts) {
  const seen = new Set();

  return parts
    .map((part) => collapseWhitespace(part))
    .filter((part) => {
      if (!part) return false;

      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(' ');
}

function buildPayeeName(transaction) {
  const candidates = [
    transaction['Applicant/Beneficiary'],
    transaction.Remarks,
    transaction['Additional Memo']
  ];

  const payeeName = candidates
    .map((value) => collapseWhitespace(value))
    .find((value) => value);

  return payeeName || 'Hana transaction';
}

function buildMemo(transaction, payeeName) {
  const payeeKey = (payeeName || '').toLowerCase();

  return joinUniqueParts([
    transaction.Remarks,
    transaction['Additional Memo'],
    transaction['Applicant/Beneficiary'],
    transaction.Type,
    transaction.Branch,
    transaction['Transaction Remarks']
  ].filter((part) => collapseWhitespace(part).toLowerCase() !== payeeKey));
}

function parseCSV(data) {
  const rows = data.split(/\r?\n/).filter((row) => row.trim());
  if (rows.length < 2) return [];

  const headers = rows[0].split('|').map((value, index) => {
    const trimmed = value.trim();
    return index === 0 ? trimmed.replace(/^\uFEFF/, '') : trimmed;
  });
  const hasExpectedLayout = expectedNewLayoutHeaders.every((header, index) => headers[index] === header);
  if (!hasExpectedLayout) {
    throw new Error('Unsupported file layout. Please export the latest Korean Hana transaction format.');
  }

  return rows
    .slice(1)
    .map((row) => row.split('|').map((value) => value.trim()))
    .filter((cols) => {
      const normalizedMarker = (cols[1] || '').replace(/\s+/g, '');
      return normalizedMarker !== '합계';
    })
    .map((cols) => ({
      No: cols[0] || '',
      'Transaction Date & Time': cols[1] || '',
      Remarks: cols[2] || '',
      'Additional Memo': cols[3] || '',
      'Applicant/Beneficiary': cols[4] || '',
      Deposit: cols[5] || '',
      Withdraw: cols[6] || '',
      'Post-Transaction Balance': cols[7] || '',
      Type: cols[8] || '',
      Branch: cols[9] || '',
      'Transaction Remarks': cols[10] || ''
    }));
}

function convertToOFX(transactions) {
  const normalizedTransactions = transactions
    .map((transaction, index) => {
      const deposit = parseAmount(transaction.Deposit);
      const withdraw = parseAmount(transaction.Withdraw);
      const postedAt = normalizeDateTime(transaction['Transaction Date & Time']);
      const amount = deposit > 0 ? deposit : -withdraw;
      const payeeName = buildPayeeName(transaction);

      if (!postedAt || amount === 0) return null;

      return {
        ...transaction,
        amount,
        postedAt,
        name: payeeName,
        memo: buildMemo(transaction, payeeName),
        fitId: joinUniqueParts([
          postedAt,
          transaction.No,
          String(index + 1)
        ]).replace(/\s+/g, '-')
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.postedAt.localeCompare(right.postedAt));

  if (normalizedTransactions.length === 0) {
    throw new Error('No valid Hana transactions were found in the export.');
  }

  const dates = normalizedTransactions.map((transaction) => transaction.postedAt);
  const startDate = dates.reduce((min, value) => value < min ? value : min);
  const endDate = dates.reduce((max, value) => value > max ? value : max);
  const ledgerSource = normalizedTransactions[normalizedTransactions.length - 1];
  const ledgerBalance = parseAmount(ledgerSource['Post-Transaction Balance']);

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
      <CURDEF>${bankCurrency}</CURDEF>
      <BANKACCTFROM>
        <ACCTID>${bankAccountId}</ACCTID>
        <ACCTTYPE>CHECKING</ACCTTYPE>
      </BANKACCTFROM>
      <BANKTRANLIST>
        <DTSTART>${startDate}</DTSTART>
        <DTEND>${endDate}</DTEND>
`;

  const ofxFooter = `
      </BANKTRANLIST>
      <LEDGERBAL>
        <BALAMT>${ledgerBalance}</BALAMT>
        <DTASOF>${endDate}</DTASOF>
      </LEDGERBAL>
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

  const ofxTransactions = normalizedTransactions.map((transaction) => {
    const type = transaction.amount > 0 ? "CREDIT" : "DEBIT";

    return `          <STMTTRN>
          <TRNTYPE>${type}</TRNTYPE>
          <DTPOSTED>${transaction.postedAt}</DTPOSTED>
          <TRNAMT>${transaction.amount}</TRNAMT>
          <FITID>${escapeXml(transaction.fitId)}</FITID>
          <NAME>${escapeXml(transaction.name)}</NAME>
          <MEMO>${escapeXml(transaction.memo)}</MEMO>
        </STMTTRN>`;
  });

  return ofxHeader + ofxTransactions.join("\n") + ofxFooter;
}
function processFile(data) {
  const transactions = parseCSV(data);
  return convertToOFX(transactions);
}

const escapeCSVValue = (value) => {
  const normalizedValue = value == null ? '' : String(value);
  if (/[",\n\r]/.test(normalizedValue)) {
      return `"${normalizedValue.replace(/"/g, '""')}"`;
  }
  return normalizedValue;
};

const givingCsvHeaders = [
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

const namespace = 'd55c9ce1-da8f-4f8f-ab97-9f8e12c63857';

const { v5: uuidv5 } = require('uuid'); // Import UUID library

function serializeChurchTracRows(rows) {
  return [givingCsvHeaders, ...rows].map((row) => row.join(',')).join('\n');
}

function normalizeCsvCell(value) {
  const trimmed = (value || '').trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"').trim();
  }
  return trimmed;
}

function inferGivingCategoryFromFilename(filename, { fallbackToGeneral = false, allowUnknown = false } = {}) {
  const normalizedName = collapseWhitespace(filename).toLowerCase();

  if (normalizedName.includes('build')) return 'Pledges';
  if (normalizedName.includes('sent')) return 'Sent Missions Income';
  if (normalizedName.includes('giving')) return 'General Offerings';
  if (fallbackToGeneral) return 'General Offerings';
  if (allowUnknown) return null;

  throw new Error(`Unable to determine giving category from filename "${filename}". Include build, sent, or giving in the file name.`);
}

function buildGivingRowsFromTransactions(transactions, category = 'General Offerings') {
  return transactions.map((item) => {
    const rawDeposit = (item.Deposit || '').replace(/,/g, '').trim();
    const deposit = Number(rawDeposit);

    // Skip rows with invalid or non-positive deposits.
    if (!Number.isFinite(deposit) || deposit <= 0) return null;

    const name = (item['Applicant/Beneficiary'] || item.Remarks || '').trim();
    const id = (!name || name.includes('(주)')) ? 'no-id' : uuidv5(name, namespace).replace(/-/g, '').slice(0, 10);
    const nameParts = name.split(/\s+/).filter(Boolean);
    const memo = [item.Remarks, item['Additional Memo']].filter(Boolean).join(' ').trim().slice(0, 64);

    return [
      id,
      escapeCSVValue(deposit),
      escapeCSVValue(category),
      'yes',
      escapeCSVValue(memo),
      escapeCSVValue(item['Transaction Date & Time']),
      'ACH',
      escapeCSVValue(nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
      escapeCSVValue(nameParts[0] || ''),
    ];
  }).filter(Boolean);
}

function parseChurchTracGivingCSV(data) {
  const lines = data.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(normalizeCsvCell);
  const headerIndexMap = new Map(headers.map((header, index) => [header, index]));

  const missingHeaders = givingCsvHeaders.filter((header) => !headerIndexMap.has(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Giving CSV is missing required columns: ${missingHeaders.join(', ')}.`);
  }

  return lines.slice(1).map((line) => {
    const cols = parseCSVLine(line).map(normalizeCsvCell);
    return givingCsvHeaders.map((header) => escapeCSVValue(cols[headerIndexMap.get(header)] || ''));
  });
}

function dedupeChurchTracRows(rows) {
  const seen = new Set();

  return rows.filter((row) => {
    const key = row.join('\u0001');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortChurchTracRows(rows) {
  return [...rows].sort((left, right) => {
    const leftDate = String(left[5] || '');
    const rightDate = String(right[5] || '');

    return rightDate.localeCompare(leftDate);
  });
}

const processGivingFile = (data, options = {}) => {
  const transactions = parseCSV(data);
  const category = options.category || 'General Offerings';
  const rows = buildGivingRowsFromTransactions(transactions, category);

  return serializeChurchTracRows(rows);
};

function processGivingFiles(files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('Add at least one giving file to continue.');
  }

  const mergedRows = files.flatMap((file) => {
    const normalizedName = (file?.name || '').toLowerCase();

    if (normalizedName.endsWith('.txt')) {
      const category = inferGivingCategoryFromFilename(file?.name || '', {
        fallbackToGeneral: true
      });
      return buildGivingRowsFromTransactions(parseCSV(file.data), category);
    }

    if (normalizedName.endsWith('.csv')) {
      const inferredCategory = inferGivingCategoryFromFilename(file?.name || '', {
        allowUnknown: true
      });
      return parseChurchTracGivingCSV(file.data).map((row) => {
        if (!inferredCategory) return row;
        const nextRow = [...row];
        nextRow[2] = escapeCSVValue(inferredCategory);
        return nextRow;
      });
    }

    throw new Error(`Unsupported giving file "${file?.name || 'unknown'}". Use .csv or .txt.`);
  });

  const uniqueRows = sortChurchTracRows(dedupeChurchTracRows(mergedRows));
  const categories = new Set(uniqueRows.map((row) => row[2]));

  return {
    data: serializeChurchTracRows(uniqueRows),
    summary: {
      fileCount: files.length,
      rowCount: uniqueRows.length,
      categories: Array.from(categories)
    }
  };
}

const allowedStatuses = ['succeeded', 'pending'];

function normalizeHeaderName(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findTithelyFundColumn(headers) {
  const normalizedHeaders = headers.map((header) => normalizeHeaderName(header));
  const preferredNames = new Set([
    'fund',
    'fundname',
    'givingfund',
    'tofund'
  ]);

  const exactMatchIndex = normalizedHeaders.findIndex((header) => preferredNames.has(header));
  if (exactMatchIndex >= 0) return exactMatchIndex;

  return normalizedHeaders.findIndex((header) => header.includes('fund'));
}

function mapTithelyCategory(fundName) {
  const normalizedFundName = collapseWhitespace(fundName).toLowerCase();

  if (normalizedFundName === 'building campaign') return 'Pledges';
  if (normalizedFundName === 'sent missions') return 'Sent Missions Income';
  return 'General Offerings';
}

function parseTithely(csvString, conversionRate) {
    const lines = csvString.split("\n").map(line => line.trim()).filter(line => line);
    const headers = lines.shift().split(",").map(h => h.replace(/"/g, '').trim()); // Remove quotes and trim spaces
    const fundColumnIndex = findTithelyFundColumn(headers);

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
      const fundName = fundColumnIndex >= 0 ? cols[fundColumnIndex] : "";

      const row = [
          escapeCSVValue(cols[requiredFields["Email"]]), // Email/Member Number
          escapeCSVValue(amount), // Amount in cents
          escapeCSVValue(mapTithelyCategory(fundName)), // Category
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

module.exports = { processFile, processGivingFile, processGivingFiles, parseTithely };
