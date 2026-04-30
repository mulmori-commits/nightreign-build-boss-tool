// ===== 耐性記号の変換 =====
function resistClass(symbol) {
  switch(symbol) {
    case '◎': return 'chip-great';
    case '◯': return 'chip-good';
    case '－': return 'chip-normal';
    case '△': return 'chip-weak';
    case '✕': return 'chip-immune';
    default:   return 'chip-normal';
  }
}

function resistLabel(symbol) {
  switch(symbol) {
    case '◎': return '◎ 弱点';
    case '◯': return '◯';
    case '－': return '－';
    case '△': return '△';
    case '✕': return '✕';
    default:   return symbol || '－';
  }
}

const ATTR_LABELS    = ['物理','打撃','斬撃','刺突','魔力','炎','雷','聖'];
const AILMENT_LABELS = ['出血','毒','腐敗','凍傷','睡眠','発狂'];
const ATTR_KEYS      = ['物理耐性','打撃耐性','斬撃耐性','刺突耐性','魔力耐性','炎耐性','雷耐性','聖耐性'];
const AILMENT_KEYS   = ['出血耐性','毒耐性','腐敗耐性','凍傷耐性','睡眠耐性','発狂耐性'];

// ===== 耐性チップ生成 =====
function buildResistChips(boss, keys, labels) {
  return keys.map((key, i) => {
    const val = boss[key] || '－';
    return `<span class="resist-chip ${resistClass(val)}" title="${labels[i]}">${labels[i]} ${val}</span>`;
  }).join('');
}

// ===== 夜の王ページ初期化 =====
let allNightBosses = [];
let allSubBosses   = [];
let allRelations   = [];
let currentNightFilter = 'all';

function initBossPage() {
  allNightBosses = DB.夜の王  || [];
  allSubBosses   = DB.サブボス || [];
  allRelations   = DB.夜の王_サブボス || [];

  renderNightBosses();
  renderNarrowTool();
  renderFieldBosses();
}

