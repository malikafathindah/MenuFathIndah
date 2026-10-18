/**
 * PT. FATH INDAH TRAVEL SERVICE - CLIENT APPLICATION
 * Supports both:
 * 1. Full-stack mode (Node.js Express backend)
 * 2. Static / GitHub Pages mode (Direct Google Sheets CSV & Web Crypto API)
 */

const GOOGLE_SPREADSHEET_ID = '1VL8trcMIcZ6n5Be-2-9YwmC1pOsKliO_wbILmU_cC1s';

const SUPABASE_CONFIG = {
  url: 'https://utqexpkwtatwzknjftpx.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cWV4cGt3dGF0d3prbmpmdHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxODQ5MTYsImV4cCI6MjEwNzc2MDkxNn0.s17as0ZuXm11AMJyYp01omnHkiqTRTGrKtYZfAI7kwE'
};

// Application State
const state = {
  isStaticMode: false, // Detected if /api/auth/login is not available (e.g. GitHub Pages)
  currentUser: null,
  activeModule: 'dashboard',
  dbSource: 'supabase',
  selectedCategory: 'ALL',
  moduleSearchQuery: '',
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
    cuti: [],
    modules: []
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

async function fetchSupabaseDirect(table, query = '') {
  const url = `${SUPABASE_CONFIG.url}/rest/v1/${table}${query ? '?' + query : ''}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_CONFIG.anonKey,
      'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
    }
  });
  if (!res.ok) throw new Error(`Gagal membaca tabel Supabase ${table}: HTTP ${res.status}`);
  return await res.json();
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

  // Event delegation for dynamic sidebar nav items
  const sidebarNav = document.getElementById('sidebarNav');
  sidebarNav?.addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item');
    if (item) {
      e.preventDefault();
      const targetModule = item.getAttribute('data-module');
      if (targetModule) {
        switchModule(targetModule);
        closeMobileSidebar();
      }
    }
  });

  // Role quick switcher (Live Preview)
  const roleSwitcher = document.getElementById('roleQuickSwitcher');
  roleSwitcher?.addEventListener('change', (e) => {
    const newRole = e.target.value;
    if (state.currentUser) {
      state.currentUser.role = newRole;
      if (userDisplayRoleEl) userDisplayRoleEl.textContent = `${newRole} • ${state.currentUser.kanwil || 'Pusat'}`;
      const indicator = document.getElementById('activeRoleIndicator');
      if (indicator) indicator.textContent = newRole;
      const badge = document.getElementById('currentRoleBadge');
      if (badge) badge.textContent = newRole;
      renderSidebarMenu();
      renderModulesGrid();
      populateCategoryFilter();
    }
  });

  // Module search input
  const searchInput = document.getElementById('moduleSearchInput');
  searchInput?.addEventListener('input', (e) => {
    state.moduleSearchQuery = e.target.value.toLowerCase().trim();
    renderModulesGrid();
  });

  // Module category filter
  const categoryFilter = document.getElementById('moduleCategoryFilter');
  categoryFilter?.addEventListener('change', (e) => {
    state.selectedCategory = e.target.value;
    renderModulesGrid();
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
  loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Mengotentikasi ke Supabase Database...</span>';

  // 1. If backend API is available, try server login (which uses Supabase)
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
        onLoginSuccess(data.user, 'supabase');
        return;
      } else if (res.status === 401 || res.status === 403) {
        showAlert(data.message || 'Username atau password tidak cocok.');
        resetLoginBtn();
        return;
      }
    } catch (err) {
      console.warn('Backend API request failed, falling back to direct Supabase client-side auth');
      state.isStaticMode = true;
    }
  }

  // 2. Direct Supabase Client-Side Auth (For GitHub Pages & Static Hosts)
  try {
    const rawUsers = await fetchSupabaseDirect('users');
    const users = rawUsers.map(u => ({
      ID: u.id || u.user_id,
      Username: u.username || u.user_id,
      Password: u.password,
      FullName: u.full_name || u.nama || u.username,
      Kanwil: u.kanwil || 'Pusat',
      Kantor: u.kantor || 'Pusat',
      Role: u.role || 'Staff',
      Status: u.status || 'Active'
    }));

    const trimmedInputUser = username.toLowerCase();
    const matched = users.find(u => (u.Username || '').trim().toLowerCase() === trimmedInputUser);

    if (!matched) {
      showAlert(`Username "${username}" tidak terdaftar pada tabel users Supabase.`);
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

    // Record Activity Log directly to Supabase if possible
    const randId = 'LOG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestampNow = getWibTimestamp();
    const newLog = {
      LogID: randId,
      Timestamp: timestampNow,
      Username: matched.Username,
      IP_Address: 'Browser Client',
      Maps_URL: state.locationData.mapsUrl,
      Location: state.locationData.address,
      Action: `LOGIN_SUCCESS (User ${matched.FullName} berhasil login ke Supabase)`,
      Module: 'Auth',
      isNewSessionLog: true
    };
    recordLocalActivityLog(newLog);

    // Try sending log to Supabase REST API
    try {
      fetch(`${SUPABASE_CONFIG.url}/rest/v1/activity_logs`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          logid: randId,
          timestamp: timestampNow,
          username: matched.Username,
          ip_address: 'Browser Client',
          maps_url: state.locationData.mapsUrl,
          location: state.locationData.address,
          action: `LOGIN_SUCCESS (User ${matched.FullName} berhasil login ke Supabase)`,
          module: 'Auth'
        })
      }).catch(() => {});
    } catch (e) {}

    const safeUser = {
      id: matched.ID || 'USR-001',
      username: matched.Username,
      fullName: matched.FullName || matched.Username,
      kanwil: matched.Kanwil || 'Pusat',
      kantor: matched.Kantor || 'Pusat',
      role: matched.Role || 'Staff',
      status: matched.Status || 'Active'
    };

    onLoginSuccess(safeUser, 'supabase');

  } catch (sbErr) {
    showAlert('Gagal terhubung ke database Supabase: ' + sbErr.message);
    resetLoginBtn();
  }
}

function resetLoginBtn() {
  loginBtn.disabled = false;
  loginBtn.innerHTML = '<span>Masuk ke Sistem</span> <i class="fa-solid fa-arrow-right"></i>';
}

function onLoginSuccess(user, dbSource = 'supabase') {
  showAlert('Login berhasil! Mengalihkan ke ruang kerja...', 'success');
  state.currentUser = user;
  state.actualRole = user.role;
  state.dbSource = dbSource;
  localStorage.setItem('fath_indah_session', JSON.stringify({
    user: user,
    actualRole: user.role,
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
    state.actualRole = '';
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
        state.actualRole = parsed.actualRole || parsed.user.role;
        state.dbSource = parsed.dbSource || 'supabase';
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

    // LAMPIRAN 1: 'Ganti Role (Preview)' HANYA berlaku dan tampil jika pengguna memiliki Role Admin
    const isActualAdmin = (state.actualRole || state.currentUser.role || '').toLowerCase() === 'admin';
    const roleSwitcherContainer = document.getElementById('roleSwitcherContainer');
    if (roleSwitcherContainer) {
      roleSwitcherContainer.style.display = isActualAdmin ? 'block' : 'none';
    }

    const roleSwitcher = document.getElementById('roleQuickSwitcher');
    if (roleSwitcher) roleSwitcher.value = state.currentUser.role || 'Admin';
    const indicator = document.getElementById('activeRoleIndicator');
    if (indicator) indicator.textContent = state.currentUser.role || 'Admin';
    const badge = document.getElementById('currentRoleBadge');
    if (badge) badge.textContent = state.currentUser.role || 'Admin';
  }

  updateHeaderDbBadge();
  switchModule('dashboard');
  fetchModules();
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

function canAccessModule(role, accessRoleStr) {
  if (!role) return false;
  const userRole = role.trim().toLowerCase();
  if (userRole === 'admin') return true; // Admin has full access to all modules
  if (!accessRoleStr) return false;
  const roles = accessRoleStr.split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
  return roles.includes(userRole);
}

async function fetchModules() {
  // 1. Try local Express API /api/modules
  if (!state.isStaticMode) {
    try {
      const res = await fetch('/api/modules');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.modules && json.modules.length > 0) {
          state.data.modules = json.modules;
          onModulesLoaded();
          return;
        }
      }
    } catch (e) {
      console.warn('Backend /api/modules unreachable, trying direct Supabase:', e.message);
    }
  }

  // 2. Direct Supabase REST API (for GitHub Pages / direct mode)
  try {
    const sbUrl = `${SUPABASE_CONFIG.url}/rest/v1/modules?select=*&order=order_num.asc`;
    const res = await fetch(sbUrl, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      state.data.modules = rows.map(m => ({
        ModuleID: m.moduleid || m.id,
        ModuleName: m.modulename,
        Category: m.category,
        Status: m.status,
        Icon: m.icon,
        AccessRole: m.accessrole,
        Order: m.order_num,
        Description: m.description
      }));
      onModulesLoaded();
      return;
    }
  } catch (err) {
    console.warn('Direct Supabase fetch failed, trying Google Sheets:', err.message);
  }

  // 3. Fallback to Google Sheets Modules sheet
  try {
    const sheetModules = await fetchGoogleSheetDirect('Modules');
    state.data.modules = sheetModules.map(m => ({
      ModuleID: m.ModuleID || m.moduleid,
      ModuleName: m.ModuleName || m.modulename,
      Category: m.Category || m.category,
      Status: m.Status || m.status,
      Icon: m.Icon || m.icon,
      AccessRole: m.AccessRole || m.accessrole,
      Order: m.Order || m.order_num,
      Description: m.Description || m.description
    }));
    onModulesLoaded();
  } catch (e) {
    console.error('All module sources failed:', e);
  }
}

function onModulesLoaded() {
  renderSidebarMenu();
  renderModulesGrid();
  populateCategoryFilter();
}

function renderSidebarMenu() {
  const sidebarNav = document.getElementById('sidebarNav');
  if (!sidebarNav) return;

  const currentRole = state.currentUser?.role || 'Admin';
  const modules = state.data.modules || [];

  // Filter modules by role
  const accessibleModules = modules.filter(m => canAccessModule(currentRole, m.AccessRole || ''));

  // Sort by order
  accessibleModules.sort((a, b) => {
    const oA = parseInt(a.Order || '99', 10) || 99;
    const oB = parseInt(b.Order || '99', 10) || 99;
    return oA - oB;
  });

  // Group by category
  const categories = {};
  accessibleModules.forEach(m => {
    const cat = m.Category || 'Umum';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(m);
  });

  // Preferred order of categories
  const categoryOrder = ['Sistem', 'Karyawan', 'Umrah', 'Haji', 'Marketing', 'Operasional', 'Keamanan', 'Keuangan', 'Pengaturan'];
  const allCatKeys = Object.keys(categories).sort((a, b) => {
    const idxA = categoryOrder.indexOf(a);
    const idxB = categoryOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  let html = '';
  allCatKeys.forEach(cat => {
    html += `<div class="nav-section-title">${cat}</div>`;
    categories[cat].forEach(m => {
      const isCurrentActive = state.activeModule === m.ModuleID || 
        (m.ModuleID === 'mod_dashboard' && state.activeModule === 'dashboard') ||
        (m.ModuleID === 'mod_data_jamaah' && state.activeModule === 'jamaah') ||
        (m.ModuleID === 'mod_logs' && state.activeModule === 'logs') ||
        (m.ModuleID === 'mod_users' && state.activeModule === 'users') ||
        (m.ModuleID === 'mod_cuti_karyawan' && state.activeModule === 'cuti_absensi');

      const icon = m.Icon || 'fa-solid fa-cube';
      const isInactive = (m.Status || '').toLowerCase() === 'inactive';

      html += `
        <a href="#${m.ModuleID}" class="nav-item ${isCurrentActive ? 'active' : ''}" data-module="${m.ModuleID}" data-tooltip="${m.ModuleName}">
          <i class="${icon} nav-icon"></i>
          <span class="nav-label">${m.ModuleName}</span>
          ${isInactive ? '<span class="menu-badge-inactive">Off</span>' : ''}
        </a>
      `;
    });
  });

  // If Admin, also ensure DB Settings is accessible
  if (currentRole.toLowerCase() === 'admin') {
    html += `
      <div class="nav-section-title">Konfigurasi</div>
      <a href="#settings" class="nav-item ${state.activeModule === 'settings' ? 'active' : ''}" data-module="settings" data-tooltip="Konfigurasi Database">
        <i class="fa-solid fa-database nav-icon"></i>
        <span class="nav-label">Konfigurasi DB</span>
      </a>
    `;
  }

  sidebarNav.innerHTML = html;
}

function renderModulesGrid() {
  const container = document.getElementById('modulesGridContainer');
  if (!container) return;

  const currentRole = state.currentUser?.role || 'Admin';
  const roleBadge = document.getElementById('currentRoleBadge');
  if (roleBadge) roleBadge.textContent = currentRole;
  const subtitle = document.getElementById('modulesRoleSubtitle');

  const modules = state.data.modules || [];
  const accessibleModules = modules.filter(m => canAccessModule(currentRole, m.AccessRole || ''));

  if (subtitle) {
    subtitle.innerHTML = `Menampilkan <strong>${accessibleModules.length} menu</strong> yang diizinkan untuk Role: <strong style="color:var(--gold-light);">${currentRole}</strong> (Tabel Modules)`;
  }

  // Filter by category
  let filtered = accessibleModules;
  if (state.selectedCategory && state.selectedCategory !== 'ALL') {
    filtered = filtered.filter(m => (m.Category || '').toLowerCase() === state.selectedCategory.toLowerCase());
  }

  // Filter by search query
  if (state.moduleSearchQuery) {
    filtered = filtered.filter(m => 
      (m.ModuleName || '').toLowerCase().includes(state.moduleSearchQuery) ||
      (m.Category || '').toLowerCase().includes(state.moduleSearchQuery) ||
      (m.Description || '').toLowerCase().includes(state.moduleSearchQuery)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 36px 20px; color:var(--text-muted); background:rgba(255,255,255,0.02); border-radius:var(--radius-md); border:1px dashed var(--border-subtle);">
        <i class="fa-solid fa-filter-circle-xmark" style="font-size:2rem; color:var(--gold-light); margin-bottom:10px;"></i>
        <div style="font-weight:600; color:var(--text-main);">Tidak ada menu yang sesuai kriteria pencarian</div>
        <div style="font-size:0.85rem; margin-top:4px;">Coba ubah kata kunci atau pilih kategori lain.</div>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(m => {
    const icon = m.Icon || 'fa-solid fa-cube';
    const statusClass = (m.Status || 'Active').toLowerCase() === 'active' ? 'active' : 'inactive';
    const statusText = (m.Status || 'Active').toLowerCase() === 'active' ? 'Aktif' : 'Non-Aktif';

    html += `
      <div class="module-card">
        <div class="module-card-top">
          <div class="module-card-icon">
            <i class="${icon}"></i>
          </div>
          <div class="module-card-info">
            <div class="module-card-name" title="${m.ModuleName}">${m.ModuleName}</div>
            <div class="module-card-badges">
              <span class="badge-category">${m.Category || 'Umum'}</span>
              <span class="badge-status ${statusClass}">${statusText}</span>
            </div>
          </div>
        </div>

        <div class="module-card-desc">
          ${m.Description || 'Modul operasional sistem PT. Fath Indah Travel Service.'}
        </div>

        <div class="module-card-footer">
          <span><i class="fa-solid fa-hashtag" style="font-size:0.7rem;"></i> ${m.ModuleID}</span>
          <button type="button" class="module-open-btn" onclick="switchModule('${m.ModuleID}')">
            <span>Buka Modul</span>
            <i class="fa-solid fa-arrow-right" style="font-size:0.75rem;"></i>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function populateCategoryFilter() {
  const select = document.getElementById('moduleCategoryFilter');
  if (!select) return;

  const currentRole = state.currentUser?.role || 'Admin';
  const accessibleModules = (state.data.modules || []).filter(m => canAccessModule(currentRole, m.AccessRole || ''));

  const cats = [...new Set(accessibleModules.map(m => m.Category).filter(Boolean))].sort();
  let html = '<option value="ALL">Semua Kategori</option>';
  cats.forEach(c => {
    html += `<option value="${c}" ${state.selectedCategory === c ? 'selected' : ''}>${c}</option>`;
  });
  select.innerHTML = html;
}

function renderDynamicModule(moduleId) {
  const container = document.getElementById('dynamicModuleContent');
  if (!container) return;

  const m = (state.data.modules || []).find(x => x.ModuleID === moduleId) || {
    ModuleID: moduleId,
    ModuleName: moduleId,
    Category: 'Operasional',
    Status: 'Active',
    Icon: 'fa-solid fa-cube',
    AccessRole: 'Admin',
    Description: 'Modul sistem PT. Fath Indah Travel Service.'
  };

  const statusClass = (m.Status || 'Active').toLowerCase() === 'active' ? 'active' : 'inactive';
  const statusText = (m.Status || 'Active').toLowerCase() === 'active' ? 'Status: Aktif' : 'Status: Non-Aktif';

  container.innerHTML = `
    <div class="dynamic-module-hero">
      <div class="dynamic-module-icon-large">
        <i class="${m.Icon || 'fa-solid fa-cube'}"></i>
      </div>
      <div>
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px; flex-wrap:wrap;">
          <h2 style="font-family:var(--font-heading); color:#ffffff; font-size:1.6rem; margin:0;">${m.ModuleName}</h2>
          <span class="badge-status ${statusClass}" style="font-size:0.75rem;">${statusText}</span>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <span class="badge-category">${m.Category}</span>
          <span style="color:var(--text-muted); font-size:0.85rem;">Kode Modul: <code>${m.ModuleID}</code></span>
          <span style="color:var(--text-muted); font-size:0.85rem;">• Hak Akses Role: <strong style="color:var(--gold-light);">${m.AccessRole || 'Semua Role'}</strong></span>
        </div>
      </div>
    </div>

    <div style="background:rgba(212,175,55,0.05); border:1px solid rgba(212,175,55,0.2); border-radius:var(--radius-md); padding:18px 20px; margin-bottom:24px;">
      <div style="font-size:0.8rem; color:var(--gold-light); text-transform:uppercase; font-weight:700; letter-spacing:0.5px; margin-bottom:6px;">
        <i class="fa-solid fa-circle-info"></i> Deskripsi & Tujuan Modul
      </div>
      <div style="font-size:0.95rem; color:var(--text-main); line-height:1.6;">
        ${m.Description || 'Modul ini terdaftar dalam Supabase Tabel Modules dan aktif dalam alur kerja operasional PT. Fath Indah Travel Service.'}
      </div>
    </div>

    <div class="dynamic-meta-grid">
      <div class="dynamic-meta-item">
        <div class="dynamic-meta-label">Kategori Sistem</div>
        <div class="dynamic-meta-val">${m.Category}</div>
      </div>
      <div class="dynamic-meta-item">
        <div class="dynamic-meta-label">ID Modul</div>
        <div class="dynamic-meta-val">${m.ModuleID}</div>
      </div>
      <div class="dynamic-meta-item">
        <div class="dynamic-meta-label">Urutan Tampilan</div>
        <div class="dynamic-meta-val">#${m.Order || '1'}</div>
      </div>
      <div class="dynamic-meta-item">
        <div class="dynamic-meta-label">Sumber Modul</div>
        <div class="dynamic-meta-val" style="color:#34d399;"><i class="fa-solid fa-database"></i> Supabase Modules</div>
      </div>
    </div>

    <div style="display:flex; gap:12px; margin-top:24px; flex-wrap:wrap;">
      <button type="button" class="btn-gold" onclick="alert('Modul ' + '${m.ModuleName}' + ' berhasil disinkronkan dengan data Supabase!')">
        <i class="fa-solid fa-rotate"></i> Sinkronisasi Data Modul
      </button>
      <button type="button" class="btn-secondary" onclick="switchModule('dashboard')">
        <i class="fa-solid fa-arrow-left"></i> Kembali ke Dashboard
      </button>
    </div>
  `;
}

function switchModule(moduleName) {
  state.activeModule = moduleName;

  // Map module aliases to existing views if applicable
  let viewId = moduleName;
  if (moduleName === 'mod_dashboard') viewId = 'dashboard';
  else if (moduleName === 'mod_data_jamaah' || moduleName === 'mod_form_input_jamaah') viewId = 'jamaah';
  else if (moduleName === 'mod_logs') viewId = 'logs';
  else if (moduleName === 'mod_users' || moduleName === 'mod_sistem_user') viewId = 'users';
  else if (moduleName === 'mod_cuti_karyawan' || moduleName === 'mod_attendance' || moduleName === 'mod_presensi' || moduleName === 'mod_data_attendance') viewId = 'cuti_absensi';
  else if (moduleName === 'mod_modules' || moduleName === 'settings') viewId = 'settings';

  // Highlight active nav item in sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-module') === moduleName || item.getAttribute('data-module') === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Hide all views
  document.querySelectorAll('.module-view').forEach(view => {
    view.classList.remove('active');
  });

  // Check if standard view exists
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
  } else {
    // Dynamic module view
    const dynamicView = document.getElementById('view-dynamic-module');
    if (dynamicView) {
      dynamicView.classList.add('active');
      renderDynamicModule(moduleName);
    }
  }

  // Update Header Titles
  const titles = {
    dashboard: { title: 'Dashboard Utama', breadcrumb: 'Portal Eksekutif / Ikhtisar Sistem' },
    jamaah: { title: 'Data Jamaah Umrah & Haji', breadcrumb: 'Manajemen Jamaah / Data Real-time Sheet Metadata' },
    logs: { title: 'Log Aktivitas Pengguna', breadcrumb: 'Audit Trail / Tabel ActivityLogs dengan Google Maps' },
    users: { title: 'Manajemen Pengguna', breadcrumb: 'Master Data / Otorisasi Tabel Users' },
    cuti_absensi: { title: 'Presensi & Cuti Karyawan', breadcrumb: 'SDM / Absensi & Pengajuan Cuti' },
    settings: { title: 'Konfigurasi Database', breadcrumb: 'Sistem / Pengalihan Google Sheets & Supabase' }
  };

  const foundMod = (state.data.modules || []).find(x => x.ModuleID === moduleName);
  const meta = titles[viewId] || { 
    title: foundMod ? foundMod.ModuleName : 'Modul ' + moduleName, 
    breadcrumb: foundMod ? `Modul Operasional / Kategori: ${foundMod.Category}` : 'PT. Fath Indah' 
  };

  if (moduleTitleEl) moduleTitleEl.textContent = meta.title;
  if (moduleBreadcrumbEl) moduleBreadcrumbEl.textContent = meta.breadcrumb;

  if (viewId === 'dashboard') renderDashboard();
  if (viewId === 'logs') renderLogsTable();
  if (viewId === 'jamaah') renderJamaahTable();
  if (viewId === 'users') renderUsersTable();
  if (viewId === 'cuti_absensi') renderCutiAbsensi();
  if (viewId === 'settings') renderSettings();
}

// ==========================================================================
// 5. DATA INGESTION
// ==========================================================================
async function loadAllModuleData() {
  fetchModules();

  if (state.isStaticMode) {
    // Direct Supabase REST API fetching (for GitHub Pages & Static Hosts)
    try {
      fetchSupabaseDirect('users').then(raw => {
        state.data.users = raw.map(u => ({
          ID: u.id || u.user_id,
          Username: u.username,
          FullName: u.full_name || u.nama,
          Role: u.role || u.jabatan,
          Kanwil: u.kanwil,
          Kantor: u.kantor,
          Status: u.status
        }));
        renderUsersTable();
        updateDashboardCounters();
      }).catch(e => console.warn('Supabase users error:', e));

      fetchSupabaseDirect('activity_logs', 'order=timestamp.desc&limit=150').then(logs => {
        const local = getLocalActivityLogs();
        state.data.logs = [...local, ...logs.map(l => ({
          LogID: l.logid || l.log_id || l.id,
          Timestamp: l.timestamp,
          Username: l.username,
          IP_Address: l.ip_address,
          Maps_URL: l.maps_url,
          Location: l.location,
          Action: l.action,
          Module: l.module
        }))];
        renderLogsTable();
        renderDashboard();
        updateDashboardCounters();
      }).catch(e => console.warn('Supabase logs error:', e));

      fetchSupabaseDirect('jamaah', 'limit=150').then(j => {
        state.data.jamaah = j;
        renderJamaahTable();
        updateDashboardCounters();
      }).catch(e => console.warn('Supabase jamaah error:', e));

      fetchSupabaseDirect('absensi', 'limit=100').then(a => {
        state.data.absensi = a;
        renderCutiAbsensi();
      }).catch(e => console.warn('Supabase absensi error:', e));

      fetchSupabaseDirect('cuti_karyawan', 'limit=100').then(c => {
        state.data.cuti = c;
        renderCutiAbsensi();
      }).catch(e => console.warn('Supabase cuti error:', e));

    } catch (e) {
      console.error('Error loading Supabase directly:', e);
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
    const name = (j.nama_lengkap || j['Nama Lengkap'] || '').toLowerCase();
    const id = (j.id_jamaah || j['ID Jamaah'] || '').toLowerCase();
    const ref = (j.referensi || j['Referensi'] || '').toLowerCase();
    const kota = (j.kabupaten_kota || j['Kabupaten / Kota'] || j.tempat_lahir || j['Tempat Lahir'] || '').toLowerCase();
    return name.includes(search) || id.includes(search) || ref.includes(search) || kota.includes(search);
  });

  const badge = document.getElementById('totalJamaahBadge');
  if (badge) badge.textContent = `${filtered.length} Jamaah`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">Tidak ada data jamaah.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.slice(0, 50).map(j => {
    const id = j.id_jamaah || j['ID Jamaah'] || j.id || '-';
    const nama = j.nama_lengkap || j['Nama Lengkap'] || '-';
    const jk = j.jenis_kelamin || j['Jenis Kelamin'] || '-';
    const paket = j.jenis_paket_umrah || j['Jenis Paket Umrah'] || j['Paket'] || 'Umrah Reguler';
    const kanwil = j.kantor_cabang || j['Kanwil'] || 'Pusat';
    const telp = j.nomor_seluler || j['Nomor Handphone'] || j['No Telp'] || '-';

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
      absensiTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">Memuat riwayat presensi Supabase...</td></tr>`;
    } else {
      absensiTbody.innerHTML = list.slice(0, 20).map(a => {
        const time = a.Timestamp || a.timestamp || a.Tanggal || '-';
        const user = a.NamaKaryawan || a.NamaUser || a.FULLNAME || a.Username || '-';
        const type = a.Tipe || a['Tipe Absen'] || 'Masuk';
        const status = a.Status || 'Tepat Waktu';
        const mapsUrl = a['Link Google Maps'] || a['Maps URL'] || '';
        return `
          <tr>
            <td>${time}</td>
            <td><strong>${user}</strong></td>
            <td><span class="badge badge-blue">${type}</span></td>
            <td>${status}</td>
            <td>
              ${mapsUrl ? `<a href="${mapsUrl}" target="_blank" class="map-link-btn"><i class="fa-solid fa-map-location-dot"></i> Maps</a>` : '-'}
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  const cutiTbody = document.getElementById('cutiTableBody');
  if (cutiTbody) {
    const list = state.data.cuti;
    if (list.length === 0) {
      cutiTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">Memuat riwayat cuti Supabase...</td></tr>`;
    } else {
      cutiTbody.innerHTML = list.slice(0, 20).map(c => {
        const id = c.cutiid || c.CutiID || '-';
        const name = c.namakaryawan || c.NamaKaryawan || '-';
        const type = c.tipecuti || c.TipeCuti || 'Cuti Tahunan';
        const start = c.tanggalmulai || c.TanggalMulai || '-';
        const end = c.tanggalselesai || c.TanggalSelesai || '-';
        const status = c.statusapproval || 'Disetujui';
        return `
          <tr>
            <td><strong>${id}</strong></td>
            <td>${name}</td>
            <td><span class="badge badge-gold">${type}</span></td>
            <td>${start} s/d ${end}</td>
            <td><span class="badge badge-success">${status}</span></td>
          </tr>
        `;
      }).join('');
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
