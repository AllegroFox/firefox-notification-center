/* =========================================================
   Filters + sorts
   ========================================================= */
$$('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('[data-filter]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    activeFilter = btn.dataset.filter;
    renderInbox();
  });
});
$$('[data-source-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('[data-source-filter]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    hideMuted = btn.dataset.sourceFilter === 'muted';
    renderInbox();
  });
});
$$('[data-source-sort]').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('[data-source-sort]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    sourceSort = btn.dataset.sourceSort;
    renderSources();
  });
});

/* =========================================================
   Bulk actions
   ========================================================= */
$('#markAllBtn').addEventListener('click', () => {
  const pool = notifsForProfile();
  const snapshot = pool.map(n => [n.id, n.unread]);
  pool.forEach(n => n.unread = false);
  renderInbox(); renderStats();
  showBanner({
    icon: '✓', text: 'All caught up',
    sub: `Marked everything in ${profile().name} as read.`,
    undo: () => { snapshot.forEach(([id, was]) => { const n = NOTIFS.find(x => x.id === id); if (n) n.unread = was; }); renderInbox(); renderStats(); }
  });
});

$('#cleanupBtn').addEventListener('click', () => {
  const dormant = sourcesForProfile().filter(s => s.status === 'dormant' && !sourceState[s.id].revoked);
  if (!dormant.length) {
    showBanner({ icon: '✓', text: 'No dormant sources', sub: 'Everything looks healthy.' });
    return;
  }
  dormant.forEach(s => sourceState[s.id].revoked = true);
  renderSources(); renderInbox(); renderStats();
  showBanner({
    icon: '✦', text: `Revoked ${dormant.length} dormant sites`,
    sub: dormant.map(d => d.name).join(', '),
    undo: () => { dormant.forEach(s => sourceState[s.id].revoked = false); renderSources(); renderInbox(); renderStats(); }
  });
});

$('#reviewDormantBtn').addEventListener('click', () => {
  document.querySelector('[data-source-sort="dormant"]').click();
});

/* =========================================================
   Pause menu
   ========================================================= */
const pauseBtn = $('#pauseAllBtn');
const pauseMenu = $('#pauseMenu');
pauseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  pauseMenu.classList.toggle('is-open');
});
document.addEventListener('click', () => pauseMenu.classList.remove('is-open'));
pauseMenu.addEventListener('click', (e) => e.stopPropagation());

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
$('[data-when="1h"]').textContent = fmt(new Date(NOW.getTime() + 60*60*1000));

$$('#pauseMenu .menu__item[data-pause]').forEach(item => {
  item.addEventListener('click', () => {
    quietMode = item.dataset.pause;
    pauseMenu.classList.remove('is-open');
    $('#quietPulse').classList.remove('is-hidden');
    $('#quietPulse').classList.add('is-quiet');
    const labelMap = {
      '1h': `Quiet for 1 hour · resumes at ${fmt(new Date(NOW.getTime() + 60*60*1000))}`,
      'today': 'Quiet for the rest of the day',
      'weekend': 'Quiet through the weekend',
      'custom': 'Quiet hours · 10pm – 8am daily',
    };
    $('#quietLabel').textContent = labelMap[quietMode];
    pauseBtn.classList.add('is-active');
    showBanner({
      icon: '⏸', text: 'All notifications paused',
      sub: labelMap[quietMode],
      undo: () => {
        quietMode = null;
        $('#quietPulse').classList.add('is-hidden');
        $('#quietPulse').classList.remove('is-quiet');
        $('#quietLabel').textContent = '';
        pauseBtn.classList.remove('is-active');
      }
    });
  });
});

/* Banner controls */
$('#bannerUndo').addEventListener('click', () => { if (undoSnapshot) undoSnapshot(); hideBanner(); });
$('#bannerClose').addEventListener('click', hideBanner);

/* =========================================================
   Theme toggle
   ========================================================= */
$('#themeToggle').addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'light' ? '' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  $('#themeIcon').textContent = next === 'light' ? '☀️' : '🌙';
  $('#themeLabel').textContent = next === 'light' ? 'Dark' : 'Light';
});

/* Keyboard shortcut hint */
document.addEventListener('keydown', (e) => {
  if (e.key === '?') {
    showBanner({
      icon: '⌘', text: 'Shortcuts: J/K to move, X to dismiss, M to mute source',
      sub: 'Coming soon in this prototype.'
    });
  }
  if (e.key === 'Escape') hideBanner();
});
/* =========================================================
   Sidebar (open / close)
   ========================================================= */
const sidebar = $('#sidebar');
function openSidebar() {
  sidebar.classList.add('is-on');
  document.body.classList.add('has-sidebar');
}
function closeSidebar() {
  sidebar.classList.remove('is-on');
  document.body.classList.remove('has-sidebar');
  renderCompact();
}
$('#expandBtn').addEventListener('click', openSidebar);
$('#manageAllBtn').addEventListener('click', openSidebar);
$('#closeBtn').addEventListener('click', closeSidebar);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sidebar.classList.contains('is-on')) closeSidebar(); });

/* =========================================================
   Tabs (Recent / Sources / Settings)
   ========================================================= */