// ===== 夜の王一覧 =====
function filterNight(cat, btn) {
  currentNightFilter = cat;
  document.querySelectorAll('#nightFilter .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderNightBosses();
}

function renderNightBosses() {
  const grid = document.getElementById('nightBossGrid');
  // 名前でグループ化（フェーズ違いをまとめる）
  const grouped = {};
  allNightBosses.forEach(b => {
    if (currentNightFilter !== 'all' && b['カテゴリ'] !== currentNightFilter) return;
    const key = b['名前'];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });

  grid.innerHTML = Object.entries(grouped).map(([name, phases]) => {
    const first = phases[0];
    const cat = first['カテゴリ'] || 'Main';
    const chips = buildResistChips(first, ATTR_KEYS, ATTR_LABELS);

    return `
      <div class="boss-card" onclick="showNightBossDetail('${name.replace(/'/g,"\\'")}')">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <h3>${name}</h3>
          <span class="badge badge-${cat.toLowerCase()}">${cat}</span>
        </div>
        <div class="resist-row">${chips}</div>
        ${first['特殊弱点'] ? `<div class="text-small text-muted" style="margin-top:6px;">⚡ ${first['特殊弱点']}</div>` : ''}
      </div>
    `;
  }).join('');
}

// ===== 夜の王詳細モーダル =====
function showNightBossDetail(name) {
  const phases = allNightBosses.filter(b => b['名前'] === name);
  if (!phases.length) return;

  const first = phases[0];
  const cat = first['カテゴリ'] || 'Main';

  // 道中ボス取得
  const relIds = allRelations
    .filter(r => phases.some(p => p['ボスID'] === r['夜の王ID']))
    .map(r => ({ sbId: r['サブボスID'], day: r['出現日'] }));

  const day1 = relIds.filter(r => String(r.day) === '1')
    .map(r => allSubBosses.find(s => s['サブボスID'] === r.sbId))
    .filter(Boolean);
  const day2 = relIds.filter(r => String(r.day) === '2')
    .map(r => allSubBosses.find(s => s['サブボスID'] === r.sbId))
    .filter(Boolean);

  let html = `
    <h2>${name} <span class="badge badge-${cat.toLowerCase()}">${cat}</span></h2>
  `;

  // フェーズごとの耐性テーブル
  phases.forEach(phase => {
    const phaseLabel = phase['フェーズ'] ? `<span class="text-small text-muted">（${phase['フェーズ']}）</span>` : '';
    html += `
      <div style="margin-bottom:12px;">
        ${phaseLabel}
        <table class="resist-table">
          <thead>
            <tr>
              ${ATTR_LABELS.map(l => `<th>${l}</th>`).join('')}
              ${AILMENT_LABELS.map(l => `<th>${l}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              ${ATTR_KEYS.map(k => {
                const v = phase[k] || '－';
                return `<td class="${resistClass(v)}">${v}</td>`;
              }).join('')}
              ${AILMENT_KEYS.map(k => {
                const v = phase[k] || '－';
                return `<td class="${resistClass(v)}">${v}</td>`;
              }).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;
  });

  if (first['特殊弱点']) {
    html += `<div class="card" style="margin-bottom:10px;">⚡ <strong>特殊弱点：</strong>${first['特殊弱点']}</div>`;
  }
  if (first['備考']) {
    html += `<div class="card" style="margin-bottom:10px;">📝 ${first['備考']}</div>`;
  }

  // 道中ボス
  if (day1.length || day2.length) {
    html += `<div class="section-title" style="margin-top:12px;">道中ボス候補</div>`;
    if (day1.length) {
      html += `<div class="text-small text-muted" style="margin-bottom:6px;">1日目</div>`;
      html += `<div class="resist-row" style="margin-bottom:10px;">
        ${[...new Set(day1.map(s => s['名前']))].map(n =>
          `<span class="resist-chip chip-normal" onclick="showSubBossDetail('${n.replace(/'/g,"\\'")}'); event.stopPropagation();" style="cursor:pointer;">${n}</span>`
        ).join('')}
      </div>`;
    }
    if (day2.length) {
      html += `<div class="text-small text-muted" style="margin-bottom:6px;">2日目</div>`;
      html += `<div class="resist-row">
        ${[...new Set(day2.map(s => s['名前']))].map(n =>
          `<span class="resist-chip chip-normal" onclick="showSubBossDetail('${n.replace(/'/g,"\\'")}'); event.stopPropagation();" style="cursor:pointer;">${n}</span>`
        ).join('')}
      </div>`;
    }
  }

  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('show');
}

// ===== サブボス詳細モーダル =====
function showSubBossDetail(name) {
  const phases = allSubBosses.filter(b => b['名前'] === name);
  if (!phases.length) return;

  const first = phases[0];
  let html = `<h2>${name}</h2>`;

  phases.forEach(phase => {
    const phaseLabel = phase['フェーズ'] ? `<span class="text-small text-muted">（${phase['フェーズ']}）</span>` : '';
    html += `
      <div style="margin-bottom:12px;">
        ${phaseLabel}
        <table class="resist-table">
          <thead>
            <tr>
              ${ATTR_LABELS.map(l => `<th>${l}</th>`).join('')}
              ${['血','毒','腐','冷','眠'].map(l => `<th>${l}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              ${ATTR_KEYS.map(k => {
                const v = phase[k] || '－';
                return `<td class="${resistClass(v)}">${v}</td>`;
              }).join('')}
              ${['血','毒','腐','冷','眠'].map(k => {
                const v = phase[k] || '－';
                return `<td class="${resistClass(v)}">${v}</td>`;
              }).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;
  });

  if (first['備考']) {
    html += `<div class="card">📝 ${first['備考']}</div>`;
  }

  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('show');
}

// ===== 3日目絞り込みツール =====
let selected1 = null;
let selected2 = null;

function renderNarrowTool() {
  const day1Bosses = allSubBosses.filter(b =>
    b['ボス種別'] === '道中' && String(b['出現日']).includes('1') && !b['フェーズ']
  );
  const day2Bosses = allSubBosses.filter(b =>
    b['ボス種別'] === '道中' && String(b['出現日']).includes('2') && !b['フェーズ']
  );

  const mainDay1 = day1Bosses.filter(b => b['グループ'] === '夜ボス' || b['カテゴリ'] !== 'DLC');
  const dlcDay1  = day1Bosses.filter(b => b['グループ'] !== '夜ボス' && b['カテゴリ'] === 'DLC');
  const mainDay2 = day2Bosses.filter(b => b['グループ'] === '夜ボス' || b['カテゴリ'] !== 'DLC');
  const dlcDay2  = day2Bosses.filter(b => b['グループ'] !== '夜ボス' && b['カテゴリ'] === 'DLC');

  document.getElementById('day1Btns').innerHTML = renderBossBtns(mainDay1, dlcDay1, 1);
  document.getElementById('day2Btns').innerHTML = renderBossBtns(mainDay2, dlcDay2, 2);
}

function renderBossBtns(main, dlc, day) {
  let html = main.map(b =>
    `<button class="boss-select-btn" data-name="${b['名前']}" data-day="${day}" onclick="selectBoss(this, ${day})">${b['名前']}</button>`
  ).join('');
  if (dlc.length) {
    html += `<div class="dlc-divider"></div>`;
    html += dlc.map(b =>
      `<button class="boss-select-btn" data-name="${b['名前']}" data-day="${day}" onclick="selectBoss(this, ${day})">${b['名前']}</button>`
    ).join('');
  }
  return html;
}

function selectBoss(btn, day) {
  const name = btn.dataset.name;
  if (day === 1) {
    if (selected1 === name) {
      selected1 = null;
      btn.classList.remove('selected');
    } else {
      document.querySelectorAll('#day1Btns .boss-select-btn').forEach(b => b.classList.remove('selected'));
      selected1 = name;
      btn.classList.add('selected');
    }
  } else {
    if (selected2 === name) {
      selected2 = null;
      btn.classList.remove('selected');
    } else {
      document.querySelectorAll('#day2Btns .boss-select-btn').forEach(b => b.classList.remove('selected'));
      selected2 = name;
      btn.classList.add('selected');
    }
  }
  updateCandidates();
}

function updateCandidates() {
  const list   = document.getElementById('candidateList');
  const badge  = document.getElementById('candidateCount');

  // 夜の王ごとに道中ボス候補をチェック
  const nightBossNames = [...new Set(allNightBosses.map(b => b['名前']))];

  const results = nightBossNames.filter(name => {
    const phases = allNightBosses.filter(b => b['名前'] === name);
    const bossIds = phases.map(p => p['ボスID']);
    const rels = allRelations.filter(r => bossIds.includes(r['夜の王ID']));

    if (selected1) {
      const sb = allSubBosses.find(s => s['名前'] === selected1);
      if (!sb) return false;
      const match = rels.some(r => r['サブボスID'] === sb['サブボスID'] && String(r['出現日']) === '1');
      if (!match) return false;
    }
    if (selected2) {
      const sb = allSubBosses.find(s => s['名前'] === selected2);
      if (!sb) return false;
      const match = rels.some(r => r['サブボスID'] === sb['サブボスID'] && String(r['出現日']) === '2');
      if (!match) return false;
    }
    return true;
  });

  badge.textContent = `候補: ${results.length}`;
  if (results.length === 0) {
    list.innerHTML = '<li class="no-result">条件に一致するボスはいません</li>';
  } else {
    list.innerHTML = results.map(name =>
      `<li onclick="showNightBossDetail('${name.replace(/'/g,"\\'")}') "style="cursor:pointer;">${name}</li>`
    ).join('');
  }
}

