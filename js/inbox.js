/* =========================================================
   Render: inbox
   ========================================================= */

let activeFilter = 'all';
let hideMuted = false;
let activeMode = 'standard'; // calm | standard | focus
let groupMode = 'source';    // source | category | none
let showPreviews = true;
const collapsedGroups = new Set();

/* Mode-aware filter — applies on top of activeFilter */
const FOCUS_SOURCES = new Set(['slack-p', 'slack-w', 'gh-p', 'gh-w', 'linear', 'gcal']);
function modeFilter(n) {
  const s = src(n.src);
  if (activeMode === 'calm') {
    // Only sources you actually engage with (>= 30% open rate)
    const rate = s.weekly ? s.opened / s.weekly : 0;
    return rate >= 0.3;
  }
  if (activeMode === 'focus') {
    // Critical only — messaging, code review, calendar
    return FOCUS_SOURCES.has(s.id);
  }
  return true; // standard
}

function renderInbox() {
  const host = $('#groupedInbox');
  const POOL = notifsForProfile();

  // Apply user filters + mode filter
  const allVisible = POOL.filter(n => {
    if (sourceState[n.src]?.revoked) return false;
    if (hideMuted && sourceState[n.src]?.paused) return false;
    if (activeFilter === 'unread') return n.unread;
    if (activeFilter === 'today')  return (NOW - n.when) / 3600000 < 24;
    if (activeFilter === 'flagged') return src(n.src).status === 'dormant';
    return true;
  });
  const filtered = allVisible.filter(modeFilter);
  const hiddenByMode = allVisible.length - filtered.length;

  // Update counters
  $('#tabRecentCount').textContent = filtered.length;
  const unread = POOL.filter(n => n.unread && !sourceState[n.src]?.revoked).length;
  $('#unreadCount').textContent = unread;
  $('#newCount').textContent = unread;

  // Mode banner
  const banner = $('#modeBanner');
  if (activeMode !== 'standard' && hiddenByMode > 0) {
    banner.hidden = false;
    const label = activeMode === 'calm' ? 'Calm' : 'Focused';
    $('#modeBannerText').textContent =
      `In ${label} mode · ${hiddenByMode} notification${hiddenByMode === 1 ? '' : 's'} hidden`;
  } else {
    banner.hidden = true;
  }

  // Empty state
  if (filtered.length === 0) {
    host.innerHTML = `
      <div class="empty" style="padding:30px 12px;">
        <div class="empty__big">✦</div>
        <div class="empty__title">You're all caught up</div>
        <div class="empty__hint">${activeMode === 'standard'
          ? 'Nothing in this view. Take a breath — maybe clean up sources while you\'re calm.'
          : `${activeMode === 'calm' ? 'Calm' : 'Focused'} mode is on. Switch to Standard to see the rest.`}</div>
      </div>`;
    return;
  }

  // Group by source, by category, or flat (by date)
  let html = '';
  if (groupMode === 'category') {
    const byCat = new Map();
    filtered.forEach(n => {
      const c = categorize(n);
      if (!c) return;
      if (!byCat.has(c.id)) byCat.set(c.id, []);
      byCat.get(c.id).push(n);
    });
    // Render enabled categories in their configured order; skip empty ones.
    for (const c of CategoryManager.getEnabled()) {
      const items = (byCat.get(c.id) || []).sort((a, b) => b.when - a.when);
      if (!items.length) continue;
      const unreadInGroup = items.filter(n => n.unread).length;
      const isCollapsed = collapsedGroups.has(c.id);
      html += `
        <div class="group ${isCollapsed ? 'is-collapsed' : ''}" data-group="${c.id}">
          <button class="group__head" data-act="toggle-group">
            <svg class="group__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
            <span class="group__icon" style="background:${c.color}">${c.icon}</span>
            <span class="group__name">${c.name}</span>
            <span class="group__count">${items.length}</span>
            ${unreadInGroup ? `<span class="group__new">${unreadInGroup} new</span>` : ''}
          </button>
          <div class="group__items">
            ${items.map(n => snotifHTML(n, true)).join('')}
          </div>
        </div>`;
    }
  } else if (groupMode === 'source') {
    const bySrc = {};
    filtered.forEach(n => { (bySrc[n.src] = bySrc[n.src] || []).push(n); });
    // Order: groups with most unread first, then most recent
    const order = Object.keys(bySrc).sort((a, b) => {
      const ua = bySrc[a].filter(n => n.unread).length;
      const ub = bySrc[b].filter(n => n.unread).length;
      if (ub !== ua) return ub - ua;
      return bySrc[b][0].when - bySrc[a][0].when;
    });
    for (const srcId of order) {
      const items = bySrc[srcId].sort((a, b) => b.when - a.when);
      const s = src(srcId);
      const unreadInGroup = items.filter(n => n.unread).length;
      const isCollapsed = collapsedGroups.has(srcId);
      html += `
        <div class="group ${isCollapsed ? 'is-collapsed' : ''}" data-group="${srcId}">
          <button class="group__head" data-act="toggle-group">
            <svg class="group__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
            <span class="group__icon" style="background:${s.color}">${s.icon}</span>
            <span class="group__name">${s.name}</span>
            <span class="group__count">${items.length}</span>
            ${unreadInGroup ? `<span class="group__new">${unreadInGroup} new</span>` : ''}
            <span class="group__actions">
              <span class="notif__action" data-act="mute-group" title="Mute ${s.name}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a4 4 0 0 1-8 0M5 21l14-14"/></svg>
              </span>
            </span>
          </button>
          <div class="group__items">
            ${items.map(n => snotifHTML(n)).join('')}
          </div>
        </div>`;
    }
  } else {
    // Flat by date
    const bucket = {};
    filtered.forEach(n => { (bucket[dateGroup(n.when)] = bucket[dateGroup(n.when)] || []).push(n); });
    for (const [label, items] of Object.entries(bucket)) {
      html += `<div class="group__label" style="font-size:11px;color:var(--text-muted);letter-spacing:.06em;text-transform:uppercase;padding:10px 4px 4px;">${label}</div>`;
      html += items.map(n => snotifHTML(n, true)).join('');
    }
  }
  host.innerHTML = html;

  // Wire interactions
  $$('.snotif', host).forEach(el => {
    const id = +el.dataset.id;
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-act]')) return;
      const n = NOTIFS.find(x => x.id === id);
      if (n) { n.unread = false; n.isNew = false; renderInbox(); renderStats(); }
    });
    el.querySelector('[data-act="dismiss"]')?.addEventListener('click', (e) => {
      e.stopPropagation(); dismissNotif(id, el);
    });
    el.querySelector('[data-act="mute"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const n = NOTIFS.find(x => x.id === id);
      if (n) togglePause(n.src);
    });
  });
  $$('.group', host).forEach(g => {
    g.querySelector('[data-act="toggle-group"]')?.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="mute-group"]')) return;
      const key = g.dataset.group;
      if (collapsedGroups.has(key)) collapsedGroups.delete(key);
      else collapsedGroups.add(key);
      g.classList.toggle('is-collapsed');
    });
    g.querySelector('[data-act="mute-group"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePause(g.dataset.group);
    });
  });
}

