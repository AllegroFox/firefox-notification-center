/* =========================================================
   Categories — group similar notifications
   (e.g. Important, Messages, Promotions…)
   Grew out of the Category concept in the sidebar.js mockup:
   a name + a set of sources, here extended with keyword rules,
   an icon/color, and an enabled flag so users can curate them.
   ========================================================= */

class Category {
  constructor({
    id,
    name,
    icon = '🏷️',
    color = '#7B5CF0',
    sources = [],       // source ids that route here
    keywords = [],      // title/preview substrings that route here
    builtin = false,    // shipped default — can be disabled but not deleted
    enabled = true,
    isCatchAll = false, // "Other" — collects anything not matched above
  }) {
    this.id = id || ('cat-' + Math.floor(Math.random() * 100000));
    this.name = name;
    this.icon = icon;
    this.color = color;
    this.sources = sources;
    this.keywords = keywords;
    this.builtin = builtin;
    this.enabled = enabled;
    this.isCatchAll = isCatchAll;
  }

  matches(n) {
    if (this.sources.includes(n.src)) return true;
    const hay = (n.title + ' ' + (n.preview || '')).toLowerCase();
    return this.keywords.some(k => k && hay.includes(k.toLowerCase()));
  }

  ruleSummary() {
    if (this.isCatchAll) return 'Everything not matched above';
    const parts = [];
    if (this.sources.length) parts.push(`${this.sources.length} source${this.sources.length === 1 ? '' : 's'}`);
    if (this.keywords.length) parts.push(`${this.keywords.length} keyword${this.keywords.length === 1 ? '' : 's'}`);
    return parts.length ? parts.join(' · ') : 'No rules yet — add some';
  }
}

