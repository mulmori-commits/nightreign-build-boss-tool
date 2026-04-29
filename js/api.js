// URLパラメータからトークンを取得、なければCONFIGから
function getToken() {
  const params = new URLSearchParams(location.search);
  return params.get('token') || (typeof CONFIG !== 'undefined' ? CONFIG.TOKEN : '');
}

function getApiUrl() {
  return typeof CONFIG !== 'undefined' ? CONFIG.API_URL : '';
}

const API = {
  async fetchAll() {
    const url = `${getApiUrl()}?token=${getToken()}&action=getAllData`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API通信エラー');
    return await res.json();
  }
};

let DB = null;

async function initDB() {
  if (DB) return DB;
  DB = await API.fetchAll();
  return DB;
}