function snotifHTML(n, showSourceLabel = false) {
  const s = src(n.src);
  const muted = sourceState[n.src]?.paused;
  return `
    <div class="snotif ${n.unread ? 'is-unread' : ''} ${n.isNew ? 'is-new' : ''}" data-id="${n.id}">
      <div>
        <div class="snotif__title">${showSourceLabel ? `<strong>${s.name}</strong> · ` : ''}${n.title}</div>
        ${showPreviews ? `<div class="snotif__preview">${n.preview}</div>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:4px;">
        <span class="snotif__time">${timeAgo(n.when)}${muted ? ' · muted' : ''}</span>
        <button class="notif__action" data-act="dismiss" title="Dismiss">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
    </div>`;
}

function dismissNotif(id, el) {
  el.classList.add('is-dismissing');
  const removed = NOTIFS.find(n => n.id === id);
  setTimeout(() => {
    NOTIFS = NOTIFS.filter(n => n.id !== id);
    renderInbox();
    renderStats();
    showBanner({
      icon: '✓',
      text: 'Notification dismissed',
      sub: `From ${src(removed.src).name}`,
      undo: () => { NOTIFS.push(removed); NOTIFS.sort((a,b) => b.when - a.when); renderInbox(); renderStats(); }
    });
  }, 280);
}
