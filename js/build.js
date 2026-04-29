// ===== ビルドページ初期化 =====
let allBuilds      = [];
let allTags        = [];
let allSubs        = [];
let allSpells      = [];
let allWeapons     = [];
let allSkills      = [];
let allChara       = [];
let buildTagRels   = [];
let buildSubRels   = [];
let buildSpellRels = [];
let currentCharaFilter = 'all';

function initBuildPage() {
  allBuilds      = DB.ビルド            || [];
  allTags        = DB.効果タグ          || [];
  allSubs        = DB.付帯効果          || [];
  allSpells      = DB.魔術祈祷          || [];
  allWeapons     = DB.武器              || [];
  allSkills      = DB.戦技              || [];
  allChara       = DB.キャラ            || [];
  buildTagRels   = DB.ビルド_効果タグ   || [];
  buildSubRels   = DB.ビルド_付帯効果   || [];
  buildSpellRels = DB.ビルド_魔術祈祷   || [];

  renderCharaFilter();
  filterBuilds();
}

// ===== キャラフィルター =====
function renderCharaFilter() {
  const container = document.getElementById('charaFilter');
  const chars = [{ id: 'all', name: '全て' }, ...allChara];

  container.innerHTML = chars.map(c =>
    `<button class="filter-btn ${c.id === 'all' ? 'active' : ''}"
      onclick="setCharaFilter('${c['キャラID'] || c.id}', this)">
      ${c['名前'] || c.name}
    </button>`
  ).join('');
}

