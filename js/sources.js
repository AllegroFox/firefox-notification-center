/* =========================================================
   Render: sources
   ========================================================= */

let sourceSort = 'recent';

function renderSources() {
  const list = $('#sourceList');
  let arr = sourcesForProfile().filter(s => !sourceState[s.id].revoked).slice();
  if (sourceSort === 'loud') {
    arr.sort((a,b) => b.weekly - a.weekly);
  } else if (sourceSort === 'dormant') {
    arr = arr.filter(s => s.status === 'dormant');
  } // recent = stable order

  $('#sourceCount').textContent = arr.length;
  $('#tabSourceCount').textContent = arr.length;

  let html = '';
  for (const s of arr) {
    const st = sourceState[s.id];
    const rate = s.weekly === 0 ? 0 : Math.round(100 * s.opened / s.weekly);
    const flag = s.status === 'dormant' && !st.paused;
    const barClass = rate < 15 ? 'is-low' : rate < 50 ? 'is-mid' : '';
    html += `
      <div class="ssource ${flag ? 'is-flagged' : ''} ${st.paused ? 'is-paused' : ''}" data-id="${s.id}">
        <div class="ssource__icon" style="background:${s.color}">${s.icon}</div>
        <div>
          <div class="ssource__name">
            <span>${s.name}</span>
            ${flag ? '<span class="pill pill--dormant">Dormant</span>' : ''}
            ${st.paused ? '<span class="pill pill--paused">Paused</span>' : ''}
            ${(!flag && !st.paused && rate >= 50) ? '<span class="pill pill--healthy">Active</span>' : ''}
          </div>
          <div class="ssource__stats">
            ${s.weekly} this week · opened ${s.opened} (${rate}%)
          </div>
          <div class="ssource__bar ${barClass}"><i style="width:${Math.max(rate, 3)}%"></i></div>
        </div>
        <div class="ssource__actions">
          <button class="tswitch ${st.paused ? '' : 'is-on'}" data-act="toggle" title="${st.paused ? 'Resume' : 'Pause'} notifications"></button>
          <button class="btn btn--ghost btn--icon btn--danger" data-act="revoke" title="Revoke permission">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
          </button>
        </div>
      </div>`;
  }
  if (arr.length === 0) {
    html = `<div class="empty" style="padding:32px 12px;"><div class="empty__big">✓</div><div class="empty__title">No sources to review</div><div class="empty__hint">All your senders are healthy.</div></div>`;
  }
  list.innerHTML = html;

  $$('.ssource', list).forEach(el => {
    const id = el.dataset.id;
    el.querySelector('[data-act="toggle"]')?.addEventListener('click', () => togglePause(id));
    el.querySelector('[data-act="revoke"]')?.addEventListener('click', () => revokeSource(id, el));
  });
}

function togglePause(id) {
  const s = sourceState[id];
  s.paused = !s.paused;
  renderSources();
  renderInbox();
  showBanner({
    icon: s.paused ? '⏸' : '▶',
    text: `${src(id).name} ${s.paused ? 'paused' : 'resumed'}`,
    sub: s.paused ? 'You won\'t see their notifications until you turn them back on.' : 'Receiving normally.',
    undo: () => { s.paused = !s.paused; renderSources(); renderInbox(); }
  });
}

function revokeSource(id, el) {
  el.classList.add('is-revoking');
  setTimeout(() => {
    sourceState[id].revoked = true;
    renderSources();
    renderInbox();
    renderStats();
    showBanner({
      icon: '↶',
      text: `Revoked permission for ${src(id).name}`,
      sub: 'They can\'t notify you anymore. You can re-allow from Settings.',
      undo: () => { sourceState[id].revoked = false; renderSources(); renderInbox(); renderStats(); }
    });
  }, 360);
}
