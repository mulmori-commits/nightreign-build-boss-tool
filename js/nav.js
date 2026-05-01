// ===== ナビゲーションメニュー =====
function toggleNavMenu() {
  const btn      = document.getElementById('navMenuBtn');
  const dropdown = document.getElementById('navDropdown');
  const isOpen   = dropdown.classList.contains('show');
  if (isOpen) {
    dropdown.classList.remove('show');
    btn.classList.remove('open');
  } else {
    dropdown.classList.add('show');
    btn.classList.add('open');
  }
}

// メニュー外クリックで閉じる
document.addEventListener('click', function(e) {
  const wrap = document.getElementById('navMenuWrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('navDropdown')?.classList.remove('show');
    document.getElementById('navMenuBtn')?.classList.remove('open');
  }
});

// ===== データ再読み込み =====
async function reloadDB() {
  const btn = document.getElementById('reloadBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = '⟳';
  btn.style.animation = 'spin 0.8s linear infinite';

  clearDBCache();
  try {
    await initDB();
    btn.style.animation = '';
    btn.textContent = '↺';
    btn.disabled = false;
    // ページを再初期化
    if (typeof initBossPage  === 'function') initBossPage();
    if (typeof initBuildPage === 'function') initBuildPage();
  } catch(e) {
    btn.style.animation = '';
    btn.textContent = '↺';
    btn.disabled = false;
  }
}
