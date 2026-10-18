/**
 * PT. FATH INDAH TRAVEL SERVICE - CLIENT APPLICATION
 * Supports both:
 * 1. Full-stack mode (Node.js Express backend)
 * 2. Static / GitHub Pages mode (Direct Google Sheets CSV & Web Crypto API)
 */

const GOOGLE_SPREADSHEET_ID = '1VL8trcMIcZ6n5Be-2-9YwmC1pOsKliO_wbILmU_cC1s';

// Application State
const state = {
  isStaticMode: false, // Detected if /api/auth/login is not available (e.g. GitHub Pages)
  currentUser: null,
  activeModule: 'dashboard',
  dbSource: 'googlesheets',
  locationData: {
    latitude: -6.200000,
    longitude: 106.816666,
    mapsUrl: 'https://www.google.com/maps?q=-6.200000,106.816666',
    address: 'Jakarta, Indonesia'
  },
  data: {
    users: [],
    logs: [],
    jamaah: [],
    absensi: [],
    cuti: []
  }
};

// DOM Elements
const loginWrapper = document.getElementById('loginWrapper');
const appContainer = document.getElementById('appContainer');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const loginBtn = document.getElementById('loginBtn');
const loginAlert = document.getElementById('loginAlert');
const geoStatusText = document.getElementById('geoStatusText');

const sidebar = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const mobileHamburgerBtn = document.getElementById('mobileHamburgerBtn');
const closeMobileSidebarBtn = document.getElementById('closeMobileSidebarBtn');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

const moduleTitleEl = document.getElementById('moduleTitle');
const moduleBreadcrumbEl = document.getElementById('moduleBreadcrumb');
const liveClockEl = document.getElementById('liveClock');
const userDisplayNameEl = document.getElementById('userDisplayName');
const userDisplayRoleEl = document.getElementById('userDisplayRole');
const userAvatarLetterEl = document.getElementById('userAvatarLetter');
const headerDbBadge = document.getElementById('headerDbBadge');

// ==========================================================================
// 1. INITIALIZATION & ENVIRONMENT DETECTION
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initLiveClock();
  initGeolocation();
  initEventListeners();
  await detectEnvironment();
  checkExistingSession();
});

async function detectEnvironment() {
  // If running on github.io or file://, automatically activate static client-side mode
  if (window.location.hostname.includes('github.io') || window.location.protocol === 'file:') {
    state.isStaticMode = true;
    console.log('[System] Running on Static/GitHub Pages Mode: Direct Google Sheets Enabled');
    return;
  }

  // Probe server /api/users
  try {
    const res = await fetch('/api/settings/db', { method: 'GET' });
    if (!res.ok) state.isStaticMode = true;
  } catch (e) {
    state.isStaticMode = true;
    console.log('[System] Backend API unavailable, falling back to Static Client-side Mode');
  }
}

function initLiveClock() {
  function update() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    if (liveClockEl) {
      liveClockEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${dateStr} - ${timeStr}`;
    }
  }
  update();
  setInterval(update, 1000);
}

function initGeolocation() {
  if (!navigator.geolocation) {
    if (geoStatusText) geoStatusText.textContent = 'GPS Browser tidak didukung (Lokasi default Jakarta aktif)';
    return;
  }

  if (geoStatusText) geoStatusText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mendeteksi koordinat Google Maps...';

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      state.locationData.latitude = lat;
      state.locationData.longitude = lng;
      state.locationData.mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`);
        if (res.ok) {
          const json = await res.json();
          const city = json.address?.city || json.address?.town || json.address?.municipality || json.address?.county || 'Indonesia';
          const road = json.address?.road || '';
          state.locationData.address = road ? `${road}, ${city}` : json.display_name.split(',').slice(0, 3).join(',');
        }
      } catch (e) {
        state.locationData.address = `Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      if (geoStatusText) {
        geoStatusText.innerHTML = `<i class="fa-solid fa-location-dot" style="color:#10b981"></i> Lokasi terdeteksi: <strong>${state.locationData.address}</strong>`;
      }
    },
    (err) => {
      console.warn('Geolocation denied/timeout:', err.message);
      if (geoStatusText) {
        geoStatusText.innerHTML = `<i class="fa-solid fa-location-dot" style="color:#f59e0b"></i> Lokasi default: Jakarta (Izin GPS dinonaktifkan)`;
      }
    },
    { timeout: 7000, enableHighAccuracy: true }
  );
}

// ==========================================================================
// 2. CLIENT-SIDE GOOGLE SHEETS & CRYPTO HELPERS (FOR GITHUB PAGES)
// ==========================================================================
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) rows.push(currentRow);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.replace(/^["']|["']$/g, '').trim());
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      let val = row[idx] !== undefined ? row[idx] : '';
      val = val.replace(/^["']|["']$/g, '').trim();
      obj[h] = val;
    });
    return obj;
  });
}

async function fetchGoogleSheetDirect(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal membaca sheet ${sheetName}: HTTP ${res.status}`);
  const csv = await res.text();
  return parseCSV(csv);
}

