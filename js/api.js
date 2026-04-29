// GAS APIとの通信
const API = {
  async fetchAll() {
    const url = `${CONFIG.API_URL}?token=${CONFIG.TOKEN}&action=getAllData`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API通信エラー');
    return await res.json();
  }
};

// 全データをメモリに保持
let DB = null;

async function initDB() {
  if (DB) return DB;
  DB = await API.fetchAll();
  return DB;
}