function resetNarrow() {
  selected1 = null;
  selected2 = null;
  document.querySelectorAll('.boss-select-btn').forEach(b => b.classList.remove('selected'));
  updateCandidates();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== フィールドボス =====
function renderFieldBosses(filter) {
  const list = document.getElementById('fieldList');
  const q = filter ? filter.toLowerCase() : '';
  const bosses = allSubBosses.filter(b =>
    b['ボス種別'] === 'フィールド' &&
    (!q || b['名前'].toLowerCase().includes(q))
  );

  // 名前でユニーク化
  const unique = [];
  const seen = new Set();
  bosses.forEach(b => {
    if (!seen.has(b['名前'])) {
      seen.add(b['名前']);
      unique.push(b);
    }
  });

  list.innerHTML = unique.map(b => `
    <div class="field-card" onclick="showSubBossDetail('${b['名前'].replace(/'/g,"\\'")}')">
      <h4>${b['名前']}</h4>
      <p class="text-small text-muted">${b['前哨戦'] || b['備考'] || ''}</p>
    </div>
  `).join('');
}

function filterField() {
  const q = document.getElementById('fieldSearch').value;
  renderFieldBosses(q);
}

// ===== タブ切り替え =====
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  event.target.classList.add('active');
  location.hash = tab === 'night' ? '' : tab;
}

// ===== モーダル =====
function closeModal(e) {
  if (e.target === document.getElementById('modalOverlay')) {
    document.getElementById('modalOverlay').classList.remove('show');
  }
}
function closeModalBtn() {
  document.getElementById('modalOverlay').classList.remove('show');
}
