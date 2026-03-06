const { clipboard, ipcRenderer } = require('electron');
const menuIds = {
  Accounting: 'menu-accounting',
  Giving: 'menu-giving',
  'Tithe.ly': 'menu-tithely',
  Hanacard: 'menu-hanacard',
  Settings: 'menu-settings'
};

const appDefinitions = {
  Accounting: {
    kicker: 'HanaBank to OFX',
    title: 'Convert raw bank exports into quiet, importable signal.',
    status: 'Ready for HanaBank text export',
    template: renderAccountingScreen,
    onLoad: () => {
      renderOutputState({
        tone: 'idle',
        title: 'Awaiting accounting export',
        detail: 'Drop a HanaBank transaction text file to generate an OFX statement.',
        pills: ['Source: .txt', 'Output: .ofx']
      });
      attachAccoungingEventListeners();
    }
  },
  Giving: {
    kicker: 'Offerings to ChurchTrac',
    title: 'Shape incoming giving data into a cleaner ChurchTrac import.',
    status: 'Ready for deposit text export',
    template: renderGivingScreen,
    onLoad: () => {
      renderOutputState({
        tone: 'idle',
        title: 'Awaiting giving export',
        detail: 'Drop the latest HanaBank giving text file to generate a ChurchTrac-ready CSV.',
        pills: ['Source: .txt', 'Output: .csv']
      });
      attachGivingEventListeners();
    }
  },
  'Tithe.ly': {
    kicker: 'Card Giving Intake',
    title: 'Pull Tithe.ly rows through a calmer KRW conversion path.',
    status: 'Exchange link standing by',
    template: renderTithelyScreen,
    onLoad: () => {
      renderOutputState({
        tone: 'idle',
        title: 'Awaiting Tithe.ly export',
        detail: 'Load a Tithe.ly CSV after checking the exchange rate panel.',
        pills: ['Source: .csv', 'Output: .csv']
      });
      attachExchangeEventListeners();
    }
  },
  Hanacard: {
    kicker: 'Manual Decode Utility',
    title: 'A small atmospheric station for translating HanaCard email details.',
    status: 'Manual decode active',
    template: renderHanacardScreen,
    onLoad: attachHanacardEventListeners
  },
  Settings: {
    kicker: 'System Calibration',
    title: 'Tune where the converted artifacts land and keep the lab steady.',
    status: 'Preferences available',
    template: renderSettingsScreen,
    onLoad: attachSettingsEventListeners
  }
};

function getMenuId(appName) {
  return menuIds[appName];
}

function setActiveMenu(appName, explicitMenuItem) {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach((item) => item.classList.remove('active'));

  const menuItem = explicitMenuItem || document.getElementById(getMenuId(appName));
  menuItem?.classList.add('active');
}

function setWorkspaceStatus(text, tone = 'ready') {
  const status = document.getElementById('workspace-status');
  if (!status) return;

  status.textContent = text;
  status.className = `workspace-status status-${tone}`;
}

function setWorkspaceHeader(appName) {
  const definition = appDefinitions[appName];
  if (!definition) return;

  const kicker = document.getElementById('workspace-kicker');
  const title = document.getElementById('workspace-title');

  if (kicker) kicker.textContent = definition.kicker;
  if (title) title.textContent = appName;
  document.body.dataset.app = appName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  setWorkspaceStatus(definition.status, 'ready');
}

function createChip(label, icon) {
  const chip = document.createElement('span');
  chip.className = 'output-pill';
  chip.innerHTML = icon ? `<i class="fas ${icon}"></i><span>${label}</span>` : `<span>${label}</span>`;
  return chip;
}