// Format Timestamp WIB (UTC+7)
function getWibTimestamp() {
  const d = new Date(Date.now() + (7 * 60 * 60 * 1000));
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function recordLocalActivityLog(entry) {
  try {
    const local = JSON.parse(localStorage.getItem('fath_indah_activity_logs') || '[]');
    local.unshift(entry);
    localStorage.setItem('fath_indah_activity_logs', JSON.stringify(local.slice(0, 100)));
  } catch (e) {}
}

function getLocalActivityLogs() {
  try {
    return JSON.parse(localStorage.getItem('fath_indah_activity_logs') || '[]');
  } catch (e) {
    return [];
  }
}

// ==========================================================================
// 3. AUTHENTICATION (LOGIN & LOGOUT)
// ==========================================================================
function initEventListeners() {
  togglePasswordBtn?.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  });

  loginForm?.addEventListener('submit', handleLogin);

  document.querySelectorAll('.demo-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const u = e.currentTarget.getAttribute('data-user');
      const p = e.currentTarget.getAttribute('data-pass');
      usernameInput.value = u;
      passwordInput.value = p;
      showAlert(`Akun demo ${u} terpilih. Klik 'Masuk ke Sistem'`, 'success');
    });
  });

  sidebarToggleBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    sidebarToggleBtn.innerHTML = isCollapsed 
      ? '<i class="fa-solid fa-angles-right"></i>' 
      : '<i class="fa-solid fa-angles-left"></i> <span>Minimize Menu</span>';
  });

  mobileHamburgerBtn?.addEventListener('click', () => {
    sidebar.classList.add('mobile-open');
    sidebarBackdrop.classList.add('active');
  });

  closeMobileSidebarBtn?.addEventListener('click', closeMobileSidebar);
  sidebarBackdrop?.addEventListener('click', closeMobileSidebar);

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetModule = item.getAttribute('data-module');
      if (targetModule) {
        switchModule(targetModule);
        closeMobileSidebar();
      }
    });
  });

  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
}

function closeMobileSidebar() {
  sidebar.classList.remove('mobile-open');
  sidebarBackdrop.classList.remove('active');
}

function showAlert(message, type = 'danger') {
  if (!loginAlert) return;
  loginAlert.className = `alert-box show alert-${type}`;
  loginAlert.innerHTML = `<i class="fa-solid ${type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i> <span>${message}</span>`;
}

function hideAlert() {
  if (!loginAlert) return;
  loginAlert.className = 'alert-box';
  loginAlert.innerHTML = '';
}

