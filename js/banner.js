/* =========================================================
   Banner
   ========================================================= */
function showBanner({ icon, text, sub, undo }) {
  const b = $('#banner');
  $('#bannerIcon').textContent = icon;
  $('#bannerText').textContent = text;
  $('#bannerSub').textContent  = sub;
  b.classList.add('is-on');
  undoSnapshot = undo || null;
  $('#bannerUndo').style.display = undo ? '' : 'none';
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(hideBanner, 4800);
}
function hideBanner() {
  $('#banner').classList.remove('is-on');
  undoSnapshot = null;
}