function renderOutputState({ tone = 'idle', title, detail = '', pills = [], actions = [] }) {
  const state = document.getElementById('output-state');
  if (!state) return;

  state.className = `output-state output-state-${tone}`;
  state.innerHTML = '';

  const heading = document.createElement('div');
  heading.className = 'output-title';
  heading.textContent = title;
  state.appendChild(heading);

  if (detail) {
    const body = document.createElement('div');
    body.className = 'output-detail';
    body.textContent = detail;
    state.appendChild(body);
  }

  if (pills.length > 0) {
    const meta = document.createElement('div');
    meta.className = 'output-meta';
    pills.forEach((pill) => {
      if (typeof pill === 'string') {
        meta.appendChild(createChip(pill));
      } else {
        meta.appendChild(createChip(pill.label, pill.icon));
      }
    });
    state.appendChild(meta);
  }

  if (actions.length > 0) {
    const row = document.createElement('div');
    row.className = 'action-row';

    actions.forEach((action) => {
      const button = document.createElement('button');
      button.className = `action-button${action.primary ? ' primary-action' : ''}`;
      button.type = 'button';
      button.innerHTML = action.icon ? `<i class="fas ${action.icon}"></i><span>${action.label}</span>` : `<span>${action.label}</span>`;
      button.addEventListener('click', action.handler);
      row.appendChild(button);
    });

    state.appendChild(row);
  }
}

function bindFileDropZone({ fileInputId = 'file-input', dropZoneId = 'drop-zone', onFile }) {
  const dropZone = document.getElementById(dropZoneId);
  const fileInput = document.getElementById(fileInputId);

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragging');
    setWorkspaceStatus('Drop file to begin conversion', 'processing');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
    setWorkspaceStatus('Ready for file intake', 'ready');
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragging');
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  });

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) onFile(file);
  });
}

function setProcessingState(title, detail) {
  setWorkspaceStatus(title, 'processing');
  renderOutputState({
    tone: 'processing',
    title,
    detail,
    pills: [{ label: 'Pipeline engaged', icon: 'fa-bolt' }]
  });
}

function setErrorState(title, detail) {
  setWorkspaceStatus(title, 'error');
  renderOutputState({
    tone: 'error',
    title,
    detail,
    pills: [{ label: 'Conversion halted', icon: 'fa-triangle-exclamation' }]
  });
}

function makeOpenAction(outputPath) {
  return {
    label: 'Open File',
    icon: 'fa-arrow-up-right-from-square',
    primary: true,
    handler: () => {
      const { shell } = require('@electron/remote');
      shell.openPath(outputPath);
    }
  };
}

function makeRevealAction(outputPath) {
  return {
    label: 'Reveal in Finder',
    icon: 'fa-folder-open',
    handler: () => {
      const { shell } = require('@electron/remote');
      shell.showItemInFolder(outputPath);
    }
  };
}

function setSuccessState({ title, detail, pills = [], outputPath }) {
  const path = require('path');
  setWorkspaceStatus('Conversion completed', 'success');
  renderOutputState({
    tone: 'success',
    title,
    detail,
    pills: [
      { label: path.basename(outputPath), icon: 'fa-file-export' },
      ...pills
    ],
    actions: [makeOpenAction(outputPath), makeRevealAction(outputPath)]
  });
}

function renderHeroPanel({ eyebrow, title, copy, chips, icon, accept }) {
  return `
    <section class="panel hero-panel">
      <div>
        <div class="panel-eyebrow">${eyebrow}</div>
        <h1 class="hero-title">${title}</h1>
        <p class="hero-copy">${copy}</p>
        <div class="hero-meta">
          ${chips.map((chip) => `<span class="meta-chip"><i class="fas ${chip.icon}"></i><span>${chip.label}</span></span>`).join('')}
        </div>
      </div>
      <div class="drop-zone" id="drop-zone">
        <div class="drop-icon"><i class="fas ${icon}"></i></div>
        <div class="drop-copy">Drag a ${accept} file here or click to upload</div>
        <div class="drop-meta">A calmer intake surface for messy exports and release-bound conversions.</div>
      </div>
      <input class="hidden-input" type="file" id="file-input" accept="${accept}">
    </section>
  `;
}

function renderOutputPanel() {
  return `
    <section class="panel output-panel">
      <div class="panel-eyebrow">Recent Output</div>
      <div id="output-state" class="output-state output-state-idle"></div>
    </section>
  `;
}