async function handleLogin(e) {
  e.preventDefault();
  hideAlert();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    showAlert('Silakan masukkan username dan password');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Mengotentikasi ke Google Sheets...</span>';

  // 1. If backend API is available, try server login
  if (!state.isStaticMode) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          latitude: state.locationData.latitude,
          longitude: state.locationData.longitude,
          mapsUrl: state.locationData.mapsUrl,
          location: state.locationData.address
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.user, data.databaseSource);
        return;
      } else if (res.status === 401 || res.status === 403) {
        showAlert(data.message || 'Username atau password tidak cocok.');
        resetLoginBtn();
        return;
      }
    } catch (err) {
      console.warn('Backend API request failed, falling back to direct Google Sheets client-side auth');
      state.isStaticMode = true;
    }
  }

  // 2. Direct Google Sheets Client-Side Auth (For GitHub Pages & Static Hosts)
  try {
    const users = await fetchGoogleSheetDirect('Users');
    const trimmedInputUser = username.toLowerCase();
    const matched = users.find(u => (u.Username || '').trim().toLowerCase() === trimmedInputUser);

    if (!matched) {
      showAlert(`Username "${username}" tidak terdaftar pada tabel Users.`);
      resetLoginBtn();
      return;
    }

    const inputHash = await sha256(password);
    const stored = (matched.Password || '').trim();
    const isMatch = (inputHash === stored) || (password === stored);

    if (!isMatch) {
      showAlert('Password salah. Silakan coba lagi.');
      resetLoginBtn();
      return;
    }

    const status = (matched.Status || '').trim().toLowerCase();
    if (status && status !== 'active') {
      showAlert('Akun Anda berstatus Inactive / Non-aktif.');
      resetLoginBtn();
      return;
    }

    // Record Activity Log
    const randId = 'LOG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newLog = {
      LogID: randId,
      Timestamp: getWibTimestamp(),
      Username: matched.Username,
      IP_Address: 'Browser Client',
      Maps_URL: state.locationData.mapsUrl,
      Location: state.locationData.address,
      Action: `LOGIN_SUCCESS (User ${matched.FullName} berhasil login)`,
      Module: 'Auth',
      isNewSessionLog: true
    };
    recordLocalActivityLog(newLog);

    const safeUser = {
      id: matched.ID || 'USR-001',
      username: matched.Username,
      fullName: matched.FullName || matched.Username,
      kanwil: matched.Kanwil || 'Pusat',
      kantor: matched.Kantor || 'Pusat',
      role: matched.Role || 'Staff',
      status: matched.Status || 'Active'
    };

    onLoginSuccess(safeUser, 'googlesheets');

  } catch (sheetErr) {
    showAlert('Gagal terhubung ke Google Sheets: ' + sheetErr.message);
    resetLoginBtn();
  }
}

function resetLoginBtn() {
  loginBtn.disabled = false;
  loginBtn.innerHTML = '<span>Masuk ke Sistem</span> <i class="fa-solid fa-arrow-right"></i>';
}

function onLoginSuccess(user, dbSource = 'googlesheets') {
  showAlert('Login berhasil! Mengalihkan ke ruang kerja...', 'success');
  state.currentUser = user;
  state.dbSource = dbSource;
  localStorage.setItem('fath_indah_session', JSON.stringify({
    user: user,
    loginTime: Date.now(),
    dbSource: dbSource
  }));

  setTimeout(() => {
    resetLoginBtn();
    enterWorkspace();
  }, 500);
}

function handleLogout() {
  if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
    localStorage.removeItem('fath_indah_session');
    state.currentUser = null;
    appContainer.classList.remove('active');
    loginWrapper.style.display = 'flex';
    usernameInput.value = '';
    passwordInput.value = '';
    hideAlert();
  }
}

function checkExistingSession() {
  const stored = localStorage.getItem('fath_indah_session');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.loginTime < 12 * 60 * 60 * 1000) {
        state.currentUser = parsed.user;
        state.dbSource = parsed.dbSource || 'googlesheets';
        enterWorkspace();
      }
    } catch (e) {
      localStorage.removeItem('fath_indah_session');
    }
  }
}

// ==========================================================================
// 4. WORKSPACE NAVIGATION & DATA LOADING
// ==========================================================================
function enterWorkspace() {
  loginWrapper.style.display = 'none';
  appContainer.classList.add('active');

  if (state.currentUser) {
    userDisplayNameEl.textContent = state.currentUser.fullName || state.currentUser.username;
    userDisplayRoleEl.textContent = `${state.currentUser.role} • ${state.currentUser.kanwil || 'Pusat'}`;
    userAvatarLetterEl.textContent = (state.currentUser.fullName || state.currentUser.username).charAt(0).toUpperCase();
  }

  updateHeaderDbBadge();
  switchModule('dashboard');
  loadAllModuleData();
}

function updateHeaderDbBadge() {
  if (!headerDbBadge) return;
  const isSupabase = state.dbSource === 'supabase';
  headerDbBadge.className = `db-pill ${isSupabase ? 'supabase' : ''}`;
  headerDbBadge.innerHTML = `
    <span class="status-dot"></span>
    <span>${isSupabase ? 'Database: Supabase' : 'Database: Google Sheets'}</span>
  `;
}

