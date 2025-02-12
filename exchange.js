// Globals in settings.js


function handleTithelyFile(file) {
  if (file.name.endsWith('.csv')) {
    const reader = new FileReader();
    reader.onload = async(e) => {
      const { rate } = await getRate();
      const data = converter.parseTithely(e.target.result, rate);
      const outputPath = await writer.writeFile('tithely', 'csv', data);
      const output = document.getElementById('output');
      output.innerHTML = `File written to: ${ path.basename(outputPath) } `;
      openButton.path = outputPath;
      showButton.path = outputPath;
      output.appendChild(openButton);
      output.appendChild(showButton);
    }
    reader.readAsText(file);
  } else {
    alert('Please upload a .txt file.');
  }
}

async function fetchRate() {
  try {
    const response = await fetch('https://api.apilayer.com/exchangerates_data/latest?base=USD&symbols=KRW', {
      headers: { 'apikey': 'as2HUVcOfa1PYK6NdGOCWCMSiJRfffBw' },
    });
    const data = await response.json();
    const exchangeRate = { rate: data.rates.KRW, date: data.date };
    store.set('exchangeRate', exchangeRate);
    return exchangeRate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
}

async function getRate() {
  const currentExchange = store.get('exchangeRate');
  if (currentExchange) {
    const date = new Date(currentExchange.date);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    if (date > oneMonthAgo) return currentExchange;
  }

  return await fetchRate();
}

function updateRate(rate, date) {
  document.getElementById('current-rate').textContent = rate;
  document.getElementById('manual-rate').value = rate;
  document.getElementById('last-updated').textContent = date;
}

async function attachExchangeEventListeners() {
  document.getElementById('refresh-rate').addEventListener('click', async () => {
    try {
      const { rate, date } = await fetchRate();
      updateRate(rate, date);
    } catch (error) {
      alert('Failed to fetch exchange rate. Please try again.');
    }
  });

  document.getElementById('manual-rate').addEventListener('input', (event) => {
    const today = new Date();
    const rate = parseFloat(event.target.value);
    const date = today.toISOString().substring(0, 10);
    const exchangeRate = { rate, date  };

    store.set('exchangeRate', exchangeRate);
    updateRate(rate, date);
  });

  const { rate, date } = await getRate();
  updateRate(rate, date);

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file) handleTithelyFile(file);
  });

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleTithelyFile(file);
  });
}