function setCharaFilter(charaId, btn) {
  currentCharaFilter = charaId;
  document.querySelectorAll('#charaFilter .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterBuilds();
}

// ===== ビルド絞り込み =====
function filterBuilds() {
  const tagQ = (document.getElementById('tagSearch').value || '').trim().toLowerCase();
  const subQ = (document.getElementById('subSearch').value || '').trim().toLowerCase();

  let filtered = allBuilds.filter(b => b['公開フラグ'] !== false && b['公開フラグ'] !== 'FALSE');

  // キャラフィルター
  if (currentCharaFilter !== 'all') {
    filtered = filtered.filter(b => b['キャラID'] === currentCharaFilter);
  }

  // 効果タグフィルター
  if (tagQ) {
    filtered = filtered.filter(b => {
      const tagIds = buildTagRels
        .filter(r => r['ビルドID'] === b['ビルドID'])
        .map(r => r['タグID']);
      const tagNames = tagIds.map(id => {
        const tag = allTags.find(t => t['タグID'] === id);
        return tag ? (tag['名前'] || '').toLowerCase() : '';
      });
      return tagNames.some(n => n.includes(tagQ));
    });
  }

  // 付帯効果フィルター
  if (subQ) {
    filtered = filtered.filter(b => {
      const subIds = buildSubRels
        .filter(r => r['ビルドID'] === b['ビルドID'])
        .map(r => r['付帯効果ID']);
      const subNames = subIds.map(id => {
        const sub = allSubs.find(s => s['付帯効果ID'] === id);
        return sub ? (sub['名前'] || '').toLowerCase() : '';
      });
      return subNames.some(n => n.includes(subQ));
    });
  }

  document.getElementById('resultCount').textContent = `${filtered.length} 件のビルド`;
  renderBuilds(filtered);
}

// ===== ビルド一覧描画 =====
function renderBuilds(builds) {
  const grid = document.getElementById('buildGrid');

  if (builds.length === 0) {
    grid.innerHTML = '<div class="no-result-msg">条件に一致するビルドが見つかりません</div>';
    return;
  }

  grid.innerHTML = builds.map(b => {
    const chara = allChara.find(c => c['キャラID'] === b['キャラID']);
    const charaName = chara ? chara['名前'] : b['キャラID'];

    const weapon = allWeapons.find(w => w['武器ID'] === b['武器ID']);
    const weaponName = weapon ? weapon['名前'] : '';

    // 効果タグ（最大3件表示）
    const tagIds = buildTagRels
      .filter(r => r['ビルドID'] === b['ビルドID'])
      .map(r => r['タグID']);
    const tagNames = tagIds.slice(0, 3).map(id => {
      const tag = allTags.find(t => t['タグID'] === id);
      return tag ? tag['名前'] : '';
    }).filter(Boolean);

    return `
      <div class="build-card" onclick="showBuildDetail('${b['ビルドID']}')">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <h3>${b['ビルド名'] || b['ビルドID']}</h3>
          <span class="badge badge-char">${charaName}</span>
        </div>
        <div class="build-meta">
          ${weaponName ? `🗡 ${weaponName}` : ''}
          ${b['投稿者'] ? `　📝 ${b['投稿者']}` : ''}
        </div>
        ${b['説明'] ? `<div class="text-small text-muted">${b['説明'].substring(0, 60)}${b['説明'].length > 60 ? '…' : ''}</div>` : ''}
        ${tagNames.length ? `
          <div class="tag-row">
            ${tagNames.map(n => `<span class="tag-chip">${n}</span>`).join('')}
            ${tagIds.length > 3 ? `<span class="tag-chip">+${tagIds.length - 3}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// ===== ビルド詳細モーダル =====
function showBuildDetail(buildId) {
  const build = allBuilds.find(b => b['ビルドID'] === buildId);
  if (!build) return;

  const chara  = allChara.find(c => c['キャラID'] === build['キャラID']);
  const weapon = allWeapons.find(w => w['武器ID'] === build['武器ID']);
  const skill  = allSkills.find(s => s['戦技ID'] === build['戦技ID']);

  // 魔術祈祷
  const spellIds = buildSpellRels
    .filter(r => r['ビルドID'] === buildId)
    .sort((a, b) => (a['順番'] || 0) - (b['順番'] || 0))
    .map(r => r['魔術祈祷ID']);
  const spellNames = spellIds.map(id => {
    const s = allSpells.find(sp => sp['ID'] === id);
    return s ? s['名前'] : id;
  });

  // 効果タグ
  const tagIds = buildTagRels
    .filter(r => r['ビルドID'] === buildId)
    .map(r => r['タグID']);
  const tagNames = tagIds.map(id => {
    const t = allTags.find(tag => tag['タグID'] === id);
    return t ? t['名前'] : '';
  }).filter(Boolean);

  // 付帯効果
  const subIds = buildSubRels
    .filter(r => r['ビルドID'] === buildId)
    .map(r => r['付帯効果ID']);
  const subNames = subIds.map(id => {
    const s = allSubs.find(sub => sub['付帯効果ID'] === id);
    return s ? s['名前'] : '';
  }).filter(Boolean);

  let html = `
    <h2>${build['ビルド名'] || buildId}</h2>

    <div class="detail-row">
      <span class="detail-label">キャラ</span>
      <span class="detail-value">
        <span class="badge badge-char">${chara ? chara['名前'] : build['キャラID']}</span>
      </span>
    </div>
  `;

  if (weapon) {
    html += `
      <div class="detail-row">
        <span class="detail-label">武器</span>
        <span class="detail-value">${weapon['名前']}
          <span class="text-small text-muted">（${weapon['種別']} / ${weapon['攻撃属性'] || '物理'}）</span>
        </span>
      </div>
    `;
  }

  if (skill) {
    html += `
      <div class="detail-row">
        <span class="detail-label">戦技</span>
        <span class="detail-value">${skill['名前']}</span>
      </div>
    `;
  }

  if (spellNames.length) {
    html += `
      <div class="detail-row">
        <span class="detail-label">魔術・祈祷</span>
        <span class="detail-value">${spellNames.join('　/　')}</span>
      </div>
    `;
  }

  if (build['説明']) {
    html += `
      <div class="detail-row">
        <span class="detail-label">説明</span>
        <span class="detail-value">${build['説明']}</span>
      </div>
    `;
  }

  if (tagNames.length) {
    html += `
      <div class="detail-row">
        <span class="detail-label">遺物効果</span>
        <span class="detail-value">
          <div class="tag-row">
            ${tagNames.map(n => `<span class="tag-chip">${n}</span>`).join('')}
          </div>
        </span>
      </div>
    `;
  }

  if (subNames.length) {
    html += `
      <div class="detail-row">
        <span class="detail-label">推奨付帯</span>
        <span class="detail-value">
          <div class="tag-row">
            ${subNames.map(n => `<span class="sub-chip">${n}</span>`).join('')}
          </div>
        </span>
      </div>
    `;
  }

  if (build['投稿者'] || build['投稿日']) {
    html += `
      <div class="text-small text-muted" style="margin-top:12px; text-align:right;">
        ${build['投稿者'] ? `by ${build['投稿者']}` : ''}
        ${build['投稿日'] ? `　${build['投稿日']}` : ''}
      </div>
    `;
  }

  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('show');
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