function switchModule(moduleName) {
  state.activeModule = moduleName;

  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-module') === moduleName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  document.querySelectorAll('.module-view').forEach(view => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById(`view-${moduleName}`);
  if (targetView) targetView.classList.add('active');

  const titles = {
    dashboard: { title: 'Dashboard Utama', breadcrumb: 'Portal Eksekutif / Ikhtisar Sistem' },
    jamaah: { title: 'Data Jamaah Umrah & Haji', breadcrumb: 'Manajemen Jamaah / Data Real-time Sheet Metadata' },
    logs: { title: 'Log Aktivitas Pengguna', breadcrumb: 'Audit Trail / Tabel ActivityLogs dengan Google Maps' },
    users: { title: 'Manajemen Pengguna', breadcrumb: 'Master Data / Otorisasi Tabel Users' },
    cuti_absensi: { title: 'Presensi & Cuti Karyawan', breadcrumb: 'SDM / Absensi & Pengajuan Cuti' },
    settings: { title: 'Konfigurasi Database', breadcrumb: 'Sistem / Pengalihan Google Sheets & Supabase' }
  };

  const meta = titles[moduleName] || { title: 'Portal Modul', breadcrumb: 'PT. Fath Indah' };
  moduleTitleEl.textContent = meta.title;
  moduleBreadcrumbEl.textContent = meta.breadcrumb;

  if (moduleName === 'dashboard') renderDashboard();
  if (moduleName === 'logs') renderLogsTable();
  if (moduleName === 'jamaah') renderJamaahTable();
  if (moduleName === 'users') renderUsersTable();
  if (moduleName === 'cuti_absensi') renderCutiAbsensi();
  if (moduleName === 'settings') renderSettings();
}

// ==========================================================================
// 5. DATA INGESTION
// ==========================================================================
async function loadAllModuleData() {
  if (state.isStaticMode) {
    // Direct Google Sheets fetching
    try {
      fetchGoogleSheetDirect('Users').then(u => {
        state.data.users = u;
        renderUsersTable();
        updateDashboardCounters();
      });

      fetchGoogleSheetDirect('ActivityLogs').then(logs => {
        const local = getLocalActivityLogs();
        state.data.logs = [...local, ...logs];
        renderLogsTable();
        renderDashboard();
        updateDashboardCounters();
      });

      fetchGoogleSheetDirect('Metadata').then(j => {
        state.data.jamaah = j;
        renderJamaahTable();
        updateDashboardCounters();
      });

      fetchGoogleSheetDirect('Absensi').then(a => {
        state.data.absensi = a;
        renderCutiAbsensi();
      }).catch(() => {});

      fetchGoogleSheetDirect('CutiKaryawan').then(c => {
        state.data.cuti = c;
        renderCutiAbsensi();
      }).catch(() => {});

    } catch (e) {
      console.error('Error loading Google Sheets directly:', e);
    }
    return;
  }

  // Full-stack Node API fetching
  try {
    fetch('/api/users').then(r => r.json()).then(data => {
      if (data.success) {
        state.data.users = data.users;
        renderUsersTable();
        updateDashboardCounters();
      }
    });

    fetch('/api/logs').then(r => r.json()).then(data => {
      if (data.success) {
        state.data.logs = data.logs;
        renderLogsTable();
        renderDashboard();
      }
    });

    fetch('/api/jamaah').then(r => r.json()).then(data => {
      if (data.success) {
        state.data.jamaah = data.jamaah;
        renderJamaahTable();
        updateDashboardCounters();
      }
    });

    fetch('/api/absensi').then(r => r.json()).then(data => {
      if (data.success) state.data.absensi = data.absensi;
    });

    fetch('/api/cuti').then(r => r.json()).then(data => {
      if (data.success) state.data.cuti = data.cuti;
    });

  } catch (err) {
    console.error('Error fetching module data:', err);
  }
}

function updateDashboardCounters() {
  const jCountEl = document.getElementById('statJamaahCount');
  const uCountEl = document.getElementById('statUsersCount');
  const lCountEl = document.getElementById('statLogsCount');

  if (jCountEl) jCountEl.textContent = state.data.jamaah.length || '154+';
  if (uCountEl) uCountEl.textContent = state.data.users.length || '42';
  if (lCountEl) lCountEl.textContent = state.data.logs.length || '325+';
}

