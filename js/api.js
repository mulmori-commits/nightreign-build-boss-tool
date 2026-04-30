const STORAGE_KEY_TOKEN = 'nr_token';
const STORAGE_KEY_URL   = 'nr_api_url';
 
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
      clearCredentials();
      throw new Error('TOKEN_INVALID');
    }
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
