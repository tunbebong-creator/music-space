// ================== CONFIG ==================
const API_BASE = '/api';

// ================== HELPERS =================
const $ = (sel, el = document) => el.querySelector(sel);
const getUser = () => {
  try { return JSON.parse(localStorage.getItem('ms_user')); }
  catch { return null; }
};
const isManager = (u) => !!u && ['manager','admin'].includes((u.role||'').toLowerCase());

// simple debounce
const debounce = (fn, ms = 250) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

// ================== MODAL AUTH ==============
function openAuth() { $('#auth-modal')?.classList.remove('hidden'); }
function closeAuth() { $('#auth-modal')?.classList.add('hidden'); }

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.auth-pane').forEach(p => p.classList.remove('show'));
  $(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
  $(`#form-${tab}`)?.classList.add('show');
}

// ================== USER UI =================
function renderUserInfo(user) {
  const box = $('#user-info');
  if (!box) return;

  if (user) {
    const name = (user.fullName || user.email || '').trim();
    const managerBtn = isManager(user)
      ? `<a href="/pages/manager/manager.html"
             style="margin-top:6px; font-size:12px; padding:6px 10px; border-radius:8px; border:1px solid #cbd5e1; text-decoration:none; color:#0ea5e9; background:#f1f5f9">
           Quản trị
         </a>`
      : '';

    box.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <div style="font-size:13px; font-weight:700; color:#1e293b; max-width:140px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${name}
        </div>
        ${managerBtn}
        <button id="logout-btn" style="border:0;background:none;color:#dc2626;font-size:12px;cursor:pointer;margin-top:6px">
          Đăng xuất
        </button>
      </div>
    `;
    $('#logout-btn')?.addEventListener('click', () => {
      localStorage.removeItem('ms_user');
      window.location.reload();
    });
  } else {
    box.innerHTML = '';
  }
}

// ================== WIRE NAV ICON ==========
$('#btnUser')?.addEventListener('click', openAuth);
$('.auth-close')?.addEventListener('click', closeAuth);
$('#auth-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'auth-modal') closeAuth();
});
document.querySelectorAll('.auth-tab').forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
);

// ================== LOGIN ==================
$('#form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#login-msg'); msg.textContent = 'Đang đăng nhập...';
  const fd = new FormData(e.target);
  const payload = { email: fd.get('email'), password: fd.get('password') };

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('ms_user', JSON.stringify(data));
    renderUserInfo(data);

    const role = (data.role || '').toLowerCase();
    if (role === 'manager' || role === 'admin') {
      window.location.href = '/pages/manager/manager.html';
      return;
    }

    msg.textContent = `Xin chào ${data.fullName || data.email}`;
    setTimeout(() => closeAuth(), 600);
    e.target.reset();
  } catch (err) {
    msg.textContent = '⚠ ' + err.message;
  }
});

// ================== REGISTER ===============
$('#form-register')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#register-msg'); msg.textContent = 'Đang tạo tài khoản...';
  const fd = new FormData(e.target);
  const payload = {
    fullName: fd.get('fullName'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    password: fd.get('password')
  };

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Register failed');

    msg.textContent = 'Tạo tài khoản thành công. Bạn có thể đăng nhập.';
    setTimeout(() => { switchTab('login'); msg.textContent = ''; }, 900);
    e.target.reset();
  } catch (err) {
    msg.textContent = '⚠ ' + err.message;
  }
});

// ================== GUARD HEALING LINK ==========
$('#linkHealing')?.addEventListener('click', (e) => {
  if (!getUser()) {
    e.preventDefault();
    openAuth();
    switchTab('login');
  }
});

// ================== HYDRATE ON LOAD =========
document.addEventListener('DOMContentLoaded', () => {
  renderUserInfo(getUser());
  initMap();
  loadUpcoming();
  setupLeafletFixes();
});

/* =================================================================
   HEALING MAP
================================================================= */
let map, markerLayer;

function initMap() {
  const el = $('#map');
  if (!el || typeof L === 'undefined') return;

  map = L.map('map', { scrollWheelZoom: true }).setView([16.0471, 108.2062], 6);
  window.map = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);
  loadMarkers();

  let timer;
  map.on('moveend', () => {
    clearTimeout(timer);
    timer = setTimeout(loadMarkers, 200);
  });

  const debouncedReload = debounce(loadMarkers, 300);
  $('#search-q')?.addEventListener('input', debouncedReload);
  $('#filter-city')?.addEventListener('change', debouncedReload);
  $('#filter-category')?.addEventListener('change', debouncedReload);
}

async function loadMarkers() {
  if (!map) return;
  markerLayer.clearLayers();

  const b = map.getBounds();
  const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map(n => n.toFixed(6)).join(',');

  const q = $('#search-q')?.value || '';
  const city = $('#filter-city')?.value || '';
  const category = $('#filter-category')?.value || '';

  const url = `${API_BASE}/healing-events?bbox=${bbox}&city=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url);
    const rows = await res.json();

    (rows || []).forEach(ev => {
      if (ev.lat == null || ev.lng == null) return;
      const m = L.marker([ev.lat, ev.lng]).addTo(markerLayer);

      const price = ev.price_cents != null ? (ev.price_cents / 100).toLocaleString('vi-VN') + ' ' + (ev.currency || 'VND') : '';
      const time = ev.start_time ? new Date(ev.start_time).toLocaleString('vi-VN') : '';
      const html = `
        <div style="min-width:220px">
          <div style="display:flex; gap:8px;">
            ${ev.thumbnail_url ? `<img src="${ev.thumbnail_url}" style="width:64px;height:64px;object-fit:cover;border-radius:8px">` : ''}
            <div>
              <div style="font-weight:700">${ev.title || ''}</div>
              <div style="font-size:12px;color:#64748b">${ev.venue_name || ''}</div>
            </div>
          </div>
          ${time ? `<div style="margin-top:6px;font-size:12px">🗓 ${time}</div>` : ''}
          ${price ? `<div style="font-size:12px">💵 ${price}</div>` : ''}
          ${ev.slug ? `<a href="/pages/event.html?slug=${ev.slug}" style="display:inline-block;margin-top:6px;font-size:13px">Xem chi tiết →</a>` : ''}
        </div>
      `;
      m.bindPopup(html);
    });
  } catch (e) {
    console.error('Lỗi tải markers:', e);
  }
}