$$('.sbtab').forEach(t => {
  t.addEventListener('click', () => {
    $$('.sbtab').forEach(x => { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
    t.classList.add('is-active');
    t.setAttribute('aria-selected', 'true');
    const tab = t.dataset.tab;
    $$('.sb__view').forEach(v => v.hidden = v.dataset.view !== tab);
  });
});

/* =========================================================
   Modes (calm / standard / focus) — in Settings
   ========================================================= */
let showStats = true;

function updateModeExamples() {
  const pool = notifsForProfile().filter(n => !sourceState[n.src]?.revoked);
  const calmHidden  = pool.filter(n => !modeFilterFor('calm', n)).length;
  const focusHidden = pool.filter(n => !modeFilterFor('focus', n)).length;
  const calmEl = $('#calmExample');
  const focusEl = $('#focusExample');
  if (calmEl)  calmEl.textContent  = `Would hide ${calmHidden} ${calmHidden === 1 ? 'notification' : 'notifications'} today`;
  if (focusEl) focusEl.textContent = `Would hide ${focusHidden} ${focusHidden === 1 ? 'notification' : 'notifications'} today`;
}
function modeFilterFor(mode, n) {
  const saved = activeMode;
  activeMode = mode;
  const keep = modeFilter(n);
  activeMode = saved;
  return keep;
}

$$('.mode-card').forEach(m => {
  m.addEventListener('click', () => {
    $$('.mode-card').forEach(x => { x.classList.remove('is-active'); x.setAttribute('aria-checked', 'false'); });
    m.classList.add('is-active');
    m.setAttribute('aria-checked', 'true');
    activeMode = m.dataset.mode;
    renderInbox();
    renderCompact();
    showBanner({
      icon: m.querySelector('.mode-card__icon').textContent,
      text: `${m.querySelector('.mode-card__title span').textContent} mode active`,
      sub: m.querySelector('.mode-card__desc').textContent
    });
  });
});
$('#modeBannerExit').addEventListener('click', () => {
  document.querySelector('.mode-card[data-mode="standard"]').click();
});

/* =========================================================
   Settings: slider + toggles
   ========================================================= */
const expireSlider = $('#expireSlider');
expireSlider.addEventListener('input', () => {
  const v = +expireSlider.value;
  $('#expireValue').textContent = v === 1 ? '1 day' : v >= 30 ? 'Never' : `${v} days`;
});
$$('[data-toggle]').forEach(t => {
  t.addEventListener('click', () => {
    const on = t.classList.toggle('is-on');
    t.setAttribute('aria-pressed', on);
    if (t.dataset.toggle === 'group')   { groupBySource = on; renderInbox(); }
    if (t.dataset.toggle === 'preview') { showPreviews = on; renderInbox(); }
    if (t.dataset.toggle === 'stats')   { showStats = on; updateStatsVisibility(); }
  });
});
function updateStatsVisibility() {
  const statsBlock = document.querySelector('.sb__view[data-view="recent"] .sb__stats');
  if (statsBlock) statsBlock.style.display = showStats ? '' : 'none';
}

/* =========================================================
   Profile switching
   ========================================================= */
const profileBtn  = $('#profileBtn');
const profileMenu = $('#profileMenu');

function renderProfileChrome() {
  const p = profile();
  // Header pill
  const av = $('#profileAvatar');
  av.textContent = p.avatar;
  av.style.background = p.color;
  $('#profileName').textContent = p.name;

  // Menu — current block
  const sourceCount = sourcesForProfile().filter(s => !sourceState[s.id].revoked).length;
  $('#profileMenuCurrent').innerHTML = `
    <span class="pmc-avatar" style="background:${p.color}">${p.avatar}</span>
    <div class="pmc-info">
      <div class="pmc-name">${p.name}</div>
      <div class="pmc-email">${p.email}</div>
      <div class="pmc-stats">${sourceCount} allowed sources · ${notifsForProfile().filter(n => n.unread).length} unread</div>
    </div>
    <span class="pmc-pill">Active</span>
  `;
  // Mark current option as is-current
  $$('.profile-option').forEach(o => o.classList.toggle('is-current', o.dataset.switch === currentProfile));

  // Settings panel — current profile
  $('#profileSettingsName').textContent = p.name;
  $('#profileSettingsSub').textContent = `${p.email} · ${sourceCount} allowed sites`;
}

profileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileMenu.classList.toggle('is-open');
});
document.addEventListener('click', () => profileMenu.classList.remove('is-open'));
profileMenu.addEventListener('click', (e) => e.stopPropagation());

$$('[data-switch]').forEach(opt => {
  opt.addEventListener('click', () => {
    const next = opt.dataset.switch;
    if (next === currentProfile) { profileMenu.classList.remove('is-open'); return; }
    currentProfile = next;
    profileMenu.classList.remove('is-open');
    // Reset any per-profile UI state
    collapsedGroups.clear();
    renderProfileChrome();
    renderInbox();
    renderSources();
    renderStats();
    renderCompact();
    updateModeExamples();
    const p = profile();
    showBanner({
      icon: '↻', text: `Switched to ${p.name}`,
      sub: `Now showing notifications for ${p.email}`
    });
  });
});

$('#switchProfileFromSettings')?.addEventListener('click', () => {
  profileMenu.classList.add('is-open');
});

/* =========================================================
   Cross-cutting: keep compact in sync with state changes
   ========================================================= */
function renderAll() {
  renderInbox();
  renderSources();
  renderStats();
  renderCompact();
}

/* Hook compact re-render + mode examples into every state change */
const _renderInbox = renderInbox;
const _renderSources = renderSources;
renderInbox = function() { _renderInbox(); renderCompact(); updateModeExamples(); };
renderSources = function() { _renderSources(); renderCompact(); updateModeExamples(); };

/* Initial render */
renderProfileChrome();
renderInbox();
renderSources();
renderStats();
renderCompact();
updateModeExamples();
updateStatsVisibility();
