const tithelyConverter = require('./converter');
const tithelyWriter = require('./writer');
const tithelyPath = require('path');
const ExchangeStore = require('electron-store');

const exchangeStore = new ExchangeStore();

function handleTithelyFile(file) {
  if (!file.name.endsWith('.csv')) {
    setErrorState('Unsupported Tithe.ly file', 'Upload a Tithe.ly CSV export ending in .csv.');
    return;
  }

  const reader = new FileReader();
  setProcessingState('Processing Tithe.ly export', `Reading ${file.name} and applying the active KRW rate.`);

  reader.onload = async(event) => {
    try {
      const { rate } = await getRate();
      const data = tithelyConverter.parseTithely(event.target.result, rate);
      const outputPath = await tithelyWriter.writeFile('tithely', 'csv', data);

      setSuccessState({
        title: 'Tithe.ly CSV generated',
        detail: `Saved ${tithelyPath.basename(outputPath)} from ${file.name} using rate ${rate}.`,
        outputPath,
        pills: [
          { label: `KRW rate ${rate}`, icon: 'fa-won-sign' },
          { label: 'Card giving mapped', icon: 'fa-credit-card' }
        ]
      });
    } catch (error) {
      setErrorState('Tithe.ly conversion failed', error.message || 'Failed to process Tithe.ly file.');
    }
  };

  reader.readAsText(file);
}

async function fetchRate() {
  const response = await fetch('https://api.apilayer.com/exchangerates_data/latest?base=USD&symbols=KRW', {
    headers: { apikey: 'as2HUVcOfa1PYK6NdGOCWCMSiJRfffBw' }
  });

  const data = await response.json();
  if (!data?.rates?.KRW) {
    throw new Error('Exchange rate response did not include KRW.');
  }

  const exchangeRate = { rate: data.rates.KRW, date: data.date };
  exchangeStore.set('exchangeRate', exchangeRate);
  return exchangeRate;
}

async function getRate() {
  const currentExchange = exchangeStore.get('exchangeRate');
  if (currentExchange) {
    const savedDate = new Date(currentExchange.date);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    if (savedDate > oneMonthAgo) return currentExchange;
  }

  return fetchRate();
}

function updateRate(rate, date) {
  const currentRate = document.getElementById('current-rate');
  const manualRate = document.getElementById('manual-rate');
  const lastUpdated = document.getElementById('last-updated');

  if (currentRate) currentRate.textContent = rate;
  if (manualRate) manualRate.value = rate;
  if (lastUpdated) lastUpdated.textContent = date;
}

async function attachExchangeEventListeners() {
  const refreshButton = document.getElementById('refresh-rate');
  const manualRate = document.getElementById('manual-rate');

  refreshButton?.addEventListener('click', async () => {
    try {
      setWorkspaceStatus('Refreshing exchange rate', 'processing');
      const { rate, date } = await fetchRate();
      updateRate(rate, date);
      setWorkspaceStatus('Exchange rate updated', 'success');
    } catch (error) {
      setWorkspaceStatus('Rate refresh failed', 'error');
      renderOutputState({
        tone: 'error',
        title: 'Exchange rate refresh failed',
        detail: error.message || 'Failed to fetch exchange rate.',
        pills: [{ label: 'Manual override available', icon: 'fa-sliders' }]
      });
    }
  });

  manualRate?.addEventListener('input', (event) => {
    const today = new Date();
    const rate = parseFloat(event.target.value);

    if (!Number.isFinite(rate)) return;

    const date = today.toISOString().substring(0, 10);
    const exchangeRate = { rate, date };
    exchangeStore.set('exchangeRate', exchangeRate);
    updateRate(rate, date);
    setWorkspaceStatus('Manual exchange rate applied', 'success');
  });

  try {
    const { rate, date } = await getRate();
    updateRate(rate, date);
  } catch (error) {
    setWorkspaceStatus('Rate unavailable', 'error');
  }

  bindFileDropZone({
    onFile: handleTithelyFile
  });
}
