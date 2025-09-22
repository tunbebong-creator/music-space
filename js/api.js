// js/api.js
(() => {
  // ============ CONFIG ============
  // Prod: domain backend Render (đã deploy)
  const PROD_API_BASE = 'https://usic-space-server.onrender.com/api';

  // Dev: đang chạy file HTML/JS ở local + backend local (node app.js)
  // -> gọi cùng origin '/api'
  const isLocal =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1';

  // Base URL cuối cùng
  const API_BASE = isLocal ? '/api' : PROD_API_BASE;

  // ============ HELPERS ============
  // fetch cơ bản
  const _fetch = (path, opt = {}) =>
    fetch(API_BASE + path, {
      // bật credentials nếu cần cookie/session => đổi thành true
      credentials: opt.credentials ?? 'same-origin',
      ...opt,
    });

  // GET → JSON (throw nếu !ok)
  const getJSON = async (path, opt = {}) => {
    const res = await _fetch(path, opt);
    if (!res.ok) throw new Error(`[GET ${path}] ${res.status} ${res.statusText}`);
    return res.json();
  };

  // POST → JSON (throw nếu !ok)
  const postJSON = async (path, body = {}, opt = {}) => {
    const res = await _fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(opt.headers || {}) },
      body: JSON.stringify(body),
      ...opt,
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(`[POST ${path}] ${res.status} ${res.statusText} ${msg}`);
    }
    return res.json();
  };

  // PUT / DELETE nếu cần
  const putJSON = async (path, body = {}, opt = {}) => {
    const res = await _fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(opt.headers || {}) },
      body: JSON.stringify(body),
      ...opt,
    });
    if (!res.ok) throw new Error(`[PUT ${path}] ${res.status} ${res.statusText}`);
    return res.json();
  };

  const del = async (path, opt = {}) => {
    const res = await _fetch(path, { method: 'DELETE', ...opt });
    if (!res.ok) throw new Error(`[DELETE ${path}] ${res.status} ${res.statusText}`);
    return res.json().catch(() => ({}));
  };

  // ============ GLOBAL EXPORT ============
  window.API_BASE = API_BASE;
  window.apiGet = (p, opt) => _fetch(p, opt);     // raw fetch (không parse)
  window.apiGetJSON = getJSON;
  window.apiPostJSON = postJSON;
  window.apiPutJSON = putJSON;
  window.apiDelete = del;
  window.API = API_BASE;

  // ============ QUICK PING ============
  // Bạn đã có /api/ping và /health → gọi cái nào cũng được
  getJSON('/ping')
    .then(d => console.log('✅ API /ping:', d))
    .catch(err => {
      console.error('❌ API /ping error:', err);
      // thử /health nếu /ping fail
      return getJSON('/health')
        .then(d => console.log('✅ API /health:', d))
        .catch(e => console.error('❌ API /health error:', e));
    });
})();
