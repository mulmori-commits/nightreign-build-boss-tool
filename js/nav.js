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