function renderAccountingScreen() {
  return `
    <div class="app-grid">
      ${renderHeroPanel({
        eyebrow: 'Accounting Pipeline',
        title: 'Bank noise in. Import-grade OFX out.',
        copy: 'Optimized for the current Korean HanaBank text export. The output keeps statement metadata intact and aims for a smoother accounting import path.',
        chips: [
          { label: 'Latest Hana Korean layout', icon: 'fa-building-columns' },
          { label: 'Generates OFX statement', icon: 'fa-file-waveform' },
          { label: 'Chronological transaction pass', icon: 'fa-clock-rotate-left' }
        ],
        icon: 'fa-wave-square',
        accept: '.txt'
      })}

      <aside class="side-panel">
        <section class="panel">
          <div class="panel-heading">Signal Notes</div>
          <ul class="note-list">
            <li>Supports the current 11-column Hana export with Korean headers.</li>
            <li>Writes KRW OFX with date bounds and ledger balance metadata.</li>
            <li>Best used with clean account exports that already exclude summary-only rows.</li>
          </ul>
        </section>
        <section class="panel">
          <div class="panel-heading">Flight Stats</div>
          <div class="stat-grid">
            <div class="metric-card">
              <div class="metric-label">Input</div>
              <div class="metric-value">TXT</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Output</div>
              <div class="metric-value">OFX</div>
            </div>
          </div>
        </section>
      </aside>

      ${renderOutputPanel()}
    </div>
  `;
}

function renderGivingScreen() {
  return `
    <div class="app-grid">
      ${renderHeroPanel({
        eyebrow: 'Giving Intake',
        title: 'Turn donor deposits into ChurchTrac-ready rhythm.',
        copy: 'Filters non-deposit lines, derives stable member IDs, and shapes the export for a cleaner giving import workflow.',
        chips: [
          { label: 'ChurchTrac CSV output', icon: 'fa-table' },
          { label: 'Stable donor ID generation', icon: 'fa-fingerprint' },
          { label: 'Memo trimming built in', icon: 'fa-scissors' }
        ],
        icon: 'fa-sparkles',
        accept: '.txt'
      })}

      <aside class="side-panel">
        <section class="panel">
          <div class="panel-heading">What It Does</div>
          <ul class="note-list">
            <li>Keeps only valid positive deposits from the Hana export.</li>
            <li>Builds compact memo text from remarks and additional memo fields.</li>
            <li>Formats names into the columns ChurchTrac expects.</li>
          </ul>
        </section>
        <section class="panel">
          <div class="panel-heading">Export Profile</div>
          <div class="stat-grid">
            <div class="metric-card">
              <div class="metric-label">Source</div>
              <div class="metric-value">Hana TXT</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Target</div>
              <div class="metric-value">CSV</div>
            </div>
          </div>
        </section>
      </aside>

      ${renderOutputPanel()}
    </div>
  `;
}

function renderTithelyScreen() {
  return `
    <div class="app-grid">
      ${renderHeroPanel({
        eyebrow: 'Tithe.ly Relay',
        title: 'Convert card-giving exports with the exchange rate in view.',
        copy: 'This path watches the stored KRW rate, lets you override it manually, and shapes the final file for ChurchTrac import.',
        chips: [
          { label: 'Live or manual KRW rate', icon: 'fa-satellite-dish' },
          { label: 'Card contribution mapping', icon: 'fa-credit-card' },
          { label: 'ChurchTrac CSV output', icon: 'fa-file-csv' }
        ],
        icon: 'fa-satellite-dish',
        accept: '.csv'
      })}

      <aside class="side-panel">
        <section class="panel">
          <div class="panel-heading">Exchange Rate</div>
          <div class="manual-panel">
            <div class="rate-card">
              <div class="metric-label">Current Rate</div>
              <div class="rate-value" id="current-rate">Loading...</div>
              <div class="output-detail">Last updated <span id="last-updated">Loading...</span></div>
            </div>
            <button class="inline-button" id="refresh-rate" type="button">
              <i class="fas fa-arrows-rotate"></i>
              <span>Refresh Rate</span>
            </button>
            <label class="field-shell" for="manual-rate">
              <span class="field-label">Manual Override</span>
              <input type="number" id="manual-rate" placeholder="Enter KRW rate">
            </label>
          </div>
        </section>
        <section class="panel">
          <div class="panel-heading">Rate Notes</div>
          <ul class="note-list">
            <li>Stored rates are reused until they are older than one month.</li>
            <li>Manual overrides write directly into the local settings store.</li>
            <li>Use manual mode if the API is down or you need a fixed statement rate.</li>
          </ul>
        </section>
      </aside>

      ${renderOutputPanel()}
    </div>
  `;
}

