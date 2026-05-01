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

// ===== 耐性テーブル生成 =====
function buildResistTable(phase) {
  return `
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
  `;
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
  closeDetail();
  renderNightBosses();
}

function renderNightBosses() {
  const grid = document.getElementById('nightBossGrid');
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
    const safeName = name.replace(/'/g, "\\'");

    return `
      <div class="boss-card" data-name="${name.replace(/"/g,'&quot;')}"
           onclick="showNightBossDetail('${safeName}')">
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

// ===== 夜の王詳細（インラインパネル） =====
function showNightBossDetail(name) {
  // 同じカードをクリックしたら閉じる
  const isSame = document.querySelector(`.boss-card[data-name="${name.replace(/"/g,'&quot;')}"]`)?.classList.contains('active-card');
  if (isSame) {
    closeDetail();
    return;
  }

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

  let html = `<h2 style="color:#8bc34a; font-size:1.1em; margin-bottom:12px; padding-right:24px;">
    ${name} <span class="badge badge-${cat.toLowerCase()}">${cat}</span>
  </h2>`;

  phases.forEach(phase => {
    const phaseLabel = phase['フェーズ']
      ? `<div class="text-small text-muted" style="margin-bottom:4px;">（${phase['フェーズ']}）</div>`
      : '';
    html += `<div style="margin-bottom:12px;">${phaseLabel}${buildResistTable(phase)}</div>`;
  });

  if (first['特殊弱点']) {
    html += `<div class="card" style="margin-bottom:10px;">⚡ <strong>特殊弱点：</strong>${first['特殊弱点']}</div>`;
  }
  if (first['対処法']) {
    html += `<div class="card" style="margin-bottom:10px;">💡 <strong>対処法：</strong>${first['対処法']}</div>`;
  }
  if (first['備考']) {
    html += `<div class="card" style="margin-bottom:10px;">📝 ${first['備考']}</div>`;
  }

  if (day1.length || day2.length) {
    html += `<div class="section-title" style="margin-top:12px;">道中ボス候補</div>`;
    if (day1.length) {
      html += `<div class="text-small text-muted" style="margin-bottom:6px;">1日目</div>
        <div class="resist-row" style="margin-bottom:10px;">
          ${[...new Set(day1.map(s => s['名前']))].map(n =>
            `<span class="resist-chip chip-normal"
              onclick="showSubBossDetail('${n.replace(/'/g,"\\'")}'); event.stopPropagation();"
              style="cursor:pointer;">${n}</span>`
          ).join('')}
        </div>`;
    }
    if (day2.length) {
      html += `<div class="text-small text-muted" style="margin-bottom:6px;">2日目</div>
        <div class="resist-row">
          ${[...new Set(day2.map(s => s['名前']))].map(n =>
            `<span class="resist-chip chip-normal"
              onclick="showSubBossDetail('${n.replace(/'/g,"\\'")}'); event.stopPropagation();"
              style="cursor:pointer;">${n}</span>`
          ).join('')}
        </div>`;
    }
  }

  document.getElementById('nightBossDetailBody').innerHTML = html;
  const panel = document.getElementById('nightBossDetail');
  panel.classList.remove('hidden');

  document.querySelectorAll('.boss-card').forEach(c => {
    c.classList.toggle('active-card', c.dataset.name === name);
  });

  setTimeout(() => {
    const top = panel.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 50);
}

function closeDetail() {
  document.getElementById('nightBossDetail').classList.add('hidden');
  document.querySelectorAll('.boss-card').forEach(c => c.classList.remove('active-card'));
}

