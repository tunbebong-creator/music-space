// ================== CONFIG ==================
const API_BASE = '/api'; // Nếu backend khác cổng: 'http://localhost:3000/api'

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
  if (e.target.id === 'auth-modal') closeAuth(); // click nền để đóng
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

    // ➜ Redirect theo role
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
  initMap();        // nếu trang có map sẽ tự chạy
  loadUpcoming();   // nếu trang có #events-grid sẽ tự render
  setupLeafletFixes();
});

/* =================================================================
   HEALING MAP
   - Cần div#map trong HTML để bật
   - API dùng /api/healing-events
================================================================= */
let map, markerLayer;

function initMap() {
  const el = $('#map');
  if (!el || typeof L === 'undefined') return;

  map = L.map('map', { scrollWheelZoom: true }).setView([16.0471, 108.2062], 6);
  // expose ra window để _invalidateMap dùng an toàn
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

  // thay đổi search/filter -> reload markers (debounce)
  const debouncedReload = debounce(loadMarkers, 300);
  $('#search-q')?.addEventListener('input', debouncedReload);
  $('#filter-city')?.addEventListener('change', debouncedReload);
  $('#filter-category')?.addEventListener('change', debouncedReload);

  $('#btn-apply')?.addEventListener('click', () => loadMarkers(true));
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
      if (ev.Lat == null || ev.Lng == null) return;
      const m = L.marker([ev.Lat, ev.Lng]).addTo(markerLayer);

      const price = ev.PriceCents != null ? (ev.PriceCents / 100).toLocaleString('vi-VN') + ' ' + (ev.Currency || 'VND') : '';
      const time = ev.StartTime ? new Date(ev.StartTime).toLocaleString('vi-VN') : '';
      const html = `
        <div style="min-width:220px">
          <div style="display:flex; gap:8px;">
            ${ev.ThumbnailUrl ? `<img src="${ev.ThumbnailUrl}" style="width:64px;height:64px;object-fit:cover;border-radius:8px">` : ''}
            <div>
              <div style="font-weight:700">${ev.Title || ev.Name || ''}</div>
              <div style="font-size:12px;color:#64748b">${ev.VenueName || ev.Address || ''}</div>
            </div>
          </div>
          ${time ? `<div style="margin-top:6px;font-size:12px">🗓 ${time}</div>` : ''}
          ${price ? `<div style="font-size:12px">💵 ${price}</div>` : ''}
          ${ev.Slug ? `<a href="/pages/event.html?slug=${ev.Slug}" style="display:inline-block;margin-top:6px;font-size:13px">Xem chi tiết →</a>` : ''}
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
   - Cần div#events-grid trong HTML
================================================================= */
async function loadUpcoming() {
  const wrap = $('#events-grid');
  if (!wrap) return;

  try {
    const res = await fetch(`${API_BASE}/healing-events`);
    const all = await res.json();

    const rows = (all || [])
      .filter(r => r.StartTime)
      .sort((a, b) => new Date(a.StartTime) - new Date(b.StartTime))
      .slice(0, 9);

    if (!rows.length) {
      wrap.innerHTML = '<p style="text-align:center;color:#64748b">Chưa có sự kiện.</p>';
      return;
    }

    wrap.innerHTML = rows.map(ev => {
      const price = ev.PriceCents != null
        ? (ev.PriceCents / 100).toLocaleString('vi-VN') + ' ' + (ev.Currency || 'VND')
        : 'Miễn phí';
      const day = ev.StartTime ? new Date(ev.StartTime).toLocaleDateString('vi-VN') : '';
      const tStart = ev.StartTime ? new Date(ev.StartTime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : '';
      const tEnd = ev.EndTime ? new Date(ev.EndTime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : '';

      return `
        <article class="hs-card">
          <img class="hs-card__cover" src="${ev.ThumbnailUrl || '/assets/placeholder.jpg'}" alt="">
          <div class="hs-card__body">
            <div>
              ${ev.Category ? `<span class="hs-tag">${ev.Category}</span>` : ''}
              ${ev.City ? `<span class="hs-tag">${ev.City}</span>` : ''}
            </div>
            <div class="hs-title">${ev.Title || ''}</div>
            <div class="hs-meta">
              ${day ? `<div>📅 ${day}</div>` : ''}
              ${(tStart && tEnd) ? `<div>⏱ ${tStart} - ${tEnd}</div>` : ''}
              ${ev.VenueName ? `<div>📍 ${ev.VenueName}</div>` : ''}
            </div>
          </div>
          <div class="hs-card__foot">
            <div class="hs-price">${price}</div>
            <a class="hs-btn" href="${ev.Slug ? `/pages/event.html?slug=${ev.Slug}` : '#'}">Xem chi tiết</a>
          </div>
        </article>`;
    }).join('');
  } catch (e) {
    console.error('Lỗi tải events:', e);
    wrap.innerHTML = '<p style="text-align:center;color:#ef4444">Không tải được danh sách sự kiện.</p>';
  }
}

/* =================================================================
   FIX: Leaflet map “trôi/giật” khi scroll/hiện lại
================================================================= */
function _invalidateMap() {
  if (window.map && typeof window.map.invalidateSize === 'function') {
    window.map.invalidateSize(true);
  }
}

function setupLeafletFixes() {
  // 1) invalidate khi trang load/resize/orientation
  window.addEventListener('load', () => setTimeout(_invalidateMap, 60));
  window.addEventListener('resize', () => setTimeout(_invalidateMap, 60));
  window.addEventListener('orientationchange', () => setTimeout(_invalidateMap, 60));

  // 2) invalidate khi scroll (throttle)
  let scTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scTimer);
    scTimer = setTimeout(_invalidateMap, 80);
  }, { passive: true });

  // 3) invalidate khi map vào viewport
  const mapEl = document.getElementById('map');
  if (mapEl && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setTimeout(_invalidateMap, 50);
      }
    }, { threshold: 0.2 });
    io.observe(mapEl);
  }

  // 4) nếu có nút toggle “Bản đồ / Danh sách”
  const mapBtn  = document.getElementById('view-map');
  const listBtn = document.getElementById('view-list');
  if (mapBtn && listBtn && mapEl) {
    mapBtn.addEventListener('click', () => {
      mapEl.style.display = 'block';
      try { window.scrollTo({ top: mapEl.offsetTop - 60, behavior: 'smooth' }); } catch {}
      setTimeout(_invalidateMap, 40);
    });
    listBtn.addEventListener('click', () => {
      mapEl.style.display = 'none';
    });
  }
}