/* =================================================================
   UPCOMING EVENTS (Grid)
================================================================= */
async function loadUpcoming() {
  const wrap = $('#events-grid');
  if (!wrap) return;

  try {
    const res = await fetch(`${API_BASE}/healing-events`);
    const all = await res.json();

    const rows = (all || [])
      .filter(r => r.start_time)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 9);

    if (!rows.length) {
      wrap.innerHTML = '<p style="text-align:center;color:#64748b">Chưa có sự kiện.</p>';
      return;
    }

    wrap.innerHTML = rows.map(ev => {
      const price = ev.price_cents != null
        ? (ev.price_cents / 100).toLocaleString('vi-VN') + ' ' + (ev.currency || 'VND')
        : 'Miễn phí';
      const day = ev.start_time ? new Date(ev.start_time).toLocaleDateString('vi-VN') : '';
      const tStart = ev.start_time ? new Date(ev.start_time).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}) : '';
      const tEnd = ev.end_time ? new Date(ev.end_time).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}) : '';

      return `
        <article class="hs-card">
          <img class="hs-card__cover" src="${ev.thumbnail_url || '/assets/placeholder.jpg'}" alt="">
          <div class="hs-card__body">
            <div>
              ${ev.category ? `<span class="hs-tag">${ev.category}</span>` : ''}
              ${ev.city ? `<span class="hs-tag">${ev.city}</span>` : ''}
            </div>
            <div class="hs-title">${ev.title || ''}</div>
            <div class="hs-meta">
              ${day ? `<div>📅 ${day}</div>` : ''}
              ${(tStart && tEnd) ? `<div>⏱ ${tStart} - ${tEnd}</div>` : ''}
              ${ev.venue_name ? `<div>📍 ${ev.venue_name}</div>` : ''}
            </div>
          </div>
          <div class="hs-card__foot">
            <div class="hs-price">${price}</div>
            <a class="hs-btn" href="${ev.slug ? `/pages/event.html?slug=${ev.slug}` : '#'}">Xem chi tiết</a>
          </div>
        </article>`;
    }).join('');
  } catch (e) {
    console.error('Lỗi tải events:', e);
    wrap.innerHTML = '<p style="text-align:center;color:#ef4444">Không tải được danh sách sự kiện.</p>';
  }
}

/* =================================================================
   FIX Leaflet
================================================================= */
function _invalidateMap() {
  if (window.map && typeof window.map.invalidateSize === 'function') {
    window.map.invalidateSize(true);
  }
}

function setupLeafletFixes() {
  window.addEventListener('load', () => setTimeout(_invalidateMap, 60));
  window.addEventListener('resize', () => setTimeout(_invalidateMap, 60));
  window.addEventListener('orientationchange', () => setTimeout(_invalidateMap, 60));

  const mapEl = document.getElementById('map');
  if (mapEl && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setTimeout(_invalidateMap, 50);
      }
    }, { threshold: 0.2 });
    io.observe(mapEl);
  }
}
