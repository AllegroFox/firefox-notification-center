/* =========================================================
   Stats
   ========================================================= */
function renderStats() {
  const POOL = notifsForProfile();
  const active = sourcesForProfile().filter(s => !sourceState[s.id].revoked);
  const total = active.reduce((sum, s) => sum + s.weekly, 0);
  const opened = active.reduce((sum, s) => sum + s.opened, 0);
  const dormant = active.filter(s => s.status === 'dormant').length;
  $('#statTotal').textContent = total;
  $('#statSites').textContent = active.length;
  $('#statOpened').textContent = opened;
  $('#statDormant').textContent = dormant;
  $('#srcCount').textContent = new Set(POOL.filter(n => n.unread).map(n => n.src)).size;
  $('#openRate').textContent = total === 0 ? '—' : Math.round(100 * opened / total) + '%';
}
