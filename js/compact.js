/* =========================================================
   Compact widget
   ========================================================= */
function renderCompact() {
  const list = $('#compactList');
  const POOL = notifsForProfile();
  const visible = POOL
    .filter(n => !sourceState[n.src]?.revoked && !sourceState[n.src]?.paused)
    .slice(0, 3);

  const unread = POOL.filter(n => n.unread && !sourceState[n.src]?.revoked).length;
  const uniqueSrc = new Set(POOL.filter(n => n.unread && !sourceState[n.src]?.revoked).map(n => n.src)).size;

  // Header text + badge
  const badge = $('#compactBadge');
  const sub = $('#compactSub');
  if (unread === 0) {
    badge.textContent = 'All caught up';
    badge.style.background = 'var(--green-soft)';
    badge.style.color = 'var(--green)';
    sub.textContent = 'No new notifications';
  } else {
    badge.textContent = unread + ' new';
    badge.style.background = 'var(--orange-soft)';
    badge.style.color = 'var(--orange)';
    sub.textContent = `${unread} new from ${uniqueSrc} site${uniqueSrc === 1 ? '' : 's'}`;
  }

  if (visible.length === 0) {
    list.innerHTML = `
      <div class="compact__empty">
        <div class="big">✦</div>
        <div class="ttl">You're all caught up</div>
        <div>Nothing waiting for you here.</div>
      </div>`;
    return;
  }

  list.innerHTML = visible.map(n => {
    const s = src(n.src);
    return `
      <div class="cnotif ${n.unread ? 'is-unread' : ''}" data-id="${n.id}">
        <div class="cnotif__icon" style="background:${s.color}">${s.icon}</div>
        <div class="cnotif__body">
          <div class="cnotif__title">${n.title}</div>
          <div class="cnotif__sub"><strong>${s.name}</strong></div>
        </div>
        <div class="cnotif__time">${timeAgo(n.when)}</div>
      </div>`;
  }).join('');

  // Click a compact row → open expanded and mark read
  $$('.cnotif', list).forEach(el => {
    el.addEventListener('click', () => {
      const n = NOTIFS.find(x => x.id === +el.dataset.id);
      if (n) n.unread = false;
      openSidebar();
      renderAll();
    });
  });
}

/* Mini quiet toggle on the compact widget */
$('#miniQuiet').addEventListener('click', () => {
  const isQuiet = $('#miniQuiet').classList.contains('is-quiet');
  if (isQuiet) {
    quietMode = null;
    $('#miniQuiet').classList.remove('is-quiet');
    $('#miniQuietLabel').textContent = 'Receiving';
    $('#quietPulse').classList.add('is-hidden');
    $('#quietPulse').classList.remove('is-quiet');
    $('#quietLabel').textContent = '';
    pauseBtn.classList.remove('is-active');
  } else {
    quietMode = '1h';
    $('#miniQuiet').classList.add('is-quiet');
    $('#miniQuietLabel').textContent = 'Quiet · 1h';
    $('#quietPulse').classList.remove('is-hidden');
    $('#quietPulse').classList.add('is-quiet');
    $('#quietLabel').textContent = `Quiet for 1 hour · resumes at ${fmt(new Date(NOW.getTime() + 60*60*1000))}`;
    pauseBtn.classList.add('is-active');
  }
});