function renderDashboard() {
  updateDashboardCounters();
  const recentLogsContainer = document.getElementById('recentLogsTableBody');
  if (!recentLogsContainer) return;

  const slice = state.data.logs.slice(0, 6);
  if (slice.length === 0) {
    recentLogsContainer.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);">Memuat log aktivitas...</td></tr>`;
    return;
  }

  recentLogsContainer.innerHTML = slice.map(log => {
    const isSuccess = (log.Action || '').includes('LOGIN_SUCCESS');
    return `
      <tr>
        <td><strong>${log.LogID}</strong></td>
        <td><i class="fa-regular fa-clock" style="color:var(--gold-light); margin-right:6px;"></i> ${log.Timestamp}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="avatar-badge" style="width:28px; height:28px; font-size:0.75rem;">${(log.Username || 'U').charAt(0).toUpperCase()}</div>
            <span>${log.Username}</span>
          </div>
        </td>
        <td><span class="badge ${isSuccess ? 'badge-success' : 'badge-failed'}">${(log.Action || '').split('(')[0].trim()}</span></td>
        <td><span style="font-size:0.8rem; color:var(--text-muted);">${log.Location || '-'}</span></td>
        <td>
          ${log.Maps_URL ? `<a href="${log.Maps_URL}" target="_blank" class="map-link-btn"><i class="fa-solid fa-map-pin"></i> Buka Maps</a>` : '-'}
        </td>
      </tr>
    `;
  }).join('');
}

