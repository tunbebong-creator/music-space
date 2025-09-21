// js/api.js
(() => {
  // true khi không phải localhost (VD: Vercel/Render)
  const IS_PROD = location.hostname !== 'localhost';

  // ĐỔI domain dưới thành domain backend thật của bạn khi deploy
  const PROD_API_BASE = 'https://<backend-domain>/api';

  // Ở local → gọi /api trên cùng origin (server/app.js đang serve API)
  const API = IS_PROD ? PROD_API_BASE : '/api';

  // Export global
  window.API = API;

  // Helpers tuỳ chọn
  window.apiGet = (p, opt = {}) => fetch(API + p, { ...opt });
  window.apiJSON = (p, body = {}, opt = {}) =>
    fetch(API + p, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(opt.headers || {}) },
      body: JSON.stringify(body),
      ...opt,
    });
})();
