const STORAGE_KEY_TOKEN = 'nr_token';
const STORAGE_KEY_URL   = 'nr_api_url';
const SESSION_KEY       = 'nr_db_cache';

function getToken()  { return localStorage.getItem(STORAGE_KEY_TOKEN) || ''; }
function getApiUrl() { return localStorage.getItem(STORAGE_KEY_URL)   || ''; }

function setCredentials(url, token) {
  localStorage.setItem(STORAGE_KEY_URL,   url);
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
}

function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_URL);
}

function clearDBCache() {
  sessionStorage.removeItem(SESSION_KEY);
  DB = null;
}

const API = {
  async fetchAll() {
    const token  = getToken();
    const apiUrl = getApiUrl();
    if (!token || !apiUrl) throw new Error('TOKEN_NOT_SET');

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'getAllData' })
    });

    if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);

    const data = await res.json();
    if (data.error === 'Unauthorized') {
      throw new Error('TOKEN_INVALID');
    }
    if (data.error) throw new Error(data.error);
    return data;
  }
};

let DB = null;

async function initDB() {
  if (DB) return DB;

  // sessionStorageにキャッシュがあれば即返す
  try {
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      DB = JSON.parse(cached);
      return DB;
    }
  } catch(e) {
    // キャッシュ読み取り失敗は無視してAPIから取得
  }

  // APIから取得してキャッシュ
  DB = await API.fetchAll();
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(DB));
  } catch(e) {
    // データが大きすぎる場合は無視
  }
  return DB;
}