function renderLogsTable() {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  const searchInput = document.getElementById('searchLogsInput')?.value.toLowerCase() || '';
  const filterModule = document.getElementById('filterLogsModule')?.value || 'all';

  let filtered = state.data.logs.filter(log => {
    const matchSearch = (log.LogID || '').toLowerCase().includes(searchInput) ||
                        (log.Username || '').toLowerCase().includes(searchInput) ||
                        (log.Action || '').toLowerCase().includes(searchInput) ||
                        (log.Location || '').toLowerCase().includes(searchInput);
    const matchModule = filterModule === 'all' || log.Module === filterModule;
    return matchSearch && matchModule;
  });

  const totalLogsBadge = document.getElementById('totalLogsCountBadge');
  if (totalLogsBadge) totalLogsBadge.textContent = `${filtered.length} Entri`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">Tidak ada data log yang sesuai filter pencarian.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.slice(0, 100).map(log => {
    const isSuccess = (log.Action || '').includes('LOGIN_SUCCESS');
    const isFailed = (log.Action || '').includes('LOGIN_FAILED');
    return `
      <tr>
        <td><code style="color:var(--gold-light); font-weight:700;">${log.LogID}</code></td>
        <td style="white-space:nowrap;">${log.Timestamp}</td>
        <td>
          <div style="font-weight:600; color:#fff;">${log.Username}</div>
          <div style="font-size:0.75rem; color:var(--text-dim);">${log.IP_Address || '-'}</div>
        </td>
        <td><span class="badge badge-blue">${log.Module || 'Auth'}</span></td>
        <td>
          <span class="badge ${isSuccess ? 'badge-success' : isFailed ? 'badge-failed' : 'badge-gold'}">
            ${isSuccess ? 'Sukses' : isFailed ? 'Gagal' : 'Aktivitas'}
          </span>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:4px;">${log.Action}</div>
        </td>
        <td>
          <div style="font-size:0.82rem; color:var(--text-main); max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${log.Location}">
            ${log.Location || 'Lokasi tidak tersedia'}
          </div>
        </td>
        <td>
          ${log.Maps_URL ? `
            <a href="${log.Maps_URL}" target="_blank" rel="noopener noreferrer" class="map-link-btn">
              <i class="fa-solid fa-location-arrow"></i> Google Maps
            </a>
          ` : '<span style="color:var(--text-dim); font-size:0.75rem;">-</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

function renderJamaahTable() {
  const tbody = document.getElementById('jamaahTableBody');
  if (!tbody) return;

  const search = document.getElementById('searchJamaahInput')?.value.toLowerCase() || '';

  const filtered = state.data.jamaah.filter(j => {
    const name = (j['Nama Lengkap'] || '').toLowerCase();
    const id = (j['ID Jamaah'] || '').toLowerCase();
    const ref = (j['Referensi'] || '').toLowerCase();
    const kota = (j['Kabupaten / Kota'] || j['Tempat Lahir'] || '').toLowerCase();
    return name.includes(search) || id.includes(search) || ref.includes(search) || kota.includes(search);
  });

  const badge = document.getElementById('totalJamaahBadge');
  if (badge) badge.textContent = `${filtered.length} Jamaah`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">Tidak ada data jamaah.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.slice(0, 50).map(j => {
    const id = j['ID Jamaah'] || '-';
    const nama = j['Nama Lengkap'] || '-';
    const jk = j['Jenis Kelamin'] || '-';
    const paket = j['Jenis Paket Umrah'] || j['Paket'] || 'Topaz Suhem';
    const kanwil = j['Kanwil'] || 'Solo Raya';
    const telp = j['Nomor Handphone'] || j['No Telp'] || '-';

    return `
      <tr>
        <td><strong style="color:var(--gold-light);">${id}</strong></td>
        <td>
          <div style="font-weight:700; color:#ffffff;">${nama}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${jk}</div>
        </td>
        <td><span class="badge badge-gold">${paket}</span></td>
        <td>${kanwil}</td>
        <td><i class="fa-brands fa-whatsapp" style="color:#22c55e; margin-right:4px;"></i> ${telp}</td>
        <td><span class="badge badge-success">Terverifikasi</span></td>
      </tr>
    `;
  }).join('');
}

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const search = document.getElementById('searchUsersInput')?.value.toLowerCase() || '';

  const filtered = state.data.users.filter(u => {
    const uname = (u.Username || '').toLowerCase();
    const fname = (u.FullName || '').toLowerCase();
    const role = (u.Role || '').toLowerCase();
    const kantor = (u.Kantor || '').toLowerCase();
    return uname.includes(search) || fname.includes(search) || role.includes(search) || kantor.includes(search);
  });

  const badge = document.getElementById('totalUsersBadge');
  if (badge) badge.textContent = `${filtered.length} Pengguna`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">Tidak ada user ditemukan.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const isActive = (u.Status || '').toLowerCase() === 'active';
    return `
      <tr>
        <td><strong>${u.ID || '-'}</strong></td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="avatar-badge" style="width:32px; height:32px; font-size:0.85rem;">${(u.FullName || u.Username).charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:700; color:#fff;">${u.FullName}</div>
              <div style="font-size:0.75rem; color:var(--text-dim);">@${u.Username}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-blue">${u.Role || 'Staff'}</span></td>
        <td>${u.Kanwil || 'Pusat'}</td>
        <td>${u.Kantor || 'Pusat'}</td>
        <td><span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">${u.Status || 'Active'}</span></td>
      </tr>
    `;
  }).join('');
}

function renderCutiAbsensi() {
  const absensiTbody = document.getElementById('absensiTableBody');
  if (absensiTbody) {
    const list = state.data.absensi;
    if (list.length === 0) {
      absensiTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">Memuat riwayat presensi...</td></tr>`;
    } else {
      absensiTbody.innerHTML = list.slice(0, 20).map(a => `
        <tr>
          <td>${a.Timestamp || '-'}</td>
          <td><strong>${a.FULLNAME || a.Username || '-'}</strong></td>
          <td><span class="badge badge-blue">${a['Tipe Absen'] || 'Masuk'}</span></td>
          <td>${a.Status || 'Tepat Waktu'}</td>
          <td>
            ${a['Maps URL'] ? `<a href="${a['Maps URL']}" target="_blank" class="map-link-btn"><i class="fa-solid fa-map-location-dot"></i> Maps</a>` : '-'}
          </td>
        </tr>
      `).join('');
    }
  }

  const cutiTbody = document.getElementById('cutiTableBody');
  if (cutiTbody) {
    const list = state.data.cuti;
    if (list.length === 0) {
      cutiTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">Memuat riwayat cuti...</td></tr>`;
    } else {
      cutiTbody.innerHTML = list.slice(0, 20).map(c => `
        <tr>
          <td><strong>${c.CutiID || '-'}</strong></td>
          <td>${c.NamaKaryawan || '-'}</td>
          <td><span class="badge badge-gold">${c.TipeCuti || 'Cuti Tahunan'}</span></td>
          <td>${c.TanggalMulai || '-'} s/d ${c.TanggalSelesai || '-'}</td>
          <td><span class="badge badge-success">Disetujui</span></td>
        </tr>
      `).join('');
    }
  }
}