const CategoryManager = new (class extends EventTarget {
  #store = [
    new Category({
      id: 'cat-important', name: 'Important', icon: '🔴', color: '#FF6680', builtin: true,
      sources: ['gh-p', 'gh-w', 'gcal', 'linear'],
      keywords: ['important', 'urgent', 'review requested', 'respond', 'okr', 'assigned to you', 'mentioned', '@you'],
    }),
    new Category({
      id: 'cat-messages', name: 'Messages', icon: '💬', color: '#7B5CF0', builtin: true,
      sources: ['slack-p', 'slack-w', 'discord'],
      keywords: ['new message', 'mention', 'commented'],
    }),
    new Category({
      id: 'cat-promos', name: 'Promotions', icon: '🏷️', color: '#FFCA3A', builtin: true,
      sources: ['amazon', 'shopify'],
      keywords: ['sale', '% off', 'deal', 'flash', 'discount', 'delivery', 'package'],
    }),
    new Category({
      id: 'cat-news', name: 'News & Updates', icon: '📰', color: '#00B3C7', builtin: true,
      sources: ['nyt', 'reddit', 'spotify', 'figma'],
      keywords: ['breaking', 'briefing', 'new posts', 'discover'],
    }),
    new Category({
      id: 'cat-other', name: 'Other', icon: '📨', color: '#9E9EAD', builtin: true, isCatchAll: true,
      sources: [], keywords: [],
    }),
  ];

  getAll() { return [...this.#store]; }
  getEnabled() { return this.#store.filter(c => c.enabled); }
  get(id) { return this.#store.find(c => c.id === id); }

  add(cat) {
    // Keep the catch-all ("Other") last so it stays a true fallback.
    const catchAllIdx = this.#store.findIndex(c => c.isCatchAll);
    if (catchAllIdx >= 0) this.#store.splice(catchAllIdx, 0, cat);
    else this.#store.push(cat);
    this.dispatchEvent(new Event('change'));
  }

  remove(id) {
    const c = this.get(id);
    if (!c || c.builtin) return; // never delete a shipped category
    this.#store = this.#store.filter(x => x.id !== id);
    this.dispatchEvent(new Event('change'));
  }
})();
window.CategoryManager = CategoryManager;

/* Assign a notification to its category: first enabled match wins,
   falling back to the enabled catch-all (if any). */
function categorize(n) {
  const enabled = CategoryManager.getEnabled();
  for (const c of enabled) {
    if (c.isCatchAll) continue;
    if (c.matches(n)) return c;
  }
  return enabled.find(c => c.isCatchAll) || null;
}

/* =========================================================
   Settings: category list + custom-category builder
   ========================================================= */
const TRASH_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
const CAT_COLORS = ['#FF6680', '#FF7139', '#FFCA3A', '#3FE1B0', '#00B3C7', '#7B5CF0'];

function renderCategorySettings() {
  const host = $('#categoryList');
  if (!host) return;

  host.innerHTML = CategoryManager.getAll().map(c => `
    <div class="cat-row ${c.enabled ? '' : 'is-off'}" data-id="${c.id}">
      <span class="cat-row__icon" style="background:${c.color}22; border-color:${c.color}66;">${c.icon}</span>
      <div class="cat-row__info">
        <div class="cat-row__name">
          ${c.name}
          ${c.builtin ? '' : '<span class="cat-row__tag">Custom</span>'}
        </div>
        <div class="cat-row__rule">${c.ruleSummary()}</div>
      </div>
      <div class="cat-row__actions">
        ${c.builtin ? '' : `<button class="btn btn--ghost btn--icon btn--danger" data-act="del-cat" title="Delete category">${TRASH_SVG}</button>`}
        <button class="tswitch ${c.enabled ? 'is-on' : ''}" data-act="toggle-cat" aria-pressed="${c.enabled}" title="${c.enabled ? 'Disable' : 'Enable'} ${c.name}"></button>
      </div>
    </div>`).join('');

  $$('.cat-row', host).forEach(row => {
    const id = row.dataset.id;
    row.querySelector('[data-act="toggle-cat"]')?.addEventListener('click', () => {
      const c = CategoryManager.get(id);
      c.enabled = !c.enabled;
      renderCategorySettings();
      renderInbox();
    });
    row.querySelector('[data-act="del-cat"]')?.addEventListener('click', () => {
      const c = CategoryManager.get(id);
      CategoryManager.remove(id);
      renderCategorySettings();
      renderInbox();
      showBanner({
        icon: '🗑',
        text: `Deleted "${c.name}"`,
        sub: 'Custom category removed.',
        undo: () => { CategoryManager.add(c); renderCategorySettings(); renderInbox(); },
      });
    });
  });
}

/* Custom-category builder form */
let _formColor = CAT_COLORS[5];
const _formSources = new Set();

function buildCatForm() {
  const form = $('#catForm');
  if (!form) return;
  _formColor = CAT_COLORS[5];
  _formSources.clear();

  form.innerHTML = `
    <div class="cat-form__row">
      <input class="cat-input cat-input--icon" id="catIcon" placeholder="🏷️" maxlength="2" value="🏷️" aria-label="Category icon" />
      <input class="cat-input" id="catName" placeholder="Category name" maxlength="24" aria-label="Category name" />
    </div>

    <div class="cat-form__label">Color</div>
    <div class="cat-swatches" id="catSwatches">
      ${CAT_COLORS.map(c => `<button type="button" class="cat-swatch ${c === _formColor ? 'is-active' : ''}" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}
    </div>

    <div class="cat-form__label">Route these sources here</div>
    <div class="cat-sources" id="catSources">
      ${SOURCES.map(s => `
        <button type="button" class="cat-src" data-src="${s.id}">
          <span class="cat-src__icon" style="background:${s.color}">${s.icon}</span>
          <span class="cat-src__name">${s.name}</span>
        </button>`).join('')}
    </div>

    <div class="cat-form__label">Keywords <small>comma-separated · matches title &amp; preview</small></div>
    <input class="cat-input" id="catKeywords" placeholder="e.g. invoice, receipt, payment" />

    <div class="cat-form__actions">
      <button class="btn btn--primary" id="catSave">Create category</button>
    </div>
  `;

  $$('#catSwatches .cat-swatch').forEach(b => b.addEventListener('click', () => {
    _formColor = b.dataset.color;
    $$('#catSwatches .cat-swatch').forEach(x => x.classList.toggle('is-active', x === b));
  }));

  $$('#catSources .cat-src').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.src;
    if (_formSources.has(id)) { _formSources.delete(id); b.classList.remove('is-on'); }
    else { _formSources.add(id); b.classList.add('is-on'); }
  }));

  $('#catSave').addEventListener('click', () => {
    const nameEl = $('#catName');
    const name = nameEl.value.trim();
    if (!name) { nameEl.focus(); return; }
    const icon = $('#catIcon').value.trim() || '🏷️';
    const keywords = $('#catKeywords').value.split(',').map(k => k.trim()).filter(Boolean);
    const cat = new Category({ name, icon, color: _formColor, sources: [..._formSources], keywords, builtin: false });
    CategoryManager.add(cat);
    closeCatForm();
    renderCategorySettings();
    renderInbox();
    showBanner({ icon, text: `Created "${name}"`, sub: cat.ruleSummary() });
  });
}

function closeCatForm() {
  const form = $('#catForm');
  const btn = $('#addCatBtn');
  if (form) form.hidden = true;
  if (btn) btn.textContent = '+ New category';
}

function initCategories() {
  renderCategorySettings();
  const addBtn = $('#addCatBtn');
  const form = $('#catForm');
  if (!addBtn || !form) return;
  addBtn.addEventListener('click', () => {
    if (form.hidden) {
      buildCatForm();
      form.hidden = false;
      addBtn.textContent = '× Cancel';
    } else {
      closeCatForm();
    }
  });
}

initCategories();