function renderSettingsScreen() {
  return `
    <div class="app-grid">
      <section class="panel hero-panel">
        <div>
          <div class="panel-eyebrow">Preferences</div>
          <h1 class="hero-title">Where should the exports land?</h1>
          <p class="hero-copy">Choose a default folder for generated files so each conversion resolves into the same place without further clicks.</p>
        </div>
        <div class="settings-stack">
          <button class="action-button primary-action" id="choose-path" type="button">
            <i class="fas fa-folder-tree"></i>
            <span>Choose Output Folder</span>
          </button>
          <div class="path-panel">
            <div class="field-label">Current Destination</div>
            <div id="default-path" class="path-display">No default path selected.</div>
          </div>
        </div>
      </section>

      <aside class="side-panel">
        <section class="panel">
          <div class="panel-heading">Storage Notes</div>
          <ul class="note-list">
            <li>The selected path is stored locally via Electron Store.</li>
            <li>Converted files keep their timestamped naming on write.</li>
            <li>If unset, output falls back to the app working directory.</li>
          </ul>
        </section>
      </aside>

      <section class="panel output-panel">
        <div class="panel-eyebrow">Preference State</div>
        <div class="output-state output-state-idle">
          <div class="output-title">System preferences are stable.</div>
          <div class="output-detail">Change the output folder here whenever you want your exported files to land somewhere new.</div>
        </div>
      </section>
    </div>
  `;
}

function renderHanacardScreen() {
  return `
    <div class="app-grid">
      <section class="panel hero-panel">
        <div>
          <div class="panel-eyebrow">Hanacard Decode</div>
          <h1 class="hero-title">One manual code. One less ritual.</h1>
          <p class="hero-copy">Use the value below when decoding HanaCard email statements. Keep USD fees as their own separate line item during manual entry.</p>
        </div>
        <div class="code-shell">
          <div>
            <div class="field-label">Decode Value</div>
            <div class="code-display" id="copyInput">1068264439</div>
          </div>
          <button class="action-button primary-action" type="button" id="copy-code">
            <i class="fas fa-copy"></i>
            <span>Copy</span>
          </button>
        </div>
      </section>

      <aside class="side-panel">
        <section class="panel">
          <div class="panel-heading">Manual Notes</div>
          <ul class="note-list">
            <li>Copy the decode value directly from here instead of retyping it.</li>
            <li>Separate USD processing fees into their own item during entry.</li>
            <li>This screen stays intentionally small and focused for now.</li>
          </ul>
        </section>
      </aside>

      <section class="panel output-panel">
        <div class="panel-eyebrow">Clipboard State</div>
        <div class="output-state output-state-idle" id="hanacard-state">
          <div class="output-title">Decode code standing by.</div>
          <div class="output-detail">Press copy when you need the code moved to the clipboard.</div>
        </div>
      </section>
    </div>
  `;
}

function attachHanacardEventListeners() {
  const copyButton = document.getElementById('copy-code');
  const copyInput = document.getElementById('copyInput');
  const state = document.getElementById('hanacard-state');

  copyButton?.addEventListener('click', () => {
    clipboard.writeText(copyInput.textContent);
    setWorkspaceStatus('Decode value copied', 'success');
    if (state) {
      state.className = 'output-state output-state-success';
      state.innerHTML = `
        <div class="output-title">Decode value copied.</div>
        <div class="output-detail">The HanaCard code is in the clipboard and ready to paste.</div>
      `;
    }
  });
}

function loadApp(appName, menuItem) {
  const definition = appDefinitions[appName];
  if (!definition) return;

  setActiveMenu(appName, menuItem);
  setWorkspaceHeader(appName);
  document.getElementById('content').innerHTML = definition.template();
  definition.onLoad?.();
}

window.loadApp = loadApp;
window.renderOutputState = renderOutputState;
window.bindFileDropZone = bindFileDropZone;
window.setWorkspaceStatus = setWorkspaceStatus;
window.setProcessingState = setProcessingState;
window.setErrorState = setErrorState;
window.setSuccessState = setSuccessState;

ipcRenderer.on('load-app', (_event, appName) => {
  loadApp(appName);
});

loadApp('Accounting', document.getElementById('menu-accounting'));