function renderSettings() {
  const optSheets = document.getElementById('optDbSheets');
  const optSupabase = document.getElementById('optDbSupabase');

  if (state.dbSource === 'supabase') {
    optSupabase?.classList.add('selected');
    optSheets?.classList.remove('selected');
  } else {
    optSheets?.classList.add('selected');
    optSupabase?.classList.remove('selected');
  }

  if (!state.isStaticMode) {
    fetch('/api/settings/db').then(r => r.json()).then(data => {
      if (data.success && data.config) {
        const sb = data.config.supabase;
        const urlInput = document.getElementById('supabaseUrlInput');
        const keyInput = document.getElementById('supabaseKeyInput');
        if (urlInput && sb.url) urlInput.value = sb.url;
        if (keyInput && sb.anonKey) keyInput.placeholder = sb.anonKey;
      }
    });
  }
}

window.selectDatabase = async function(mode) {
  state.dbSource = mode;
  const optSheets = document.getElementById('optDbSheets');
  const optSupabase = document.getElementById('optDbSupabase');

  if (mode === 'supabase') {
    optSupabase?.classList.add('selected');
    optSheets?.classList.remove('selected');
  } else {
    optSheets?.classList.add('selected');
    optSupabase?.classList.remove('selected');
  }

  if (!state.isStaticMode) {
    try {
      const res = await fetch('/api/settings/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeSource: mode })
      });
      const d = await res.json();
      if (d.success) {
        alert(`Database aktif berhasil diubah ke: ${mode.toUpperCase()}`);
        updateHeaderDbBadge();
        loadAllModuleData();
      }
    } catch (err) {
      alert('Gagal mengubah mode database: ' + err.message);
    }
  } else {
    alert(`Database dialihkan ke: ${mode.toUpperCase()}`);
    updateHeaderDbBadge();
  }
};

window.saveSupabaseConfig = async function() {
  const url = document.getElementById('supabaseUrlInput')?.value.trim();
  const anonKey = document.getElementById('supabaseKeyInput')?.value.trim();

  if (!url) {
    alert('Harap masukkan URL Supabase');
    return;
  }

  if (!state.isStaticMode) {
    try {
      const res = await fetch('/api/settings/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabase: { url, anonKey } })
      });
      const d = await res.json();
      if (d.success) alert('Konfigurasi Supabase berhasil disimpan!');
    } catch (e) {
      alert('Gagal menyimpan: ' + e.message);
    }
  } else {
    localStorage.setItem('fath_indah_supabase_url', url);
    localStorage.setItem('fath_indah_supabase_key', anonKey);
    alert('Konfigurasi Supabase berhasil disimpan di browser!');
  }
};

window.testSupabase = async function() {
  const url = document.getElementById('supabaseUrlInput')?.value.trim();
  const anonKey = document.getElementById('supabaseKeyInput')?.value.trim();
  const resultDiv = document.getElementById('supabaseTestResult');

  if (resultDiv) {
    resultDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungi Supabase REST API...';
    resultDiv.style.display = 'block';
  }

  try {
    const cleanUrl = url.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });

    if (res.ok || res.status === 200 || res.status === 404 || res.status === 401) {
      if (res.status === 401) {
        resultDiv.innerHTML = '<span style="color:#ef4444"><i class="fa-solid fa-circle-xmark"></i> Anon Key tidak valid</span>';
      } else {
        resultDiv.innerHTML = '<span style="color:#10b981"><i class="fa-solid fa-circle-check"></i> Koneksi ke Supabase REST API berhasil!</span>';
      }
    } else {
      resultDiv.innerHTML = `<span style="color:#ef4444">Status HTTP ${res.status}: ${res.statusText}</span>`;
    }
  } catch (err) {
    if (resultDiv) resultDiv.innerHTML = '<span style="color:#ef4444">Error: ' + err.message + '</span>';
  }
};

window.exportLogsToCSV = function() {
  const logs = state.data.logs;
  if (!logs || logs.length === 0) {
    alert('Tidak ada log untuk diekspor.');
    return;
  }

  let csv = 'LogID,Timestamp,Username,IP_Address,Maps_URL,Location,Action,Module\n';
  logs.forEach(l => {
    const row = [
      `"${l.LogID || ''}"`,
      `"${l.Timestamp || ''}"`,
      `"${l.Username || ''}"`,
      `"${l.IP_Address || ''}"`,
      `"${l.Maps_URL || ''}"`,
      `"${(l.Location || '').replace(/"/g, '""')}"`,
      `"${(l.Action || '').replace(/"/g, '""')}"`,
      `"${l.Module || ''}"`
    ];
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ActivityLogs_FathIndah_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
