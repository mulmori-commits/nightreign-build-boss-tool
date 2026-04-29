function getToken() {
  const params = new URLSearchParams(location.search);
  return params.get('token') || (window._NR_TOKEN || '');
}

function getApiUrl() {
  return window._NR_API_URL || '';
}

const API = {
  async fetchAll() {
    const token = getToken();
    const apiUrl = getApiUrl();
    if (!token || !apiUrl) throw new Error('configが未設定です。');
    const url = `${apiUrl}?token=${token}&action=getAllData`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API通信エラー');
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }
};

let DB = null;

async function initDB() {
  if (DB) return DB;
  DB = await API.fetchAll();
  return DB;
}