// ===== サブボス詳細モーダル =====
function showSubBossDetail(name) {
  const phases = allSubBosses.filter(b => b['名前'] === name);
  if (!phases.length) return;

  const first = phases[0];
  let html = `<h2>${name}</h2>`;

  phases.forEach(phase => {
    const phaseLabel = phase['フェーズ']
      ? `<div class="text-small text-muted" style="margin-bottom:4px;">（${phase['フェーズ']}）</div>`
      : '';
    html += `<div style="margin-bottom:12px;">${phaseLabel}${buildResistTable(phase)}</div>`;
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

// 旧ツールのBOSS_DATAをそのまま使用（略称で管理）
const NARROW_BOSS_DATA = {
  'グラディウス': { day1: ['亜人', '鈴玉狩り'], day2: ['忌み鬼', 'ツリガ'] },
  'エデレ': {
    day1: ['貪食ドラゴン', 'ミミズ顔', '英雄のガーゴイル', 'フレイディア', '夜騎兵'],
    day2: ['古竜', '坩堝＆カバ', '僻地の宿将'],
  },
  'グノスター': {
    day1: ['熔鉄デーモン', '戦場の宿将', '百足のデーモン', 'ティビアの呼び舟', '爛れた樹霊'],
    day2: ['大土竜', '竜人兵', '竜ツリ'],
  },
  'マリス': {
    day1: ['貪食ドラゴン', 'ミミズ顔', '英雄のガーゴイル', '熔鉄デーモン', '接ぎ木の君主'],
    day2: ['ツリガ', '降る星の成獣', '神肌のふたり'],
  },
  'リブラ': {
    day1: ['フレイディア', '戦場の宿将', '百足のデーモン', 'ティビアの呼び舟', '幽鬼'],
    day2: ['坩堝＆カバ', '神肌のふたり', '死儀礼の鳥'],
  },
  'フルゴール': {
    day1: ['貪食ドラゴン', 'ミミズ顔', '夜騎兵', '戦場の宿将', '百足のデーモン', '幽鬼'],
    day2: ['僻地の宿将', '竜人兵', '無名の王'],
  },
  'カリゴ': {
    day1: ['フレイディア', '熔鉄デーモン', 'ティビアの呼び舟', '爛れた樹霊', '接ぎ木の君主'],
    day2: ['竜ツリ', '神肌のふたり', '踊り子'],
  },
  'ナメレス': {
    day1: ['亜人', '鈴玉狩り', '貪食ドラゴン', 'ミミズ顔', '英雄のガーゴイル', 'フレイディア', '夜騎兵', '熔鉄デーモン', '戦場の宿将', '百足のデーモン', 'ティビアの呼び舟', '爛れた樹霊', '接ぎ木の君主', '幽鬼'],
    day2: ['忌み鬼', 'ツリガ', '古竜', '坩堝＆カバ', '僻地の宿将', '大土竜', '竜人兵', '竜ツリ', '降る星の成獣', '神肌のふたり', '死儀礼の鳥', '無名の王', '踊り子'],
  },
  'ハルモニア': {
    day1: ['傷＆うろ底', '呪剣士＆神獣'],
    day2: ['デーモンの王子', '血の君主'],
  },
  'ストラゲス': {
    day1: ['大赤熊', '死の騎士'],
    day2: ['獅子舞', 'アルトリウス'],
  },
};

// 略称→夜の王正式名のマップ（詳細パネル表示用）
const NARROW_NIGHT_NAME = {
  'グラディウス': '夜の獣、グラディウス',
  'エデレ':       '夜の爵、エデレ',
  'グノスター':   '夜の識、グノスター',
  'マリス':       '深海の夜、マリス',
  'リブラ':       '夜の魔、リブラ',
  'フルゴール':   '夜光の騎士、フルゴール',
  'カリゴ':       '夜の霞、カリゴ',
  'ナメレス':     '夜の王、ナメレス',
  'ハルモニア':   '英雄武器の娘たち、ハルモニア',
  'ストラゲス':   '反逆のストラゲス',
};

const NARROW_GROUPS_DAY1 = {
  main: ['亜人', '英雄のガーゴイル', '鈴玉狩り', '戦場の宿将', '爛れた樹霊', '接ぎ木の君主', 'ティビアの呼び舟', '貪食ドラゴン', 'フレイディア', 'ミミズ顔', '百足のデーモン', '夜騎兵', '幽鬼', '熔鉄デーモン'],
  dlc:  ['傷＆うろ底', '呪剣士＆神獣', '大赤熊', '死の騎士'],
};
const NARROW_GROUPS_DAY2 = {
  main: ['忌み鬼', '踊り子', '大土竜', '神肌のふたり', '古竜', '死儀礼の鳥', '僻地の宿将', 'ツリガ', '降る星の成獣', '無名の王', '坩堝＆カバ', '竜人兵', '竜ツリ'],
  dlc:  ['デーモンの王子', '血の君主', '獅子舞', 'アルトリウス'],
};

function renderNarrowTool() {
  const day1Html = NARROW_GROUPS_DAY1.main.map(name =>
    `<button class="boss-select-btn" data-name="${name}" onclick="selectBoss(this, 1)">${name}</button>`
  ).join('') +
  `<div class="dlc-divider"></div>` +
  NARROW_GROUPS_DAY1.dlc.map(name =>
    `<button class="boss-select-btn" data-name="${name}" onclick="selectBoss(this, 1)">${name}</button>`
  ).join('');

  const day2Html = NARROW_GROUPS_DAY2.main.map(name =>
    `<button class="boss-select-btn" data-name="${name}" onclick="selectBoss(this, 2)">${name}</button>`
  ).join('') +
  `<div class="dlc-divider"></div>` +
  NARROW_GROUPS_DAY2.dlc.map(name =>
    `<button class="boss-select-btn" data-name="${name}" onclick="selectBoss(this, 2)">${name}</button>`
  ).join('');

  document.getElementById('day1Btns').innerHTML = day1Html;
  document.getElementById('day2Btns').innerHTML = day2Html;
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
  const list  = document.getElementById('candidateList');
  const badge = document.getElementById('candidateCount');

  let results = [];
  for (const [shortName, data] of Object.entries(NARROW_BOSS_DATA)) {
    let ok = true;
    if (selected1 && !data.day1.includes(selected1)) ok = false;
    if (selected2 && !data.day2.includes(selected2)) ok = false;
    if (ok) results.push(shortName);
  }

  badge.textContent = `候補: ${results.length}`;
  if (results.length === 0) {
    list.innerHTML = '<li class="no-result">条件に一致するボスはいません</li>';
  } else {
    list.innerHTML = results.map(shortName => {
      const fullName = NARROW_NIGHT_NAME[shortName] || shortName;
      return `<li onclick="showNightBossDetail('${fullName.replace(/'/g,"\\'")}'); switchTab('night');"
        style="cursor:pointer;">${shortName}</li>`;
    }).join('');
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
let currentFieldType = 'all';
let currentFieldKana = 'all';

const KANA_RANGES = {
  'あ': ['あ','い','う','え','お','ア','イ','ウ','エ','オ'],
  'か': ['か','き','く','け','こ','カ','キ','ク','ケ','コ','が','ぎ','ぐ','げ','ご','ガ','ギ','グ','ゲ','ゴ'],
  'さ': ['さ','し','す','せ','そ','サ','シ','ス','セ','ソ','ざ','じ','ず','ぜ','ぞ','ザ','ジ','ズ','ゼ','ゾ'],
  'た': ['た','ち','つ','て','と','タ','チ','ツ','テ','ト','だ','ぢ','づ','で','ど','ダ','ヂ','ヅ','デ','ド'],
  'な': ['な','に','ぬ','ね','の','ナ','ニ','ヌ','ネ','ノ'],
  'は': ['は','ひ','ふ','へ','ほ','ハ','ヒ','フ','ヘ','ホ','ば','び','ぶ','べ','ぼ','バ','ビ','ブ','ベ','ボ','ぱ','ぴ','ぷ','ぺ','ぽ','パ','ピ','プ','ペ','ポ'],
  'ま': ['ま','み','む','め','も','マ','ミ','ム','メ','モ'],
  'や': ['や','ゆ','よ','ヤ','ユ','ヨ'],
  'ら': ['ら','り','る','れ','ろ','ラ','リ','ル','レ','ロ'],
  'わ': ['わ','を','ん','ワ','ヲ','ン'],
};

// カタカナ→ひらがな変換
function toHiragana(str) {
  return str.replace(/[\u30A1-\u30F6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// ローマ字→かな行マッピング
const ROMAJI_TO_ROW = {
  'a':'あ', 'i':'あ', 'u':'あ', 'e':'あ', 'o':'あ',
  'ka':'か', 'ki':'か', 'ku':'か', 'ke':'か', 'ko':'か',
  'ga':'か', 'gi':'か', 'gu':'か', 'ge':'か', 'go':'か',
  'sa':'さ', 'si':'さ', 'su':'さ', 'se':'さ', 'so':'さ', 'shi':'さ',
  'ta':'た', 'te':'た', 'to':'た', 'da':'た', 'de':'た', 'do':'た',
  'chi':'た', 'tsu':'た', 'ti':'た', 'tu':'た',
  'na':'な', 'ni':'な', 'nu':'な', 'ne':'な', 'no':'な',
  'ha':'は', 'hi':'は', 'hu':'は', 'he':'は', 'ho':'は', 'fu':'は',
  'ba':'は', 'bi':'は', 'bu':'は', 'be':'は', 'bo':'は',
  'pa':'は', 'pi':'は', 'pu':'は', 'pe':'は', 'po':'は',
  'ma':'ま', 'mi':'ま', 'mu':'ま', 'me':'ま', 'mo':'ま',
  'ya':'や', 'yu':'や', 'yo':'や',
  'ra':'ら', 'ri':'ら', 'ru':'ら', 're':'ら', 'ro':'ら',
  'wa':'わ', 'n':'わ',
};
const KANJI_ROW = {
  // あ行
  '亜':'あ', '赤':'あ', '暗':'あ', '石':'あ', '忌':'あ', '英':'あ', '黄':'あ', '王':'あ',
  // か行
  '還':'か', '兆':'か', '丘':'か', '黒':'か', '君':'か', '結':'か', '古':'か', '混':'か', '蜘':'か',
  // さ行
  '獅':'さ', '死':'さ', '失':'さ', '神':'さ', '祖':'さ',
  // た行
  '堕':'た', '知':'た', '著':'た', '調':'た', '接':'た', '爛':'た', '貪':'た',
  // は行
  '放':'は', '墓':'は', '火':'は', '飛':'は', '腐':'は', '降':'は',
  // ま行
  '百':'ま',
  // や行
  '溶':'や', '夜':'や',
  // ら行
  '猟':'ら', '霊':'ら', '老':'ら', '竜':'ら', '坩':'ら',
  // あ行（大=おお）
  '大':'あ',
};

function matchesKana(b, kana) {
  if (kana === 'all') return true;
  // 読み列があればその先頭文字で判定、なければ名前の先頭文字＋漢字ルックアップ
  const yomi = b['読み'] || '';
  const first = yomi ? yomi.charAt(0) : b['名前'].charAt(0);
  const firstH = toHiragana(first);
  if ((KANA_RANGES[kana] || []).some(c => toHiragana(c) === firstH)) return true;
  return KANJI_ROW[first] === kana;
}

function matchesType(b, type) {
  if (type === 'all') return true;
  const loc = b['前哨戦'] || '';
  return loc.includes(type);
}

function setFieldType(type, btn) {
  currentFieldType = type;
  document.querySelectorAll('#fieldTypeFilter .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderFieldBosses();
}

function setFieldKana(kana, btn) {
  currentFieldKana = kana;
  document.querySelectorAll('#fieldKanaFilter .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderFieldBosses();
}

function renderFieldBosses() {
  const list = document.getElementById('fieldList');
  const rawQ = document.getElementById('fieldSearch')?.value || '';
  const q = toHiragana(rawQ.toLowerCase());

  const unique = [];
  const seen = new Set();
  allSubBosses.forEach(b => {
    if (b['ボス種別'] !== 'フィールド') return;
    if (seen.has(b['名前'])) return;
    if (!matchesType(b, currentFieldType)) return;
    if (!matchesKana(b, currentFieldKana)) return;
    if (q && !toHiragana(b['名前'].toLowerCase()).includes(q) && !toHiragana((b['読み'] || '').toLowerCase()).includes(q)) return;
    seen.add(b['名前']);
    unique.push(b);
  });

  if (unique.length === 0) {
    list.innerHTML = '<div style="color:#666; padding:20px; text-align:center;">該当するボスがいません</div>';
    return;
  }

  list.innerHTML = unique.map(b => `
    <div class="field-card" onclick="showSubBossDetail('${b['名前'].replace(/'/g,"\\'")}')">
      <h4>${b['名前']}</h4>
      <p class="text-small text-muted">${b['前哨戦'] || b['備考'] || ''}</p>
    </div>
  `).join('');
}

function filterField() {
  const raw = document.getElementById('fieldSearch')?.value || '';
  // ローマ字入力の場合は行フィルターを自動設定
  const romajiRow = ROMAJI_TO_ROW[raw.toLowerCase()];
  if (romajiRow) {
    const btn = document.querySelector(`#fieldKanaFilter .filter-btn[data-kana="${romajiRow}"]`);
    if (btn) {
      setFieldKana(romajiRow, btn);
      return;
    }
  }
  renderFieldBosses();
}

// ===== タブ切り替え =====
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  // eventが存在する場合のみボタンをハイライト
  if (typeof event !== 'undefined' && event && event.target && event.target.classList) {
    event.target.classList.add('active');
  } else {
    // プログラムから呼ばれた場合はタブ名で対応ボタンを探す
    const tabMap = { night: 0, narrow: 1, field: 2 };
    const btns = document.querySelectorAll('.tab-btn');
    if (btns[tabMap[tab]]) btns[tabMap[tab]].classList.add('active');
  }
  location.hash = tab === 'night' ? '' : tab;
}

// ===== モーダル（サブボス用） =====
function closeModal(e) {
  if (e.target === document.getElementById('modalOverlay')) {
    document.getElementById('modalOverlay').classList.remove('show');
  }
}
function closeModalBtn() {
  document.getElementById('modalOverlay').classList.remove('show');
}
