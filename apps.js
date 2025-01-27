function loadApp(appName, menuItem) {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => item.classList.remove('active'));
  menuItem.classList.add('active');

  if (appName === 'Accounting') {
    document.getElementById('content').innerHTML = `
      <div class="card">
        <h1>${appName}</h1>
        <p>Drag and drop a file or select one to get started.</p>
        <div class="drop-zone" id="drop-zone">Drag and drop a .txt file here or click to upload</div>
        <input type="file" id="file-input" accept=".txt" style="display: none;">
        <pre id="output">Waiting for file...</pre>
      </div>`;
    attachAccoungingEventListeners();
  } else if (appName === 'Giving') {
    document.getElementById('content').innerHTML = `
      <div class="card">
        <h1>${appName}</h1>
        <p>Drag and drop a file or select one to get started.</p>
        <div class="drop-zone" id="drop-zone">Drag and drop a .txt file here or click to upload</div>
        <input type="file" id="file-input" accept=".txt" style="display: none;">
        <pre id="output">Waiting for file...</pre>
      </div>`;
    attachGivingEventListeners();
  } else if (appName === 'Tithe.ly') {
    document.getElementById('content').innerHTML = `
      <div class="card">
        <h1>${appName}</h1>

        <section id="exchange-rate" style="margin-bottom: 20px;">
          <h2>Exchange Rate</h2>
          <p>Current Rate: <span id="current-rate">Loading...</span> (Last updated: <span id="last-updated">Loading...</span>)</p>
          <p><button id="refresh-rate">Refresh Rate</button></p>
          <p><label for="manual-rate">Set Rate Manually:</label>
          <input type="number" id="manual-rate" placeholder="Enter rate"></p>
        </section>

        <p>Drag and drop a file or select one to get started.</p>
        <div class="drop-zone" id="drop-zone">Drag and drop a .csv file here or click to upload</div>
        <input type="file" id="file-input" accept=".csv" style="display: none;">
        <pre id="output">Waiting for file...</pre>
      </div>`;
    attachExchangeEventListeners();
  } else if (appName === 'Settings') {
    document.getElementById('content').innerHTML = `
      <div class="card">
        <h1>${appName}</h1>
        <p>Select a default path for saving files:</p>
        <button class="button" id="choose-path">Choose Path</button>
        <div class="file-path" id="default-path"></div>
      </div>`;
    attachSettingsEventListeners();
  } else if (appName === 'Hanacard') {
    document.getElementById('content').innerHTML = `
    <div class="card">
      <h1>${appName}</h1>
      <p>For now manually input the items from the email</p>
      <p>Use this value to decode the email</p>
      <p><input readonly type="text" value="1068264439"></p>
      <p>Make sure to input a separate item for USD fees</p>
    </div>`;
  } else {
    document.getElementById('content').innerHTML = `<div class="card"><h1>${appName}</h1><p>Content for ${appName} goes here.</p></div>`;
  }
}

document.getElementById('menu-accounting').click();
