import { pack } from 'binpack3d';
import { presets } from './presets.js';
import { Scene } from './scene.js';

const els = {
  preset: document.getElementById('preset'),
  pack: document.getElementById('pack'),
  binsInput: document.getElementById('bins-input'),
  itemsInput: document.getElementById('items-input'),
  biggerFirst: document.getElementById('opt-biggerFirst'),
  distributeItems: document.getElementById('opt-distributeItems'),
  decimals: document.getElementById('opt-decimals'),
  parseError: document.getElementById('parse-error'),
  resetCamera: document.getElementById('reset-camera'),
  toggleLabels: document.getElementById('toggle-labels'),
  canvas: document.getElementById('canvas'),
  binSummary: document.getElementById('bin-summary'),
  unfitSummary: document.getElementById('unfit-summary'),
};

const scene = new Scene(els.canvas);

function loadPreset(id) {
  const p = presets.find((x) => x.id === id);
  if (!p) return;
  els.binsInput.value = JSON.stringify(p.bins, null, 2);
  els.itemsInput.value = JSON.stringify(p.items, null, 2);
  els.biggerFirst.checked = p.options.biggerFirst ?? true;
  els.distributeItems.checked = p.options.distributeItems ?? false;
  els.decimals.value = String(p.options.numberOfDecimals ?? 2);
  runPack();
}

function populatePresets() {
  for (const p of presets) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label;
    opt.title = p.description;
    els.preset.appendChild(opt);
  }
}

function showError(msg) {
  els.parseError.textContent = msg;
  els.parseError.hidden = false;
}

function clearError() {
  els.parseError.hidden = true;
  els.parseError.textContent = '';
}

function runPack() {
  let bins, items;
  try {
    bins = JSON.parse(els.binsInput.value);
    items = JSON.parse(els.itemsInput.value);
  } catch (err) {
    showError(`JSON parse error: ${err.message}`);
    return;
  }
  if (!Array.isArray(bins) || !Array.isArray(items)) {
    showError('Bins and items must be JSON arrays.');
    return;
  }
  clearError();

  const options = {
    biggerFirst: els.biggerFirst.checked,
    distributeItems: els.distributeItems.checked,
    numberOfDecimals: Number(els.decimals.value) || 0,
  };

  let result;
  try {
    result = pack({ bins, items, options });
  } catch (err) {
    showError(`pack() threw: ${err.message}`);
    return;
  }

  scene.render(result, bins);
  renderSummary(result);
}

function renderSummary(result) {
  // Bin cards
  els.binSummary.innerHTML = '';
  for (const bin of result.bins) {
    const card = document.createElement('div');
    card.className = 'bin-card';

    const [bw, bh, bd] = bin.whd;
    const utilPct = (bin.utilization * 100).toFixed(1);

    card.innerHTML = `
      <h3>
        <span>${escapeHtml(bin.partno)}</span>
        <span class="meta">${bw}×${bh}×${bd}</span>
      </h3>
      <div class="progress"><div style="width: ${utilPct}%"></div></div>
      <div class="stats">
        <span>${utilPct}%</span><span style="color: var(--text-muted)">utilization</span>
        <span>${bin.fittedItems.length}</span><span style="color: var(--text-muted)">items</span>
        <span>${bin.totalWeight.toFixed(2)} / ${bin.maxWeight}</span><span style="color: var(--text-muted)">weight</span>
      </div>
      <div class="gravity-grid">
        <div data-label="FL">${bin.gravity[0].toFixed(0)}%</div>
        <div data-label="FR">${bin.gravity[1].toFixed(0)}%</div>
        <div data-label="BL">${bin.gravity[2].toFixed(0)}%</div>
        <div data-label="BR">${bin.gravity[3].toFixed(0)}%</div>
      </div>
    `;
    els.binSummary.appendChild(card);
  }

  // Unfit list
  els.unfitSummary.innerHTML = '';
  if (result.unfitItems.length > 0) {
    const card = document.createElement('div');
    card.className = 'unfit-card';
    const items = result.unfitItems
      .map((u) => `<li>${escapeHtml(u.partno)} <span class="reason">${u.reason}</span></li>`)
      .join('');
    card.innerHTML = `
      <h3>Unfit items (${result.unfitItems.length})</h3>
      <ul>${items}</ul>
    `;
    els.unfitSummary.appendChild(card);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Wire up events
els.pack.addEventListener('click', runPack);
els.preset.addEventListener('change', (e) => loadPreset(e.target.value));
els.resetCamera.addEventListener('click', () => scene.resetCamera());
els.toggleLabels.addEventListener('change', (e) => scene.setLabelsVisible(e.target.checked));

// Re-run on Ctrl/Cmd-Enter in textareas
for (const ta of [els.binsInput, els.itemsInput]) {
  ta.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runPack();
    }
  });
}

// Boot
populatePresets();
loadPreset(presets[0].id);
