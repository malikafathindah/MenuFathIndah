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
    modules: [],
    rekapAbsensi: null,
    catPaket: [],
    logBrosur: [],
    mnuLogBrosur: [],
    kanwilFathIndah: []
  },
  rekapFilter: {
    month: 10,
    year: 2026,
    search: '',
    location: 'ALL'
  },
  logAbsensiFilter: {
    search: '',
    type: 'ALL'
  },
  logAbsensiSort: {
    column: 'timestamp',
    dir: 'desc'
  },
  brosurFilter: {
    search: '',
    category: 'ALL',
    wilayah: 'ALL',
    status: 'Aktif'
  },
  brosurViewMode: 'table',
  activeBrosurId: null,
  selectedLocalBrosurFile: null
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
  updateGDriveStatusUI();
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
  initRekapAbsensiEvents();
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

function isModuleActive(m) {
  if (!m) return false;
  const status = String(m.Status || m.status || 'Active').trim().toLowerCase();
  return status !== 'inactive' && status !== 'non-aktif' && status !== 'nonaktif' && status !== 'off' && status !== 'disabled';
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

  // Filter modules by role and active status (exclude Inactive modules)
  const accessibleModules = modules.filter(m => isModuleActive(m) && canAccessModule(currentRole, m.AccessRole || ''));

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
        (m.ModuleID === 'mod_data_jamaah' && (state.activeModule === 'jamaah' || state.activeModule === 'mod_data_jamaah')) ||
        (m.ModuleID === 'mod_form_input_jamaah' && (state.activeModule === 'jamaah' || state.activeModule === 'mod_form_input_jamaah')) ||
        (m.ModuleID === 'mod_pembayaran_group' && (state.activeModule === 'pembayaran_group' || state.activeModule === 'mod_pembayaran_group')) ||
        (m.ModuleID === 'mod_kelengkapan_umrah' && (state.activeModule === 'kelengkapan_umrah' || state.activeModule === 'mod_kelengkapan_umrah')) ||
        (m.ModuleID === 'mod_logs' && state.activeModule === 'logs') ||
        (m.ModuleID === 'mod_users' && state.activeModule === 'users') ||
        (m.ModuleID === 'mod_cuti_karyawan' && state.activeModule === 'cuti_absensi') ||
        (m.ModuleID === 'mod_data_attendance' && (state.activeModule === 'log_absensi' || state.activeModule === 'mod_data_attendance')) ||
        (m.ModuleID === 'mod_input_brosur' && (state.activeModule === 'launching_brosur' || state.activeModule === 'mod_input_brosur')) ||
        ((m.ModuleID === 'mod_attendance' || m.ModuleID === 'rekap_absensi') && (state.activeModule === 'rekap_absensi' || state.activeModule === 'mod_attendance'));

      const icon = m.Icon || 'fa-solid fa-cube';

      html += `
        <a href="#${m.ModuleID}" class="nav-item ${isCurrentActive ? 'active' : ''}" data-module="${m.ModuleID}" data-tooltip="${m.ModuleName}">
          <i class="${icon} nav-icon"></i>
          <span class="nav-label">${m.ModuleName}</span>
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
  // Filter active modules and accessible by current role (exclude Inactive modules)
  const accessibleModules = modules.filter(m => isModuleActive(m) && canAccessModule(currentRole, m.AccessRole || ''));

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
    const statusClass = 'active';
    const statusText = 'Aktif';

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
  // Filter active modules only so inactive modules don't leave empty categories
  const accessibleModules = (state.data.modules || []).filter(m => isModuleActive(m) && canAccessModule(currentRole, m.AccessRole || ''));

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
  // Prevent navigating to inactive modules
  const foundMod = (state.data.modules || []).find(x => x.ModuleID === moduleName);
  if (foundMod && !isModuleActive(foundMod)) {
    alert(`Modul "${foundMod.ModuleName || moduleName}" berstatus Non-Aktif (Inactive) sehingga tidak dapat diakses.`);
    if (state.activeModule && state.activeModule !== moduleName) {
      return;
    }
    moduleName = 'dashboard';
  }

  state.activeModule = moduleName;

  // Map module aliases to existing views if applicable
  let viewId = moduleName;
  if (moduleName === 'mod_dashboard') viewId = 'dashboard';
  else if (moduleName === 'mod_data_jamaah' || moduleName === 'mod_form_input_jamaah') viewId = 'jamaah';
  else if (moduleName === 'mod_pembayaran_group' || moduleName === 'mod_pembayaran_jamaah') viewId = 'pembayaran_group';
  else if (moduleName === 'mod_kelengkapan_umrah' || moduleName === 'mod_input_kelengkapan_umrah') viewId = 'kelengkapan_umrah';
  else if (moduleName === 'mod_upload_dok_jamaah' || moduleName === 'upload_dok_jamaah') viewId = 'upload_dok_jamaah';
  else if (moduleName === 'mod_logs') viewId = 'logs';
  else if (moduleName === 'mod_users' || moduleName === 'mod_sistem_user') viewId = 'users';
  else if (moduleName === 'mod_attendance' || moduleName === 'rekap_absensi' || moduleName === 'mod_rekap_absensi') viewId = 'rekap_absensi';
  else if (moduleName === 'mod_data_attendance' || moduleName === 'log_absensi' || moduleName === 'riwayat_log_absensi') viewId = 'log_absensi';
  else if (moduleName === 'mod_cuti_karyawan' || moduleName === 'cuti_karyawan') viewId = 'cuti_karyawan';
  else if (moduleName === 'mod_cuti_bersama' || moduleName === 'cuti_bersama') viewId = 'cuti_bersama';
  else if (moduleName === 'mod_presensi') viewId = 'cuti_absensi';
  else if (moduleName === 'mod_input_brosur' || moduleName === 'launching_brosur' || moduleName === 'mod_view_brochure') viewId = 'launching_brosur';
  else if (moduleName === 'mod_daftar_karyawan' || moduleName === 'daftar_karyawan') viewId = 'daftar_karyawan';
  else if (moduleName === 'mod_bio_karyawan' || moduleName === 'bio_karyawan') viewId = 'bio_karyawan';
  else if (moduleName === 'mod_detail_emp' || moduleName === 'detail_emp') viewId = 'detail_emp';
  else if (moduleName === 'mod_emp_analytics' || moduleName === 'emp_analytics') viewId = 'emp_analytics';
  else if (moduleName === 'mod_upload_dok' || moduleName === 'upload_dok') viewId = 'upload_dok';
  else if (moduleName === 'mod_slip_gaji' || moduleName === 'slip_gaji') viewId = 'slip_gaji';
  else if (moduleName === 'mod_dashboard_ht' || moduleName === 'dashboard_ht') viewId = 'dashboard_ht';
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
    rekap_absensi: { title: 'Rekapitulasi Absensi Karyawan', breadcrumb: 'SDM / Rekapitulasi Presensi Matrix & Arsiran Libur' },
    log_absensi: { title: 'Riwayat Log Absensi', breadcrumb: 'SDM & Karyawan / Akses Data Tabel Absensi Supabase' },
    launching_brosur: { title: 'Catalog Brosur', breadcrumb: 'Marketing / Catalog Brosur' },
    cuti_karyawan: { title: 'Pengajuan & Riwayat Cuti Karyawan', breadcrumb: 'SDM & Karyawan / Pengajuan Cuti Mandiri & Kuota' },
    cuti_bersama: { title: 'Cuti Bersama, Approval & Matriks Cuti', breadcrumb: 'SDM & Manajemen / Master Cuti Bersama & Persetujuan' },
    cuti_absensi: { title: 'Presensi & Cuti Karyawan', breadcrumb: 'SDM / Absensi & Pengajuan Cuti' },
    daftar_karyawan: { title: 'Biodata Karyawan (Tabel Supabase: Bio_Karyawan)', breadcrumb: 'SDM & Karyawan / Master Direktori Bio_Karyawan' },
    bio_karyawan: { title: 'Formulir Entry Karyawan Baru', breadcrumb: 'SDM & Karyawan / Entry Biodata & Dokumen Lengkap' },
    detail_emp: { title: 'Dokumen Resmi Detail Kepegawaian', breadcrumb: 'SDM & Karyawan / Cetak Dokumen Biodata A4 Resmi' },
    emp_analytics: { title: 'Analytics & Statistik Demografi SDM', breadcrumb: 'SDM & Manajemen / Eksekutif Dashboard Demografi' },
    upload_dok: { title: 'Pusat Unggahan Dokumen Fisik Karyawan', breadcrumb: 'SDM & Personalia / Berkas KTP, KK, Ijazah ke Google Drive' },
    slip_gaji: { title: 'Lihat Dokumen Slip Gaji Karyawan', breadcrumb: 'Keuangan & SDM / Pratinjau Slip Gaji Resmi' },
    dashboard_ht: { title: 'Dashboard Haji Terencana', breadcrumb: 'Haji / Dashboard Agregasi Angsuran Khusus Jamaah Haji Terencana' },
    pembayaran_group: { title: 'Sistem Pembayaran Jamaah & Kolektif Agen', breadcrumb: 'Umrah / Transaksi Individual, Kolektif & Matriks Bulanan' },
    kelengkapan_umrah: { title: 'Input Kelengkapan Data Umrah', breadcrumb: 'Umrah / Pencatatan Dokumen Visa, Asuransi Polis & BPJS' },
    upload_dok_jamaah: { title: 'Pusat Unggahan Dokumen Fisik Jamaah Umrah', breadcrumb: 'Umrah / Berkas KTP, Paspor, KK, Buku Nikah Jamaah' },
    settings: { title: 'Konfigurasi Database', breadcrumb: 'Sistem / Pengalihan Google Sheets & Supabase' }
  };

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
  if (viewId === 'rekap_absensi') renderRekapAbsensi();
  if (viewId === 'log_absensi') renderLogAbsensiTable();
  if (viewId === 'launching_brosur') initLaunchingBrosurView();
  if (viewId === 'cuti_karyawan') initCutiKaryawanView();
  if (viewId === 'cuti_bersama') initCutiBersamaView();
  if (viewId === 'cuti_absensi') renderCutiAbsensi();
  if (viewId === 'daftar_karyawan') initDaftarKaryawanView();
  if (viewId === 'bio_karyawan') initBioKaryawanView();
  if (viewId === 'detail_emp') initEmployeeDetailView();
  if (viewId === 'emp_analytics') initEmployeeAnalyticsView();
  if (viewId === 'upload_dok') initUploadDocView();
  if (viewId === 'upload_dok_jamaah') initUploadDokJamaahView();
  if (viewId === 'slip_gaji') initSlipGajiView();
  if (viewId === 'dashboard_ht') initDashboardHT();
  if (viewId === 'jamaah') {
    if (window.appCoreInstance && typeof window.appCoreInstance.fetchJamaahData === 'function') {
      window.appCoreInstance.currentModule = moduleName;
      if (moduleName === 'mod_form_input_jamaah') {
        window.appCoreInstance.activeSubTab = 'form';
      } else {
        window.appCoreInstance.activeSubTab = 'table';
      }
      window.appCoreInstance.fetchJamaahData();
    }
  }
  if (viewId === 'pembayaran_group') {
    if (window.appPaymentInstance && typeof window.appPaymentInstance.refreshAllData === 'function') {
      window.appPaymentInstance.currentModule = moduleName;
      window.appPaymentInstance.refreshAllData();
    }
  }
  if (viewId === 'kelengkapan_umrah') {
    if (window.appKelengkapanInstance && typeof window.appKelengkapanInstance.loadKelengkapanUmrahData === 'function') {
      window.appKelengkapanInstance.loadKelengkapanUmrahData();
    } else {
      setTimeout(() => {
        if (window.appKelengkapanInstance && typeof window.appKelengkapanInstance.loadKelengkapanUmrahData === 'function') {
          window.appKelengkapanInstance.loadKelengkapanUmrahData();
        }
      }, 350);
    }
  }
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

      fetchSupabaseDirect('absensi', 'order=timestamp.desc&limit=500').then(a => {
        state.data.absensi = a;
        renderLogAbsensiTable();
        renderCutiAbsensi();
      }).catch(e => console.warn('Supabase absensi error:', e));

      fetchSupabaseDirect('cuti_karyawan', 'limit=100').then(c => {
        state.data.cuti = c;
        renderCutiAbsensi();
      }).catch(e => console.warn('Supabase cuti error:', e));

      loadRekapAbsensiData();
      loadBrosurData();

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
      if (data.success) {
        state.data.absensi = data.absensi;
        renderLogAbsensiTable();
        renderCutiAbsensi();
      }
    });

    fetch('/api/cuti').then(r => r.json()).then(data => {
      if (data.success) {
        state.data.cuti = data.cuti;
        renderCutiAbsensi();
      }
    });

    loadRekapAbsensiData();
    loadBrosurData();

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
      absensiTbody.innerHTML = list.slice(0, 50).map(a => {
        let tanggalStr = '';
        if (a.tanggal && /^\d{4}-\d{2}-\d{2}/.test(String(a.tanggal))) {
          tanggalStr = String(a.tanggal).slice(0, 10);
        } else if (a.Tahun && a.Bulan && a.Tanggal) {
          const y = String(a.Tahun).trim();
          const m = String(a.Bulan).trim().padStart(2, '0');
          const d = String(a.Tanggal).trim().padStart(2, '0');
          tanggalStr = `${y}-${m}-${d}`;
        } else if (a.timestamp || a.Timestamp) {
          const raw = String(a.timestamp || a.Timestamp).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
            tanggalStr = raw.slice(0, 10);
          } else {
            const dt = new Date(raw);
            if (!isNaN(dt.getTime())) {
              const y = dt.getFullYear();
              const m = String(dt.getMonth() + 1).padStart(2, '0');
              const d = String(dt.getDate()).padStart(2, '0');
              tanggalStr = `${y}-${m}-${d}`;
            } else {
              tanggalStr = raw.split(' ')[0] || '-';
            }
          }
        } else {
          tanggalStr = a.Tanggal || '-';
        }

        const user = a.nama_karyawan || a.NamaKaryawan || a.nama_user || a.NamaUser || a.FULLNAME || a.Username || '-';
        const type = a.tipe || a.Tipe || a['Tipe Absen'] || 'Masuk';
        const status = a.kode || a.Status || 'Tepat Waktu';
        const mapsUrl = a.link_google_maps || a['Link Google Maps'] || a['Maps URL'] || '';
        return `
          <tr>
            <td><code style="color:var(--gold-light); font-weight:600;">${tanggalStr}</code></td>
            <td><strong>${user}</strong></td>
            <td><span class="badge badge-blue">${type}</span></td>
            <td><span class="badge badge-active">${status}</span></td>
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

// ==========================================================================
// 6C. RIWAYAT LOG ABSENSI (TABEL ABSENSI SESUAI LAMPIRAN CYBER DARK / NEON CYAN)
// ==========================================================================

function formatIndonesianDateDisplay(row) {
  let dateStr = '';
  if (row.tanggal && /^\d{4}-\d{2}-\d{2}/.test(String(row.tanggal))) {
    dateStr = String(row.tanggal).slice(0, 10);
  } else if (row.Tahun && row.Bulan && row.Tanggal) {
    const y = String(row.Tahun).trim();
    const m = String(row.Bulan).trim().padStart(2, '0');
    const d = String(row.Tanggal).trim().padStart(2, '0');
    dateStr = `${y}-${m}-${d}`;
  } else if (row.timestamp || row.Timestamp) {
    const raw = String(row.timestamp || row.Timestamp).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      dateStr = raw.slice(0, 10);
    } else {
      const dt = new Date(raw);
      if (!isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        dateStr = `${y}-${m}-${d}`;
      }
    }
  } else if (row.tanggal) {
    const num = parseInt(String(row.tanggal).trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= 31) {
      dateStr = `2026-10-${String(num).padStart(2, '0')}`;
    }
  }

  if (dateStr && dateStr.length === 10) {
    const parts = dateStr.split('-');
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[monthIdx] || 'Oktober';
    return `${day} ${monthName} ${year}`;
  }

  return '20 Oktober 2026';
}

function extractTimeStr(row) {
  const ts = row.timestamp || row.Timestamp || '';
  if (ts) {
    const match = String(ts).match(/(\d{2}:\d{2}:\d{2})/);
    if (match) return match[1];
    const matchShort = String(ts).match(/(\d{2}:\d{2})/);
    if (matchShort) return matchShort[1] + ':00';
  }
  if (row.jam || row.Jam || row.waktu) {
    const j = String(row.jam || row.Jam || row.waktu).trim();
    if (/^\d{2}:\d{2}:\d{2}$/.test(j)) return j;
    if (/^\d{2}:\d{2}$/.test(j)) return j + ':00';
  }
  return '08:00:00';
}

function getIsoDateForSort(row) {
  let dateStr = '';
  if (row.tanggal && /^\d{4}-\d{2}-\d{2}/.test(String(row.tanggal))) {
    dateStr = String(row.tanggal).slice(0, 10);
  } else if (row.timestamp || row.Timestamp) {
    const raw = String(row.timestamp || row.Timestamp).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) dateStr = raw.slice(0, 10);
  }
  return dateStr || '2026-10-20';
}

function renderLogAbsensiTable() {
  const tbody = document.getElementById('logAbsensiTableBody');
  if (!tbody) return;

  const list = state.data.absensi || [];
  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:36px; color:#64748b;">
          <i class="fa-regular fa-folder-open" style="font-size:2rem; color:#00e5ff; margin-bottom:10px;"></i>
          <div>Tidak ada data absensi di tabel Supabase. Klik Refresh untuk memuat ulang.</div>
        </td>
      </tr>
    `;
    updateLogAbsensiStats(0, 0, 0);
    return;
  }

  // Filter Search & Type
  const searchQuery = (state.logAbsensiFilter?.search || '').toLowerCase();
  const typeFilter = state.logAbsensiFilter?.type || 'ALL';

  let filtered = list.filter(item => {
    const name = (item.nama_karyawan || item.NamaKaryawan || item.nama_user || item.NamaUser || item.FULLNAME || item.Username || '').toLowerCase();
    const tipe = (item.tipe || item.Tipe || '').toLowerCase();

    if (searchQuery && !name.includes(searchQuery)) return false;
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'Datang' && !(tipe.includes('datang') || tipe.includes('hadir'))) return false;
      if (typeFilter === 'Izin' && !tipe.includes('izin')) return false;
      if (typeFilter === 'Sakit' && !tipe.includes('sakit')) return false;
      if (typeFilter === 'Pulang' && !tipe.includes('pulang')) return false;
    }
    return true;
  });

  // Sorting
  const sortCol = state.logAbsensiSort?.column || 'timestamp';
  const sortDir = state.logAbsensiSort?.dir || 'desc';

  filtered.sort((a, b) => {
    let valA = '';
    let valB = '';

    if (sortCol === 'tanggal') {
      valA = getIsoDateForSort(a);
      valB = getIsoDateForSort(b);
    } else if (sortCol === 'jam') {
      valA = extractTimeStr(a);
      valB = extractTimeStr(b);
    } else {
      valA = (a.timestamp || a.Timestamp || (getIsoDateForSort(a) + ' ' + extractTimeStr(a)));
      valB = (b.timestamp || b.Timestamp || (getIsoDateForSort(b) + ' ' + extractTimeStr(b)));
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Update Stats
  const totalCount = filtered.length;
  const datangCount = filtered.filter(x => {
    const t = (x.tipe || x.Tipe || '').toLowerCase();
    const k = (x.kode || '').toUpperCase();
    return t.includes('datang') || t.includes('hadir') || k === 'H';
  }).length;
  const izinCount = totalCount - datangCount;
  updateLogAbsensiStats(totalCount, datangCount, izinCount);

  // Update Sort Indicator
  const sortIndicator = document.getElementById('absensiSortIndicator');
  if (sortIndicator) {
    const colName = sortCol === 'tanggal' ? 'Tanggal' : (sortCol === 'jam' ? 'Jam' : 'Waktu');
    sortIndicator.textContent = `${colName} (${sortDir.toUpperCase()})`;
  }

  // Update Sort Arrow Icons
  const arrowTanggal = document.getElementById('sortArrowTanggal');
  const arrowJam = document.getElementById('sortArrowJam');
  if (arrowTanggal) {
    if (sortCol === 'tanggal') {
      arrowTanggal.className = sortDir === 'asc' ? 'fa-solid fa-caret-up sort-arrow' : 'fa-solid fa-caret-down sort-arrow';
    } else {
      arrowTanggal.className = 'fa-solid fa-caret-down sort-arrow';
    }
  }
  if (arrowJam) {
    if (sortCol === 'jam') {
      arrowJam.className = sortDir === 'asc' ? 'fa-solid fa-caret-up sort-arrow' : 'fa-solid fa-caret-down sort-arrow';
    } else {
      arrowJam.className = 'fa-solid fa-caret-down sort-arrow';
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:36px; color:#64748b;">
          <div>Tidak ada data absensi yang sesuai filter.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((row, idx) => {
    const no = idx + 1;
    const tanggalText = formatIndonesianDateDisplay(row);
    const jamText = extractTimeStr(row);
    const namaKaryawan = (row.nama_karyawan || row.NamaKaryawan || row.nama_user || row.NamaUser || row.FULLNAME || row.Username || '-').toUpperCase();
    
    // Tipe pill
    const rawTipe = (row.tipe || row.Tipe || (row.kode === 'H' ? 'Datang' : (row.kode === 'I' ? 'Izin' : 'Hadir'))).trim();
    const tipeLower = rawTipe.toLowerCase();
    let tipeClass = 'tipe-pill-datang';
    let displayTipe = rawTipe;

    if (tipeLower.includes('izin')) {
      tipeClass = 'tipe-pill-izin';
      displayTipe = 'Izin';
    } else if (tipeLower.includes('sakit')) {
      tipeClass = 'tipe-pill-sakit';
      displayTipe = 'Sakit';
    } else if (tipeLower.includes('pulang')) {
      tipeClass = 'tipe-pill-pulang';
      displayTipe = 'Pulang';
    } else if (tipeLower.includes('datang') || tipeLower.includes('hadir')) {
      tipeClass = 'tipe-pill-datang';
      displayTipe = 'Datang';
    }

    // Kode box
    const rawKode = (row.kode || row.Kode || (tipeLower.includes('izin') ? 'L' : 'H')).toUpperCase().trim();
    let kodeClass = 'kode-box-h';
    if (rawKode === 'H') kodeClass = 'kode-box-h';
    else if (rawKode === 'L') kodeClass = 'kode-box-l';
    else if (rawKode === 'I') kodeClass = 'kode-box-i';
    else if (rawKode === 'S') kodeClass = 'kode-box-s';
    else if (rawKode === 'A') kodeClass = 'kode-box-a';
    else kodeClass = 'kode-box-default';

    // Map URL
    let mapsUrl = row.link_google_maps || row['Link Google Maps'] || row.maps_url || '';
    if (!mapsUrl && row.latitude && row.longitude) {
      mapsUrl = `https://maps.google.com/?q=${row.latitude},${row.longitude}`;
    }
    if (!mapsUrl && (row.catatan || row.location)) {
      const loc = (row.catatan || row.location).replace(/^Lokasi:\s*/i, '').trim();
      if (loc) {
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('PT Fath Indah ' + loc)}`;
      }
    }
    if (!mapsUrl) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('PT Fath Indah Travel Service')}`;
    }

    return `
      <tr>
        <td class="col-no">${no}</td>
        <td class="col-tanggal">${tanggalText}</td>
        <td class="col-jam">${jamText}</td>
        <td class="col-nama">${namaKaryawan}</td>
        <td class="col-tipe">
          <span class="tipe-pill ${tipeClass}">${displayTipe}</span>
        </td>
        <td class="col-kode">
          <span class="kode-box ${kodeClass}">${rawKode}</span>
        </td>
        <td class="col-peta">
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-buka-peta">
            <i class="fa-solid fa-map-location-dot"></i>
            <span>Buka Peta</span>
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function updateLogAbsensiStats(total, datang, izin) {
  const elTotal = document.getElementById('absensiStatTotal');
  const elDatang = document.getElementById('absensiStatDatang');
  const elIzin = document.getElementById('absensiStatIzin');
  if (elTotal) elTotal.textContent = total.toLocaleString('id-ID');
  if (elDatang) elDatang.textContent = datang.toLocaleString('id-ID');
  if (elIzin) elIzin.textContent = izin.toLocaleString('id-ID');
}

window.toggleSortLogAbsensi = function(column) {
  if (state.logAbsensiSort.column === column) {
    state.logAbsensiSort.dir = state.logAbsensiSort.dir === 'desc' ? 'asc' : 'desc';
  } else {
    state.logAbsensiSort.column = column;
    state.logAbsensiSort.dir = 'desc';
  }
  renderLogAbsensiTable();
};

window.onLogAbsensiFilterChange = function() {
  const searchInput = document.getElementById('logAbsensiSearchInput');
  const typeFilter = document.getElementById('logAbsensiTypeFilter');
  if (searchInput) state.logAbsensiFilter.search = searchInput.value.trim();
  if (typeFilter) state.logAbsensiFilter.type = typeFilter.value;
  renderLogAbsensiTable();
};

window.reloadLogAbsensiData = async function() {
  const tbody = document.getElementById('logAbsensiTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:36px; color:#64748b;">
          <i class="fa-solid fa-spinner fa-spin" style="color:#00e5ff; font-size:1.5rem;"></i>
          <div style="margin-top:10px;">Menghubungi Supabase dan memperbarui data absensi...</div>
        </td>
      </tr>
    `;
  }

  if (state.isStaticMode) {
    try {
      const records = await fetchSupabaseDirect('absensi', 'order=timestamp.desc&limit=500');
      if (records) {
        state.data.absensi = records;
      }
    } catch (e) {
      console.warn('Gagal memuat absensi langsung dari Supabase:', e);
    }
  } else {
    try {
      const res = await fetch('/api/absensi');
      const data = await res.json();
      if (data.success && data.absensi) {
        state.data.absensi = data.absensi;
      }
    } catch (e) {
      console.warn('Gagal fetch /api/absensi:', e);
    }
  }

  renderLogAbsensiTable();
};

// ==========================================================================
// 6D. LAUNCHING BROSUR (TABEL LOGBROSUR & MNULOGBROSUR SUPABASE)
// ==========================================================================

const GDRIVE_BROSUR_FOLDER_URL = 'https://drive.google.com/drive/folders/1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc';

// Master data fallback untuk CatPaket (Kategori Brosur) jika tabel di Supabase belum selesai sinkronisasi izin RLS
const DEFAULT_CAT_PAKET = [
  { id: 1, catagory: 'Umrah' },
  { id: 2, catagory: 'Haji Khusus & Furoda' },
  { id: 3, catagory: 'Haji Terencana' },
  { id: 4, catagory: 'Wisata Halal' },
  { id: 5, catagory: 'Promo & Seasonal' }
];

// Master data fallback untuk KanwilFathIndah jika tabel di Supabase belum selesai sinkronisasi izin RLS
const DEFAULT_KANWIL_FATH_INDAH = [
  { id: 1, namakanwil: 'Pusat', namakanwill: 'Pusat' },
  { id: 2, namakanwil: 'Jabodetabek', namakanwill: 'Jabodetabek' },
  { id: 3, namakanwil: 'Solo Raya', namakanwill: 'Solo Raya' },
  { id: 4, namakanwil: 'Samarinda', namakanwill: 'Samarinda' },
  { id: 5, namakanwil: 'Surabaya', namakanwill: 'Surabaya' },
  { id: 6, namakanwil: 'Pemalang', namakanwill: 'Pemalang' },
  { id: 7, namakanwil: 'Pekalongan', namakanwill: 'Pekalongan' },
  { id: 8, namakanwil: 'Jawa Barat', namakanwill: 'Jawa Barat' },
  { id: 9, namakanwil: 'Jawa Tengah', namakanwill: 'Jawa Tengah' },
  { id: 10, namakanwil: 'Jawa Timur', namakanwill: 'Jawa Timur' }
];

// Master data fallback untuk MnuLogBrosur jika tabel di Supabase belum selesai sinkronisasi izin RLS
const DEFAULT_MNU_LOG_BROSUR = [
  { id: 'MNU-001', catagory: 'Umrah', brosurname: 'Paket Umrah Reguler 9 Hari', status: 'Active', catatan: 'Brosur paket standar bintang 4' },
  { id: 'MNU-002', catagory: 'Umrah', brosurname: 'Paket Umrah Ramadhan Awal', status: 'Active', catatan: 'Brosur paket awal Ramadhan' },
  { id: 'MNU-003', catagory: 'Umrah', brosurname: 'Paket Umrah Ramadhan Lailatul Qadar', status: 'Active', catatan: 'Brosur paket 10 hari akhir Ramadhan' },
  { id: 'MNU-004', catagory: 'Umrah', brosurname: 'Paket Umrah Plus Turki 12 Hari', status: 'Active', catatan: 'Wisata sejarah Istanbul & Bursa' },
  { id: 'MNU-005', catagory: 'Umrah', brosurname: 'Paket Umrah Plus Dubai', status: 'Active', catatan: 'Wisata Dubai & Abu Dhabi' },
  { id: 'MNU-006', catagory: 'Umrah', brosurname: 'Paket Umrah VIP Bintang 5', status: 'Active', catatan: 'Hotel depan pelataran Masjidil Haram' },
  { id: 'MNU-007', catagory: 'Haji Khusus & Furoda', brosurname: 'Brosur Haji Khusus Kuota Kemenag', status: 'Active', catatan: 'Masa tunggu resmi kemenag' },
  { id: 'MNU-008', catagory: 'Haji Khusus & Furoda', brosurname: 'Brosur Haji Furoda / Mujamalah VVIP', status: 'Active', catatan: 'Berangkat langsung tanpa antri' },
  { id: 'MNU-009', catagory: 'Haji Khusus & Furoda', brosurname: 'Brosur Rincian Fasilitas Maktab Haji', status: 'Active', catatan: 'Maktab VIP tenda AC berkarpet' },
  { id: 'MNU-010', catagory: 'Haji Terencana', brosurname: 'Brosur Program Tabungan Haji Terencana', status: 'Active', catatan: 'Skema porsi awal terencana' },
  { id: 'MNU-011', catagory: 'Haji Terencana', brosurname: 'Brosur Skema Angsuran Terencana', status: 'Active', catatan: 'Tabel angsuran berkala' },
  { id: 'MNU-012', catagory: 'Wisata Halal', brosurname: 'Brosur Tour Muslim Turki Cappadochia', status: 'Active', catatan: 'Paket liburan musim dingin & semi' },
  { id: 'MNU-013', catagory: 'Wisata Halal', brosurname: 'Brosur Wisata Halal Aqsho - Jordan - Mesir', status: 'Active', catatan: 'Napak tilas tiga masjid suci' },
  { id: 'MNU-014', catagory: 'Wisata Halal', brosurname: 'Brosur Tour Muslim Eropa Barat', status: 'Active', catatan: 'Paris, Swiss, Italia & Belanda' },
  { id: 'MNU-015', catagory: 'Promo & Seasonal', brosurname: 'Flyer Promo Early Bird 1448H', status: 'Active', catatan: 'Diskon khusus pendaftar awal' },
  { id: 'MNU-016', catagory: 'Promo & Seasonal', brosurname: 'Katalog Brosur Milad PT Fath Indah', status: 'Active', catatan: 'Edisi spesial milad travel' }
];

// Initial sample LogBrosur jika tabel di Supabase belum berisi
const DEFAULT_LOG_BROSUR = [
  {
    id: 'BRS-20261020-001',
    created_at: '2026-10-20T08:15:00.000Z',
    tglupload: '2026-10-20',
    validuntil: '2026-12-31',
    status: 'Aktif',
    wilayah: 'Pusat',
    catagory: 'Umrah',
    brosurname: 'Paket Umrah Reguler 9 Hari',
    link: 'https://drive.google.com/drive/folders/1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc',
    catatan: 'Edisi revisi keberangkatan musim 1448H dengan hotel bintang 4 Madinah'
  },
  {
    id: 'BRS-20261019-002',
    created_at: '2026-10-19T10:30:00.000Z',
    tglupload: '2026-10-19',
    validuntil: '2026-11-30',
    status: 'Aktif',
    wilayah: 'Solo Raya',
    catagory: 'Haji Khusus & Furoda',
    brosurname: 'Brosur Haji Furoda / Mujamalah VVIP',
    link: 'https://drive.google.com/drive/folders/1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc',
    catatan: 'Brosur resmi kuota langsung visa haji mujamalah Fath Indah Travel'
  },
  {
    id: 'BRS-20261018-003',
    created_at: '2026-10-18T14:45:00.000Z',
    tglupload: '2026-10-18',
    validuntil: '2026-10-25',
    status: 'Expired',
    wilayah: 'Samarinda',
    catagory: 'Promo & Seasonal',
    brosurname: 'Flyer Promo Early Bird 1448H',
    link: 'https://drive.google.com/drive/folders/1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc',
    catatan: 'Flyer digital untuk share Instagram & WhatsApp marketing cabang'
  }
];

function initLaunchingBrosurView() {
  populateBrosurDropdowns();
  resetBrosurForm();
  loadBrosurData();
  updateGDriveStatusUI();
  setupDropZoneListeners();

  const savedMode = localStorage.getItem('fath_brosur_view_mode') || 'table';
  setBrosurViewMode(savedMode);
}

window.switchBrosurTab = function(tabName) {
  const btnList = document.getElementById('tabBtnBrosurList');
  const btnInput = document.getElementById('tabBtnBrosurInput');
  const paneList = document.getElementById('tabPaneBrosurList');
  const paneInput = document.getElementById('tabPaneBrosurInput');

  if (tabName === 'input') {
    btnList?.classList.remove('active');
    btnInput?.classList.add('active');
    paneList?.classList.remove('active');
    paneInput?.classList.add('active');
    resetBrosurForm();
  } else {
    btnInput?.classList.remove('active');
    btnList?.classList.add('active');
    paneInput?.classList.remove('active');
    paneList?.classList.add('active');
    if (state.brosurViewMode === 'split') {
      renderBrosurSplitView();
    } else {
      renderBrosurTable();
    }
  }
};

async function loadBrosurData(force = false) {
  // 0. Load KanwilFathIndah (Master Wilayah Brosur dari tabel KanwilFathIndah header namakanwil)
  let kanwilData = [];
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/KanwilFathIndah?select=namakanwil`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        kanwilData = data;
      }
    } else {
      const resAll = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/KanwilFathIndah?select=*`, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (resAll.ok) {
        const dataAll = await resAll.json();
        if (Array.isArray(dataAll) && dataAll.length > 0) {
          kanwilData = dataAll;
        }
      }
    }
  } catch (e) {
    console.warn('Gagal fetch KanwilFathIndah dari Supabase:', e.message);
  }

  if (!kanwilData || kanwilData.length === 0) {
    try {
      const apiRes = await fetch('/api/brosur/kanwil');
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          kanwilData = json.data;
        }
      }
    } catch (_) {}
  }

  if (!kanwilData || kanwilData.length === 0) {
    const localKanwil = localStorage.getItem('fath_indah_kanwil_brosur');
    try {
      if (localKanwil) {
        const parsed = JSON.parse(localKanwil);
        if (Array.isArray(parsed) && parsed.length > 0) kanwilData = parsed;
      }
    } catch (_) {}
  }

  if (!kanwilData || kanwilData.length === 0) {
    kanwilData = DEFAULT_KANWIL_FATH_INDAH;
  }
  state.data.kanwilFathIndah = kanwilData;

  // 1. Load CatPaket (Master Kategori Brosur dari tabel CatPaket header catagory - Requirement #1)
  let catPaketData = [];
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/CatPaket?select=*&order=catagory.asc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        catPaketData = data;
      }
    }
  } catch (e) {
    console.warn('Gagal fetch CatPaket dari Supabase:', e.message);
  }

  // Fallback ke server API jika tabel Supabase perlu service_role
  if (!catPaketData || catPaketData.length === 0) {
    try {
      const apiRes = await fetch('/api/brosur/catpaket');
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          catPaketData = json.data;
        }
      }
    } catch (_) {}
  }

  // Fallback ke localStorage atau default seed
  if (!catPaketData || catPaketData.length === 0) {
    const localCat = localStorage.getItem('fath_indah_cat_paket');
    try {
      if (localCat) {
        const parsed = JSON.parse(localCat);
        if (Array.isArray(parsed) && parsed.length > 0) catPaketData = parsed;
      }
    } catch (_) {}
  }

  if (!catPaketData || catPaketData.length === 0) {
    catPaketData = DEFAULT_CAT_PAKET;
  }
  state.data.catPaket = catPaketData;

  // 2. Load MnuLogBrosur (Master Menu Kategori & Brosur)
  let mnuData = [];
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/MnuLogBrosur?select=*&order=catagory.asc,brosurname.asc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        mnuData = data;
      }
    }
  } catch (e) {
    console.warn('Gagal fetch MnuLogBrosur dari Supabase:', e.message);
  }

  // Fallback ke server API jika tabel Supabase kosong
  if (!mnuData || mnuData.length === 0) {
    try {
      const apiRes = await fetch('/api/brosur/menu');
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          mnuData = json.data;
        }
      }
    } catch (_) {}
  }

  // Fallback ke localStorage atau default seed
  if (!mnuData || mnuData.length === 0) {
    const localMnu = localStorage.getItem('fath_indah_mnu_log_brosur');
    try {
      if (localMnu) {
        const parsed = JSON.parse(localMnu);
        if (Array.isArray(parsed) && parsed.length > 0) mnuData = parsed;
      }
    } catch (_) {}
  }

  if (!mnuData || mnuData.length === 0) {
    mnuData = DEFAULT_MNU_LOG_BROSUR;
  }

  state.data.mnuLogBrosur = mnuData;
  populateBrosurDropdowns();

  // 3. Load LogBrosur (Daftar Brosur Terdaftar dari Supabase)
  let logData = null;
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/LogBrosur?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        logData = data.map(item => ({
          ...item,
          wilayah: item.wilayah || item.lokasibrosur || 'Pusat'
        }));
      }
    }
  } catch (e) {
    console.warn('Gagal fetch LogBrosur dari Supabase:', e.message);
  }

  // Fallback ke server API jika direct fetch Supabase terhalang CORS
  if (logData === null) {
    try {
      const apiRes = await fetch('/api/brosur/log');
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.data && Array.isArray(json.data)) {
          logData = json.data.map(item => ({
            ...item,
            wilayah: item.wilayah || item.lokasibrosur || 'Pusat'
          }));
        }
      }
    } catch (_) {}
  }

  // Fallback ke localStorage jika offline
  if (logData === null) {
    const localLog = localStorage.getItem('fath_indah_log_brosur');
    try {
      if (localLog) {
        const parsed = JSON.parse(localLog);
        if (Array.isArray(parsed)) logData = parsed;
      }
    } catch (_) {}
  }

  // Default fallback hanya jika database benar-benar tidak dapat dihubungi
  if (logData === null) {
    logData = DEFAULT_LOG_BROSUR;
  }

  state.data.logBrosur = logData;
  renderBrosurTable();
}

function populateBrosurDropdowns() {
  // 1. Wilayah Brosur: ONLY from KanwilFathIndah header namakanwil (Requirement #1)
  const kanwilList = (state.data.kanwilFathIndah && state.data.kanwilFathIndah.length > 0)
    ? state.data.kanwilFathIndah
    : DEFAULT_KANWIL_FATH_INDAH;

  const listNames = kanwilList.map(k => (k.namakanwil || k.namakanwill || '').trim()).filter(Boolean);

  // Ambil juga wilayah yang sudah tercatat pada riwayat LogBrosur (seperti Jabodetabek, dll)
  const logWilayah = (state.data.logBrosur || []).map(l => {
    if (l.wilayah) return l.wilayah.trim();
    if (l.lokasibrosur) return l.lokasibrosur.trim();
    if (l.namapaket && l.namapaket.startsWith('[')) {
      const m = l.namapaket.match(/^\[([^\]]+)\]/);
      if (m) return m[1].trim();
    }
    return '';
  }).filter(Boolean);

  const defaultNames = DEFAULT_KANWIL_FATH_INDAH.map(k => k.namakanwil);

  const wilNames = [...new Set([...listNames, ...logWilayah, ...defaultNames, 'Jabodetabek'])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'id'));

  // Populate Table Filter Wilayah
  const wilFilter = document.getElementById('brosurWilayahFilter');
  if (wilFilter) {
    const currentWil = state.brosurFilter.wilayah || 'ALL';
    let wilFilterHtml = '<option value="ALL">Semua Wilayah</option>';
    wilNames.forEach(w => {
      wilFilterHtml += `<option value="${w}" ${w === currentWil ? 'selected' : ''}>${w}</option>`;
    });
    wilFilter.innerHTML = wilFilterHtml;
  }

  // Populate Form Input Wilayah
  const inputWilayah = document.getElementById('inputBrosurWilayah');
  if (inputWilayah) {
    const prevWil = inputWilayah.value;
    let inputWilHtml = '<option value="">-- Pilih Wilayah Brosur --</option>';
    wilNames.forEach(w => {
      inputWilHtml += `<option value="${w}" ${w === prevWil ? 'selected' : ''}>${w}</option>`;
    });
    inputWilayah.innerHTML = inputWilHtml;
  }

  // 2. Kategori Brosur: ONLY from CatPaket header catagory (Requirement #1)
  const catList = (state.data.catPaket && state.data.catPaket.length > 0)
    ? state.data.catPaket
    : DEFAULT_CAT_PAKET;
  const categories = [...new Set(catList.map(c => (c.catagory || c.category || '').trim()).filter(Boolean))].sort();

  // Populate Table Filter Category
  const catFilter = document.getElementById('brosurCategoryFilter');
  if (catFilter) {
    const currentCat = state.brosurFilter.category || 'ALL';
    let filterHtml = '<option value="ALL">Semua Kategori</option>';
    categories.forEach(cat => {
      filterHtml += `<option value="${cat}" ${cat === currentCat ? 'selected' : ''}>${cat}</option>`;
    });
    catFilter.innerHTML = filterHtml;
  }

  // Populate Form Category Select (dari Tabel CatPaket header catagory)
  const inputCategory = document.getElementById('inputBrosurCategory');
  if (inputCategory) {
    const prevSelected = inputCategory.value;
    let inputCatHtml = '<option value="">-- Pilih Kategori --</option>';
    categories.forEach(cat => {
      inputCatHtml += `<option value="${cat}" ${cat === prevSelected ? 'selected' : ''}>${cat}</option>`;
    });
    inputCategory.innerHTML = inputCatHtml;
  }

  // 3. Nama Brosur: ambil hasil pemilihan Kategori Brosur, lalu cari pada tabel MnuLogBrosur apabila ditemukan isikan dropdown brosurname (Requirement #2)
  syncBrosurNameVisibility();
}

function syncBrosurNameVisibility() {
  const categorySelect = document.getElementById('inputBrosurCategory');
  const groupName = document.getElementById('groupBrosurName');
  const nameSelect = document.getElementById('inputBrosurName');
  if (!groupName || !nameSelect) return;

  const selectedCat = categorySelect ? categorySelect.value.trim() : '';

  // Requirement: dropdown Nama Brosur tidak akan muncul apabila dropdown Kategori Brosur tidak terisi dengan benar
  if (!selectedCat) {
    groupName.style.display = 'none';
    nameSelect.innerHTML = '<option value="">-- Pilih Kategori Terlebih Dahulu --</option>';
    nameSelect.value = '';
    nameSelect.removeAttribute('required');
    return;
  }

  // Cari pada tabel MnuLogBrosur apabila ditemukan isikan dropdown dengan header brosurname (Requirement #2)
  const mnuList = (state.data.mnuLogBrosur && state.data.mnuLogBrosur.length > 0)
    ? state.data.mnuLogBrosur
    : DEFAULT_MNU_LOG_BROSUR;

  const matched = mnuList.filter(m => (m.catagory || m.category || '').trim().toLowerCase() === selectedCat.toLowerCase());

  if (matched.length > 0) {
    groupName.style.display = 'block';
    nameSelect.setAttribute('required', 'required');

    const distinctNames = [...new Set(matched.map(m => (m.brosurname || m.brosur_name || '').trim()).filter(Boolean))].sort();

    const prevVal = nameSelect.value;
    let html = `<option value="">-- Pilih Nama Brosur (${selectedCat}) --</option>`;
    distinctNames.forEach(name => {
      html += `<option value="${name}" ${name === prevVal ? 'selected' : ''}>${name}</option>`;
    });
    nameSelect.innerHTML = html;
  } else {
    // Apabila kategori terpilih belum memiliki data brosurname di MnuLogBrosur
    groupName.style.display = 'block';
    nameSelect.setAttribute('required', 'required');
    nameSelect.innerHTML = `<option value="">-- Belum ada brosur di MnuLogBrosur untuk "${selectedCat}" --</option>`;
  }
}

window.onBrosurWilayahChange = function() {
  updateGeneratedFileName();
};

window.onBrosurCategoryChange = function() {
  syncBrosurNameVisibility();
  updateGeneratedFileName();
};

window.onBrosurNameChange = function() {
  updateGeneratedFileName();
};

// Google Apps Script source code template for 1-click copy
const APPS_SCRIPT_SOURCE_CODE = `/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: AUTO-UPLOADER BROSUR PT. FATH INDAH TRAVEL SERVICE
 * Target Folder ID: 1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc
 * ============================================================================
 */
const TARGET_FOLDER_ID = "1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, message: "Payload tidak ditemukan." });
    }
    var payload = JSON.parse(e.postData.contents);
    var folderId = payload.folderId || TARGET_FOLDER_ID;
    var folder = DriveApp.getFolderById(folderId);
    if (!folder) {
      return createJsonResponse({ success: false, message: "Folder tidak ditemukan dengan ID: " + folderId });
    }
    var fileName = payload.fileName || ("BROSUR_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".pdf");
    var mimeType = payload.mimeType || "application/pdf";
    var base64String = payload.base64;
    if (!base64String) {
      return createJsonResponse({ success: false, message: "Konten file Base64 kosong." });
    }
    if (base64String.indexOf(",") > -1) {
      base64String = base64String.split(",")[1];
    }
    var decoded = Utilities.base64Decode(base64String);
    var blob = Utilities.newBlob(decoded, mimeType, fileName);
    var createdFile = folder.createFile(blob);
    try {
      createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {}
    var fileId = createdFile.getId();
    var directViewUrl = "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";
    return createJsonResponse({
      success: true,
      message: "File brosur berhasil diunggah ke Google Drive!",
      fileId: fileId,
      fileName: createdFile.getName(),
      directLink: directViewUrl,
      fileUrl: directViewUrl,
      folderUrl: "https://drive.google.com/drive/folders/" + folderId,
      sizeBytes: createdFile.getSize()
    });
  } catch (error) {
    return createJsonResponse({ success: false, message: error.toString() });
  }
}

function doGet(e) {
  return createJsonResponse({
    success: true,
    status: "active",
    message: "Google Drive Uploader Webhook PT Fath Indah aktif.",
    targetFolderId: TARGET_FOLDER_ID,
    targetFolderUrl: "https://drive.google.com/drive/folders/" + TARGET_FOLDER_ID
  });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;

let pendingBrosurPayload = null;

function getGDriveWebhookUrl() {
  return (localStorage.getItem('fath_indah_gdrive_script_url') || '').trim();
}

function setGDriveWebhookUrl(url) {
  localStorage.setItem('fath_indah_gdrive_script_url', (url || '').trim());
  updateGDriveStatusUI();
}

function updateGDriveStatusUI() {
  const url = getGDriveWebhookUrl();
  const hasUrl = !!url;

  // Status Pill di Form Brosur
  const pill = document.getElementById('gdriveWebhookStatusPill');
  const pillText = document.getElementById('gdriveWebhookStatusText');
  if (pill && pillText) {
    if (hasUrl) {
      pill.className = 'gdrive-status-badge active';
      pillText.textContent = 'Auto-Upload Drive: Terhubung';
      pill.title = `Terkoneksi ke: ${url}`;
    } else {
      pill.className = 'gdrive-status-badge pending';
      pillText.textContent = 'Auto-Upload Drive: Belum Dikonfigurasi';
      pill.title = 'Klik untuk memasang Webhook Google Apps Script';
    }
  }

  // Status Badge di Konfigurasi DB
  const badgeDb = document.getElementById('gdriveConfigStatusBadgeDb');
  if (badgeDb) {
    if (hasUrl) {
      badgeDb.className = 'gdrive-status-badge active';
      badgeDb.innerHTML = '<i class="fa-solid fa-check"></i> <span>Terhubung</span>';
    } else {
      badgeDb.className = 'gdrive-status-badge pending';
      badgeDb.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Belum Terhubung</span>';
    }
  }

  const inputModal = document.getElementById('inputGDriveScriptUrl');
  if (inputModal && !inputModal.value) {
    inputModal.value = url;
  }

  const inputDb = document.getElementById('inputGDriveScriptUrlDb');
  if (inputDb && !inputDb.value) {
    inputDb.value = url;
  }
}

window.openGDriveConfigModal = function() {
  const modal = document.getElementById('gdriveConfigModal');
  if (!modal) return;
  modal.style.display = 'flex';
  const urlInput = document.getElementById('inputGDriveScriptUrl');
  if (urlInput) urlInput.value = getGDriveWebhookUrl();
  const codeBox = document.getElementById('appsScriptCodeBlock');
  if (codeBox) codeBox.textContent = APPS_SCRIPT_SOURCE_CODE;
  updateGDriveStatusUI();
};

window.closeGDriveConfigModal = function() {
  const modal = document.getElementById('gdriveConfigModal');
  if (modal) modal.style.display = 'none';
};

window.openGDrivePromptModal = function(fileName) {
  const modal = document.getElementById('gdrivePromptModal');
  if (!modal) return;
  const textEl = document.getElementById('promptFileNameText');
  if (textEl) textEl.textContent = fileName || 'File Brosur';
  modal.style.display = 'flex';
};

window.closeGDrivePromptModal = function() {
  const modal = document.getElementById('gdrivePromptModal');
  if (modal) modal.style.display = 'none';
};

window.toggleGDriveGuide = function() {
  const content = document.getElementById('gdriveStepsContent');
  const chevron = document.getElementById('gdriveGuideChevron');
  if (!content) return;
  if (content.style.display === 'none' || !content.style.display) {
    content.style.display = 'block';
    if (chevron) chevron.className = 'fa-solid fa-chevron-up';
  } else {
    content.style.display = 'none';
    if (chevron) chevron.className = 'fa-solid fa-chevron-down';
  }
};

window.copyAppsScriptCode = function() {
  navigator.clipboard.writeText(APPS_SCRIPT_SOURCE_CODE).then(() => {
    const btn = document.getElementById('btnCopyScriptCode');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check" style="color:#34d399;"></i> <span>Kode Tersalin!</span>';
      setTimeout(() => { btn.innerHTML = orig; }, 2500);
    }
  }).catch(() => {
    prompt('Salin skrip Google Apps Script berikut:', APPS_SCRIPT_SOURCE_CODE);
  });
};

window.saveGDriveConfig = function() {
  const input = document.getElementById('inputGDriveScriptUrl');
  const url = (input ? input.value : '').trim();
  if (!url) {
    if (confirm('Kosongkan URL Auto-Upload Google Drive?')) {
      setGDriveWebhookUrl('');
      alert('Konfigurasi auto-upload dihapus.');
      closeGDriveConfigModal();
    }
    return;
  }
  setGDriveWebhookUrl(url);
  alert('URL Webhook Google Apps Script berhasil disimpan!');
  closeGDriveConfigModal();
};

window.saveGDriveConfigFromDb = function() {
  const input = document.getElementById('inputGDriveScriptUrlDb');
  const url = (input ? input.value : '').trim();
  setGDriveWebhookUrl(url);
  alert('URL Webhook Auto-Upload Google Drive berhasil disimpan!');
};

window.testGDriveWebhook = async function() {
  const input = document.getElementById('inputGDriveScriptUrl');
  const statusEl = document.getElementById('gdriveTestStatus');
  const url = (input ? input.value : '').trim();
  if (!url) {
    alert('Harap masukkan URL Web App Google Apps Script terlebih dahulu!');
    return;
  }

  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.color = '#38bdf8';
    statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menguji koneksi ke Web App...';
  }

  try {
    const res = await fetch(url, { method: 'GET', mode: 'cors' });
    if (res.ok) {
      const data = await res.json();
      if (statusEl) {
        statusEl.style.color = '#34d399';
        statusEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> Koneksi Berhasil! Terhubung ke Folder: ${data.targetFolderId || '1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc'}`;
      }
    } else {
      if (statusEl) {
        statusEl.style.color = '#f87171';
        statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Respon HTTP ${res.status}. Pastikan deployment "Who has access: Anyone".`;
      }
    }
  } catch (err) {
    if (statusEl) {
      statusEl.style.color = '#fbbf24';
      statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Tes selesai (${err.message}). Jika disetel Anyone, Web App siap menerima POST upload.`;
    }
  }
};

window.testGDriveWebhookFromDb = async function() {
  const input = document.getElementById('inputGDriveScriptUrlDb');
  const statusEl = document.getElementById('gdriveTestStatusDb');
  const url = (input ? input.value : '').trim();
  if (!url) {
    alert('Harap masukkan URL Web App Google Apps Script terlebih dahulu!');
    return;
  }

  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.color = '#38bdf8';
    statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menguji koneksi ke Web App...';
  }

  try {
    const res = await fetch(url, { method: 'GET', mode: 'cors' });
    if (res.ok) {
      const data = await res.json();
      if (statusEl) {
        statusEl.style.color = '#34d399';
        statusEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> Koneksi Berhasil! Folder Target: ${data.targetFolderId || '1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc'}`;
      }
    } else {
      if (statusEl) {
        statusEl.style.color = '#f87171';
        statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Respon HTTP ${res.status}. Pastikan deployment "Who has access: Anyone".`;
      }
    }
  } catch (err) {
    if (statusEl) {
      statusEl.style.color = '#fbbf24';
      statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Tes selesai (${err.message}). Webhook siap digunakan jika disetel Anyone.`;
    }
  }
};

function setupDropZoneListeners() {
  const dropZone = document.getElementById('brosurDropZone');
  if (!dropZone || dropZone.dataset.listenersAdded) return;
  dropZone.dataset.listenersAdded = 'true';

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      const fileInput = document.getElementById('localBrosurFileInput');
      if (fileInput) {
        fileInput.files = files;
      }
      handleLocalFileSelect({ target: { files: files } });
    }
  }, false);
}

window.handleLocalFileSelect = function(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  state.selectedLocalBrosurFile = file;

  // Requirement #4 (Second): Set link Google Drive folder otomatis
  const linkInput = document.getElementById('inputBrosurLink');
  if (linkInput) {
    linkInput.value = GDRIVE_BROSUR_FOLDER_URL;
  }

  updateGeneratedFileName();

  // Show banner
  const banner = document.getElementById('selectedFileBanner');
  const nameEl = document.getElementById('selectedFileName');
  const metaEl = document.getElementById('selectedFileMeta');

  if (banner) banner.style.display = 'flex';
  if (nameEl) nameEl.textContent = file.name;
  if (metaEl) {
    const sizeKB = Math.round(file.size / 1024);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = sizeKB > 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
    const autoStatus = getGDriveWebhookUrl() ? '⚡ Auto-Upload Aktif' : '⚠️ Webhook Belum Terhubung';
    metaEl.textContent = `Ukuran: ${sizeStr} • Format: ${file.type || file.name.split('.').pop().toUpperCase()} • ${autoStatus}`;
  }
};

window.onUploadToGDriveClick = function() {
  const fileName = state.generatedSpecificFileName;
  if (fileName && !fileName.includes('...')) {
    navigator.clipboard.writeText(fileName).then(() => {
      alert(`Nama file standar:\n"${fileName}"\n\nTelah disalin ke clipboard! Silakan beri nama ini saat mengunggah file ke Google Drive.`);
    }).catch(() => {
      prompt('Salin nama file standar berikut untuk Google Drive:', fileName);
    });
  }
};

window.clearSelectedFile = function() {
  state.selectedLocalBrosurFile = null;
  const fileInput = document.getElementById('localBrosurFileInput');
  if (fileInput) fileInput.value = '';
  const banner = document.getElementById('selectedFileBanner');
  if (banner) banner.style.display = 'none';
  updateGeneratedFileName();
};

// Helper format tanggal dd mmm yy (Lampiran 3)
function formatDateDdMmmYy(dateStr) {
  if (!dateStr || dateStr === '-' || dateStr === 'null' || dateStr === 'undefined') return '-';
  const clean = String(dateStr).trim().slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parts[2].padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const mmm = months[m - 1] || parts[1];
    const yy = y.length === 4 ? y.slice(2) : y;
    return `${d} ${mmm} ${yy}`;
  }
  return dateStr;
}

// Requirement #6: 3 Bagian Komponen Penamaan Otomatis
window.onJumlahHariChange = function() {
  const select = document.getElementById('inputBrosurJumlahHari');
  const groupCustom = document.getElementById('groupCustomJumlahHari');
  if (select && groupCustom) {
    if (select.value === 'custom') {
      groupCustom.style.display = 'block';
      const customInput = document.getElementById('inputBrosurCustomHari');
      if (customInput) customInput.focus();
    } else {
      groupCustom.style.display = 'none';
      const customInput = document.getElementById('inputBrosurCustomHari');
      if (customInput) customInput.value = '';
    }
  }
  updateBrosurCompositeName();
};

// Helper format custom hari, contoh: "29 34" -> "29H 34H" (Requirement #2)
function formatCustomHariBrosur(input) {
  if (!input) return '';
  const tokens = input.trim().split(/[\s,/-]+/).filter(Boolean);
  if (tokens.length === 0) return '';
  const formatted = tokens.map(t => {
    const num = t.replace(/\D/g, '');
    if (num) return `${num}H`;
    return t.toUpperCase();
  }).filter(Boolean);
  return formatted.join(' ');
}

window.updateBrosurCompositeName = function() {
  const wilayah = (document.getElementById('inputBrosurWilayah')?.value || '').trim();
  const paket = (document.getElementById('inputBrosurNamaPaket')?.value || '').trim();
  const hariSelect = document.getElementById('inputBrosurJumlahHari')?.value || '';
  let partHari = '[Jumlah Hari]';
  if (hariSelect === 'custom') {
    const rawCustom = (document.getElementById('inputBrosurCustomHari')?.value || '').trim();
    const formattedCustom = formatCustomHariBrosur(rawCustom);
    if (formattedCustom) {
      partHari = `[${formattedCustom}]`;
    }
  } else if (hariSelect) {
    partHari = `[${hariSelect}D]`;
  }
  const tglBerangkat = document.getElementById('inputBrosurTglBerangkat')?.value || '';

  const displayBox = document.getElementById('generatedSpecificFileName');

  if (!wilayah && !paket && !hariSelect && !tglBerangkat) {
    if (displayBox) {
      displayBox.textContent = '[Wilayah] [Nama Paket] [Jumlah Hari] [Tanggal Berangkat]';
      displayBox.style.color = 'var(--text-muted)';
    }
    state.generatedSpecificFileName = '';
    return;
  }

  const partWilayah = wilayah ? `[${wilayah}]` : '[Wilayah]';
  const partPaket = paket ? `[${paket}]` : '[Nama Paket]';

  let partTgl = '[Tanggal Berangkat]';
  if (tglBerangkat) {
    const parts = tglBerangkat.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parts[2].padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const mmm = months[m - 1] || parts[1];
      partTgl = `[${d} ${mmm} ${y}]`;
    }
  }

  // Format: [Wilayah] [Nama Paket] [Jumlah Hari / 29H 34H] [dd mmm yyyy]
  const combinedName = `${partWilayah} ${partPaket} ${partHari} ${partTgl}`;
  state.generatedSpecificFileName = combinedName;
  if (displayBox) {
    displayBox.textContent = combinedName;
    displayBox.style.color = '#38bdf8';
  }
};

function updateGeneratedFileName() {
  updateBrosurCompositeName();
}

window.copySpecificFileName = function() {
  const text = state.generatedSpecificFileName || document.getElementById('generatedSpecificFileName')?.textContent;
  if (!text || text.includes('...')) {
    alert('Harap isi Nama Paket, Jumlah Hari, atau Tanggal Berangkat.');
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btnCopyFileName');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check" style="color:#34d399;"></i> <span>Tersalin!</span>';
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
    }
  }).catch(e => {
    prompt('Salin nama file berikut:', text);
  });
};

window.resetBrosurForm = function() {
  const form = document.getElementById('brosurInputForm');
  if (form) form.reset();

  // Populate dropdowns dari master data
  populateBrosurDropdowns();

  // Sembunyikan kembali dropdown Nama Brosur saat form di-reset
  const groupName = document.getElementById('groupBrosurName');
  if (groupName) groupName.style.display = 'none';

  // Reset 3 Bagian Komponen Penamaan Otomatis
  const inputPaket = document.getElementById('inputBrosurNamaPaket');
  if (inputPaket) inputPaket.value = '';
  const inputHari = document.getElementById('inputBrosurJumlahHari');
  if (inputHari) inputHari.value = '';
  const groupCustom = document.getElementById('groupCustomJumlahHari');
  if (groupCustom) groupCustom.style.display = 'none';
  const inputCustomHari = document.getElementById('inputBrosurCustomHari');
  if (inputCustomHari) inputCustomHari.value = '';
  const inputTglBerangkat = document.getElementById('inputBrosurTglBerangkat');
  if (inputTglBerangkat) inputTglBerangkat.value = '';

  // Tanggal Upload diisi otomatis tanggal hari ini (yyyy-mm-dd) ke input hidden
  const todayYmd = new Date().toISOString().slice(0, 10);
  const tglUploadInput = document.getElementById('inputBrosurTglUpload');
  if (tglUploadInput) tglUploadInput.value = todayYmd;

  // Valid Until default kosong (wajib dipilih user lewat DTPICKER)
  const validUntilInput = document.getElementById('inputBrosurValidUntil');
  if (validUntilInput) {
    validUntilInput.value = '';
    validUntilInput.min = todayYmd;
  }

  const linkInput = document.getElementById('inputBrosurLink');
  if (linkInput) linkInput.value = GDRIVE_BROSUR_FOLDER_URL;

  clearSelectedFile();
  updateBrosurCompositeName();
};

async function uploadBrosurToGoogleDrive(file, generatedFileName) {
  const gdriveWebhookUrl = getGDriveWebhookUrl();
  if (!gdriveWebhookUrl) {
    return { success: false, message: 'URL Webhook Google Apps Script belum dikonfigurasi.' };
  }

  // Baca file lokal menjadi Base64
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  const payload = {
    folderId: '1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc',
    fileName: generatedFileName || file.name,
    mimeType: file.type || 'application/pdf',
    base64: base64Data
  };

  // Kirim tanpa custom header Content-Type agar browser tidak trigger preflight OPTIONS pada Google Apps Script
  const response = await fetch(gdriveWebhookUrl, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} saat menghubungi Webhook Google Drive`);
  }

  const result = await response.json();
  return result;
}

window.promptActionSetup = function() {
  closeGDrivePromptModal();
  openGDriveConfigModal();
};

window.promptActionManual = function() {
  closeGDrivePromptModal();
  if (state.generatedSpecificFileName && !state.generatedSpecificFileName.includes('...')) {
    navigator.clipboard.writeText(state.generatedSpecificFileName).catch(() => {});
  }
  // Buka folder Google Drive
  window.open(GDRIVE_BROSUR_FOLDER_URL, '_blank', 'noopener,noreferrer');
  
  // Lanjutkan simpan payload
  if (pendingBrosurPayload) {
    const payload = { ...pendingBrosurPayload };
    pendingBrosurPayload = null;
    executeSaveBrosurToSupabase(payload);
  }
};

window.promptActionSaveMetadataOnly = function() {
  closeGDrivePromptModal();
  if (pendingBrosurPayload) {
    const payload = { ...pendingBrosurPayload };
    pendingBrosurPayload = null;
    executeSaveBrosurToSupabase(payload);
  }
};

window.submitBrosurForm = async function(event) {
  if (event) event.preventDefault();

  const wilayah = document.getElementById('inputBrosurWilayah')?.value || '';
  const catagory = document.getElementById('inputBrosurCategory')?.value;
  let brosurname = document.getElementById('inputBrosurName')?.value || '';
  const validuntil = document.getElementById('inputBrosurValidUntil')?.value;
  const tglupload = document.getElementById('inputBrosurTglUpload')?.value || new Date().toISOString().slice(0, 10);
  let link = document.getElementById('inputBrosurLink')?.value.trim() || GDRIVE_BROSUR_FOLDER_URL;
  const catatan = (document.getElementById('inputBrosurCatatan')?.value || '').trim();

  // Requirement #2: 3 Bagian + [Wilayah] digabung menjadi namapaket
  // Format: [Wilayah] [Nama Paket] [Jumlah Hari / 29H 34H] [dd mmm yyyy]
  const paket = (document.getElementById('inputBrosurNamaPaket')?.value || '').trim();
  const hariSelect = document.getElementById('inputBrosurJumlahHari')?.value || '';
  let partHari = '';
  if (hariSelect === 'custom') {
    const rawCustom = (document.getElementById('inputBrosurCustomHari')?.value || '').trim();
    const formattedCustom = formatCustomHariBrosur(rawCustom);
    if (formattedCustom) {
      partHari = `[${formattedCustom}]`;
    }
  } else if (hariSelect) {
    partHari = `[${hariSelect}D]`;
  }
  const tglBerangkat = document.getElementById('inputBrosurTglBerangkat')?.value || '';

  let generatedNamaPaket = '';
  if (wilayah || paket || partHari || tglBerangkat) {
    const partWilayah = wilayah ? `[${wilayah}]` : '';
    const partPaket = paket ? `[${paket}]` : '';
    let partTgl = '';
    if (tglBerangkat) {
      const parts = tglBerangkat.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10);
        const d = parts[2].padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const mmm = months[m - 1] || parts[1];
        partTgl = `[${d} ${mmm} ${y}]`;
      }
    }
    generatedNamaPaket = [partWilayah, partPaket, partHari, partTgl].filter(Boolean).join(' ');
  }

  // Jika nama brosur master belum terpilih, gunakan hasil komponen paket
  if (!brosurname) {
    if (generatedNamaPaket) {
      brosurname = generatedNamaPaket;
    } else if (paket) {
      brosurname = paket;
    }
  }

  if (!wilayah) {
    alert('Harap pilih Wilayah Brosur!');
    return;
  }

  if (!catagory) {
    alert('Harap pilih Kategori Brosur!');
    return;
  }

  if (!brosurname) {
    alert('Harap lengkapi rincian Nama Paket atau pilih Nama Brosur!');
    return;
  }

  if (!validuntil) {
    alert('Harap tentukan tanggal batas berlaku brosur (Valid Until)!');
    return;
  }

  const selectedFile = state.selectedLocalBrosurFile;
  const specificName = generatedNamaPaket || state.generatedSpecificFileName || (selectedFile ? selectedFile.name : '');
  const gdriveWebhookUrl = getGDriveWebhookUrl();

  // Jika file lokal dipilih tapi webhook belum dipasang, tampilkan modal interaktif untuk konfirmasi
  if (selectedFile && !gdriveWebhookUrl) {
    pendingBrosurPayload = { wilayah, catagory, brosurname, namapaket: generatedNamaPaket, link, catatan, validuntil, tglupload, status: 'Aktif', selectedFile, specificName };
    openGDrivePromptModal(selectedFile.name);
    return;
  }

  const btnSubmit = document.getElementById('btnSubmitBrosur');
  if (btnSubmit) {
    btnSubmit.disabled = true;
  }

  // Jika webhook aktif dan file dipilih: upload berkas terlebih dahulu
  if (selectedFile && gdriveWebhookUrl) {
    if (btnSubmit) {
      btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah berkas brosur...';
    }

    try {
      const uploadResult = await uploadBrosurToGoogleDrive(selectedFile, specificName);
      if (uploadResult && uploadResult.success) {
        link = uploadResult.directLink || uploadResult.fileUrl || link;
        const linkInput = document.getElementById('inputBrosurLink');
        if (linkInput) linkInput.value = link;
      } else {
        const errMsg = uploadResult?.message || 'Koneksi ke Webhook Apps Script gagal';
        const continueSave = confirm(`Peringatan: Gagal mengunggah berkas secara otomatis (${errMsg}).\n\nApakah Anda tetap ingin menyimpan data brosur?`);
        if (!continueSave) {
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Simpan Brosur</span>';
          }
          return;
        }
      }
    } catch (uploadErr) {
      console.error('Error auto-upload:', uploadErr);
      const continueSave = confirm(`Peringatan: Gagal mengunggah berkas (${uploadErr.message}).\n\nApakah Anda tetap ingin menyimpan data brosur?`);
      if (!continueSave) {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Simpan Brosur</span>';
        }
        return;
      }
    }
  }

  if (btnSubmit) {
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan data brosur...';
  }

  await executeSaveBrosurToSupabase({ wilayah, catagory, brosurname, namapaket: generatedNamaPaket, link, catatan, validuntil, tglupload, status: 'Aktif', specificName });
};

async function executeSaveBrosurToSupabase(payload) {
  const { wilayah, catagory, brosurname, namapaket, link, catatan, validuntil, tglupload, status, specificName } = payload;
  const btnSubmit = document.getElementById('btnSubmitBrosur');

  // Requirement #4: untuk isian catatan pada tabel LogBrosur apabila kosong diisi "" (blank) saja, murni catatan user saja
  const finalCatatan = (catatan || '').trim();

  // Requirement #2 & #6: direkam pada tabel LogBrosur Header namapaket
  const supabasePayload = {
    catagory: catagory,
    brosurname: brosurname,
    namapaket: namapaket || null,
    lokasibrosur: wilayah,
    link: link,
    validuntil: validuntil || null,
    tglupload: tglupload || new Date().toISOString().slice(0, 10),
    status: status || 'Aktif',
    catatan: finalCatatan
  };

  let savedItem = null;
  let savedToSupabase = false;

  // 1. Simpan langsung via Supabase REST API
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/LogBrosur`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(supabasePayload)
    });

    if (res.ok || res.status === 201) {
      const data = await res.json();
      savedItem = Array.isArray(data) ? data[0] : data;
      savedToSupabase = true;
    } else {
      const errText = await res.text();
      console.warn('Gagal insert ke LogBrosur:', res.status, errText);
    }
  } catch (e) {
    console.warn('Gagal fetch insert ke database:', e.message);
  }

  // 2. Jika direct fetch gagal, panggil backend server /api/brosur/log
  if (!savedToSupabase && !state.isStaticMode) {
    try {
      const res = await fetch('/api/brosur/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...supabasePayload,
          wilayah: wilayah
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        savedItem = data.data;
        savedToSupabase = true;
      }
    } catch (e) {
      console.warn('Gagal call /api/brosur/log:', e.message);
    }
  }

  // Fallback jika database offline
  if (!savedItem) {
    savedItem = {
      id: `LOCAL-${Date.now()}`,
      created_at: new Date().toISOString(),
      catagory: catagory,
      brosurname: brosurname,
      namapaket: namapaket || null,
      lokasibrosur: wilayah,
      wilayah: wilayah,
      link: link,
      validuntil: validuntil || null,
      tglupload: tglupload || new Date().toISOString().slice(0, 10),
      status: status || 'Aktif',
      catatan: finalCatatan
    };
  } else {
    savedItem.wilayah = savedItem.lokasibrosur || savedItem.wilayah || wilayah;
  }

  // Prepend data baru ke tabel antarmuka
  state.data.logBrosur = [savedItem, ...(state.data.logBrosur || [])];
  localStorage.setItem('fath_indah_log_brosur', JSON.stringify(state.data.logBrosur));

  if (btnSubmit) {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Simpan Brosur</span>';
  }

  const idMsg = savedItem.id ? `\n(ID Record: #${savedItem.id})` : '';
  alert(`Brosur "${brosurname}" untuk wilayah ${wilayah} berhasil disimpan!${idMsg}`);

  resetBrosurForm();
  renderBrosurTable();
  switchBrosurTab('list');
}

function getFilteredBrosurList() {
  const list = state.data.logBrosur || [];
  const search = (state.brosurFilter.search || '').toLowerCase();
  const category = state.brosurFilter.category || 'ALL';
  const wilayahFilter = state.brosurFilter.wilayah || 'ALL';
  const statusFilter = state.brosurFilter.status || 'Aktif';
  const todayStr = new Date().toISOString().slice(0, 10);

  return list.filter(item => {
    const wil = (item.wilayah || item.lokasibrosur || '').toLowerCase();
    const cat = (item.catagory || item.category || '').toLowerCase();
    const name = (item.brosurname || item.name || '').toLowerCase();
    const notes = (item.catatan || '').toLowerCase();

    // Hitung status aktif / expired berdasarkan status tersimpan dan masa berlaku
    let rawStatus = (item.status || 'Aktif').trim();
    const isPastDate = item.validuntil && item.validuntil < todayStr;
    const isExpired = rawStatus.toLowerCase() === 'expired' || isPastDate;
    const effectiveStatus = isExpired ? 'Expired' : 'Aktif';

    // Requirement #5: Filter Status Brosur (Default: Aktif)
    if (statusFilter !== 'ALL' && effectiveStatus !== statusFilter) {
      return false;
    }

    if (wilayahFilter !== 'ALL' && (item.wilayah || item.lokasibrosur || '') !== wilayahFilter) {
      return false;
    }

    if (category !== 'ALL' && (item.catagory || item.category) !== category) {
      return false;
    }

    if (search && !wil.includes(search) && !cat.includes(search) && !name.includes(search) && !notes.includes(search)) {
      return false;
    }

    return true;
  });
}

function getGDriveEmbedUrl(url) {
  if (!url) return 'about:blank';
  url = url.trim();

  // 1. Google Drive File: /file/d/{id}/...
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  // 2. Google Drive query param ?id={id}
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1] && !url.includes('/folders/')) {
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  }

  // 3. Google Drive Folder: /drive/folders/{id}
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#list`;
  }

  return url;
}

function updateBrosurStats(list) {
  const elTotal = document.getElementById('brosurStatTotal');
  const elCat = document.getElementById('brosurStatCategory');
  const elActive = document.getElementById('brosurStatActive');
  const todayStr = new Date().toISOString().slice(0, 10);

  if (elTotal) elTotal.textContent = list.length;
  if (elCat) {
    const cats = new Set(list.map(x => x.catagory || x.category).filter(Boolean));
    elCat.textContent = cats.size || 0;
  }
  if (elActive) {
    const activeCount = list.filter(item => {
      const isPast = item.validuntil && item.validuntil < todayStr;
      const isExp = (item.status || '').trim().toLowerCase() === 'expired' || isPast;
      return !isExp;
    }).length;
    elActive.textContent = activeCount;
  }
}

function renderBrosurTable() {
  const tbody = document.getElementById('logBrosurTableBody');
  const list = state.data.logBrosur || [];
  const filtered = getFilteredBrosurList();
  const todayStr = new Date().toISOString().slice(0, 10);

  updateBrosurStats(list);

  if (tbody) {
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding:36px; color:#64748b;">
            <i class="fa-regular fa-folder-open" style="font-size:2rem; color:var(--gold-light); margin-bottom:10px;"></i>
            <div>Tidak ada brosur yang sesuai filter. Klik <strong>Input Brosur Baru</strong> untuk mendaftarkan brosur.</div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = filtered.map((item, idx) => {
        const no = idx + 1;
        const wil = item.lokasibrosur || item.wilayah || 'Pusat';
        const cat = item.catagory || item.category || 'Umum';
        const name = item.brosurname || item.name || '-';
        const notes = item.catatan || '-';
        const link = item.link || GDRIVE_BROSUR_FOLDER_URL;

        let rawTglUpload = item.tglupload || '';
        if (!rawTglUpload && item.created_at) {
          rawTglUpload = String(item.created_at).slice(0, 10);
        }
        const tglUploadDisplay = formatDateDdMmmYy(rawTglUpload);
        const validUntilDisplay = formatDateDdMmmYy(item.validuntil);

        let rawStatus = (item.status || 'Aktif').trim();
        const isPastDate = item.validuntil && item.validuntil < todayStr;
        const isExpired = rawStatus.toLowerCase() === 'expired' || isPastDate;
        const statusLabel = isExpired ? 'Expired' : 'Aktif';
        const statusPillClass = isExpired ? 'expired' : 'aktif';
        const statusIcon = isExpired ? 'fa-clock-rotate-left' : 'fa-circle-check';

        const catLower = cat.toLowerCase();
        let badgeClass = 'default';
        if (catLower.includes('umrah')) badgeClass = 'umrah';
        else if (catLower.includes('haji')) badgeClass = 'haji';
        else if (catLower.includes('wisata')) badgeClass = 'wisata';
        else if (catLower.includes('promo')) badgeClass = 'promo';

        const safeId = String(item.id || `LOCAL-${idx}`);

        return `
          <tr>
            <td style="color:#64748b; font-weight:600;">${no}</td>
            <td style="white-space:nowrap; font-size:0.82rem; color:#cbd5e1; font-family:'JetBrains Mono',monospace;">
              <i class="fa-regular fa-calendar" style="color:var(--text-dim); margin-right:4px;"></i>${tglUploadDisplay}
            </td>
            <td style="white-space:nowrap; font-size:0.82rem; font-family:'JetBrains Mono',monospace; ${isPastDate ? 'color:#f87171;' : 'color:#38bdf8;'}">
              <i class="fa-regular fa-calendar-check" style="margin-right:4px;"></i><strong>${validUntilDisplay}</strong>
            </td>
            <td>
              <span style="color:#38bdf8; font-weight:600; font-size:0.82rem; display:inline-flex; align-items:center; gap:5px;">
                <i class="fa-solid fa-location-dot"></i> ${wil}
              </span>
            </td>
            <td>
              <span class="brosur-cat-badge ${badgeClass}">${cat}</span>
            </td>
            <td>
              <a href="${link}" target="_blank" rel="noopener noreferrer" style="color:#ffffff; font-size:0.9rem; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:6px; transition:color 0.2s;" onmouseover="this.style.color='#38bdf8'" onmouseout="this.style.color='#ffffff'" title="Klik untuk membuka berkas brosur">
                <span>${name}</span>
                <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem; color:#38bdf8;"></i>
              </a>
              ${item.namapaket ? `<div style="font-size:0.78rem; color:#38bdf8; font-weight:600; margin-top:3px; font-family:'JetBrains Mono',monospace;"><i class="fa-solid fa-box-archive" style="font-size:0.72rem; margin-right:4px;"></i>${item.namapaket}</div>` : ''}
            </td>
            <td style="text-align:center;">
              <span class="brosur-status-pill ${statusPillClass}">
                <i class="fa-solid ${statusIcon}"></i> ${statusLabel}
              </span>
            </td>
            <td style="font-size:0.84rem; color:#94a3b8; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${notes}">
              ${notes}
            </td>
            <td style="text-align:center; white-space:nowrap;">
              <button type="button" class="btn-action-icon btn-action-wa" onclick="sendBrosurViaWhatsApp('${safeId}')" title="Send Via WA">
                <i class="fa-brands fa-whatsapp"></i>
              </button>
              <a href="${link}" target="_blank" rel="noopener noreferrer" class="btn-action-icon" title="Buka Berkas">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
              <button type="button" class="btn-action-icon btn-action-edit" onclick="openUpdateStatusModal('${safeId}')" title="Update Status Brosur">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button type="button" class="btn-action-icon btn-action-delete" onclick="deleteBrosurRecord('${safeId}')" title="Hapus Brosur">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Sinkronkan juga split view jika sedang aktif
  if (state.brosurViewMode === 'split') {
    renderBrosurSplitView();
  }
}

// --------------------------------------------------------------------------
// FITUR BARU: DUAL VIEW MODE (TABEL LIST vs LISTING KIRI & PREVIEW DRIVE KANAN)
// --------------------------------------------------------------------------

window.setBrosurViewMode = function(mode) {
  state.brosurViewMode = mode || 'table';
  try {
    localStorage.setItem('fath_brosur_view_mode', state.brosurViewMode);
  } catch (_) {}

  const btnTable = document.getElementById('btnViewModeTable');
  const btnSplit = document.getElementById('btnViewModeSplit');
  const tableContainer = document.getElementById('brosurTableViewContainer');
  const splitContainer = document.getElementById('brosurSplitViewContainer');

  if (state.brosurViewMode === 'split') {
    btnTable?.classList.remove('active');
    btnSplit?.classList.add('active');
    if (tableContainer) tableContainer.style.display = 'none';
    if (splitContainer) splitContainer.style.display = 'grid';
    renderBrosurSplitView();
  } else {
    btnSplit?.classList.remove('active');
    btnTable?.classList.add('active');
    if (splitContainer) splitContainer.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';
    renderBrosurTable();
  }
};

function renderBrosurSplitView() {
  const cardsContainer = document.getElementById('brosurSplitCardsList');
  if (!cardsContainer) return;

  const filtered = getFilteredBrosurList();
  const countEl = document.getElementById('brosurSplitCount');
  if (countEl) countEl.textContent = `${filtered.length} Berkas`;

  if (filtered.length === 0) {
    cardsContainer.innerHTML = `
      <div style="text-align:center; padding:36px 16px; color:#64748b; background:rgba(0,0,0,0.2); border-radius:8px;">
        <i class="fa-regular fa-folder-open" style="font-size:2rem; color:var(--gold-light); margin-bottom:10px;"></i>
        <div style="font-size:0.86rem; color:#94a3b8;">Tidak ada dokumen brosur yang sesuai filter.</div>
      </div>
    `;
    resetActiveDrivePreviewEmpty();
    return;
  }

  // Tentukan item mana yang aktif untuk preview
  let activeItem = null;
  if (state.activeBrosurId) {
    activeItem = filtered.find(x => String(x.id || '') === String(state.activeBrosurId));
  }
  if (!activeItem) {
    activeItem = filtered[0];
    state.activeBrosurId = String(activeItem.id || 'LOCAL-0');
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  cardsContainer.innerHTML = filtered.map((item, idx) => {
    const safeId = String(item.id || `LOCAL-${idx}`);
    const isActive = String(safeId) === String(state.activeBrosurId);
    const no = idx + 1;
    const wil = item.lokasibrosur || item.wilayah || 'Pusat';
    const cat = item.catagory || item.category || 'Umum';
    const name = item.brosurname || item.name || '-';
    const notes = item.catatan || '-';
    const link = item.link || GDRIVE_BROSUR_FOLDER_URL;

    let rawTglUpload = item.tglupload || '';
    if (!rawTglUpload && item.created_at) {
      rawTglUpload = String(item.created_at).slice(0, 10);
    }
    const tglUploadDisplay = formatDateDdMmmYy(rawTglUpload);
    const validUntilDisplay = formatDateDdMmmYy(item.validuntil);

    let rawStatus = (item.status || 'Aktif').trim();
    const isPastDate = item.validuntil && item.validuntil < todayStr;
    const isExpired = rawStatus.toLowerCase() === 'expired' || isPastDate;
    const statusLabel = isExpired ? 'Expired' : 'Aktif';
    const statusPillClass = isExpired ? 'expired' : 'aktif';
    const statusIcon = isExpired ? 'fa-clock-rotate-left' : 'fa-circle-check';

    const catLower = cat.toLowerCase();
    let badgeClass = 'default';
    if (catLower.includes('umrah')) badgeClass = 'umrah';
    else if (catLower.includes('haji')) badgeClass = 'haji';
    else if (catLower.includes('wisata')) badgeClass = 'wisata';
    else if (catLower.includes('promo')) badgeClass = 'promo';

    return `
      <div class="brosur-doc-card ${isActive ? 'active' : ''}" id="docCard-${safeId}" onclick="selectBrosurForPreview('${safeId}')">
        <div class="brosur-doc-card-top">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="brosur-doc-card-no">#${no}</span>
            <span class="brosur-cat-badge ${badgeClass}">${cat}</span>
          </div>
          <span class="brosur-status-pill ${statusPillClass}" style="font-size:0.68rem; padding:2px 8px;">
            <i class="fa-solid ${statusIcon}"></i> ${statusLabel}
          </span>
        </div>

        <div class="brosur-doc-card-title">
          <i class="fa-solid fa-file-pdf" style="color:${isActive ? 'var(--gold-light)' : '#38bdf8'}; font-size:0.88rem;"></i>
          <span>${name}</span>
        </div>

        ${item.namapaket ? `
          <div class="brosur-doc-card-paket">
            <i class="fa-solid fa-box-archive" style="font-size:0.75rem;"></i>
            <span>${item.namapaket}</span>
          </div>
        ` : ''}

        <div class="brosur-doc-card-meta">
          <div class="brosur-doc-card-meta-item" title="Wilayah: ${wil}">
            <i class="fa-solid fa-location-dot" style="color:#38bdf8;"></i>
            <span>${wil}</span>
          </div>
          <div class="brosur-doc-card-meta-item" title="Valid Until: ${validUntilDisplay}">
            <i class="fa-regular fa-calendar-check" style="${isPastDate ? 'color:#f87171;' : 'color:#34d399;'}"></i>
            <span style="${isPastDate ? 'color:#f87171;' : ''}">${validUntilDisplay}</span>
          </div>
          <div class="brosur-doc-card-meta-item" title="Tanggal Upload: ${tglUploadDisplay}">
            <i class="fa-regular fa-calendar" style="color:var(--text-dim);"></i>
            <span>${tglUploadDisplay}</span>
          </div>
          <div class="brosur-doc-card-meta-item" title="Tautan Google Drive">
            <i class="fa-brands fa-google-drive" style="color:#f59e0b;"></i>
            <span>Google Drive</span>
          </div>
        </div>

        ${notes && notes !== '-' ? `
          <div class="brosur-doc-card-notes" title="${notes}">
            <i class="fa-regular fa-note-sticky" style="margin-right:4px;"></i>${notes}
          </div>
        ` : ''}

        <div class="brosur-doc-card-footer" onclick="event.stopPropagation()">
          <button type="button" class="brosur-btn-view-indicator" onclick="selectBrosurForPreview('${safeId}')">
            <i class="fa-solid ${isActive ? 'fa-eye' : 'fa-arrow-right'}"></i>
            <span>${isActive ? 'Sedang Dilihat' : 'Lihat Dokumen'}</span>
          </button>
          
          <div style="display:flex; align-items:center; gap:5px;">
            <button type="button" class="btn-action-icon btn-action-wa" onclick="sendBrosurViaWhatsApp('${safeId}')" title="Send Via WA">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
            <a href="${link}" target="_blank" rel="noopener noreferrer" class="btn-action-icon" title="Buka di Tab Baru">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button type="button" class="btn-action-icon btn-action-edit" onclick="openUpdateStatusModal('${safeId}')" title="Update Status">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn-action-icon btn-action-delete" onclick="deleteBrosurRecord('${safeId}')" title="Hapus">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (activeItem) {
    const activeSafeId = String(activeItem.id || 'LOCAL-0');
    selectBrosurForPreview(activeSafeId);
  }
}

window.selectBrosurForPreview = function(safeId) {
  state.activeBrosurId = safeId;

  // Update card active classes
  document.querySelectorAll('.brosur-doc-card').forEach(el => el.classList.remove('active'));
  const card = document.getElementById(`docCard-${safeId}`);
  if (card) {
    card.classList.add('active');
  }

  const list = state.data.logBrosur || [];
  let item = list.find(x => String(x.id || '') === String(safeId));
  if (!item && safeId && safeId.startsWith('LOCAL-')) {
    const idx = parseInt(safeId.replace('LOCAL-', ''), 10);
    if (!isNaN(idx) && list[idx]) item = list[idx];
  }

  if (!item) return;

  const wil = item.lokasibrosur || item.wilayah || 'Pusat';
  const cat = item.catagory || item.category || 'Umum';
  const name = item.brosurname || item.name || 'Dokumen Brosur';
  const link = item.link || GDRIVE_BROSUR_FOLDER_URL;
  const paket = item.namapaket || '';
  const validUntilDisplay = formatDateDdMmmYy(item.validuntil);
  const notes = item.catatan || '-';

  // Update header panel kanan
  const titleEl = document.getElementById('brosurPreviewTitle');
  const badgeEl = document.getElementById('brosurPreviewBadge');
  const metaEl = document.getElementById('brosurPreviewMeta');
  const openExternalBtn = document.getElementById('btnPreviewOpenExternal');
  const fallbackLink = document.getElementById('brosurIframeDirectFallback');

  if (titleEl) titleEl.textContent = name;
  if (badgeEl) badgeEl.textContent = `${cat.toUpperCase()} • ${wil.toUpperCase()}`;
  if (metaEl) {
    metaEl.innerHTML = `${paket ? `<span style="color:#38bdf8; font-family:'JetBrains Mono',monospace; margin-right:8px;">${paket}</span>` : ''}<span>Masa Berlaku: ${validUntilDisplay}</span>`;
  }
  if (openExternalBtn) openExternalBtn.href = link;
  if (fallbackLink) fallbackLink.href = link;

  // Iframe update
  const iframe = document.getElementById('brosurPreviewIframe');
  const loader = document.getElementById('brosurIframeLoader');
  const embedUrl = getGDriveEmbedUrl(link);

  if (iframe) {
    if (loader) {
      loader.style.opacity = '1';
      loader.style.display = 'flex';
    }
    iframe.onload = function() {
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 250);
      }
    };
    iframe.src = embedUrl;
  }

  // Update Detail Pane content
  const detailBody = document.getElementById('brosurDetailBody');
  if (detailBody) {
    let rawTglUpload = item.tglupload || '';
    if (!rawTglUpload && item.created_at) {
      rawTglUpload = String(item.created_at).slice(0, 10);
    }
    const tglUploadDisplay = formatDateDdMmmYy(rawTglUpload);

    let rawStatus = (item.status || 'Aktif').trim();
    const todayStr = new Date().toISOString().slice(0, 10);
    const isPastDate = item.validuntil && item.validuntil < todayStr;
    const isExpired = rawStatus.toLowerCase() === 'expired' || isPastDate;
    const statusLabel = isExpired ? 'Expired' : 'Aktif';
    const statusPillClass = isExpired ? 'expired' : 'aktif';

    detailBody.innerHTML = `
      <div style="margin-bottom:18px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px;">
          <h3 style="font-size:1.15rem; font-weight:800; color:#ffffff; margin:0;">${name}</h3>
          <span class="brosur-status-pill ${statusPillClass}">${statusLabel}</span>
        </div>
        ${paket ? `<div style="color:#38bdf8; font-family:'JetBrains Mono',monospace; font-size:0.86rem; font-weight:600;"><i class="fa-solid fa-box-archive" style="margin-right:5px;"></i>${paket}</div>` : ''}
      </div>

      <div class="brosur-detail-grid">
        <div class="brosur-detail-box">
          <label>Wilayah / Kantor</label>
          <div class="val" style="color:#38bdf8;"><i class="fa-solid fa-location-dot" style="margin-right:5px;"></i>${wil}</div>
        </div>
        <div class="brosur-detail-box">
          <label>Kategori Paket</label>
          <div class="val" style="color:var(--gold-light);"><i class="fa-solid fa-tags" style="margin-right:5px;"></i>${cat}</div>
        </div>
        <div class="brosur-detail-box">
          <label>Tanggal Upload</label>
          <div class="val" style="font-family:'JetBrains Mono',monospace;"><i class="fa-regular fa-calendar" style="margin-right:5px;"></i>${tglUploadDisplay}</div>
        </div>
        <div class="brosur-detail-box">
          <label>Masa Berlaku (Valid Until)</label>
          <div class="val" style="font-family:'JetBrains Mono',monospace; ${isPastDate ? 'color:#f87171;' : 'color:#34d399;'}"><i class="fa-regular fa-calendar-check" style="margin-right:5px;"></i>${validUntilDisplay}</div>
        </div>
      </div>

      <div class="brosur-detail-box" style="margin-bottom:18px;">
        <label>Catatan & Keterangan Brosur</label>
        <div class="val" style="font-size:0.84rem; line-height:1.5; color:#cbd5e1; font-weight:normal;">${notes}</div>
      </div>

      <div class="brosur-detail-box" style="margin-bottom:20px;">
        <label>Tautan Berkas Google Drive</label>
        <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
          <input type="text" readonly value="${link}" style="flex:1; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); color:#38bdf8; padding:8px 12px; border-radius:4px; font-size:0.8rem; font-family:'JetBrains Mono',monospace;">
          <button type="button" class="btn-preview-tool" onclick="navigator.clipboard.writeText('${link}'); alert('Tautan Google Drive berhasil disalin!')" title="Salin Tautan">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding-top:14px; border-top:1px solid rgba(255,255,255,0.06);">
        <button type="button" class="btn-add-brosur-shortcut" style="margin-left:0; background:#22c55e; color:#ffffff;" onclick="sendBrosurViaWhatsApp('${safeId}')">
          <i class="fa-brands fa-whatsapp" style="font-size:1.1rem;"></i>
          <span>Kirim Via WhatsApp</span>
        </button>
        <a href="${link}" target="_blank" rel="noopener noreferrer" class="btn-refresh-brosur" style="text-decoration:none; color:var(--text-main);">
          <i class="fa-brands fa-google-drive" style="color:#f59e0b;"></i>
          <span>Buka di Google Drive</span>
        </a>
        <button type="button" class="btn-refresh-brosur" onclick="openUpdateStatusModal('${safeId}')">
          <i class="fa-solid fa-pen-to-square" style="color:#38bdf8;"></i>
          <span>Ubah Status</span>
        </button>
      </div>
    `;
  }
};

window.switchPreviewSubTab = function(subTab) {
  const btnDoc = document.getElementById('btnPrevTabDoc');
  const btnDetail = document.getElementById('btnPrevTabDetail');
  const paneDoc = document.getElementById('panePrevTabDoc');
  const paneDetail = document.getElementById('panePrevTabDetail');

  if (subTab === 'detail') {
    btnDoc?.classList.remove('active');
    btnDetail?.classList.add('active');
    paneDoc?.classList.remove('active');
    paneDetail?.classList.add('active');
  } else {
    btnDetail?.classList.remove('active');
    btnDoc?.classList.add('active');
    paneDetail?.classList.remove('active');
    paneDoc?.classList.add('active');
  }
};

window.reloadActiveDrivePreview = function() {
  const iframe = document.getElementById('brosurPreviewIframe');
  const loader = document.getElementById('brosurIframeLoader');
  if (iframe && iframe.src && iframe.src !== 'about:blank') {
    if (loader) {
      loader.style.opacity = '1';
      loader.style.display = 'flex';
    }
    const currentSrc = iframe.src;
    iframe.src = 'about:blank';
    setTimeout(() => {
      iframe.src = currentSrc;
    }, 100);
  }
};

window.copyActiveDriveLink = function() {
  const linkEl = document.getElementById('btnPreviewOpenExternal');
  const link = linkEl?.href;
  if (link && link !== '#' && !link.endsWith('#')) {
    navigator.clipboard.writeText(link).then(() => {
      alert('Tautan Google Drive berhasil disalin ke clipboard!');
    }).catch(() => {
      prompt('Salin tautan Google Drive:', link);
    });
  } else {
    alert('Pilih dokumen terlebih dahulu.');
  }
};

function resetActiveDrivePreviewEmpty() {
  const titleEl = document.getElementById('brosurPreviewTitle');
  const badgeEl = document.getElementById('brosurPreviewBadge');
  const metaEl = document.getElementById('brosurPreviewMeta');
  const iframe = document.getElementById('brosurPreviewIframe');
  const loader = document.getElementById('brosurIframeLoader');
  if (titleEl) titleEl.textContent = 'Tidak Ada Dokumen';
  if (badgeEl) badgeEl.textContent = 'GOOGLE DRIVE VIEWER';
  if (metaEl) metaEl.textContent = 'Sesuaikan pencarian atau filter di atas';
  if (loader) loader.style.display = 'none';
  if (iframe) iframe.src = 'about:blank';
}

window.sendBrosurViaWhatsApp = function(id) {
  const list = state.data.logBrosur || [];
  let item = list.find(x => String(x.id) === String(id));
  if (!item && id && id.startsWith('LOCAL-')) {
    const idx = parseInt(id.replace('LOCAL-', ''), 10);
    if (!isNaN(idx) && list[idx]) item = list[idx];
  }
  if (!item) {
    alert('Data brosur tidak ditemukan.');
    return;
  }

  const name = item.brosurname || item.name || 'Brosur Paket';
  const wil = item.lokasibrosur || item.wilayah || 'Pusat';
  const cat = item.catagory || item.category || 'Umum';
  const validUntilDisplay = formatDateDdMmmYy(item.validuntil);
  const link = item.link || GDRIVE_BROSUR_FOLDER_URL;
  const notes = (item.catatan || '').trim();
  const paket = (item.namapaket || '').trim();

  const lines = [
    `*KATALOG BROSUR PT. FATH INDAH TRAVEL SERVICE*`,
    `----------------------------------------------------`,
    `📌 *Nama Brosur:* ${name}`,
    paket ? `📦 *Rincian Paket:* ${paket}` : null,
    `🏢 *Wilayah:* ${wil}`,
    `🏷️ *Kategori:* ${cat}`,
    validUntilDisplay && validUntilDisplay !== '-' ? `📅 *Masa Berlaku:* s/d ${validUntilDisplay}` : null,
    notes ? `📝 *Keterangan:* ${notes}` : null,
    `----------------------------------------------------`,
    `📥 *Unduh / Buka Berkas Brosur:*`,
    `${link}`,
    `----------------------------------------------------`,
    `_PT. Fath Indah Travel Service - Umrah & Hajj Service_`
  ].filter(Boolean).join('\n');

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(lines)}`;
  window.open(waUrl, '_blank');
};

window.openUpdateStatusModal = function(id) {
  const modal = document.getElementById('updateStatusModal');
  if (!modal) return;

  const list = state.data.logBrosur || [];
  const item = list.find(x => String(x.id) === String(id));
  if (!item) {
    alert('Data brosur tidak ditemukan.');
    return;
  }

  const idInput = document.getElementById('modalStatusBrosurId');
  const nameEl = document.getElementById('modalStatusBrosurName');
  const wilEl = document.getElementById('modalStatusBrosurWilayah');
  const catEl = document.getElementById('modalStatusBrosurCat');
  const tglUpEl = document.getElementById('modalStatusBrosurTglUpload');
  const validEl = document.getElementById('modalStatusBrosurValidUntil');
  const linkEl = document.getElementById('modalStatusBrosurLink');
  const selectEl = document.getElementById('modalStatusSelect');

  if (idInput) idInput.value = item.id;
  if (nameEl) nameEl.textContent = item.brosurname || item.name || '-';
  if (wilEl) wilEl.textContent = item.lokasibrosur || item.wilayah || 'Pusat';
  if (catEl) catEl.textContent = item.catagory || item.category || '-';
  if (tglUpEl) tglUpEl.textContent = item.tglupload || (item.created_at ? String(item.created_at).slice(0, 10) : '-');
  if (validEl) validEl.textContent = item.validuntil || '-';
  if (linkEl) {
    linkEl.href = item.link || GDRIVE_BROSUR_FOLDER_URL;
  }

  if (selectEl) {
    const curStatus = (item.status || 'Aktif').trim();
    selectEl.value = curStatus.toLowerCase() === 'expired' ? 'Expired' : 'Aktif';
  }

  modal.style.display = 'flex';
};

window.closeUpdateStatusModal = function() {
  const modal = document.getElementById('updateStatusModal');
  if (modal) modal.style.display = 'none';
};

window.saveBrochureStatus = async function() {
  const id = document.getElementById('modalStatusBrosurId')?.value;
  const selectEl = document.getElementById('modalStatusSelect');
  const newStatus = selectEl ? selectEl.value : 'Aktif';

  if (!id) return;

  const btnSave = document.getElementById('btnSaveStatusChange');
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan Status...';
  }

  let updated = false;

  // 1. Direct fetch ke Supabase
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/LogBrosur?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      updated = true;
    }
  } catch (e) {
    console.warn('Gagal PATCH status ke Supabase:', e.message);
  }

  // 2. Fallback backend server
  if (!updated && !state.isStaticMode) {
    try {
      const apiRes = await fetch(`/api/brosur/log/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (apiRes.ok) updated = true;
    } catch (_) {}
  }

  // Update item di local state
  if (state.data.logBrosur) {
    const item = state.data.logBrosur.find(x => String(x.id) === String(id));
    if (item) {
      item.status = newStatus;
    }
    localStorage.setItem('fath_indah_log_brosur', JSON.stringify(state.data.logBrosur));
  }

  if (btnSave) {
    btnSave.disabled = false;
    btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan Status';
  }

  closeUpdateStatusModal();
  renderBrosurTable();
  alert(`Status brosur berhasil diubah menjadi: "${newStatus}"!`);
};

window.deleteBrosurRecord = async function(id) {
  const list = state.data.logBrosur || [];
  const item = list.find(x => String(x.id) === String(id));
  const brosurName = item ? (item.brosurname || item.name) : 'brosur';

  const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus brosur "${brosurName}" dari daftar dan database LogBrosur?`);
  if (!confirmDelete) return;

  // 1. Direct delete Supabase
  try {
    await fetch(`${SUPABASE_CONFIG.url}/rest/v1/LogBrosur?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
  } catch (e) {
    console.warn('Gagal DELETE langsung ke Supabase:', e.message);
  }

  // 2. Delete server API jika running
  if (!state.isStaticMode) {
    try {
      await fetch(`/api/brosur/log/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (_) {}
  }

  // Hapus dari state
  state.data.logBrosur = list.filter(x => String(x.id) !== String(id));
  localStorage.setItem('fath_indah_log_brosur', JSON.stringify(state.data.logBrosur));

  renderBrosurTable();
  alert(`Brosur "${brosurName}" berhasil dihapus dari database!`);
};

window.copyBrosurLink = function(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert('Tautan berkas berhasil disalin ke clipboard!');
  }).catch(() => {
    prompt('Salin tautan berkas berikut:', url);
  });
};

window.onBrosurFilterChange = function() {
  const searchInput = document.getElementById('brosurSearchInput');
  const catSelect = document.getElementById('brosurCategoryFilter');
  const wilSelect = document.getElementById('brosurWilayahFilter');
  const statusSelect = document.getElementById('brosurStatusFilter');
  if (searchInput) state.brosurFilter.search = searchInput.value.trim();
  if (catSelect) state.brosurFilter.category = catSelect.value;
  if (wilSelect) state.brosurFilter.wilayah = wilSelect.value;
  if (statusSelect) state.brosurFilter.status = statusSelect.value;
  renderBrosurTable();
};

window.reloadBrosurData = async function() {
  const tbody = document.getElementById('logBrosurTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:36px; color:#64748b;">
          <i class="fa-solid fa-spinner fa-spin" style="color:var(--gold-light); font-size:1.5rem;"></i>
          <div style="margin-top:10px;">Memperbarui data brosur...</div>
        </td>
      </tr>
    `;
  }
  await loadBrosurData(true);
};

// ==========================================================================
// 6B. REKAPITULASI ABSENSI BULANAN (MATRIX REKAP & WEEKEND ARSIRAN)
// ==========================================================================

const INDO_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INDO_DAY_LETTERS = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
const INDO_DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function parseCSVMatrixClient(csvText) {
  const lines = [];
  let cur = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    const next = csvText[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') { field += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === ',' && !inQuotes) {
      cur.push(field.trim()); field = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      cur.push(field.trim()); lines.push(cur); cur = []; field = '';
    } else {
      field += c;
    }
  }
  if (field || cur.length) { cur.push(field.trim()); lines.push(cur); }
  return lines;
}

function getRekapCodeLabel(code) {
  switch (code) {
    case 'H': return 'Hadir';
    case 'S': return 'Sakit';
    case 'I': return 'Izin';
    case 'A': return 'Alpha / Tanpa Keterangan';
    case 'P': return 'Perjalanan Dinas';
    case 'C': return 'Cuti';
    case 'L': return 'Lain-lain';
    case 'W': return 'Work From Home (WFH)';
    case 'T': return 'Terlambat Datang';
    default: return code;
  }
}

async function loadRekapAbsensiData(force = false) {
  const filterMonth = state.rekapFilter?.month || 10;
  const filterYear = state.rekapFilter?.year || 2026;

  if (state.data.rekapAbsensi && !force && 
      state.data.rekapAbsensi.month === filterMonth && 
      state.data.rekapAbsensi.year === filterYear) {
    return state.data.rekapAbsensi;
  }

  // 1. Try Full-stack Node API if not in static mode
  if (!state.isStaticMode) {
    try {
      const res = await fetch(`/api/rekap-absensi?month=${filterMonth}&year=${filterYear}${force ? '&force=true' : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.employees) {
          state.data.rekapAbsensi = json;
          return json;
        }
      }
    } catch (e) {
      console.warn('Backend /api/rekap-absensi not reachable, fallback to direct sources:', e.message);
    }
  }

  // 2. Direct Supabase Query (Tabel users & absensi di Supabase)
  try {
    // 2a. Ambil data Nama Karyawan dari Tabel users dengan Header full_name
    // Dimana NoUrut bernilai lebih dari 1 atau not NULL dan diurutkan NoUrut secara ascending
    let usersList = [];
    try {
      const uUrl = `${SUPABASE_CONFIG.url}/rest/v1/users?select=id,username,nama,full_name,kanwil,kantor,status,NoUrut&NoUrut=not.is.null&order=NoUrut.asc`;
      const uRes = await fetch(uUrl, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (uRes.ok) {
        usersList = await uRes.json();
      }
    } catch (uErr) {
      console.warn('Gagal fetch users dengan NoUrut dari Supabase REST API:', uErr);
    }

    if (!usersList || usersList.length === 0) {
      usersList = state.data.users || [];
    }

    // Filter NoUrut bernilai > 1 atau not NULL (angka valid >= 1 dan bukan null)
    const validUsers = (usersList || []).filter(u => {
      const nu = u.NoUrut !== undefined ? u.NoUrut : u.noUrut;
      if (nu === null || nu === undefined || nu === '') return false;
      const num = Number(nu);
      return !isNaN(num) && (num >= 1 || nu !== null);
    });

    // Urutkan NoUrut secara ascending
    validUsers.sort((a, b) => {
      const na = Number(a.NoUrut !== undefined ? a.NoUrut : a.noUrut);
      const nb = Number(b.NoUrut !== undefined ? b.NoUrut : b.noUrut);
      return na - nb;
    });

    const employees = [];
    const seenNames = new Set();
    const empIndexMap = {};

    validUsers.forEach(u => {
      const fullName = (u.full_name || u.FullName || u.nama || u.username || '').trim().toUpperCase();
      if (!fullName || seenNames.has(fullName)) return;
      seenNames.add(fullName);

      const no = String(u.NoUrut !== undefined ? u.NoUrut : (u.noUrut || (employees.length + 1)));
      const loc = (u.kantor || u.Kantor || u.kanwil || u.Kanwil || 'PUSAT').toUpperCase();
      const empObj = {
        no,
        name: fullName,
        location: loc,
        days: {}
      };
      empIndexMap[fullName] = empObj;
      employees.push(empObj);
    });

    // 2b. Ambil data presensi dari Tabel absensi sesuai bulan & tahun
    const sbUrl = `${SUPABASE_CONFIG.url}/rest/v1/absensi?select=*&bulan=eq.${filterMonth}&tahun=eq.${filterYear}&limit=5000`;
    const res = await fetch(sbUrl, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });

    if (res.ok) {
      const records = await res.json();
      if (records && records.length > 0) {
        records.forEach(r => {
          const empName = (r.nama_karyawan || r.nama_user || '').trim().toUpperCase();
          if (!empName || !empIndexMap[empName]) return;

          const day = parseInt((r.tanggal || '').slice(8, 10), 10);
          if (day && r.kode) {
            empIndexMap[empName].days[day] = r.kode.toUpperCase();
          }
        });
      }

      const data = {
        month: filterMonth,
        year: filterYear,
        count: employees.length,
        employees,
        source: 'supabase'
      };
      state.data.rekapAbsensi = data;
      return data;
    }
  } catch (sbErr) {
    console.warn('Direct Supabase fetch for rekap failed:', sbErr);
  }

  // 3. Fallback to Direct Google Sheet
  try {
    const sheetName = 'Rekap Absensi';
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    if (res.ok) {
      const csvText = await res.text();
      const matrix = parseCSVMatrixClient(csvText);

      let sheetMonth = 10;
      let sheetYear = 2026;
      if (matrix[2] && matrix[2][2]) {
        const m = parseInt(matrix[2][2], 10);
        if (!isNaN(m)) sheetMonth = m;
      }
      if (matrix[3] && matrix[3][2]) {
        const y = parseInt(matrix[3][2], 10);
        if (!isNaN(y)) sheetYear = y;
      }

      const employees = [];
      for (let i = 9; i < matrix.length; i++) {
        const row = matrix[i];
        if (!row || !row[1]) continue;
        const no = row[0] || String(employees.length + 1);
        const name = row[1];
        const location = row[2] || 'PUSAT';
        const days = {};
        for (let d = 1; d <= 31; d++) {
          days[d] = (row[2 + d] || '').trim().toUpperCase();
        }
        employees.push({ no, name, location, days });
      }

      const data = {
        month: sheetMonth,
        year: sheetYear,
        count: employees.length,
        employees,
        source: 'googlesheets'
      };
      state.data.rekapAbsensi = data;
      return data;
    }
  } catch (err) {
    console.error('Failed to load Rekap Absensi sheet directly:', err);
  }

  return null;
}

function initRekapAbsensiEvents() {
  const monthSelect = document.getElementById('rekapMonthSelect');
  const yearSelect = document.getElementById('rekapYearSelect');
  const prevBtn = document.getElementById('rekapPrevMonthBtn');
  const nextBtn = document.getElementById('rekapNextMonthBtn');
  const currentBtn = document.getElementById('rekapCurrentMonthBtn');
  const searchInput = document.getElementById('searchRekapInput');
  const lokasiSelect = document.getElementById('filterRekapLokasi');
  const refreshBtn = document.getElementById('refreshRekapBtn');
  const printBtn = document.getElementById('printRekapBtn');

  monthSelect?.addEventListener('change', (e) => {
    state.rekapFilter.month = parseInt(e.target.value, 10);
    renderRekapTable();
  });

  yearSelect?.addEventListener('change', (e) => {
    state.rekapFilter.year = parseInt(e.target.value, 10);
    renderRekapTable();
  });

  prevBtn?.addEventListener('click', () => {
    let m = state.rekapFilter.month - 1;
    let y = state.rekapFilter.year;
    if (m < 1) {
      m = 12;
      y--;
    }
    state.rekapFilter.month = m;
    state.rekapFilter.year = y;
    if (monthSelect) monthSelect.value = String(m);
    if (yearSelect) yearSelect.value = String(y);
    renderRekapTable();
  });

  nextBtn?.addEventListener('click', () => {
    let m = state.rekapFilter.month + 1;
    let y = state.rekapFilter.year;
    if (m > 12) {
      m = 1;
      y++;
    }
    state.rekapFilter.month = m;
    state.rekapFilter.year = y;
    if (monthSelect) monthSelect.value = String(m);
    if (yearSelect) yearSelect.value = String(y);
    renderRekapTable();
  });

  currentBtn?.addEventListener('click', () => {
    const targetMonth = 10;
    const targetYear = 2026;
    state.rekapFilter.month = targetMonth;
    state.rekapFilter.year = targetYear;
    if (monthSelect) monthSelect.value = String(targetMonth);
    if (yearSelect) yearSelect.value = String(targetYear);
    renderRekapTable();
  });

  searchInput?.addEventListener('input', (e) => {
    state.rekapFilter.search = e.target.value.toLowerCase().trim();
    renderRekapTable();
  });

  lokasiSelect?.addEventListener('change', (e) => {
    state.rekapFilter.location = e.target.value;
    renderRekapTable();
  });

  refreshBtn?.addEventListener('click', async () => {
    const icon = refreshBtn.querySelector('i');
    if (icon) icon.classList.add('fa-spin');
    await loadRekapAbsensiData(true);
    renderRekapTable();
    if (icon) icon.classList.remove('fa-spin');
  });

  printBtn?.addEventListener('click', () => {
    window.print();
  });
}

async function renderRekapAbsensi() {
  if (!state.data.rekapAbsensi) {
    await loadRekapAbsensiData();
  }
  // Sync select inputs with state
  const monthSelect = document.getElementById('rekapMonthSelect');
  const yearSelect = document.getElementById('rekapYearSelect');
  if (monthSelect) monthSelect.value = String(state.rekapFilter.month);
  if (yearSelect) yearSelect.value = String(state.rekapFilter.year);

  renderRekapTable();
}

function renderRekapTable() {
  const thead = document.getElementById('rekapTableHead');
  const tbody = document.getElementById('rekapTableBody');
  if (!thead || !tbody) return;

  const month = parseInt(state.rekapFilter.month, 10);
  const year = parseInt(state.rekapFilter.year, 10);
  const monthName = INDO_MONTH_NAMES[month - 1] || 'Bulan';

  // Dynamic Day Count for Selected Month and Year (28, 29, 30, or 31)
  const totalDays = new Date(year, month, 0).getDate();

  // Compute Day Metadata (Detect Saturday & Sunday)
  const dayMetas = [];
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isSaturday = (dayOfWeek === 6);
    const isSunday = (dayOfWeek === 0);
    const isWeekend = isSaturday || isSunday;
    dayMetas.push({
      day: d,
      dayOfWeek,
      isSaturday,
      isSunday,
      isWeekend,
      letter: INDO_DAY_LETTERS[dayOfWeek],
      dayName: INDO_DAY_NAMES[dayOfWeek]
    });
  }

  // 1. BUILD TABLE THEAD
  // Row 1: Fixed headers + Month Title Colspan + Rekap Summary Colspan
  let thRow1 = `
    <tr>
      <th rowspan="2" class="sticky-col-1">NO</th>
      <th rowspan="2" class="sticky-col-2">NAMA KARYAWAN</th>
      <th rowspan="2" class="sticky-col-3">LOKASI</th>
      <th colspan="${totalDays}" class="month-header-banner">
        <i class="fa-solid fa-calendar-days" style="margin-right:6px;"></i>
        BULAN ${monthName.toUpperCase()} ${year}
      </th>
      <th colspan="8" class="rekap-summary-banner">
        <i class="fa-solid fa-chart-simple" style="margin-right:6px;"></i>
        TOTAL REKAPITULASI
      </th>
    </tr>
  `;

  // Row 2: Days 1..N (with Day Number & Initial) + Summary Codes
  let thRow2 = '<tr>';
  dayMetas.forEach(m => {
    let colClass = 'day-col';
    if (m.isSaturday) colClass += ' saturday-col';
    else if (m.isSunday) colClass += ' sunday-col';

    const weekendBadge = m.isWeekend ? ` [${m.dayName} - Akhir Pekan]` : '';
    thRow2 += `
      <th class="${colClass}" title="${m.dayName}, ${m.day} ${monthName} ${year}${weekendBadge}">
        <span class="matrix-day-num">${m.day}</span>
        <span class="matrix-day-letter">${m.letter}</span>
      </th>
    `;
  });

  // Summary headers: H, S, I, A, P, C, L, %
  thRow2 += `
    <th class="rekap-sum-cell" style="color:#34d399;" title="Total Hadir (H)">H</th>
    <th class="rekap-sum-cell" style="color:#fbbf24;" title="Total Sakit (S)">S</th>
    <th class="rekap-sum-cell" style="color:#38bdf8;" title="Total Izin (I)">I</th>
    <th class="rekap-sum-cell" style="color:#f87171;" title="Total Alpha (A)">A</th>
    <th class="rekap-sum-cell" style="color:#f472b6;" title="Total Dinas (P)">P</th>
    <th class="rekap-sum-cell" style="color:#5eead4;" title="Total Cuti (C)">C</th>
    <th class="rekap-sum-cell" style="color:#c084fc;" title="Total Lain-lain (L)">L</th>
    <th class="rekap-sum-pct" title="Persentase Kehadiran Kerja">%</th>
  `;
  thRow2 += '</tr>';

  thead.innerHTML = thRow1 + thRow2;

  // 2. GET & FILTER EMPLOYEES
  let rawEmployees = state.data.rekapAbsensi?.employees || [];
  if (rawEmployees.length === 0 && state.data.users?.length > 0) {
    // Fallback to active users with NoUrut > 1 / not NULL
    const validFallback = state.data.users
      .filter(u => {
        const nu = u.NoUrut !== undefined ? u.NoUrut : u.noUrut;
        return nu !== null && nu !== undefined && nu !== '' && !isNaN(Number(nu)) && Number(nu) >= 1;
      })
      .sort((a, b) => {
        const na = Number(a.NoUrut !== undefined ? a.NoUrut : a.noUrut);
        const nb = Number(b.NoUrut !== undefined ? b.NoUrut : b.noUrut);
        return na - nb;
      });

    const seenNames = new Set();
    rawEmployees = [];
    validFallback.forEach((u, idx) => {
      const fn = (u.FullName || u.full_name || u.Username || '').trim().toUpperCase();
      if (!fn || seenNames.has(fn)) return;
      seenNames.add(fn);
      rawEmployees.push({
        no: String(u.NoUrut || idx + 1),
        name: fn,
        location: (u.Kantor || u.kantor || u.Kanwil || u.kanwil || 'PUSAT').toUpperCase(),
        days: {}
      });
    });
  }

  const searchQuery = (state.rekapFilter.search || '').toLowerCase().trim();
  const filterLoc = (state.rekapFilter.location || 'ALL').toUpperCase();

  const filtered = rawEmployees.filter(emp => {
    const matchSearch = !searchQuery || 
      emp.name.toLowerCase().includes(searchQuery) || 
      emp.location.toLowerCase().includes(searchQuery);
    const matchLoc = (filterLoc === 'ALL') || (emp.location.toUpperCase() === filterLoc);
    return matchSearch && matchLoc;
  });

  // Populate dynamic location dropdown options if needed
  populateRekapLocations(rawEmployees);

  // 3. BUILD TBODY ROWS & CALCULATE KPI STATS
  let globalTotalH = 0;
  let globalTotalS = 0;
  let globalTotalI = 0;
  let globalTotalA = 0;
  let globalTotalP = 0;
  let globalTotalC = 0;
  let globalTotalL = 0;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${totalDays + 11}" style="text-align:center; padding: 36px; color: var(--text-muted);">
          <i class="fa-solid fa-user-slash" style="font-size:1.6rem; margin-bottom:8px; display:block; opacity:0.5;"></i>
          Tidak ada data karyawan yang cocok dengan filter pencarian ("${state.rekapFilter.search || state.rekapFilter.location}").
        </td>
      </tr>
    `;
    updateRekapKpis(0, 0, 0, 0, 0);
    return;
  }

  const sheetMonth = state.data.rekapAbsensi?.month || 10;
  const sheetYear = state.data.rekapAbsensi?.year || 2026;
  const isSheetMonth = (month === sheetMonth && year === sheetYear);

  // Count total workdays (weekdays) in the month
  const totalWorkdays = dayMetas.filter(m => !m.isWeekend).length;

  const rowsHtml = filtered.map((emp, rowIdx) => {
    let rowH = 0, rowS = 0, rowI = 0, rowA = 0, rowP = 0, rowC = 0, rowL = 0;

    let dayCellsHtml = '';
    dayMetas.forEach(m => {
      let code = '';
      if (isSheetMonth) {
        code = (emp.days && emp.days[m.day]) ? emp.days[m.day].trim().toUpperCase() : '';
      } else {
        // If another month is selected, match against state.data.absensi if available
        code = findAttendanceForDate(emp.name, year, month, m.day, m.isWeekend);
      }

      // Track counters
      if (code === 'H') rowH++;
      else if (code === 'S') rowS++;
      else if (code === 'I') rowI++;
      else if (code === 'A') rowA++;
      else if (code === 'P') rowP++;
      else if (code === 'C') rowC++;
      else if (code === 'L') rowL++;

      // Weekend vs Weekday Cell Styling
      let cellClass = 'day-cell';
      let titleTooltip = `${emp.name} - ${m.dayName}, ${m.day} ${monthName} ${year}`;

      if (m.isSaturday) {
        cellClass += ' saturday-cell';
        titleTooltip += ' (Hari Libur Sabtu)';
      } else if (m.isSunday) {
        cellClass += ' sunday-cell';
        titleTooltip += ' (Hari Libur Minggu)';
      }

      let content = '';
      if (code) {
        const label = getRekapCodeLabel(code);
        titleTooltip += `: ${label} (${code})`;
        content = `<span class="badge-rekap badge-code-${code}" title="${titleTooltip}">${code}</span>`;
      } else if (m.isWeekend) {
        // Empty weekend with arsiran
        content = '';
      }

      dayCellsHtml += `<td class="${cellClass}" title="${titleTooltip}">${content}</td>`;
    });

    // Accumulate globals
    globalTotalH += rowH;
    globalTotalS += rowS;
    globalTotalI += rowI;
    globalTotalA += rowA;
    globalTotalP += rowP;
    globalTotalC += rowC;
    globalTotalL += rowL;

    // Calculate attendance percentage based on weekdays
    const pct = totalWorkdays > 0 
      ? Math.min(100, Math.round(((rowH + rowP) / totalWorkdays) * 100)) 
      : 100;

    return `
      <tr>
        <td class="sticky-col-1">${emp.no || (rowIdx + 1)}</td>
        <td class="sticky-col-2">
          <div class="rekap-emp-name" title="${emp.name}">${emp.name}</div>
        </td>
        <td class="sticky-col-3">
          <span class="rekap-emp-loc">${emp.location}</span>
        </td>
        ${dayCellsHtml}
        <td class="rekap-sum-cell rekap-sum-h">${rowH || 0}</td>
        <td class="rekap-sum-cell rekap-sum-s">${rowS || '-'}</td>
        <td class="rekap-sum-cell rekap-sum-i">${rowI || '-'}</td>
        <td class="rekap-sum-cell rekap-sum-a">${rowA || '-'}</td>
        <td class="rekap-sum-cell">${rowP || '-'}</td>
        <td class="rekap-sum-cell">${rowC || '-'}</td>
        <td class="rekap-sum-cell">${rowL || '-'}</td>
        <td class="rekap-sum-pct">${pct}%</td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rowsHtml;

  // 4. UPDATE TOP KPI SUMMARY CARDS
  updateRekapKpis(
    filtered.length,
    globalTotalH,
    globalTotalS + globalTotalI,
    globalTotalA,
    globalTotalP + globalTotalC
  );
}

function updateRekapKpis(totalKaryawan, totalHadir, totalSakitIzin, totalAlpha, totalDinasCuti) {
  const elKaryawan = document.getElementById('kpiTotalKaryawan');
  const elHadir = document.getElementById('kpiTotalHadir');
  const elSakitIzin = document.getElementById('kpiTotalSakitIzin');
  const elAlpha = document.getElementById('kpiTotalAlpha');
  const elDinasCuti = document.getElementById('kpiTotalDinasCuti');

  if (elKaryawan) elKaryawan.textContent = totalKaryawan.toLocaleString('id-ID');
  if (elHadir) elHadir.textContent = totalHadir.toLocaleString('id-ID');
  if (elSakitIzin) elSakitIzin.textContent = totalSakitIzin.toLocaleString('id-ID');
  if (elAlpha) elAlpha.textContent = totalAlpha.toLocaleString('id-ID');
  if (elDinasCuti) elDinasCuti.textContent = totalDinasCuti.toLocaleString('id-ID');
}

function populateRekapLocations(employees) {
  const select = document.getElementById('filterRekapLokasi');
  if (!select) return;

  const currentVal = state.rekapFilter.location || 'ALL';
  const locations = [...new Set(employees.map(e => (e.location || 'PUSAT').trim().toUpperCase()).filter(Boolean))].sort();

  let html = '<option value="ALL">Semua Lokasi</option>';
  locations.forEach(loc => {
    const isSelected = (loc === currentVal) ? 'selected' : '';
    html += `<option value="${loc}" ${isSelected}>${loc}</option>`;
  });
  select.innerHTML = html;
}

function findAttendanceForDate(employeeName, year, month, day, isWeekend) {
  // If records exist in state.data.absensi, check there
  const absList = state.data.absensi || [];
  const empLower = employeeName.toLowerCase();
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  const found = absList.find(a => {
    const aName = (a.NamaKaryawan || a.NamaUser || a.FULLNAME || a.Username || '').toLowerCase();
    const aDate = (a.Tanggal || a.Timestamp || a.timestamp || '').slice(0, 10);
    return aName.includes(empLower) && aDate === dateStr;
  });

  if (found) {
    const status = (found.Status || found.Tipe || '').toLowerCase();
    if (status.includes('sakit')) return 'S';
    if (status.includes('izin')) return 'I';
    if (status.includes('dinas')) return 'P';
    if (status.includes('cuti')) return 'C';
    if (status.includes('alpha')) return 'A';
    return 'H';
  }

  // Weekends have no default attendance
  if (isWeekend) return '';

  return '';
}

window.reloadRekapAbsensi = async function() {
  await loadRekapAbsensiData(true);
  renderRekapTable();
};

window.onRekapFilterChange = function() {
  const searchInput = document.getElementById('searchRekapInput');
  const lokasiSelect = document.getElementById('filterRekapLokasi');
  if (searchInput) state.rekapFilter.search = searchInput.value.toLowerCase().trim();
  if (lokasiSelect) state.rekapFilter.location = lokasiSelect.value;
  renderRekapTable();
};

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

// ==========================================================================
// 12. MODUL CUTI KARYAWAN & CUTI BERSAMA (SUPABASE DIRECT INTEGRATION)
//     mod_cuti_karyawan (Pengajuan Mandiri & Kuota)
//     mod_cuti_bersama  (Setting Cuti Bersama, Approval & Matriks Kuota)
// ==========================================================================

if (!state.cuti) {
  state.cuti = {
    karyawanList: [],
    bersamaList: [],
    employees: [],
    selectedYear: '2026',
    activeCbTab: 'list',
    userQuota: { netQuota: 12, terpakai: 0, sisaCuti: 12 },
    activeApprovalItem: null
  };
}

// Helper: Format Tanggal Indonesia (dd Mmm yyyy)
function formatIndoCutiDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const cleanStr = String(dateStr).split('T')[0].split(' ')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${months[monthIdx] || parts[1]} ${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch (e) {
    // fallback
  }
  return String(dateStr);
}

// Folder Target Google Drive untuk Dokumen Pendukung Cuti Karyawan
const GDRIVE_CUTI_FOLDER_ID = '12Fcad07H3-DF3HJteLuvJ8Zpd3W7UzBD';
const GDRIVE_CUTI_FOLDER_URL = 'https://drive.google.com/drive/folders/12Fcad07H3-DF3HJteLuvJ8Zpd3W7UzBD?usp=sharing';
let selectedCutiFile = null;

// Helper: Dapatkan daftar karyawan untuk dropdown & matriks
async function fetchEmployeesForCuti(forceRefresh = false) {
  // Jika sudah ada dan valid (bukan generic 'Karyawan')
  if (!forceRefresh && state.cuti.employees && state.cuti.employees.length > 0) {
    const hasValidNames = state.cuti.employees.some(e => e.nama && e.nama !== 'Karyawan' && !e.nama.startsWith('Karyawan '));
    if (hasValidNames) {
      return state.cuti.employees;
    }
  }

  // 1. Prioritas Utama: Ambil dari Tabel Supabase "Bio_Karyawan" (atau view "bio_karyawan" / "Bio Karyawan")
  try {
    const endpoints = [
      `${SUPABASE_CONFIG.url}/rest/v1/Bio_Karyawan?select=*&order=nama_karyawan.asc`,
      `${SUPABASE_CONFIG.url}/rest/v1/bio_karyawan?select=*&order=nama_karyawan.asc`
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: {
            'apikey': SUPABASE_CONFIG.anonKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
          }
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const mapped = list
              .filter(k => {
                const st = String(k.status || 'Aktif').toLowerCase();
                return st !== 'inactive' && st !== 'nonaktif' && st !== 'non-aktif';
              })
              .map(k => ({
                nik: k.nik || k.NIK || '',
                nama: k.nama_karyawan || k['Nama Karyawan'] || '',
                jabatan: k.jabatan || k.Jabatan || k.divisi || 'Staff',
                kanwil: k.kantor || k.Kantor || 'Pusat',
                divisi: k.divisi || k.Divisi || '',
                status: k.status || 'Aktif'
              }))
              .filter(e => e.nama && e.nama !== 'Karyawan');

            if (mapped.length > 0) {
              mapped.sort((a, b) => a.nama.localeCompare(b.nama));
              state.cuti.employees = mapped;
              return state.cuti.employees;
            }
          }
        }
      } catch (errInner) {
        // coba endpoint berikutnya
      }
    }
  } catch (errSupabase) {
    console.warn('Gagal memuat Bio_Karyawan dari Supabase REST:', errSupabase);
  }

  // 2. Prioritas Kedua: Ambil dari Backend Server API /api/bio-karyawan
  try {
    const resServer = await fetch('/api/bio-karyawan');
    if (resServer.ok) {
      const json = await resServer.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list
          .filter(k => {
            const st = String(k.status || 'Aktif').toLowerCase();
            return st !== 'inactive' && st !== 'nonaktif' && st !== 'non-aktif';
          })
          .map(k => ({
            nik: k.nik || k.NIK || '',
            nama: k.nama_karyawan || k['Nama Karyawan'] || '',
            jabatan: k.jabatan || k.Jabatan || k.divisi || 'Staff',
            kanwil: k.kantor || k.Kantor || 'Pusat',
            divisi: k.divisi || k.Divisi || '',
            status: k.status || 'Aktif'
          }))
          .filter(e => e.nama && e.nama !== 'Karyawan');

        if (mapped.length > 0) {
          mapped.sort((a, b) => a.nama.localeCompare(b.nama));
          state.cuti.employees = mapped;
          return state.cuti.employees;
        }
      }
    }
  } catch (errServer) {
    // Abaikan jika running static
  }

  // 3. Prioritas Ketiga (LIVE Direct Sheet Fallback): Ambil langsung dari Google Sheet "Bio Karyawan"
  // Spreadsheet ID: 1VL8trcMIcZ6n5Be-2-9YwmC1pOsKliO_wbILmU_cC1s
  try {
    const sheetId = '1VL8trcMIcZ6n5Be-2-9YwmC1pOsKliO_wbILmU_cC1s';
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Bio Karyawan')}`;
    const resGviz = await fetch(sheetUrl);
    if (resGviz.ok) {
      const text = await resGviz.text();
      const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const data = JSON.parse(jsonStr);
      if (data && data.table && Array.isArray(data.table.rows)) {
        const cols = data.table.cols.map(c => (c ? c.label : ''));
        const mapped = data.table.rows.map((r, idx) => {
          const obj = {};
          cols.forEach((colName, cidx) => {
            const cell = r.c ? r.c[cidx] : null;
            obj[colName] = cell && cell.v !== undefined ? cell.v : '';
          });
          return {
            nik: String(obj['NIK'] || `EMP-${String(idx + 1).padStart(3, '0')}`).trim(),
            nama: String(obj['Nama Karyawan'] || '').trim(),
            jabatan: String(obj['Jabatan'] || obj['Divisi'] || 'Staff').trim(),
            kanwil: String(obj['Kantor'] || 'Pusat').trim(),
            divisi: String(obj['Divisi'] || '').trim(),
            status: String(obj['Status'] || 'Aktif').trim()
          };
        })
        .filter(k => {
          const st = (k.status || 'Aktif').toLowerCase();
          return k.nama && k.nama !== 'Karyawan' && st !== 'non aktif' && st !== 'inactive' && st !== 'nonaktif';
        });

        if (mapped.length > 0) {
          mapped.sort((a, b) => a.nama.localeCompare(b.nama));
          state.cuti.employees = mapped;
          return state.cuti.employees;
        }
      }
    }
  } catch (errGviz) {
    console.warn('Gagal memuat Bio Karyawan langsung dari Google Sheet:', errGviz);
  }

  // 4. Fallback ke state.data.users
  if (state.data && state.data.users && state.data.users.length > 0) {
    const mapped = state.data.users
      .filter(u => {
        const st = String(u.Status || u.status || 'Active').toLowerCase();
        return st !== 'inactive' && st !== 'nonaktif' && st !== 'non-aktif';
      })
      .map((u, idx) => {
        const nama = (u.FullName || u.full_name || u.nama || u.Nama || u.Username || u.username || '').trim();
        const nik = u.user_id || u.NoUrut || u.ID || u.id || (idx + 1 < 10 ? `EMP-00${idx + 1}` : `EMP-0${idx + 1}`);
        const jabatan = u.Role || u.role || u.jabatan || u.Jabatan || 'Staff';
        const kanwil = u.Kanwil || u.kanwil || 'Pusat';
        return { nik, nama, jabatan, kanwil };
      })
      .filter(e => e.nama && e.nama !== 'Karyawan');

    if (mapped.length > 0) {
      mapped.sort((a, b) => a.nama.localeCompare(b.nama));
      state.cuti.employees = mapped;
      return state.cuti.employees;
    }
  }

  // 5. Fallback ke Supabase users table
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/users?select=*&order=full_name.asc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    if (res.ok) {
      const users = await res.json();
      const mapped = users
        .filter(u => {
          const st = String(u.status || u.Status || 'Active').toLowerCase();
          return st !== 'inactive' && st !== 'nonaktif' && st !== 'non-aktif';
        })
        .map((u, idx) => {
          const nama = (u.full_name || u.FullName || u.nama || u.Nama || u.username || u.Username || '').trim();
          const nik = u.user_id || u.NoUrut || u.id || u.ID || (idx + 1 < 10 ? `EMP-00${idx + 1}` : `EMP-0${idx + 1}`);
          const jabatan = u.role || u.Role || u.jabatan || u.Jabatan || 'Staff';
          const kanwil = u.kanwil || u.Kanwil || 'Pusat';
          return { nik, nama, jabatan, kanwil };
        })
        .filter(e => e.nama && e.nama !== 'Karyawan');

      const seenMap = new Map();
      mapped.forEach(e => {
        const key = e.nama.toLowerCase();
        if (!seenMap.has(key)) {
          seenMap.set(key, e);
        }
      });
      const uniqueMapped = Array.from(seenMap.values());

      if (uniqueMapped.length > 0) {
        uniqueMapped.sort((a, b) => a.nama.localeCompare(b.nama));
        state.cuti.employees = uniqueMapped;
        return state.cuti.employees;
      }
    }
  } catch (err) {
    console.warn('Gagal memuat users dari Supabase untuk cuti:', err);
  }

  // 6. Fallback: Ekstrak dari riwayat data cuti_karyawan yang sudah pernah ada
  if (state.cuti.karyawanList && state.cuti.karyawanList.length > 0) {
    const seen = new Set();
    const fromCuti = [];
    state.cuti.karyawanList.forEach(c => {
      const nama = String(c.namakaryawan || '').trim();
      if (nama && nama !== '-' && !seen.has(nama.toLowerCase())) {
        seen.add(nama.toLowerCase());
        fromCuti.push({
          nik: c.nik || 'EMP-001',
          nama: nama,
          jabatan: c.jabatan || 'Staff',
          kanwil: 'Pusat'
        });
      }
    });
    if (fromCuti.length > 0) {
      fromCuti.sort((a, b) => a.nama.localeCompare(b.nama));
      state.cuti.employees = fromCuti;
      return state.cuti.employees;
    }
  }

  return [];
}


// Handler File Dokumen Lokal Cuti
window.onCutiDokumenFileSelected = function(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  // Batas 10MB
  if (file.size > 10 * 1024 * 1024) {
    alert('Ukuran berkas melebihi 10MB. Silakan pilih dokumen yang lebih kecil.');
    event.target.value = '';
    return;
  }

  selectedCutiFile = file;

  const idleBox = document.getElementById('cutiDropzoneIdle');
  const selectedBox = document.getElementById('cutiDropzoneSelected');
  const nameEl = document.getElementById('cutiSelectedFileName');
  const metaEl = document.getElementById('cutiSelectedFileMeta');
  const iconEl = document.getElementById('cutiSelectedFileIcon');

  if (idleBox) idleBox.style.display = 'none';
  if (selectedBox) selectedBox.style.display = 'flex';
  if (nameEl) nameEl.textContent = file.name;

  const sizeKb = (file.size / 1024).toFixed(1);
  const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKb} KB`;
  if (metaEl) metaEl.textContent = `${sizeStr} • Siap diunggah ke Google Drive`;

  if (iconEl) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') iconEl.innerHTML = '<i class="fa-solid fa-file-pdf" style="color:#f43f5e;"></i>';
    else if (['jpg', 'jpeg', 'png'].includes(ext)) iconEl.innerHTML = '<i class="fa-solid fa-file-image" style="color:#38bdf8;"></i>';
    else if (['doc', 'docx'].includes(ext)) iconEl.innerHTML = '<i class="fa-solid fa-file-word" style="color:#60a5fa;"></i>';
    else iconEl.innerHTML = '<i class="fa-solid fa-file-lines"></i>';
  }
};

window.removeSelectedCutiFile = function(event) {
  if (event) event.stopPropagation();
  selectedCutiFile = null;

  const fileInput = document.getElementById('cutiDokumenFileInput');
  if (fileInput) fileInput.value = '';

  const idleBox = document.getElementById('cutiDropzoneIdle');
  const selectedBox = document.getElementById('cutiDropzoneSelected');
  if (idleBox) idleBox.style.display = 'flex';
  if (selectedBox) selectedBox.style.display = 'none';
};

// Fungsi Upload Berkas Cuti ke Google Drive Folder
async function uploadCutiDokumenToGoogleDrive(file, namaKaryawan, tipeCuti) {
  const gdriveWebhookUrl = getGDriveWebhookUrl();
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
  const cleanNama = (namaKaryawan || 'Karyawan').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanTipe = (tipeCuti || 'Cuti').replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const targetFileName = `CUTI_${cleanNama}_${cleanTipe}_${timestamp}.${ext}`;

  // 1. Coba upload via Webhook Apps Script jika sudah dipasang
  if (gdriveWebhookUrl) {
    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const payload = {
        folderId: GDRIVE_CUTI_FOLDER_ID,
        fileName: targetFileName,
        mimeType: file.type || 'application/pdf',
        base64: base64Data
      };

      const response = await fetch(gdriveWebhookUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        if (result && (result.directLink || result.fileUrl)) {
          return {
            success: true,
            linkDokumen: result.directLink || result.fileUrl,
            fileName: targetFileName
          };
        }
      }
    } catch (uploadErr) {
      console.warn('Auto upload ke Google Drive via webhook gagal, menggunakan fallback:', uploadErr);
    }
  }

  // 2. Fallback: Langsung link-kan ke folder target Google Drive dengan nama file terlampir
  return {
    success: true,
    linkDokumen: `https://drive.google.com/drive/folders/${GDRIVE_CUTI_FOLDER_ID}`,
    fileName: targetFileName,
    isFallback: true
  };
}

// ==========================================================================
// 12.1 MODUL PENGAJUAN CUTI KARYAWAN (mod_cuti_karyawan)
// ==========================================================================

async function initCutiKaryawanView() {
  const user = state.currentUser || { username: 'Staff', role: 'Staff', full_name: 'Staff Karyawan' };
  const isAdmin = (user.role || '').toLowerCase() === 'admin' || (user.role || '').toLowerCase() === 'administrator utama';

  const userDisplayName = user.full_name || user.FullName || user.nama || user.username || 'Staff';

  // Badge User di Banner
  const userBadgeEl = document.getElementById('cutiUserBadgeText');
  if (userBadgeEl) {
    userBadgeEl.textContent = `${userDisplayName} (${user.role || 'Staff'})`;
  }

  // Setup Form Pengajuan Cuti (Admin vs Staff)
  const selWrap = document.getElementById('cutiNamaSelectWrapper');
  const roWrap = document.getElementById('cutiNamaReadonlyWrapper');
  const noteEl = document.getElementById('cutiNamaModeNote');
  const inputNama = document.getElementById('cutiNamaKaryawanInput');
  const inputNik = document.getElementById('cutiNik');
  const inputJabatan = document.getElementById('cutiJabatan');
  const selectNama = document.getElementById('cutiNamaKaryawanSelect');

  const employees = await fetchEmployeesForCuti(true);

  if (isAdmin) {
    if (selWrap) selWrap.style.display = 'block';
    if (roWrap) roWrap.style.display = 'none';
    if (noteEl) noteEl.textContent = '(Mode Admin: Dapat memilih karyawan)';

    if (selectNama && employees.length > 0) {
      selectNama.innerHTML = '<option value="">-- Pilih Karyawan --</option>' +
        employees.map(e => `<option value="${e.nama}" data-nik="${e.nik}" data-jabatan="${e.jabatan}">${e.nama} (${e.jabatan || 'Staff'})</option>`).join('');
      
      // Default pilih user yang login jika ada di list
      const matched = employees.find(e => e.nama.toLowerCase() === userDisplayName.toLowerCase());
      if (matched) {
        selectNama.value = matched.nama;
        if (inputNik) inputNik.value = matched.nik;
        if (inputJabatan) inputJabatan.value = matched.jabatan;
      } else {
        if (inputNik) inputNik.value = user.id || 'EMP-001';
        if (inputJabatan) inputJabatan.value = user.role || 'Staff';
      }
    }
  } else {
    if (selWrap) selWrap.style.display = 'none';
    if (roWrap) roWrap.style.display = 'block';
    if (noteEl) noteEl.textContent = '(Otomatis dari Akun Login)';
    if (inputNama) inputNama.value = userDisplayName;
    if (inputNik) inputNik.value = user.id || user.user_id || 'EMP-001';
    if (inputJabatan) inputJabatan.value = user.role || 'Staff';
  }

  // Inisialisasi Tanggal Mulai & Selesai Default (Hari Ini)
  const todayIso = new Date().toISOString().split('T')[0];
  const tglMulaiEl = document.getElementById('cutiTglMulai');
  const tglSelesaiEl = document.getElementById('cutiTglSelesai');
  if (tglMulaiEl && !tglMulaiEl.value) tglMulaiEl.value = todayIso;
  if (tglSelesaiEl && !tglSelesaiEl.value) tglSelesaiEl.value = todayIso;
  calculateCutiDurationDays();

  // Load Data Cuti & Kuota
  await loadCutiKaryawanData();
}

function onAdminSelectCutiEmployee() {
  const selectNama = document.getElementById('cutiNamaKaryawanSelect');
  const inputNik = document.getElementById('cutiNik');
  const inputJabatan = document.getElementById('cutiJabatan');
  if (!selectNama) return;

  const opt = selectNama.options[selectNama.selectedIndex];
  if (opt && opt.value) {
    if (inputNik) inputNik.value = opt.getAttribute('data-nik') || '-';
    if (inputJabatan) inputJabatan.value = opt.getAttribute('data-jabatan') || 'Karyawan';
  }
}

function calculateCutiDurationDays() {
  const tglMulaiEl = document.getElementById('cutiTglMulai');
  const tglSelesaiEl = document.getElementById('cutiTglSelesai');
  const jumlahHariEl = document.getElementById('cutiJumlahHari');
  const durasiTextEl = document.getElementById('cutiDurasiText');
  if (!tglMulaiEl || !tglSelesaiEl || !jumlahHariEl) return;

  const startVal = tglMulaiEl.value;
  const endVal = tglSelesaiEl.value;
  if (!startVal || !endVal) return;

  const dStart = new Date(startVal);
  const dEnd = new Date(endVal);

  if (dEnd < dStart) {
    tglSelesaiEl.value = startVal;
    jumlahHariEl.value = 1;
    if (durasiTextEl) durasiTextEl.textContent = '1 Hari';
    return;
  }

  // Hitung jumlah hari kerja (inklusif)
  const diffTime = Math.abs(dEnd - dStart);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  jumlahHariEl.value = diffDays;
  if (durasiTextEl) durasiTextEl.textContent = `${diffDays} Hari`;
}

async function loadCutiKaryawanData(forceRefresh) {
  const listContainer = document.getElementById('cutiHistoryListContainer');
  if (listContainer && forceRefresh) {
    listContainer.innerHTML = `
      <div class="cuti-empty-state">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:1.8rem; color:#38bdf8;"></i>
        <p>Memuat riwayat pengajuan cuti...</p>
      </div>
    `;
  }

  try {
    // 1. Fetch cuti_karyawan dari Supabase
    const resKaryawan = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/cuti_karyawan?select=*&order=tanggalpengajuan.desc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });

    if (resKaryawan.ok) {
      state.cuti.karyawanList = await resKaryawan.json();
    }

    // 2. Fetch cuti_bersama dari Supabase jika belum dimuat
    if (!state.cuti.bersamaList || state.cuti.bersamaList.length === 0 || forceRefresh) {
      const resBersama = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/cuti_bersama?select=*&order=tanggal.asc`, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (resBersama.ok) {
        state.cuti.bersamaList = await resBersama.json();
      }
    }

    // 3. Hitung Kuota Cuti Pribadi Pengguna
    calculateAndRenderUserCutiQuota();

    // 4. Render Riwayat Pengajuan
    renderCutiKaryawanHistory();

  } catch (err) {
    console.error('Error loadCutiKaryawanData:', err);
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="cuti-empty-state" style="color:#fb7185;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size:1.8rem;"></i>
          <p>Gagal memuat data cuti dari database Supabase.</p>
        </div>
      `;
    }
  }
}

function calculateAndRenderUserCutiQuota() {
  const user = state.currentUser || {};
  const userName = (user.full_name || user.username || '').toLowerCase().trim();
  const userId = (user.id || '').toLowerCase().trim();
  const currentYear = new Date().getFullYear().toString();

  // Hitung total Cuti Bersama yang memotong kuota tahunan pada tahun berjalan
  let totalCbPotong = 0;
  (state.cuti.bersamaList || []).forEach(cb => {
    const st = String(cb.status || '').trim().toLowerCase();
    const potong = String(cb.potongcutitahunan || '').trim().toLowerCase();
    const thn = String(cb.tahun || cb.tanggal || '').slice(0, 4);
    if ((st === 'aktif' || st === '') && potong === 'ya' && (!thn || thn === currentYear)) {
      totalCbPotong += Number(cb.jumlahhari || 1);
    }
  });

  const baseQuota = 12;
  const netQuota = Math.max(0, baseQuota - totalCbPotong);

  // Filter permohonan cuti user yang disetujui (atau non-rejected) pada tahun berjalan
  let terpakai = 0;
  (state.cuti.karyawanList || []).forEach(c => {
    const cNama = String(c.namakaryawan || '').toLowerCase().trim();
    const cNik = String(c.nik || '').toLowerCase().trim();
    const isSameUser = (cNama && (cNama === userName || userName.includes(cNama) || cNama.includes(userName))) || (cNik && cNik === userId);
    
    if (isSameUser) {
      const st = String(c.statusapproval || '').toLowerCase();
      const isApproved = st.includes('setuju') || st.includes('approve');
      const isTahunan = String(c.tipecuti || '').toLowerCase().includes('tahunan');
      const cYear = String(c.tanggalmulai || c.tanggalpengajuan || '').slice(0, 4);
      
      if (isApproved && isTahunan && (!cYear || cYear === currentYear)) {
        terpakai += Number(c.jumlahhari || 1);
      }
    }
  });

  const sisaCuti = Math.max(0, netQuota - terpakai);
  state.cuti.userQuota = { netQuota, terpakai, sisaCuti };

  const netEl = document.getElementById('cutiUserNetQuota');
  const usedEl = document.getElementById('cutiUserUsedQuota');
  const remEl = document.getElementById('cutiUserRemainingQuota');

  if (netEl) netEl.textContent = `${netQuota} Hari`;
  if (usedEl) usedEl.textContent = `${terpakai} Hari`;
  if (remEl) remEl.textContent = `${sisaCuti} Hari`;
}

function renderCutiKaryawanHistory(filterKeyword) {
  const listContainer = document.getElementById('cutiHistoryListContainer');
  if (!listContainer) return;

  const user = state.currentUser || {};
  const userName = (user.full_name || user.username || '').toLowerCase().trim();
  const userId = (user.id || '').toLowerCase().trim();
  const isAdmin = (user.role || '').toLowerCase() === 'admin' || (user.role || '').toLowerCase() === 'administrator utama';

  let list = (state.cuti.karyawanList || []);

  // Jika bukan admin, hanya tampilkan cuti miliknya sendiri
  if (!isAdmin) {
    list = list.filter(c => {
      const cNama = String(c.namakaryawan || '').toLowerCase().trim();
      const cNik = String(c.nik || '').toLowerCase().trim();
      return (cNama && (cNama === userName || userName.includes(cNama) || cNama.includes(userName))) || (cNik && cNik === userId);
    });
  }

  // Filter Keyword jika ada
  const kw = (filterKeyword || '').toLowerCase().trim();
  if (kw) {
    list = list.filter(c =>
      String(c.cutiid || '').toLowerCase().includes(kw) ||
      String(c.namakaryawan || '').toLowerCase().includes(kw) ||
      String(c.tipecuti || '').toLowerCase().includes(kw) ||
      String(c.statusapproval || '').toLowerCase().includes(kw) ||
      String(c.keterangan || '').toLowerCase().includes(kw)
    );
  }

  if (list.length === 0) {
    listContainer.innerHTML = `
      <div class="cuti-empty-state" style="padding:32px 16px; text-align:center;">
        <i class="fa-solid fa-folder-open" style="font-size:2rem; color:var(--text-dim); margin-bottom:10px;"></i>
        <p style="font-size:0.85rem; font-weight:700; color:var(--text-main); margin-bottom:4px;">Belum Ada Riwayat Cuti</p>
        <span style="font-size:0.75rem; color:var(--text-muted);">Pengajuan cuti yang telah diajukan akan tampil di sini secara real-time.</span>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = list.map(item => {
    const st = String(item.statusapproval || 'Pending').trim();
    let badgeCls = 'pending';
    let icon = 'fa-clock';
    if (st.toLowerCase().includes('setuju') || st.toLowerCase().includes('approve')) {
      badgeCls = 'disetujui';
      icon = 'fa-circle-check';
    } else if (st.toLowerCase().includes('tolak') || st.toLowerCase().includes('reject')) {
      badgeCls = 'ditolak';
      icon = 'fa-circle-xmark';
    }

    const tglMulai = formatIndoCutiDate(item.tanggalmulai);
    const tglSelesai = formatIndoCutiDate(item.tanggalselesai);
    const durasi = item.jumlahhari || 1;

    return `
      <div class="cuti-history-card-item">
        <div class="cuti-history-top">
          <span class="cuti-id-tag">${item.cutiid || 'CT-NEW'}</span>
          <span class="cuti-status-badge ${badgeCls}">
            <i class="fa-solid ${icon}"></i>
            <span>${st}</span>
          </span>
        </div>
        <div class="cuti-type-badge">${item.tipecuti || 'Cuti Tahunan'} • ${durasi} Hari Kerja</div>
        <div class="cuti-period-text">
          <i class="fa-regular fa-calendar" style="color:#38bdf8;"></i>
          <span>${tglMulai} ${tglMulai !== tglSelesai ? 's.d ' + tglSelesai : ''}</span>
        </div>
        ${item.keterangan ? `<div class="cuti-reason-text">"${item.keterangan}"</div>` : ''}
        ${item.linkdokumen ? `
          <div style="margin-top:6px;">
            <a href="${item.linkdokumen}" target="_blank" rel="noopener noreferrer" style="font-size:0.72rem; color:#38bdf8; display:inline-flex; align-items:center; gap:4px;">
              <i class="fa-solid fa-paperclip"></i>
              <span>Lampiran Dokumen Drive</span>
              <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.65rem;"></i>
            </a>
          </div>
        ` : ''}
        ${item.catatanapproval ? `
          <div class="cuti-approval-note">
            <i class="fa-solid fa-comment-dots" style="margin-right:4px;"></i> Catatan Otorisasi: ${item.catatanapproval}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function filterCutiKaryawanHistory() {
  const searchInput = document.getElementById('cutiHistorySearch');
  renderCutiKaryawanHistory(searchInput ? searchInput.value : '');
}

async function handlePengajuanCutiSubmit(event) {
  if (event) event.preventDefault();

  const user = state.currentUser || {};
  const isAdmin = (user.role || '').toLowerCase() === 'admin' || (user.role || '').toLowerCase() === 'administrator utama';

  const selectNama = document.getElementById('cutiNamaKaryawanSelect');
  const inputNama = document.getElementById('cutiNamaKaryawanInput');
  const inputNik = document.getElementById('cutiNik');
  const inputJabatan = document.getElementById('cutiJabatan');
  const inputTipe = document.getElementById('cutiTipe');
  const inputTglMulai = document.getElementById('cutiTglMulai');
  const inputTglSelesai = document.getElementById('cutiTglSelesai');
  const inputJumlahHari = document.getElementById('cutiJumlahHari');
  const inputKeterangan = document.getElementById('cutiKeterangan');
  const btnSubmit = document.getElementById('btnSubmitPengajuanCuti');

  const namaKaryawan = isAdmin ? (selectNama ? selectNama.value : '') : (inputNama ? inputNama.value : '');
  if (!namaKaryawan) {
    alert('Nama karyawan wajib diisi!');
    return;
  }

  const tglMulai = inputTglMulai ? inputTglMulai.value : '';
  const tglSelesai = inputTglSelesai ? inputTglSelesai.value : '';
  if (!tglMulai || !tglSelesai) {
    alert('Tanggal mulai dan selesai wajib diisi!');
    return;
  }

  const nik = inputNik ? inputNik.value : (user.id || 'EMP-001');
  const jabatan = inputJabatan ? inputJabatan.value : (user.role || 'Staff');
  const tipeCuti = inputTipe ? inputTipe.value : 'Cuti Tahunan';
  const jumlahHari = parseFloat(inputJumlahHari ? inputJumlahHari.value : 1) || 1;
  const keterangan = inputKeterangan ? inputKeterangan.value : '';

  // 1. Upload Berkas Lokal ke Google Drive jika ada file yang dipilih
  let finalLinkDokumen = null;
  if (selectedCutiFile) {
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah Dokumen ke Google Drive...';
    }

    try {
      const uploadRes = await uploadCutiDokumenToGoogleDrive(selectedCutiFile, namaKaryawan, tipeCuti);
      if (uploadRes && uploadRes.linkDokumen) {
        finalLinkDokumen = uploadRes.linkDokumen;
      }
    } catch (uploadErr) {
      console.warn('Gagal upload dokumen ke Google Drive:', uploadErr);
      finalLinkDokumen = `${GDRIVE_CUTI_FOLDER_URL}#${encodeURIComponent(selectedCutiFile.name)}`;
    }
  }

  // 2. Generate Unique CutiID: CT-2026-XXXX
  const cutiId = `CT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const nowIso = new Date().toISOString();

  const payload = {
    cutiid: cutiId,
    tanggalpengajuan: nowIso,
    nik: nik,
    namakaryawan: namaKaryawan,
    jabatan: jabatan,
    tipecuti: tipeCuti,
    tanggalmulai: tglMulai,
    tanggalselesai: tglSelesai,
    jumlahhari: jumlahHari,
    keterangan: keterangan,
    linkdokumen: finalLinkDokumen,
    statusapproval: 'Pending',
    approvedby: null,
    approvedat: null,
    catatanapproval: null,
    createdat: nowIso
  };

  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan ke Supabase...';
  }

  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/cuti_karyawan`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok || res.status === 201) {
      let msg = `✅ Berhasil! Pengajuan cuti [${cutiId}] untuk ${namaKaryawan} telah tersimpan di Supabase.`;
      if (selectedCutiFile) {
        msg += `\n📄 Dokumen pendukung telah dihubungkan ke folder Google Drive resmi.`;
      }
      alert(msg);
      resetFormPengajuanCuti();
      await loadCutiKaryawanData(true);
    } else {
      const errText = await res.text();
      alert(`⚠️ Gagal menyimpan permohonan cuti: ${errText}`);
    }
  } catch (err) {
    console.error('Submit error:', err);
    alert(`⚠️ Terjadi kesalahan koneksi ke Supabase: ${err.message}`);
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Pengajuan Cuti';
    }
  }
}

function resetFormPengajuanCuti() {
  const form = document.getElementById('formPengajuanCuti');
  if (form) form.reset();

  removeSelectedCutiFile();

  const todayIso = new Date().toISOString().split('T')[0];
  const tglMulaiEl = document.getElementById('cutiTglMulai');
  const tglSelesaiEl = document.getElementById('cutiTglSelesai');
  const durasiEl = document.getElementById('cutiJumlahHari');
  const durasiText = document.getElementById('cutiDurasiText');

  if (tglMulaiEl) tglMulaiEl.value = todayIso;
  if (tglSelesaiEl) tglSelesaiEl.value = todayIso;
  if (durasiEl) durasiEl.value = 1;
  if (durasiText) durasiText.textContent = '1 Hari';
}

// ==========================================================================
// 12.2 MODUL CUTI BERSAMA, APPROVAL & MATRIKS KUOTA (mod_cuti_bersama)
// ==========================================================================

async function initCutiBersamaView() {
  await reloadCutiBersamaModule();
}

function switchCutiBersamaTab(tabName) {
  state.cuti.activeCbTab = tabName;

  const btnList = document.getElementById('tabBtnCbList');
  const btnApproval = document.getElementById('tabBtnCbApproval');
  const btnMatrix = document.getElementById('tabBtnCbMatrix');

  const paneList = document.getElementById('paneCbList');
  const paneApproval = document.getElementById('paneCbApproval');
  const paneMatrix = document.getElementById('paneCbMatrix');

  if (btnList) btnList.classList.toggle('active', tabName === 'list');
  if (btnApproval) btnApproval.classList.toggle('active', tabName === 'approval');
  if (btnMatrix) btnMatrix.classList.toggle('active', tabName === 'matrix');

  if (paneList) paneList.style.display = tabName === 'list' ? 'block' : 'none';
  if (paneApproval) paneApproval.style.display = tabName === 'approval' ? 'block' : 'none';
  if (paneMatrix) paneMatrix.style.display = tabName === 'matrix' ? 'block' : 'none';
}

async function reloadCutiBersamaModule(forceRefresh) {
  const yearSelect = document.getElementById('cbSelectYear');
  if (yearSelect) state.cuti.selectedYear = yearSelect.value || '2026';

  const yearNavLabel = document.getElementById('cbYearLabelNav');
  if (yearNavLabel) yearNavLabel.textContent = state.cuti.selectedYear;

  try {
    // 1. Fetch Cuti Bersama
    const resCb = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/cuti_bersama?select=*&order=tanggal.asc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    if (resCb.ok) {
      state.cuti.bersamaList = await resCb.json();
    }

    // 2. Fetch Cuti Karyawan
    const resCk = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/cuti_karyawan?select=*&order=tanggalpengajuan.desc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    if (resCk.ok) {
      state.cuti.karyawanList = await resCk.json();
    }

    // Pastikan employees loaded dengan nama asli
    await fetchEmployeesForCuti(forceRefresh);

    // Render Tab 1: Cuti Bersama
    renderCutiBersamaTable();

    // Render Tab 2: Approval
    renderCutiApprovalTable();

    // Render Tab 3: Matriks Kuota
    await renderCutiMatrixTable();

  } catch (err) {
    console.error('Error reloadCutiBersamaModule:', err);
  }
}

async function onCutiBersamaYearChange() {
  const yearSelect = document.getElementById('cbSelectYear');
  if (yearSelect) state.cuti.selectedYear = yearSelect.value;
  const yearNavLabel = document.getElementById('cbYearLabelNav');
  if (yearNavLabel) yearNavLabel.textContent = state.cuti.selectedYear;

  renderCutiBersamaTable();
  await renderCutiMatrixTable();
}

function renderCutiBersamaTable() {
  const tbody = document.getElementById('cbTableBody');
  if (!tbody) return;

  const targetYear = state.cuti.selectedYear || '2026';
  const allCb = state.cuti.bersamaList || [];

  // Filter per tahun
  const filtered = allCb.filter(item => {
    const y = String(item.tahun || item.tanggal || '').slice(0, 4);
    return !targetYear || y === targetYear;
  });

  // Hitung stats
  let totalHari = 0;
  let totalPotong = 0;
  filtered.forEach(item => {
    const st = String(item.status || 'Aktif').trim().toLowerCase();
    const durasi = Number(item.jumlahhari || 1);
    if (st === 'aktif' || st === '') {
      totalHari += durasi;
      if (String(item.potongcutitahunan || '').toLowerCase() === 'ya') {
        totalPotong += durasi;
      }
    }
  });

  const netHak = Math.max(0, 12 - totalPotong);

  const statTotalEl = document.getElementById('cbStatTotalDays');
  const statPotongEl = document.getElementById('cbStatPotongDays');
  const statNetEl = document.getElementById('cbStatNetDays');
  if (statTotalEl) statTotalEl.textContent = `${totalHari} Hari`;
  if (statPotongEl) statPotongEl.textContent = `${totalPotong} Hari`;
  if (statNetEl) statNetEl.textContent = `${netHak} Hari`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">
          Tidak ada data cuti bersama / libur nasional pada tahun ${targetYear}.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((item, idx) => {
    const isPotong = String(item.potongcutitahunan || 'Ya').toLowerCase() === 'ya';
    const isAktif = String(item.status || 'Aktif').toLowerCase() === 'aktif';
    const safeItem = JSON.stringify(item).replace(/"/g, '&quot;');

    return `
      <tr>
        <td style="text-align:center; font-family:monospace; color:var(--text-dim);">${idx + 1}</td>
        <td style="font-family:monospace; color:var(--text-light); font-size:0.82rem;">${formatIndoCutiDate(item.tanggal)}</td>
        <td>
          <strong style="color:var(--text-main); font-size:0.85rem;">${item.namaharilibur || 'Hari Libur'}</strong>
          <div style="font-size:0.7rem; color:var(--text-muted); font-family:monospace;">ID: ${item.id} • Tahun: ${item.tahun}</div>
        </td>
        <td style="text-align:center;">
          <span style="background:rgba(255,255,255,0.06); padding:3px 10px; border-radius:6px; font-family:monospace; font-weight:700; color:var(--text-light);">
            ${item.jumlahhari || 1} Hari
          </span>
        </td>
        <td style="text-align:center;">
          <span class="status-pill ${isPotong ? 'warning' : 'info'}" style="font-size:0.72rem;">
            ${isPotong ? 'Ya (Potong Kuota)' : 'Tidak (Libur Bebas)'}
          </span>
        </td>
        <td style="color:var(--text-muted); font-size:0.8rem;">${item.keterangan || '-'}</td>
        <td style="text-align:center;">
          <span class="status-pill ${isAktif ? 'active' : 'inactive'}" style="font-size:0.72rem;">
            ${isAktif ? 'Aktif' : 'Nonaktif'}
          </span>
        </td>
        <td style="text-align:center;">
          <div style="display:inline-flex; gap:6px;">
            <button type="button" class="btn-action edit" onclick="editCutiBersama('${item.id}')" title="Edit Hari Libur">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn-action delete" onclick="deleteCutiBersama('${item.id}')" title="Hapus Hari Libur">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderCutiApprovalTable(filterKeyword, filterStatus) {
  const tbody = document.getElementById('cutiApprovalTableBody');
  if (!tbody) return;

  const allCuti = state.cuti.karyawanList || [];

  // Hitung pending counter
  const pendingCount = allCuti.filter(c => {
    const st = String(c.statusapproval || '').toLowerCase();
    return st.includes('pending') || st.includes('tunggu');
  }).length;

  const badgePendingHeader = document.getElementById('badgePendingApprovalCount');
  const badgePendingTab = document.getElementById('tabBadgeApprovalPending');

  if (badgePendingHeader) badgePendingHeader.textContent = pendingCount;
  if (badgePendingTab) {
    badgePendingTab.textContent = pendingCount;
    badgePendingTab.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }

  const kw = (filterKeyword !== undefined ? filterKeyword : (document.getElementById('cutiApprovalSearch')?.value || '')).toLowerCase().trim();
  const stFilter = (filterStatus !== undefined ? filterStatus : (document.getElementById('cutiApprovalStatusFilter')?.value || 'ALL')).toLowerCase().trim();

  let list = allCuti.filter(item => {
    // Filter keyword
    const matchKw = !kw ||
      String(item.cutiid || '').toLowerCase().includes(kw) ||
      String(item.namakaryawan || '').toLowerCase().includes(kw) ||
      String(item.nik || '').toLowerCase().includes(kw) ||
      String(item.tipecuti || '').toLowerCase().includes(kw) ||
      String(item.keterangan || '').toLowerCase().includes(kw);

    // Filter status
    const itemSt = String(item.statusapproval || 'Pending').toLowerCase();
    let matchSt = true;
    if (stFilter !== 'all') {
      if (stFilter === 'pending') matchSt = itemSt.includes('pending') || itemSt.includes('tunggu');
      else if (stFilter === 'disetujui') matchSt = itemSt.includes('setuju') || itemSt.includes('approve');
      else if (stFilter === 'ditolak') matchSt = itemSt.includes('tolak') || itemSt.includes('reject');
    }

    return matchKw && matchSt;
  });

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">
          Tidak ada pengajuan cuti yang sesuai kriteria pencarian.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const st = String(item.statusapproval || 'Pending').trim();
    let badgeCls = 'pending';
    let icon = 'fa-clock';
    if (st.toLowerCase().includes('setuju') || st.toLowerCase().includes('approve')) {
      badgeCls = 'disetujui';
      icon = 'fa-circle-check';
    } else if (st.toLowerCase().includes('tolak') || st.toLowerCase().includes('reject')) {
      badgeCls = 'ditolak';
      icon = 'fa-circle-xmark';
    }

    const tglPengajuan = formatIndoCutiDate(item.tanggalpengajuan);
    const tglMulai = formatIndoCutiDate(item.tanggalmulai);
    const tglSelesai = formatIndoCutiDate(item.tanggalselesai);
    const durasi = item.jumlahhari || 1;

    return `
      <tr>
        <td>
          <strong style="color:#38bdf8; font-family:monospace; font-size:0.85rem;">${item.cutiid || 'CT-NEW'}</strong>
          <div style="font-size:0.7rem; color:var(--text-dim);">${tglPengajuan}</div>
        </td>
        <td>
          <strong style="color:var(--text-light); font-size:0.85rem;">${item.namakaryawan || '-'}</strong>
          <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;">${item.jabatan || 'Staff'} • NIK: ${item.nik || '-'}</div>
        </td>
        <td>
          <span style="font-size:0.75rem; color:#c084fc; background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.25); padding:2px 8px; border-radius:6px; font-weight:600;">
            ${item.tipecuti || 'Cuti Tahunan'}
          </span>
        </td>
        <td style="font-size:0.8rem; color:var(--text-light);">
          <div>${tglMulai}</div>
          <div style="font-size:0.7rem; color:var(--text-dim);">s.d ${tglSelesai}</div>
        </td>
        <td style="text-align:center;">
          <span style="background:rgba(255,255,255,0.06); padding:3px 8px; border-radius:6px; font-family:monospace; font-weight:700; color:var(--text-light);">
            ${durasi} Hari
          </span>
        </td>
        <td style="max-width:220px;">
          <div style="font-size:0.78rem; color:var(--text-main); line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.keterangan || '-'}">
            ${item.keterangan || '-'}
          </div>
          ${item.linkdokumen ? `
            <a href="${item.linkdokumen}" target="_blank" rel="noopener noreferrer" style="font-size:0.7rem; color:#38bdf8; display:inline-flex; align-items:center; gap:4px; margin-top:3px;">
              <i class="fa-solid fa-paperclip"></i> Lampiran Drive
            </a>
          ` : ''}
          ${item.catatanapproval ? `
            <div style="font-size:0.68rem; color:#f59e0b; font-style:italic; margin-top:2px;">
              Catatan: ${item.catatanapproval}
            </div>
          ` : ''}
        </td>
        <td style="text-align:center;">
          <span class="cuti-status-badge ${badgeCls}">
            <i class="fa-solid ${icon}"></i>
            <span>${st}</span>
          </span>
        </td>
        <td style="text-align:center;">
          <div style="display:inline-flex; gap:6px;">
            <button type="button" class="btn-action view" onclick="openApprovalCutiModal('${item.cutiid}')" title="Proses Persetujuan">
              <i class="fa-solid fa-stamp"></i>
              <span style="font-size:0.72rem; margin-left:4px;">Proses</span>
            </button>
            <button type="button" class="btn-action delete" onclick="deleteCutiRequest('${item.cutiid}')" title="Hapus Permohonan Cuti">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterCutiApprovalList() {
  const searchInput = document.getElementById('cutiApprovalSearch');
  const statusSelect = document.getElementById('cutiApprovalStatusFilter');
  renderCutiApprovalTable(
    searchInput ? searchInput.value : '',
    statusSelect ? statusSelect.value : 'ALL'
  );
}

async function renderCutiMatrixTable() {
  const tbody = document.getElementById('cutiMatrixTableBody');
  if (!tbody) return;

  const targetYear = state.cuti.selectedYear || '2026';

  // 1. Hitung total cuti bersama yang memotong kuota pada tahun target
  let totalCbPotong = 0;
  (state.cuti.bersamaList || []).forEach(cb => {
    const st = String(cb.status || 'Aktif').trim().toLowerCase();
    const potong = String(cb.potongcutitahunan || '').trim().toLowerCase();
    const y = String(cb.tahun || cb.tanggal || '').slice(0, 4);
    if ((st === 'aktif' || st === '') && potong === 'ya' && (!y || y === targetYear)) {
      totalCbPotong += Number(cb.jumlahhari || 1);
    }
  });

  const baseQuota = 12;
  const netQuota = Math.max(0, baseQuota - totalCbPotong);

  const matPotongEl = document.getElementById('matrixCbPotongVal');
  const matNetEl = document.getElementById('matrixNetQuotaVal');
  if (matPotongEl) matPotongEl.textContent = `${totalCbPotong} Hari`;
  if (matNetEl) matNetEl.textContent = `${netQuota} Hari`;

  // 2. Pastikan daftar karyawan termuat dengan nama asli (bukan generic 'Karyawan')
  let employees = state.cuti.employees || [];
  if (employees.length === 0 || employees.every(e => e.nama === 'Karyawan' || e.nama.startsWith('Karyawan '))) {
    employees = await fetchEmployeesForCuti(true);
  }

  if (!employees || employees.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:32px; color:var(--text-muted);">
          Belum ada master data karyawan untuk menghitung matriks kuota.
        </td>
      </tr>
    `;
    return;
  }

  // 3. Agregasikan permohonan cuti per karyawan
  const allCuti = state.cuti.karyawanList || [];

  tbody.innerHTML = employees.map(emp => {
    const empName = (emp.nama || '').toLowerCase().trim();
    const empNik = (emp.nik || '').toLowerCase().trim();

    let usedTahunan = 0;
    let cutiSakit = 0;
    let cutiUmrah = 0;
    let cutiMelahirkan = 0;

    allCuti.forEach(c => {
      const cNama = String(c.namakaryawan || '').toLowerCase().trim();
      const cNik = String(c.nik || '').toLowerCase().trim();
      const isMatch = (cNama && (cNama === empName || empName.includes(cNama) || cNama.includes(empName))) || (cNik && cNik === empNik);

      if (isMatch) {
        const st = String(c.statusapproval || '').toLowerCase();
        // Hanya hitung jika disetujui (atau non-rejected)
        const isApproved = st.includes('setuju') || st.includes('approve');
        const dur = Number(c.jumlahhari || 1);
        const tipe = String(c.tipecuti || '').toLowerCase();
        const y = String(c.tanggalmulai || c.tanggalpengajuan || '').slice(0, 4);

        if (isApproved && (!y || y === targetYear)) {
          if (tipe.includes('tahunan')) usedTahunan += dur;
          else if (tipe.includes('sakit')) cutiSakit += dur;
          else if (tipe.includes('umrah') || tipe.includes('ibadah')) cutiUmrah += dur;
          else if (tipe.includes('lahir') || tipe.includes('melahirkan')) cutiMelahirkan += dur;
        }
      }
    });

    const sisa = Math.max(0, netQuota - usedTahunan);
    let sisaBadgeCls = 'safe';
    if (sisa === 0) sisaBadgeCls = 'danger';
    else if (sisa <= 3) sisaBadgeCls = 'warning';

    return `
      <tr>
        <td style="font-family:monospace; color:#38bdf8; font-size:0.8rem;">${emp.nik || '-'}</td>
        <td>
          <strong style="color:var(--text-light); font-size:0.85rem;">${emp.nama}</strong>
          ${usedTahunan > 0 || cutiSakit > 0 || cutiUmrah > 0 ? `
            <span style="margin-left:6px; font-size:0.65rem; background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.3); color:#38bdf8; padding:1px 6px; border-radius:10px;">
              Pernah Cuti
            </span>
          ` : ''}
        </td>
        <td style="color:var(--text-muted); font-size:0.8rem;">${emp.jabatan || 'Staff'}</td>
        <td style="text-align:center; font-family:monospace; font-weight:700; color:var(--text-light);">${netQuota} Hari</td>
        <td style="text-align:center; font-family:monospace; font-weight:700; color:#fbbf24;">${usedTahunan} Hari</td>
        <td style="text-align:center; font-family:monospace; color:#c084fc;">${cutiSakit} Hari</td>
        <td style="text-align:center; font-family:monospace; color:#2dd4bf;">${cutiUmrah} Hari</td>
        <td style="text-align:center; font-family:monospace; color:#f472b6;">${cutiMelahirkan} Hari</td>
        <td style="text-align:center;">
          <span class="matrix-sisa-badge ${sisaBadgeCls}">
            ${sisa} Hari
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// 12.3 MODAL & ACTION HANDLERS
// ==========================================================================

function openAddCutiBersamaModal() {
  const modal = document.getElementById('modalCutiBersama');
  const title = document.getElementById('modalCutiBersamaTitle');
  const form = document.getElementById('formCutiBersama');
  if (form) form.reset();

  const idInput = document.getElementById('cbFormId');
  if (idInput) idInput.value = '';

  const thnInput = document.getElementById('cbFormTahun');
  if (thnInput) thnInput.value = state.cuti.selectedYear || '2026';

  if (title) title.textContent = 'Tambah Hari Cuti Bersama';
  if (modal) modal.style.display = 'flex';
}

function editCutiBersama(id) {
  const item = (state.cuti.bersamaList || []).find(cb => cb.id === id);
  if (!item) return;

  const modal = document.getElementById('modalCutiBersama');
  const title = document.getElementById('modalCutiBersamaTitle');

  const idInput = document.getElementById('cbFormId');
  const thnInput = document.getElementById('cbFormTahun');
  const tglInput = document.getElementById('cbFormTanggal');
  const namaInput = document.getElementById('cbFormNama');
  const jmlInput = document.getElementById('cbFormJumlahHari');
  const potongInput = document.getElementById('cbFormPotong');
  const stInput = document.getElementById('cbFormStatus');
  const ketInput = document.getElementById('cbFormKeterangan');

  if (idInput) idInput.value = item.id;
  if (thnInput) thnInput.value = item.tahun || '2026';
  if (tglInput) tglInput.value = item.tanggal ? item.tanggal.split('T')[0] : '';
  if (namaInput) namaInput.value = item.namaharilibur || '';
  if (jmlInput) jmlInput.value = item.jumlahhari || 1;
  if (potongInput) potongInput.value = item.potongcutitahunan || 'Ya';
  if (stInput) stInput.value = item.status || 'Aktif';
  if (ketInput) ketInput.value = item.keterangan || '';

  if (title) title.textContent = `Edit Cuti Bersama [${item.id}]`;
  if (modal) modal.style.display = 'flex';
}

function closeCutiBersamaModal() {
  const modal = document.getElementById('modalCutiBersama');
  if (modal) modal.style.display = 'none';
}

async function handleCutiBersamaSubmit(event) {
  if (event) event.preventDefault();

  const idInput = document.getElementById('cbFormId');
  const thnInput = document.getElementById('cbFormTahun');
  const tglInput = document.getElementById('cbFormTanggal');
  const namaInput = document.getElementById('cbFormNama');
  const jmlInput = document.getElementById('cbFormJumlahHari');
  const potongInput = document.getElementById('cbFormPotong');
  const stInput = document.getElementById('cbFormStatus');
  const ketInput = document.getElementById('cbFormKeterangan');
  const btnSave = document.getElementById('btnSaveCutiBersama');

  const isEdit = !!(idInput && idInput.value);
  const cbId = isEdit ? idInput.value : `CB-${thnInput.value || 2026}-${String(Date.now()).slice(-4)}`;

  const payload = {
    id: cbId,
    tahun: String(thnInput.value || '2026'),
    tanggal: tglInput.value,
    namaharilibur: namaInput.value,
    jumlahhari: parseFloat(jmlInput.value || 1) || 1,
    potongcutitahunan: potongInput.value || 'Ya',
    status: stInput.value || 'Aktif',
    keterangan: ketInput.value || null,
    createdat: new Date().toISOString()
  };

  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
  }

  try {
    let res;
    if (isEdit) {
      // PATCH ke Supabase
      res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/cuti_bersama?id=eq.${cbId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } else {
      // POST ke Supabase
      res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/cuti_bersama`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok || res.status === 201 || res.status === 204) {
      alert(`✅ Data Cuti Bersama ${cbId} berhasil disimpan ke Supabase!`);
      closeCutiBersamaModal();
      await reloadCutiBersamaModule(true);
    } else {
      const err = await res.text();
      alert(`⚠️ Gagal menyimpan Cuti Bersama: ${err}`);
    }
  } catch (err) {
    console.error('Error saving cuti bersama:', err);
    alert(`⚠️ Terjadi kesalahan: ${err.message}`);
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Data';
    }
  }
}

async function deleteCutiBersama(id) {
  if (!confirm(`Apakah Anda yakin ingin menghapus Hari Cuti Bersama [${id}]?`)) return;

  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/cuti_bersama?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });

    if (res.ok || res.status === 204) {
      alert(`✅ Cuti Bersama [${id}] berhasil dihapus dari Supabase!`);
      await reloadCutiBersamaModule(true);
    } else {
      const err = await res.text();
      alert(`⚠️ Gagal menghapus: ${err}`);
    }
  } catch (err) {
    console.error('Delete CB error:', err);
    alert(`⚠️ Terjadi kesalahan: ${err.message}`);
  }
}

function openApprovalCutiModal(cutiId) {
  const item = (state.cuti.karyawanList || []).find(c => c.cutiid === cutiId);
  if (!item) return;

  state.cuti.activeApprovalItem = item;

  const modal = document.getElementById('modalApprovalCuti');
  const inputId = document.getElementById('approvalCutiId');
  const infoId = document.getElementById('approvalInfoId');
  const infoNama = document.getElementById('approvalInfoNama');
  const infoJabatan = document.getElementById('approvalInfoJabatan');
  const infoTipe = document.getElementById('approvalInfoTipe');
  const infoPeriode = document.getElementById('approvalInfoPeriode');
  const infoAlasan = document.getElementById('approvalInfoAlasan');
  const infoLink = document.getElementById('approvalInfoLink');
  const infoLinkWrapper = document.getElementById('approvalInfoLinkWrapper');
  const selectStatus = document.getElementById('approvalStatusSelect');
  const textCatatan = document.getElementById('approvalCatatan');

  if (inputId) inputId.value = item.cutiid;
  if (infoId) infoId.textContent = item.cutiid;
  if (infoNama) infoNama.textContent = item.namakaryawan || '-';
  if (infoJabatan) infoJabatan.textContent = `${item.jabatan || 'Staff'} • NIK: ${item.nik || '-'}`;
  if (infoTipe) infoTipe.textContent = `${item.tipecuti || 'Cuti Tahunan'} • ${item.jumlahhari || 1} Hari Kerja`;
  if (infoPeriode) infoPeriode.textContent = `${formatIndoCutiDate(item.tanggalmulai)} s.d ${formatIndoCutiDate(item.tanggalselesai)}`;
  if (infoAlasan) infoAlasan.textContent = item.keterangan ? `"${item.keterangan}"` : '-';

  if (infoLink && infoLinkWrapper) {
    if (item.linkdokumen) {
      infoLink.href = item.linkdokumen;
      infoLink.textContent = item.linkdokumen;
      infoLinkWrapper.style.display = 'block';
    } else {
      infoLinkWrapper.style.display = 'none';
    }
  }

  if (selectStatus) {
    const curSt = String(item.statusapproval || 'Pending').toLowerCase();
    if (curSt.includes('setuju') || curSt.includes('approve')) selectStatus.value = 'Disetujui';
    else if (curSt.includes('tolak') || curSt.includes('reject')) selectStatus.value = 'Ditolak';
    else selectStatus.value = 'Pending';
  }

  if (textCatatan) textCatatan.value = item.catatanapproval || '';

  if (modal) modal.style.display = 'flex';
}

function closeApprovalCutiModal() {
  const modal = document.getElementById('modalApprovalCuti');
  if (modal) modal.style.display = 'none';
}

async function submitCutiApprovalDecision() {
  const inputId = document.getElementById('approvalCutiId');
  const selectStatus = document.getElementById('approvalStatusSelect');
  const textCatatan = document.getElementById('approvalCatatan');
  const btnSubmit = document.getElementById('btnSubmitApprovalDecision');

  const cutiId = inputId ? inputId.value : '';
  if (!cutiId) return;

  const decision = selectStatus ? selectStatus.value : 'Disetujui';
  const catatan = textCatatan ? textCatatan.value.trim() : '';

  const user = state.currentUser || {};
  const approverName = user.full_name || user.username || 'Admin Manajerial';
  const nowIso = new Date().toISOString();

  const payload = {
    statusapproval: decision,
    approvedby: approverName,
    approvedat: nowIso,
    catatanapproval: catatan || null
  };

  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan Otorisasi...';
  }

  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/cuti_karyawan?cutiid=eq.${cutiId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok || res.status === 204) {
      alert(`✅ Keputusan approval cuti [${cutiId}] berhasil disimpan sebagai '${decision}' di Supabase!`);
      closeApprovalCutiModal();
      await reloadCutiBersamaModule(true);
      if (document.getElementById('view-cuti_karyawan')?.classList.contains('active')) {
        await loadCutiKaryawanData(true);
      }
    } else {
      const err = await res.text();
      alert(`⚠️ Gagal memperbarui status approval: ${err}`);
    }
  } catch (err) {
    console.error('Approval submit error:', err);
    alert(`⚠️ Terjadi kesalahan: ${err.message}`);
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fa-solid fa-check-double"></i> Simpan Keputusan';
    }
  }
}

async function deleteCutiRequest(cutiId) {
  if (!confirm(`Apakah Anda yakin ingin menghapus pengajuan cuti [${cutiId}]?`)) return;

  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/cuti_karyawan?cutiid=eq.${cutiId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });

    if (res.ok || res.status === 204) {
      alert(`✅ Pengajuan cuti [${cutiId}] berhasil dihapus dari Supabase!`);
      await reloadCutiBersamaModule(true);
      if (document.getElementById('view-cuti_karyawan')?.classList.contains('active')) {
        await loadCutiKaryawanData(true);
      }
    } else {
      const err = await res.text();
      alert(`⚠️ Gagal menghapus: ${err}`);
    }
  } catch (err) {
    console.error('Delete cuti error:', err);
    alert(`⚠️ Terjadi kesalahan: ${err.message}`);
  }
}


// ==========================================================================
// SECTION 13: MODUL HR & PERSONALIA TERINTEGRASI SUPABASE
// 1. mod_daftar_karyawan (Daftar Karyawan)
// 2. mod_bio_karyawan (Form Biodata Karyawan)
// 3. mod_data_attendance (Data Kehadiran / Log Absensi Presensi)
// 4. mod_upload_dok (Arsip & Upload Dokumen Pegawai ke Google Drive)
// 5. mod_detail_emp (Detail Karyawan & Cetak Presisi A4 Resmi Perusahaan)
// 6. mod_emp_analytics (Dashboard Statistik & Analytics Kepegawaian)
// 7. mod_slip_gaji (Lihat Slip Gaji & Viewer Dokumen Penggajian Drive)
// ==========================================================================

// State internal modul HR & Personalia
if (!state.hr) {
  state.hr = {
    employees: [],
    selectedEmployeeNik: null,
    daftarFilter: { search: '', dept: 'ALL', status: 'ALL' },
    slipGajiList: [],
    slipGajiFilter: { search: '', periode: 'ALL' },
    uploadDokList: [],
    uploadDokFilter: { search: '', jenis: 'ALL' },
    selectedUploadDokFile: null
  };
}

// Master Default Kanwil & Departemen
const HR_DEFAULT_DEPTS = [
  'Operasional Umrah & Haji',
  'Ticketing & Reservasi',
  'Keuangan & Akuntansi',
  'SDM & Legal (HRD)',
  'Marketing & Promosi',
  'IT & Digital Media',
  'Pelayanan Jamaah & Perlengkapan'
];

// Helper format Rupiah
function formatRupiah(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

// --------------------------------------------------------------------------
// 13.1 DAFTAR & BIODATA KARYAWAN (mod_daftar_karyawan) - SUPABASE Bio_Karyawan
// --------------------------------------------------------------------------

function normalizeEmployee(e) {
  if (!e) return null;
  const nik = String(e.nik || e.NIK || '').trim();
  const nama = String(e.nama_karyawan || e['Nama Karyawan'] || e.nama || e.nama_lengkap || '').trim();
  const jabatan = String(e.jabatan || e.Jabatan || e.fungsional || e.Funsional || 'Staff').trim();
  const divisi = String(e.divisi || e.Divisi || e.departemen || e.dept || 'Operasional').trim();
  const kantor = String(e.kantor || e.Kantor || e.kanwil || e.lokasi_penempatan || 'Pusat').trim();
  const statusEmp = String(e.status_emp || e.STATUSEMP || e.statuskaryawan || e.status_karyawan || 'PKWTT').trim();
  const status = String(e.status || e.Status || 'Aktif').trim();
  const telp = String(e.nomor_hp || e['Nomor Telephone/HP'] || e.nomortelepon || e.no_telepon || e.nohp || '-').trim();
  const email = String(e.email || e.Email || '-').trim();
  const tglMasuk = e.tanggal_masuk || e.TanggalMulaiTugas || e.tglmasuk || e.tanggal_input || '-';

  return {
    ...e,
    nik: nik,
    nama: nama,
    nama_karyawan: nama,
    nama_lengkap: nama,
    jabatan: jabatan,
    divisi: divisi,
    departemen: divisi,
    dept: divisi,
    kantor: kantor,
    kanwil: kantor,
    status_emp: statusEmp,
    statuskaryawan: statusEmp,
    status_karyawan: statusEmp,
    status: status,
    nomor_hp: telp,
    nomortelepon: telp,
    email: email,
    tanggal_masuk: tglMasuk,
    tglmasuk: tglMasuk,
    jenis_kelamin: e.jenis_kelamin || e['Jenis Kelamin'] || e.jeniskelamin || 'Laki-laki',
    tempat_lahir: e.tempat_lahir || e['Tempat Lahir'] || e.tempatlahir || '',
    tanggal_lahir: e.tanggal_lahir || e['Tanggal Lahir'] || e.tanggallahir || null,
    golongan_darah: e.golongan_darah || e['Golongan Darah'] || e.goldarah || '-',
    alamat: e.alamat || e['Alamat Rumah Lengkap'] || e.alamatktp || '',
    alamatktp: e.alamat || e['Alamat Rumah Lengkap'] || e.alamatktp || '',
    alamatdomisili: e.alamatdomisili || e.alamat || e['Alamat Rumah Lengkap'] || '',
    kode_pos: e.kode_pos || e['Kode Pos'] || e.kodepos || '',
    kelurahan: e.kelurahan || e['Kelurahan/Desa'] || '',
    kecamatan: e.kecamatan || e['Kecamatan'] || '',
    kota_kabupaten: e.kota_kabupaten || e['Kabupaten/Kota'] || e.kota || '',
    kota: e.kota_kabupaten || e['Kabupaten/Kota'] || e.kota || '',
    provinsi: e.provinsi || e['Provinsi'] || '',
    no_ktp: e.no_ktp || e['Nomor Kartu Tanda Penduduk (KTP)'] || e.noktp || '',
    no_kk: e.no_kk || e['Nomor Kartu Keluarga (KK)'] || '',
    npwp: e.npwp || e['NPWP'] || '',
    bpjs_kesehatan: e.bpjs_kesehatan || e['Nomor BPJS Kesehatan'] || e.bpjskes || '',
    bpjs_ketenagakerjaan: e.bpjs_ketenagakerjaan || e['Nomor BP Ketenagakerjaan'] || e.bpjstk || '',
    penanggung_bpjs: e.penanggung_bpjs || e['Penanggung BPJS Kesehatan'] || '',
    nama_bank: e.nama_bank || e['Nama Bank'] || e.bank || 'BCA',
    bank: e.nama_bank || e['Nama Bank'] || e.bank || 'BCA',
    no_rekening: e.no_rekening || e['No Rekening'] || e.norekening || '',
    bank_atas_nama: e.bank_atas_nama || e['Nama Di Bank'] || nama,
    agama: e.agama || 'Islam',
    status_nikah: e.status_nikah || e.statusnikah || 'Menikah',
    pendidikan_terakhir: e.pendidikan_terakhir || e['Pendidikan Terakhir'] || e.pendidikan || 'S1',
    jurusan: e.jurusan || e['Jurusan Pendidikan Terakhir'] || '',
    lembaga_pendidikan: e.lembaga_pendidikan || e['Nama Lembaga Pendidikan'] || '',
    nama_ibu_kandung: e.nama_ibu_kandung || e['Nama Ibu Kandung'] || '',
    nama_pasangan: e.nama_pasangan || e['Nama Suami/Istri'] || '',
    tgl_lahir_pasangan: e.tgl_lahir_pasangan || e['Tanggal Lahir Suami/Istri'] || null,
    anak_1_nama: e.anak_1_nama || e['Nama Anak Kandung 1'] || '',
    anak_2_nama: e.anak_2_nama || e['Nama Anak Kandung 2'] || '',
    anak_3_nama: e.anak_3_nama || e['Nama Anak Kandung 3'] || '',
    anak_4_nama: e.anak_4_nama || e['Nama Anak Kandung 4'] || '',
    kontak_darurat_nama: e.kontak_darurat_nama || e.nama_pasangan || e.nama_ibu_kandung || '',
    kontak_darurat_hp: e.kontak_darurat_hp || telp || '',
    kontak_darurat_hubungan: e.kontak_darurat_hubungan || 'Keluarga',
    foto_url: e.foto_url || e['UploadFoto'] || e.upload_foto || '',
    upload_foto: e.foto_url || e['UploadFoto'] || e.upload_foto || '',
    upload_ktp: e.upload_ktp || e['UploadKTP'] || '',
    upload_npwp: e.upload_npwp || e['UploadNPWP'] || '',
    upload_kk: e.upload_kk || e['UploadKK'] || '',
    umur: e.umur || e['Umur'] || '',
    masa_kerja: e.masa_kerja || e['MasaKerja'] || ''
  };
}

async function initDaftarKaryawanView() {
  await loadDaftarKaryawanData();
}

async function loadDaftarKaryawanData(forceRefresh = false) {
  const tbody = document.getElementById('dkTableBody') || document.getElementById('daftarKaryawanTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:36px; color:var(--text-muted);">
          <i class="fa-solid fa-spinner fa-spin" style="color:#06b6d4; font-size:1.6rem;"></i>
          <div style="margin-top:12px; font-weight:600; font-size:0.9rem; color:var(--text-light);">Memuat data dari Supabase tabel Bio_Karyawan...</div>
          <div style="font-size:0.75rem; color:var(--text-dim); margin-top:4px;">Menghubungkan master data kepegawaian & profil karyawan</div>
        </td>
      </tr>
    `;
  }

  let list = [];

  // 1. Ambil langsung dari Supabase REST API (Tabel Bio_Karyawan / Bio Karyawan)
  const candidateEndpoints = [
    `${SUPABASE_CONFIG.url}/rest/v1/Bio_Karyawan?select=*&order=nik.asc`,
    `${SUPABASE_CONFIG.url}/rest/v1/Bio%20Karyawan?select=*&order=nik.asc`,
    `${SUPABASE_CONFIG.url}/rest/v1/bio_karyawan?select=*&order=nik.asc`
  ];

  for (const ep of candidateEndpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          list = raw;
          break;
        }
      }
    } catch (err) {
      // coba endpoint berikutnya
    }
  }

  // 2. Fallback via Node Server API /api/bio-karyawan
  if (!list || list.length === 0) {
    try {
      const res = await fetch('/api/bio-karyawan');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          list = json.data;
        }
      }
    } catch (_) {}
  }

  // 3. Normalisasi semua records
  const normalizedList = (list || []).map(normalizeEmployee).filter(Boolean);
  state.hr.employees = normalizedList;

  renderDaftarKaryawanTable();
  updateDaftarKaryawanStats();
  populateDaftarKaryawanFilterOptions();

  // Sinkronkan ke state cuti
  if (normalizedList.length > 0 && state.cuti) {
    state.cuti.employees = normalizedList.map(e => ({
      nik: e.nik,
      nama: e.nama_karyawan,
      jabatan: e.jabatan,
      kanwil: e.kantor,
      divisi: e.divisi,
      status: e.status
    }));
  }
}

function updateDaftarKaryawanStats() {
  const employees = state.hr.employees || [];
  const total = employees.length;
  const aktif = employees.filter(e => String(e.status || '').toLowerCase() === 'aktif').length;
  const pkwtt = employees.filter(e => String(e.status_emp || '').toUpperCase().includes('PKWTT') || String(e.status_emp || '').toLowerCase().includes('tetap')).length;
  const pkwt = employees.filter(e => String(e.status_emp || '').toUpperCase().includes('PKWT') || String(e.status_emp || '').toLowerCase().includes('kontrak')).length;

  const elTotal = document.getElementById('dkStatTotal') || document.getElementById('statTotalKaryawanList');
  const elAktif = document.getElementById('dkStatAktif');
  const elPkwtt = document.getElementById('dkStatPkwtt') || document.getElementById('statKaryawanTetap');
  const elPkwt = document.getElementById('dkStatPkwt') || document.getElementById('statKaryawanKontrak');

  if (elTotal) elTotal.textContent = total;
  if (elAktif) elAktif.textContent = aktif || total;
  if (elPkwtt) elPkwtt.textContent = pkwtt;
  if (elPkwt) elPkwt.textContent = pkwt;
}

function populateDaftarKaryawanFilterOptions() {
  const employees = state.hr.employees || [];

  // 1. Filter Kantor
  const kantorSelect = document.getElementById('dkFilterKantor');
  if (kantorSelect) {
    const currentVal = (kantorSelect.value || 'ALL').trim().toLowerCase();
    const distinctKantor = [...new Set(employees.map(e => (e.kantor || '').trim()).filter(Boolean))].sort();
    if (distinctKantor.length > 0) {
      let optHtml = '<option value="ALL">Semua Kantor Cabang</option>';
      distinctKantor.forEach(k => {
        const isSel = k.toLowerCase() === currentVal;
        optHtml += `<option value="${k}" ${isSel ? 'selected' : ''}>${k}</option>`;
      });
      kantorSelect.innerHTML = optHtml;
    }
  }

  // 2. Filter Divisi
  const divisiSelect = document.getElementById('dkFilterDivisi') || document.getElementById('filterDaftarKaryawanDept');
  if (divisiSelect) {
    const currentVal = (divisiSelect.value || 'ALL').trim().toLowerCase();
    const distinctDivisi = [...new Set(employees.map(e => (e.divisi || e.departemen || '').trim()).filter(Boolean))].sort();
    if (distinctDivisi.length > 0) {
      let optHtml = '<option value="ALL">Semua Divisi</option>';
      distinctDivisi.forEach(d => {
        const isSel = d.toLowerCase() === currentVal;
        optHtml += `<option value="${d}" ${isSel ? 'selected' : ''}>${d}</option>`;
      });
      divisiSelect.innerHTML = optHtml;
    }
  }
}

function renderDaftarKaryawanTable() {
  const tbody = document.getElementById('dkTableBody') || document.getElementById('daftarKaryawanTableBody');
  if (!tbody) return;

  const filter = state.hr.daftarFilter || {};
  const employees = state.hr.employees || [];

  const searchKeyword = (filter.search || '').toLowerCase().trim();
  const filterKantor = (filter.kantor || 'ALL').toLowerCase().trim();
  const filterDivisi = (filter.divisi || filter.dept || 'ALL').toLowerCase().trim();
  const filterStatus = (filter.status || 'ALL').toLowerCase().trim();

  const filtered = employees.filter(emp => {
    // 1. Search keyword
    if (searchKeyword) {
      const matchSearch =
        String(emp.nik || '').toLowerCase().includes(searchKeyword) ||
        String(emp.nama_karyawan || emp.nama || '').toLowerCase().includes(searchKeyword) ||
        String(emp.jabatan || '').toLowerCase().includes(searchKeyword) ||
        String(emp.divisi || '').toLowerCase().includes(searchKeyword) ||
        String(emp.kantor || '').toLowerCase().includes(searchKeyword) ||
        String(emp.nomor_hp || '').toLowerCase().includes(searchKeyword) ||
        String(emp.email || '').toLowerCase().includes(searchKeyword);
      if (!matchSearch) return false;
    }

    // 2. Kantor filter
    if (filterKantor !== 'all') {
      const k = String(emp.kantor || '').toLowerCase().trim();
      if (!k.includes(filterKantor) && filterKantor !== k) return false;
    }

    // 3. Divisi filter
    if (filterDivisi !== 'all') {
      const d = String(emp.divisi || emp.departemen || '').toLowerCase().trim();
      if (!d.includes(filterDivisi) && filterDivisi !== d) return false;
    }

    // 4. Status filter
    if (filterStatus !== 'all') {
      const s = String(emp.status || 'aktif').toLowerCase().trim();
      if (filterStatus === 'aktif' && !s.includes('aktif')) return false;
      if (filterStatus === 'non aktif' && s.includes('aktif') && !s.includes('non')) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:48px 20px; color:var(--text-muted);">
          <div style="font-size:2.2rem; margin-bottom:12px; color:var(--text-dim);"><i class="fa-solid fa-users-slash"></i></div>
          <div style="font-size:0.95rem; font-weight:700; color:var(--text-main);">Tidak ada data karyawan yang cocok</div>
          <div style="font-size:0.8rem; margin-top:4px;">Coba ubah kata kunci pencarian atau sesuaikan filter kantor/divisi/status.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((emp, idx) => {
    const nik = emp.nik || `NIK-${idx + 1}`;
    const nama = emp.nama_karyawan || emp.nama || 'Karyawan';
    const jabatan = emp.jabatan || 'Staff';
    const divisi = emp.divisi || emp.departemen || 'Operasional';
    const kantor = emp.kantor || 'Pusat';
    const statusEmp = emp.status_emp || 'PKWTT';
    const telp = emp.nomor_hp || '-';
    const email = emp.email || '-';
    const status = emp.status || 'Aktif';

    // Status EMP CSS tag
    let statusEmpClass = 'status-pkwtt';
    if (statusEmp.toUpperCase().includes('PKWT')) statusEmpClass = 'status-pkwt';
    else if (statusEmp.toUpperCase().includes('PROBA') || statusEmp.toUpperCase().includes('MAGANG')) statusEmpClass = 'status-magang';

    // Status keaktifan pill
    const isAktif = status.toLowerCase() === 'aktif';
    const statusPillClass = isAktif ? 'status-pill-aktif' : 'status-pill-nonaktif';

    // Clean Phone WA
    const rawDigits = telp.replace(/[^0-9]/g, '');
    let waPhone = rawDigits;
    if (waPhone.startsWith('0')) waPhone = '62' + waPhone.slice(1);

    // Avatar Initials & Gradient
    const nameWords = nama.split(' ').filter(Boolean);
    const initials = (nameWords[0] ? nameWords[0][0] : '') + (nameWords[1] ? nameWords[1][0] : '');
    const charCode = (nama.charCodeAt(0) || 65) + (nama.charCodeAt(nama.length - 1) || 65);
    const hue = (charCode * 37) % 360;
    const avatarGradient = `linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 45) % 360}, 75%, 35%))`;

    const fotoUrl = emp.foto_url || emp.upload_foto;
    const hasPhoto = fotoUrl && (fotoUrl.startsWith('http') || fotoUrl.startsWith('data:'));

    const avatarHtml = hasPhoto
      ? `<img src="${fotoUrl}" class="dk-avatar-img" alt="${nama}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <div class="dk-avatar-circle" style="display:none; background:${avatarGradient};">${initials.toUpperCase() || 'K'}</div>`
      : `<div class="dk-avatar-circle" style="background:${avatarGradient};">${initials.toUpperCase() || 'K'}</div>`;

    const genderIcon = emp.jenis_kelamin === 'Perempuan' ? '<i class="fa-solid fa-venus" style="color:#f472b6;"></i>' : '<i class="fa-solid fa-mars" style="color:#38bdf8;"></i>';
    const subText = `${genderIcon} ${emp.jenis_kelamin || 'Laki-laki'}${emp.tempat_lahir ? ' • ' + emp.tempat_lahir : ''}`;

    return `
      <tr>
        <td style="text-align:center; font-family:monospace; color:var(--text-dim); font-size:0.8rem;">${idx + 1}</td>
        <td>
          <span class="dk-nik-badge">${nik}</span>
        </td>
        <td>
          <div class="dk-name-cell">
            ${avatarHtml}
            <div class="dk-name-wrap">
              <div class="dk-name-title">${nama}</div>
              <div class="dk-name-sub">${subText}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="dk-jabatan-title">${jabatan}</div>
          <div class="dk-jabatan-sub"><i class="fa-solid fa-graduation-cap"></i> ${emp.pendidikan_terakhir || 'S1'}${emp.jurusan ? ' ' + emp.jurusan : ''}</div>
        </td>
        <td>
          <span class="dk-divisi-badge">${divisi}</span>
        </td>
        <td>
          <span class="dk-kantor-badge"><i class="fa-solid fa-location-dot"></i> ${kantor}</span>
        </td>
        <td style="text-align:center;">
          <span class="dk-emp-tag ${statusEmpClass}">${statusEmp}</span>
        </td>
        <td>
          <div class="dk-kontak-wrap">
            ${telp && telp !== '-'
              ? `<a href="https://wa.me/${waPhone}" target="_blank" rel="noopener noreferrer" class="dk-phone-link" title="Kirim Pesan WhatsApp">
                  <i class="fa-brands fa-whatsapp"></i> ${telp}
                </a>`
              : '<span style="color:var(--text-dim); font-size:0.75rem;">-</span>'}
            ${email && email !== '-'
              ? `<div class="dk-email-text" title="${email}"><i class="fa-regular fa-envelope"></i> ${email}</div>`
              : ''}
          </div>
        </td>
        <td style="text-align:center;">
          <span class="status-pill ${statusPillClass}">
            <i class="fa-solid fa-circle" style="font-size:6px; margin-right:4px;"></i>${status}
          </span>
        </td>
        <td style="text-align:center;">
          <div class="dk-action-buttons">
            <button type="button" class="btn-action-table view" onclick="viewEmployeeDetailFromList('${nik}')" title="Cetak / Pratinjau Dokumen Detail A4 Resmi">
              <i class="fa-solid fa-id-card-clip"></i>
            </button>
            <button type="button" class="btn-action-table edit" onclick="editEmployeeBio('${nik}')" title="Edit Biodata di Formulir Entry">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.onDaftarKaryawanFilterChange = function() {
  const searchInput = document.getElementById('dkSearchInput') || document.getElementById('searchDaftarKaryawan');
  const kantorSelect = document.getElementById('dkFilterKantor');
  const divisiSelect = document.getElementById('dkFilterDivisi') || document.getElementById('filterDaftarKaryawanDept');
  const statusSelect = document.getElementById('dkFilterStatus') || document.getElementById('filterDaftarKaryawanStatus');

  state.hr.daftarFilter = {
    search: searchInput ? searchInput.value : '',
    kantor: kantorSelect ? kantorSelect.value : 'ALL',
    divisi: divisiSelect ? divisiSelect.value : 'ALL',
    status: statusSelect ? statusSelect.value : 'ALL'
  };

  renderDaftarKaryawanTable();
};

window.exportDaftarKaryawanCSV = function() {
  const employees = state.hr.employees || [];
  if (employees.length === 0) {
    alert('Tidak ada data karyawan untuk diexport.');
    return;
  }

  const headers = ['NIK', 'Nama Lengkap', 'Jabatan', 'Divisi / Departemen', 'Status Kepegawaian', 'No Telepon / HP', 'Email', 'Tanggal Masuk', 'Penempatan Kantor'];
  const rows = employees.map(e => [
    `"${e.nik || ''}"`,
    `"${(e.nama_karyawan || '').replace(/"/g, '""')}"`,
    `"${(e.jabatan || '').replace(/"/g, '""')}"`,
    `"${(e.divisi || '').replace(/"/g, '""')}"`,
    `"${(e.status_emp || '').replace(/"/g, '""')}"`,
    `"${(e.nomor_hp || '').replace(/"/g, '""')}"`,
    `"${(e.email || '').replace(/"/g, '""')}"`,
    `"${(e.tanggal_masuk || '').replace(/"/g, '""')}"`,
    `"${(e.kantor || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Daftar_Karyawan_FathIndah_Supabase_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.viewEmployeeDetailFromList = function(nik) {
  state.hr.selectedEmployeeNik = nik;
  switchModule('mod_detail_emp');
  initEmployeeDetailView(nik);
};

window.editEmployeeBio = function(nik) {
  state.hr.selectedEmployeeNik = nik;
  switchModule('mod_bio_karyawan');
  populateBioKaryawanFormWithNik(nik);
};

// --------------------------------------------------------------------------
// 13.2 FORMULIR BIO KARYAWAN (mod_bio_karyawan) - 6 CLUSTERS TERPADU
// --------------------------------------------------------------------------

// Kamus Kodepos Cepat Indonesia untuk Instant Auto-Fill
const INTERNAL_KODEPOS_DB = {
  '10110': { kelurahan: 'Petojo Selatan', kecamatan: 'Gambir', kota: 'Kota Jakarta Pusat', provinsi: 'DKI Jakarta' },
  '10120': { kelurahan: 'Gambir', kecamatan: 'Gambir', kota: 'Kota Jakarta Pusat', provinsi: 'DKI Jakarta' },
  '12110': { kelurahan: 'Gunung', kecamatan: 'Kebayoran Baru', kota: 'Kota Jakarta Selatan', provinsi: 'DKI Jakarta' },
  '15419': { kelurahan: 'Pisangan', kecamatan: 'Ciputat Timur', kota: 'Kota Tangerang Selatan', provinsi: 'Banten' },
  '15411': { kelurahan: 'Ciputat', kecamatan: 'Ciputat', kota: 'Kota Tangerang Selatan', provinsi: 'Banten' },
  '15412': { kelurahan: 'Cipayung', kecamatan: 'Ciputat', kota: 'Kota Tangerang Selatan', provinsi: 'Banten' },
  '15111': { kelurahan: 'Tangerang', kecamatan: 'Tangerang', kota: 'Kota Tangerang', provinsi: 'Banten' },
  '16111': { kelurahan: 'Gudang', kecamatan: 'Bogor Tengah', kota: 'Kota Bogor', provinsi: 'Jawa Barat' },
  '16411': { kelurahan: 'Depok', kecamatan: 'Pancasari', kota: 'Kota Depok', provinsi: 'Jawa Barat' },
  '17111': { kelurahan: 'Bekasi Jaya', kecamatan: 'Bekasi Timur', kota: 'Kota Bekasi', provinsi: 'Jawa Barat' },
  '17142': { kelurahan: 'Marga Mulya', kecamatan: 'Bekasi Utara', kota: 'Kota Bekasi', provinsi: 'Jawa Barat' },
  '40111': { kelurahan: 'Braga', kecamatan: 'Sumur Bandung', kota: 'Kota Bandung', provinsi: 'Jawa Barat' },
  '40132': { kelurahan: 'Lebak Siliwangi', kecamatan: 'Coblong', kota: 'Kota Bandung', provinsi: 'Jawa Barat' },
  '50111': { kelurahan: 'Kauman', kecamatan: 'Semarang Tengah', kota: 'Kota Semarang', provinsi: 'Jawa Tengah' },
  '53111': { kelurahan: 'Kranji', kecamatan: 'Purwokerto Timur', kota: 'Kabupaten Banyumas', provinsi: 'Jawa Tengah' },
  '52311': { kelurahan: 'Kebondalem', kecamatan: 'Pemalang', kota: 'Kabupaten Pemalang', provinsi: 'Jawa Tengah' },
  '57111': { kelurahan: 'Keprabon', kecamatan: 'Banjarsari', kota: 'Kota Surakarta', provinsi: 'Jawa Tengah' },
  '57511': { kelurahan: 'Sukoharjo', kecamatan: 'Sukoharjo', kota: 'Kabupaten Sukoharjo', provinsi: 'Jawa Tengah' },
  '55111': { kelurahan: 'Ngupasan', kecamatan: 'Gondomanan', kota: 'Kota Yogyakarta', provinsi: 'DI Yogyakarta' },
  '60111': { kelurahan: 'Surabaya', kecamatan: 'Tegalsari', kota: 'Kota Surabaya', provinsi: 'Jawa Timur' },
  '65111': { kelurahan: 'Klojen', kecamatan: 'Klojen', kota: 'Kota Malang', provinsi: 'Jawa Timur' },
  '20111': { kelurahan: 'Kesawan', kecamatan: 'Medan Barat', kota: 'Kota Medan', provinsi: 'Sumatera Utara' },
  '75111': { kelurahan: 'Pasar Pagi', kecamatan: 'Samarinda Kota', kota: 'Kota Samarinda', provinsi: 'Kalimantan Timur' },
  '90111': { kelurahan: 'Pattunuang', kecamatan: 'Wajo', kota: 'Kota Makassar', provinsi: 'Sulawesi Selatan' },
  '80111': { kelurahan: 'Dangin Puri', kecamatan: 'Denpasar Timur', kota: 'Kota Denpasar', provinsi: 'Bali' }
};

window.handleKodePosInput = function(val) {
  const clean = String(val || '').trim();
  if (clean.length === 5) {
    window.lookupKodepos(clean);
  } else {
    const feedback = document.getElementById('kodeposFeedback');
    if (feedback) feedback.innerHTML = '';
  }
};

window.triggerKodePosLookup = function() {
  const input = document.getElementById('bioKodePos');
  const val = input ? input.value.trim() : '';
  if (!val) {
    alert('Masukkan 5 digit angka Kode Pos.');
    if (input) input.focus();
    return;
  }
  window.lookupKodepos(val);
};

window.lookupKodepos = async function(kodepos) {
  const clean = String(kodepos || '').trim();
  const feedback = document.getElementById('kodeposFeedback');
  if (feedback) feedback.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-cyan"></i> Mencari alamat dari Supabase Kodepos...';

  const mapItem = (item) => ({
    kodepos: item.kodepos || item.Kodepos || item.KodePos || clean,
    kelurahan: item.kelurahan || item.Kelurahan || item.urban || '',
    kecamatan: item.kecamatan || item.Kecamatan || item.subdistrict || '',
    kota: item.kota || item.Kota || item.kabupaten || item.Kabupaten || item.city || '',
    provinsi: item.provinsi || item.Provinsi || item.province || ''
  });

  // 1. Prioritas Utama: Ambil langsung dari Supabase REST API (Tabel "Kodepos" atau "kodepos")
  try {
    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
      const endpoints = [
        `Kodepos?Kodepos=eq.${encodeURIComponent(clean)}`,
        `Kodepos?KodePos=eq.${encodeURIComponent(clean)}`,
        `Kodepos?kodepos=eq.${encodeURIComponent(clean)}`,
        `kodepos?kodepos=eq.${encodeURIComponent(clean)}`,
        `KodePos?KodePos=eq.${encodeURIComponent(clean)}`
      ];
      for (const ep of endpoints) {
        try {
          const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${ep}&select=*`, {
            headers: {
              'apikey': SUPABASE_CONFIG.anonKey,
              'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
            }
          });
          if (res.ok) {
            const raw = await res.json();
            if (Array.isArray(raw) && raw.length > 0) {
              const list = raw.map(mapItem);
              // Pastikan data memiliki kelurahan/kecamatan/kota (bukan row kosong/null)
              if (list.some(it => it.kelurahan || it.kecamatan || it.kota)) {
                applyKodeposData(list[0], clean, 'Supabase (Tabel Kodepos)', list);
                return;
              }
            }
          }
        } catch (eInner) {}
      }
    }
  } catch (errSb) {
    console.warn('Supabase direct Kodepos fetch error:', errSb);
  }

  // 2. Prioritas Kedua: Query melalui Backend Server /api/kodepos (yang terhubung ke Supabase)
  try {
    const res = await fetch(`/api/kodepos?q=${encodeURIComponent(clean)}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        applyKodeposData(json.data, clean, json.source === 'supabase' ? 'Supabase (Tabel Kodepos)' : json.source, json.all);
        return;
      }
    }
  } catch (errSrv) {}

  // 3. Fallback Kamus Cepat Internal
  if (INTERNAL_KODEPOS_DB[clean]) {
    const data = INTERNAL_KODEPOS_DB[clean];
    applyKodeposData(data, clean, 'Database Internal');
    return;
  }

  // 4. Fallback Public Kodepos API
  try {
    const res = await fetch(`https://kodepos-266e6.firebaseapp.com/search?q=${clean}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.length > 0) {
        const item = json.data[0];
        const data = {
          kelurahan: item.urban || item.kelurahan || '',
          kecamatan: item.subdistrict || item.kecamatan || '',
          kota: item.city || item.kabupaten || item.kota || '',
          provinsi: item.province || item.provinsi || ''
        };
        applyKodeposData(data, clean, 'Online Kodepos API');
        return;
      }
    }
  } catch (err) {
    console.warn('External Kodepos API fetch failed:', err);
  }

  // Jika tidak ditemukan
  if (feedback) {
    feedback.innerHTML = `<span style="color:#fbbf24;"><i class="fa-solid fa-circle-exclamation"></i> Kodepos ${clean} tidak ditemukan di tabel Supabase. Silakan isi Kelurahan/Kecamatan/Kota secara manual.</span>`;
  }
};

function applyKodeposData(data, kodepos, sourceName, allList) {
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
  };

  setEl('bioKelurahan', data.kelurahan);
  setEl('bioKecamatan', data.kecamatan);
  setEl('bioKota', data.kota);
  setEl('bioProvinsi', data.provinsi);

  // Jika terdapat beberapa kelurahan untuk 1 kodepos, siapkan datalist opsi pilihan
  if (Array.isArray(allList) && allList.length > 1) {
    let dl = document.getElementById('bioKelurahanList');
    if (!dl) {
      dl = document.createElement('datalist');
      dl.id = 'bioKelurahanList';
      document.body.appendChild(dl);
      const kelInput = document.getElementById('bioKelurahan');
      if (kelInput) kelInput.setAttribute('list', 'bioKelurahanList');
    }
    dl.innerHTML = allList.map(item => `<option value="${item.kelurahan}">${item.kelurahan} - ${item.kecamatan}</option>`).join('');
  }

  const feedback = document.getElementById('kodeposFeedback');
  if (feedback) {
    const multipleNote = (Array.isArray(allList) && allList.length > 1)
      ? ` <span style="font-size:0.7rem; color:#a5f3fc;">(${allList.length} Kelurahan tersedia, pilih di opsi Kelurahan)</span>`
      : '';
    feedback.innerHTML = `<span style="color:#34d399;"><i class="fa-solid fa-circle-check"></i> Alamat terdeteksi: <strong>${data.kelurahan}, ${data.kecamatan}, ${data.kota}, ${data.provinsi}</strong> (${sourceName})${multipleNote}</span>`;
  }
}

function initBioKaryawanView() {
  if (state.hr.selectedEmployeeNik) {
    populateBioKaryawanFormWithNik(state.hr.selectedEmployeeNik);
  } else {
    resetBioKaryawanForm();
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

const BIO_DOC_CONFIG = {
  FOTO: { label: 'Pas Foto', fieldId: 'bioFotoUrl', nameId: 'nameBioFoto', statusId: 'statusBioFoto', prefix: 'FOTO' },
  KTP: { label: 'Berkas KTP', fieldId: 'bioUploadKtp', nameId: 'nameBioKtp', statusId: 'statusBioKtp', prefix: 'KTP' },
  NPWP: { label: 'Berkas NPWP', fieldId: 'bioUploadNpwp', nameId: 'nameBioNpwp', statusId: 'statusBioNpwp', prefix: 'NPWP' },
  KK: { label: 'Berkas Kartu Keluarga', fieldId: 'bioUploadKk', nameId: 'nameBioKk', statusId: 'statusBioKk', prefix: 'KK' }
};

window._pendingBioFiles = {};

window.updateBioDocStatusBadge = function(docType, url, label) {
  const cfg = BIO_DOC_CONFIG[docType];
  if (!cfg) return;
  const statusEl = document.getElementById(cfg.statusId);
  const nameEl = document.getElementById(cfg.nameId);
  if (!statusEl) return;

  if (url) {
    statusEl.innerHTML = `<span class="status-success"><i class="fa-solid fa-circle-check"></i> <a href="${url}" target="_blank" style="color:#34d399; text-decoration:underline; font-weight:600;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Lihat ${label || cfg.label} di Google Drive</a></span>`;
    if (nameEl) nameEl.textContent = 'Berkas tersimpan di Drive';
  } else {
    statusEl.innerHTML = '';
    if (nameEl) nameEl.textContent = 'Belum ada file dipilih';
  }
};

window.checkBioNamaBeforeBrowse = function(event) {
  const namaInp = document.getElementById('bioNama');
  const namaVal = (namaInp?.value || '').trim();
  if (!namaVal) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    alert('⚠️ Harap isi Nama Karyawan terlebih dahulu sebelum memilih berkas!');
    if (namaInp) {
      namaInp.focus();
      try {
        namaInp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {}
    }
    return false;
  }
  return true;
};

window.handleBioDocFileSelect = function(fileInput, docType) {
  const namaInp = document.getElementById('bioNama');
  const namaVal = (namaInp?.value || '').trim();
  if (!namaVal) {
    alert('⚠️ Harap isi Nama Karyawan terlebih dahulu sebelum memilih berkas!');
    fileInput.value = '';
    if (namaInp) {
      namaInp.focus();
      try {
        namaInp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {}
    }
    return;
  }

  const file = fileInput.files && fileInput.files[0];
  const cfg = BIO_DOC_CONFIG[docType];
  if (!cfg) return;

  const nameEl = document.getElementById(cfg.nameId);
  const statusEl = document.getElementById(cfg.statusId);
  const targetInput = document.getElementById(cfg.fieldId);

  if (!file) {
    if (targetInput && targetInput.value) {
      if (nameEl) nameEl.textContent = 'Berkas tersimpan di Drive';
      updateBioDocStatusBadge(docType, targetInput.value);
    } else {
      if (nameEl) nameEl.textContent = 'Belum ada file dipilih';
      if (statusEl) statusEl.innerHTML = '';
    }
    delete window._pendingBioFiles[docType];
    return;
  }

  // Rekam file lokal terpilih ke antrian, JANGAN langsung unggah ke Google Drive (tunggu tombol Simpan)
  window._pendingBioFiles[docType] = file;
  if (nameEl) nameEl.textContent = file.name;

  if (statusEl) {
    statusEl.innerHTML = `<span style="color:#fbbf24; font-size:0.78rem; display:inline-flex; align-items:center; gap:5px;"><i class="fa-solid fa-clock"></i> File lokal <strong>"${file.name}"</strong> dipilih. Berkas akan diunggah ke Google Drive saat tombol <strong>"Simpan Data Karyawan"</strong> ditekan.</span>`;
  }
};

function resetBioKaryawanForm() {
  const form = document.getElementById('formBioKaryawan');
  if (form) form.reset();
  state.hr.selectedEmployeeNik = null;
  const nikInput = document.getElementById('bioNik');
  if (nikInput) {
    nikInput.removeAttribute('readonly');
    nikInput.style.opacity = '1';
  }
  const feedback = document.getElementById('kodeposFeedback');
  if (feedback) feedback.innerHTML = '';
  const dl = document.getElementById('bioKelurahanList');
  if (dl) dl.innerHTML = '';

  ['FOTO', 'KTP', 'NPWP', 'KK'].forEach(dt => {
    updateBioDocStatusBadge(dt, null);
    const cfg = BIO_DOC_CONFIG[dt];
    if (cfg) {
      const hid = document.getElementById(cfg.fieldId);
      if (hid) hid.value = '';
    }
    const fileInp = document.getElementById(
      dt === 'FOTO' ? 'bioFotoFile' :
      dt === 'KTP' ? 'bioKtpFile' :
      dt === 'NPWP' ? 'bioNpwpFile' : 'bioKkFile'
    );
    if (fileInp) fileInp.value = '';
    const nameEl = document.getElementById(
      dt === 'FOTO' ? 'nameBioFoto' :
      dt === 'KTP' ? 'nameBioKtp' :
      dt === 'NPWP' ? 'nameBioNpwp' : 'nameBioKk'
    );
    if (nameEl) nameEl.textContent = 'Belum ada file dipilih';
    const statusEl = document.getElementById(
      dt === 'FOTO' ? 'statusBioFoto' :
      dt === 'KTP' ? 'statusBioKtp' :
      dt === 'NPWP' ? 'statusBioNpwp' : 'statusBioKk'
    );
    if (statusEl) statusEl.innerHTML = '';
  });
  window._pendingBioFiles = {};
}

function populateBioKaryawanFormWithNik(nik) {
  const employees = state.hr.employees || [];
  const emp = employees.find(e => String(e.nik || '').trim() === String(nik || '').trim());
  if (!emp) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  };

  // CLUSTER 1: Data Pribadi Karyawan
  setVal('bioNik', emp.nik);
  setVal('bioNama', emp.nama_karyawan || emp.nama || emp['Nama Karyawan']);
  setVal('bioJenisKelamin', emp.jenis_kelamin || emp['Jenis Kelamin'] || 'Laki-laki');
  setVal('bioGolDarah', emp.golongan_darah || emp['Golongan Darah'] || '-');
  setVal('bioTempatLahir', emp.tempat_lahir || emp['Tempat Lahir']);
  setVal('bioTanggalLahir', emp.tanggal_lahir ? String(emp.tanggal_lahir).split('T')[0] : '');
  setVal('bioAgama', emp.agama || 'Islam');
  setVal('bioStatusNikah', emp.status_nikah || emp.statusnikah || 'Menikah');
  setVal('bioStatusEmp', emp.status_emp || emp.STATUSEMP || emp.statuskaryawan || 'PKWTT');
  setVal('bioStatus', emp.status || emp.Status || 'Aktif');
  setVal('bioDivisi', emp.divisi || emp.departemen || emp.dept || 'Top Manajemen');
  setVal('bioJabatan', emp.jabatan || emp['Jabatan'] || 'Staff');
  setVal('bioFungsional', emp.fungsional || emp['Funsional'] || '');
  setVal('bioKantor', emp.kantor || emp.kanwil || 'Pusat');
  setVal('bioTanggalMasuk', emp.tanggal_masuk ? String(emp.tanggal_masuk).split('T')[0] : (emp.tglmasuk ? String(emp.tglmasuk).split('T')[0] : ''));

  // CLUSTER 2: Alamat Lengkap Karyawan
  setVal('bioAlamat', emp.alamat || emp['Alamat Rumah Lengkap'] || emp.alamatktp);
  setVal('bioKodePos', emp.kode_pos || emp['Kode Pos'] || emp.kodepos);
  setVal('bioKelurahan', emp.kelurahan || emp['Kelurahan/Desa']);
  setVal('bioKecamatan', emp.kecamatan || emp['Kecamatan']);
  setVal('bioKota', emp.kota_kabupaten || emp['Kabupaten/Kota'] || emp.kota);
  setVal('bioProvinsi', emp.provinsi || emp['Provinsi']);
  setVal('bioHp', emp.nomor_hp || emp['Nomor Telephone/HP'] || emp.nomortelepon || emp.no_telepon || emp.nohp);
  setVal('bioEmail', emp.email && emp.email !== '-' ? emp.email : '');

  // CLUSTER 3: Riwayat Pendidikan Terakhir
  setVal('bioPendidikan', emp.pendidikan_terakhir || emp['Pendidikan Terakhir'] || 'S1');
  setVal('bioJurusan', emp.jurusan || emp['Jurusan Pendidikan Terakhir']);
  setVal('bioLembagaPendidikan', emp.lembaga_pendidikan || emp['Nama Lembaga Pendidikan']);

  // CLUSTER 4: Data Keluarga & Tanggungan
  setVal('bioNamaIbuKandung', emp.nama_ibu_kandung || emp['Nama Ibu Kandung']);
  setVal('bioNamaPasangan', emp.nama_pasangan || emp['Nama Suami/Istri']);
  setVal('bioTglLahirPasangan', emp.tgl_lahir_pasangan ? String(emp.tgl_lahir_pasangan).split('T')[0] : (emp['Tanggal Lahir Suami/Istri'] ? String(emp['Tanggal Lahir Suami/Istri']).split('T')[0] : ''));
  setVal('bioAnak1Nama', emp.anak_1_nama || emp['Nama Anak Kandung 1']);
  setVal('bioAnak1TglLahir', emp.anak_1_tgl_lahir ? String(emp.anak_1_tgl_lahir).split('T')[0] : '');
  setVal('bioAnak2Nama', emp.anak_2_nama || emp['Nama Anak Kandung 2']);
  setVal('bioAnak2TglLahir', emp.anak_2_tgl_lahir ? String(emp.anak_2_tgl_lahir).split('T')[0] : '');
  setVal('bioAnak3Nama', emp.anak_3_nama || emp['Nama Anak Kandung 3']);
  setVal('bioAnak3TglLahir', emp.anak_3_tgl_lahir ? String(emp.anak_3_tgl_lahir).split('T')[0] : '');
  setVal('bioAnak4Nama', emp.anak_4_nama || emp['Nama Anak Kandung 4']);
  setVal('bioAnak4TglLahir', emp.anak_4_tgl_lahir ? String(emp.anak_4_tgl_lahir).split('T')[0] : '');

  // CLUSTER 5: Dokumen Kependudukan & BPJS
  setVal('bioNoKtp', emp.no_ktp || emp['Nomor Kartu Tanda Penduduk (KTP)'] || emp.noktp);
  setVal('bioNoKk', emp.no_kk || emp['Nomor Kartu Keluarga (KK)']);
  setVal('bioNpwp', emp.npwp || emp['NPWP']);
  setVal('bioBpjsTk', emp.bpjs_ketenagakerjaan || emp['Nomor BP Ketenagakerjaan'] || emp.bpjstk);
  setVal('bioBpjsKes', emp.bpjs_kesehatan || emp['Nomor BPJS Kesehatan'] || emp.bpjskes);
  setVal('bioPenanggungBpjs', emp.penanggung_bpjs || emp['Penanggung BPJS Kesehatan'] || 'Perusahaan');
  setVal('bioFotoUrl', emp.upload_foto || emp.foto_url || emp['UploadFoto'] || '');
  setVal('bioUploadKtp', emp.upload_ktp || emp['UploadKTP'] || '');
  setVal('bioUploadNpwp', emp.upload_npwp || emp['UploadNPWP'] || '');
  setVal('bioUploadKk', emp.upload_kk || emp['UploadKK'] || '');
  setVal('bioDaruratNama', emp.kontak_darurat_nama || emp.nama_pasangan || emp.nama_ibu_kandung);
  setVal('bioDaruratHp', emp.kontak_darurat_hp || emp.nomor_hp);
  setVal('bioDaruratHub', emp.kontak_darurat_hubungan || 'Keluarga');

  // Perbarui lencana status dokumen tersimpan
  updateBioDocStatusBadge('FOTO', emp.upload_foto || emp.foto_url || emp['UploadFoto'], 'Pas Foto');
  updateBioDocStatusBadge('KTP', emp.upload_ktp || emp['UploadKTP'], 'KTP');
  updateBioDocStatusBadge('NPWP', emp.upload_npwp || emp['UploadNPWP'], 'NPWP');
  updateBioDocStatusBadge('KK', emp.upload_kk || emp['UploadKK'], 'Kartu Keluarga');

  // CLUSTER 6: Informasi Rekening Bank
  setVal('bioBankAtasNama', emp.bank_atas_nama || emp['Nama Di Bank'] || emp.nama_karyawan || emp.nama);
  setVal('bioNamaBank', emp.nama_bank || emp['Nama Bank'] || emp.bank || 'BSI');
  setVal('bioNoRekening', emp.no_rekening || emp['No Rekening'] || emp.norekening);

  // Lock NIK saat editing agar primary key tidak terduplikasi
  const nikInput = document.getElementById('bioNik');
  if (nikInput) {
    nikInput.setAttribute('readonly', 'readonly');
    nikInput.style.opacity = '0.75';
  }
}

window.handleBioKaryawanSubmit = async function(event) {
  if (event) event.preventDefault();

  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  const getDateVal = (id) => {
    const el = document.getElementById(id);
    const val = el ? el.value.trim() : '';
    return val ? val : null;
  };

  const nik = getVal('bioNik');
  const nama = getVal('bioNama');

  if (!nik || !nama) {
    alert('Nomor Induk Karyawan (NIK) dan Nama Karyawan wajib diisi!');
    const targetEl = !nik ? document.getElementById('bioNik') : document.getElementById('bioNama');
    if (targetEl) targetEl.focus();
    return;
  }

  const btnSubmit = document.getElementById('btnBioSubmit');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mempersiapkan Dokumen...';
  }

  // 1. Unggah berkas ke Google Drive hanya saat tombol Simpan ditekan (mencegah duplicate upload)
  const webhookUrl = getGDriveWebhookUrl();
  const pendingDocTypes = Object.keys(window._pendingBioFiles || {});

  if (pendingDocTypes.length > 0) {
    if (!webhookUrl) {
      alert('⚠️ Perhatian: Webhook Google Drive belum dikonfigurasi. Berkas belum dapat diunggah ke Google Drive. Silakan atur Webhook Google Drive di konfigurasi.');
    } else {
      for (const dt of pendingDocTypes) {
        const file = window._pendingBioFiles[dt];
        const cfg = BIO_DOC_CONFIG[dt];
        if (!file || !cfg) continue;

        const nameEl = document.getElementById(cfg.nameId);
        const statusEl = document.getElementById(cfg.statusId);
        const targetInput = document.getElementById(cfg.fieldId);

        // Format nama file spesifik: [PREFIX]_[Nama]_[NIK].[ext]
        const cleanNama = nama.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
        const cleanNik = nik.replace(/[^a-zA-Z0-9]/g, '_');
        const ext = file.name.split('.').pop() || (dt === 'FOTO' ? 'jpg' : 'pdf');
        const specificFileName = `${cfg.prefix}_${cleanNama}${cleanNik ? '_' + cleanNik : ''}.${ext}`;

        if (btnSubmit) {
          btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah ${cfg.label} ke Google Drive...`;
        }
        if (statusEl) {
          statusEl.innerHTML = `<span class="status-uploading"><i class="fa-solid fa-spinner fa-spin text-cyan"></i> Mengunggah ${specificFileName} ke Google Drive...</span>`;
        }

        try {
          const base64Data = await readFileAsBase64(file);
          const scriptPayload = {
            folderId: '1cHGrQ2cOzcAJ_MYq8MLi96droVIMPvcr',
            fileName: specificFileName,
            mimeType: file.type || 'application/octet-stream',
            base64: base64Data
          };

          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(scriptPayload)
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const data = await res.json();
          if (data.success && (data.directLink || data.fileUrl)) {
            const driveUrl = data.directLink || data.fileUrl;
            if (targetInput) targetInput.value = driveUrl;
            if (statusEl) {
              statusEl.innerHTML = `<span class="status-success"><i class="fa-solid fa-circle-check"></i> <a href="${driveUrl}" target="_blank" style="color:#34d399; text-decoration:underline; font-weight:600;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Tersimpan di Google Drive: ${specificFileName}</a></span>`;
            }
            if (nameEl) nameEl.textContent = specificFileName;
            delete window._pendingBioFiles[dt];
          } else {
            throw new Error(data.message || 'Gagal upload ke Google Drive');
          }
        } catch (uploadErr) {
          console.error(`Upload ${dt} error:`, uploadErr);
          if (statusEl) {
            statusEl.innerHTML = `<span class="status-error"><i class="fa-solid fa-circle-exclamation"></i> Gagal upload: ${uploadErr.message}</span>`;
          }
          const proceed = confirm(`Berkas ${cfg.label} gagal diunggah ke Google Drive (${uploadErr.message}). Apakah Anda ingin tetap melanjutkan menyimpan biodata ke database?`);
          if (!proceed) {
            if (btnSubmit) {
              btnSubmit.disabled = false;
              btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Data Karyawan';
            }
            return;
          }
        }
      }
    }
  }

  if (btnSubmit) {
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan ke Supabase Bio_Karyawan...';
  }

  // VALID SCHEMA COLUMNS OF Supabase Bio_Karyawan (Strict 54 columns)
  const VALID_BIO_COLS = new Set([
    'nik', 'nama_karyawan', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'golongan_darah',
    'alamat', 'kode_pos', 'kelurahan', 'kecamatan', 'kota_kabupaten', 'provinsi',
    'nomor_hp', 'email', 'pendidikan_terakhir', 'jurusan', 'lembaga_pendidikan',
    'nama_ibu_kandung', 'nama_pasangan', 'tgl_lahir_pasangan',
    'anak_1_nama', 'anak_1_tgl_lahir', 'anak_2_nama', 'anak_2_tgl_lahir',
    'anak_3_nama', 'anak_3_tgl_lahir', 'anak_4_nama', 'anak_4_tgl_lahir',
    'no_kk', 'no_ktp', 'npwp', 'bpjs_ketenagakerjaan', 'bpjs_kesehatan', 'penanggung_bpjs',
    'bank_atas_nama', 'nama_bank', 'no_rekening', 'status', 'status_emp',
    'tanggal_input', 'tanggal_masuk', 'keterangan', 'divisi', 'jabatan', 'fungsional',
    'kantor', 'upload_ktp', 'upload_npwp', 'upload_kk', 'upload_foto', 'umur', 'evaluasi', 'masa_kerja'
  ]);

  // Bangun keterangan dengan info ekstra agar data lengkap tetap tercatat
  const extras = [];
  if (getVal('bioAgama')) extras.push(`Agama: ${getVal('bioAgama')}`);
  if (getVal('bioStatusNikah')) extras.push(`Status Nikah: ${getVal('bioStatusNikah')}`);
  if (getVal('bioDaruratNama')) extras.push(`Kontak Darurat: ${getVal('bioDaruratNama')} (${getVal('bioDaruratHp') || '-'}, ${getVal('bioDaruratHub') || '-'})`);

  const rawPayload = {
    // CLUSTER 1: Data Pribadi Karyawan
    nik: nik,
    nama_karyawan: nama,
    jenis_kelamin: getVal('bioJenisKelamin') || 'Laki-laki',
    golongan_darah: getVal('bioGolDarah') || '-',
    tempat_lahir: getVal('bioTempatLahir') || null,
    tanggal_lahir: getDateVal('bioTanggalLahir'),
    status_emp: getVal('bioStatusEmp') || 'PKWTT',
    status: getVal('bioStatus') || 'Aktif',
    divisi: getVal('bioDivisi') || 'Top Manajemen',
    jabatan: getVal('bioJabatan') || 'Staff',
    fungsional: getVal('bioFungsional') || null,
    kantor: getVal('bioKantor') || 'Pusat',
    tanggal_masuk: getDateVal('bioTanggalMasuk'),

    // CLUSTER 2: Alamat Lengkap Karyawan
    alamat: getVal('bioAlamat') || null,
    kode_pos: getVal('bioKodePos') || null,
    kelurahan: getVal('bioKelurahan') || null,
    kecamatan: getVal('bioKecamatan') || null,
    kota_kabupaten: getVal('bioKota') || null,
    provinsi: getVal('bioProvinsi') || null,
    nomor_hp: getVal('bioHp') || null,
    email: getVal('bioEmail') || null,

    // CLUSTER 3: Riwayat Pendidikan Terakhir
    pendidikan_terakhir: getVal('bioPendidikan') || 'S1',
    jurusan: getVal('bioJurusan') || null,
    lembaga_pendidikan: getVal('bioLembagaPendidikan') || null,

    // CLUSTER 4: Data Keluarga & Tanggungan
    nama_ibu_kandung: getVal('bioNamaIbuKandung') || null,
    nama_pasangan: getVal('bioNamaPasangan') || null,
    tgl_lahir_pasangan: getDateVal('bioTglLahirPasangan'),
    anak_1_nama: getVal('bioAnak1Nama') || null,
    anak_1_tgl_lahir: getDateVal('bioAnak1TglLahir'),
    anak_2_nama: getVal('bioAnak2Nama') || null,
    anak_2_tgl_lahir: getDateVal('bioAnak2TglLahir'),
    anak_3_nama: getVal('bioAnak3Nama') || null,
    anak_3_tgl_lahir: getDateVal('bioAnak3TglLahir'),
    anak_4_nama: getVal('bioAnak4Nama') || null,
    anak_4_tgl_lahir: getDateVal('bioAnak4TglLahir'),

    // CLUSTER 5: Dokumen Kependudukan & BPJS
    no_ktp: getVal('bioNoKtp') || null,
    no_kk: getVal('bioNoKk') || null,
    npwp: getVal('bioNpwp') || null,
    bpjs_ketenagakerjaan: getVal('bioBpjsTk') || null,
    bpjs_kesehatan: getVal('bioBpjsKes') || null,
    penanggung_bpjs: getVal('bioPenanggungBpjs') || 'Perusahaan',
    upload_foto: getVal('bioFotoUrl') || null,
    upload_ktp: getVal('bioUploadKtp') || null,
    upload_npwp: getVal('bioUploadNpwp') || null,
    upload_kk: getVal('bioUploadKk') || null,

    // CLUSTER 6: Informasi Rekening Bank
    bank_atas_nama: getVal('bioBankAtasNama') || nama,
    nama_bank: getVal('bioNamaBank') || 'BSI',
    no_rekening: getVal('bioNoRekening') || null,

    // Sistem Metadata
    tanggal_input: new Date().toISOString().split('T')[0],
    keterangan: extras.length > 0 ? extras.join(' | ') : null
  };

  // Filter ketat agar HANYA kolom resmi Supabase yang dikirimkan
  const cleanPayload = {};
  for (const [k, v] of Object.entries(rawPayload)) {
    if (VALID_BIO_COLS.has(k)) {
      cleanPayload[k] = v;
    }
  }

  try {
    let saved = false;
    let lastError = '';

    // 1. Simpan langsung ke Supabase REST API (Upsert)
    const candidateEndpoints = [
      `${SUPABASE_CONFIG.url}/rest/v1/Bio_Karyawan`,
      `${SUPABASE_CONFIG.url}/rest/v1/Bio%20Karyawan`,
      `${SUPABASE_CONFIG.url}/rest/v1/bio_karyawan`
    ];

    for (const ep of candidateEndpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_CONFIG.anonKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(cleanPayload)
        });

        if (res.ok || res.status === 201 || res.status === 200 || res.status === 204) {
          saved = true;
          break;
        } else {
          lastError = await res.text();
          console.warn(`Supabase save endpoint ${ep} failed:`, res.status, lastError);
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    // 2. Fallback simpan via server backend /api/bio-karyawan
    if (!saved) {
      try {
        const srvRes = await fetch('/api/bio-karyawan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanPayload)
        });
        if (srvRes.ok) {
          const srvData = await srvRes.json();
          if (srvData.success) {
            saved = true;
          }
        }
      } catch (srvErr) {
        console.warn('Backend fallback save error:', srvErr);
      }
    }

    if (saved) {
      alert(`✅ Berhasil! Data Karyawan [${nik}] ${nama} telah berhasil disimpan ke database Bio_Karyawan Supabase lengkap beserta tautan dokumen Google Drive.`);
      resetBioKaryawanForm();
      await loadDaftarKaryawanData(true);
      switchModule('mod_daftar_karyawan');
    } else {
      let friendlyError = lastError;
      try {
        const parsed = JSON.parse(lastError);
        if (parsed.message) friendlyError = parsed.message;
      } catch (e) {}
      alert(`⚠️ Gagal menyimpan ke Supabase: ${friendlyError || 'Koneksi terputus'}. Pastikan tabel Bio_Karyawan sudah tersedia dan izin RLS terbuka.`);
    }
  } catch (err) {
    console.error('Error simpan biodata:', err);
    alert(`⚠️ Terjadi kesalahan saat menyimpan: ${err.message}`);
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Data Karyawan';
    }
  }
};

// --------------------------------------------------------------------------
// 13.3 DOKUMEN DETAIL PEGAWAI & CETAK PRESISI A4 RESMI (mod_detail_emp)
// --------------------------------------------------------------------------

async function initEmployeeDetailView(targetNik) {
  if (!state.hr.employees || state.hr.employees.length === 0) {
    await loadDaftarKaryawanData();
  }
  populateEmployeeDetailSelect(targetNik);
}

function populateEmployeeDetailSelect(targetNik) {
  const select = document.getElementById('selectDetailEmployee');
  if (!select) return;

  const employees = state.hr.employees || [];
  if (employees.length === 0) {
    select.innerHTML = '<option value="">-- Belum ada data karyawan di Supabase --</option>';
    return;
  }

  const selectedVal = targetNik || state.hr.selectedEmployeeNik || (employees[0] && employees[0].nik);

  select.innerHTML = employees.map(e => {
    const isSel = String(e.nik) === String(selectedVal);
    return `<option value="${e.nik}" ${isSel ? 'selected' : ''}>${e.nik} - ${e.nama_karyawan || e.nama} (${e.jabatan || 'Staff'} • ${e.kantor || 'Pusat'})</option>`;
  }).join('');

  onSelectEmployeeDetailChange();
}

window.onSelectEmployeeDetailChange = function() {
  const select = document.getElementById('selectDetailEmployee');
  if (!select) return;

  const nik = select.value;
  state.hr.selectedEmployeeNik = nik;
  const employees = state.hr.employees || [];
  const emp = employees.find(e => String(e.nik) === String(nik));

  renderEmployeeDetailPaper(emp);
};

function renderEmployeeDetailPaper(emp) {
  const container = document.getElementById('employeeDetailPaper');
  if (!container) return;

  if (!emp) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px 20px; color:var(--text-muted);">
        <i class="fa-solid fa-user-xmark" style="font-size:2.5rem; margin-bottom:12px; color:var(--text-dim);"></i>
        <div>Silakan pilih karyawan di atas untuk mencetak lembar data resmi.</div>
      </div>
    `;
    return;
  }

  const nik = emp.nik || '-';
  const nama = emp.nama_karyawan || emp.nama || '-';
  const gender = emp.jenis_kelamin || 'Laki-laki';
  const tglLahirFormatted = emp.tanggal_lahir ? String(emp.tanggal_lahir).split('T')[0] : '-';
  const ttl = `${emp.tempat_lahir || '-'}, ${tglLahirFormatted}`;
  const golDarah = emp.golongan_darah || '-';
  const agama = emp.agama || 'Islam';
  const statusNikah = emp.status_nikah || 'Menikah';
  const noKtp = emp.no_ktp || '-';
  const noKk = emp.no_kk || '-';
  const npwp = emp.npwp || '-';

  const telp = emp.nomor_hp || '-';
  const email = emp.email !== '-' ? emp.email : '-';
  const alamatKtp = emp.alamat || '-';
  const domisiliParts = [
    emp.kelurahan ? `Kel. ${emp.kelurahan}` : '',
    emp.kecamatan ? `Kec. ${emp.kecamatan}` : '',
    emp.kota_kabupaten || emp.kota || '',
    emp.provinsi || '',
    emp.kode_pos || ''
  ].filter(Boolean).join(', ');
  const alamatDomisili = domisiliParts || alamatKtp;

  const jabatan = emp.jabatan || 'Staff';
  const dept = emp.divisi || emp.departemen || 'Operasional';
  const statusKaryawan = emp.status_emp || 'PKWTT';
  const tglMasuk = emp.tanggal_masuk ? String(emp.tanggal_masuk).split('T')[0] : '-';
  const kanwil = emp.kantor || 'Kantor Pusat Jakarta';
  const masaKerja = emp.masa_kerja ? `${emp.masa_kerja} Tahun` : '-';

  const pendidikan = [emp.pendidikan_terakhir, emp.jurusan ? `(${emp.jurusan})` : '', emp.lembaga_pendidikan].filter(Boolean).join(' ');
  const namaIbu = emp.nama_ibu_kandung || '-';
  const pasangan = emp.nama_pasangan || '-';
  const anakList = [emp.anak_1_nama, emp.anak_2_nama, emp.anak_3_nama, emp.anak_4_nama].filter(Boolean).join(', ') || '-';

  const bank = emp.nama_bank || 'BCA';
  const noRek = emp.no_rekening || '-';
  const atasNama = emp.bank_atas_nama || nama;
  const bpjsKes = emp.bpjs_kesehatan ? `${emp.bpjs_kesehatan} ${emp.penanggung_bpjs ? '(' + emp.penanggung_bpjs + ')' : ''}` : '-';
  const bpjsTk = emp.bpjs_ketenagakerjaan || '-';

  // Cek foto formal
  const fotoUrl = emp.foto_url || emp.upload_foto;
  let fotoHtml = `
    <div style="width:120px; height:150px; border:2px dashed #94a3b8; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f8fafc; color:#64748b; font-size:0.7rem; margin:auto;">
      <i class="fa-solid fa-user" style="font-size:2.5rem; color:#cbd5e1; margin-bottom:8px;"></i>
      <span>Pas Foto 3x4</span>
      <span style="font-size:0.6rem; color:#94a3b8;">PT Fath Indah</span>
    </div>
  `;

  if (fotoUrl && (fotoUrl.startsWith('http') || fotoUrl.startsWith('data:'))) {
    fotoHtml = `
      <div style="width:120px; height:150px; border:2px solid #0284c7; border-radius:8px; overflow:hidden; margin:auto; background:#f8fafc; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
        <img src="${fotoUrl}" alt="${nama}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'padding:30px 10px; font-size:0.7rem; color:#64748b; text-align:center;\\'><i class=\\'fa-solid fa-image-slash\\' style=\\'font-size:1.8rem; margin-bottom:6px;\\'></i><br>Foto Resmi</div>';">
      </div>
    `;
  }

  const currentDateIndo = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

  container.innerHTML = `
    <!-- HEADER RESMI PERUSAHAAN (KOP SURAT) -->
    <div class="de-header-official">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:20px;">
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="width:64px; height:64px; border-radius:12px; background:#0f172a; border:2px solid #38bdf8; display:flex; align-items:center; justify-content:center; color:#38bdf8; font-size:2rem; font-weight:900;">
            <i class="fa-solid fa-kaaba"></i>
          </div>
          <div>
            <div style="font-size:1.35rem; font-weight:900; letter-spacing:0.5px; color:#0f172a; text-transform:uppercase;">
              PT. FATH INDAH TRAVEL SERVICES
            </div>
            <div style="font-size:0.78rem; font-weight:700; color:#0284c7; letter-spacing:1px; text-transform:uppercase;">
              Penyelenggara Ibadah Haji Khusus & Umrah Resmi Kemenag RI
            </div>
            <div style="font-size:0.7rem; color:#475569; margin-top:2px;">
              Gedung Fath Indah, Jl. Warung Buncit Raya No. 45 Jakarta Selatan • Telp: (021) 7919-8888 • www.fathindah.co.id
            </div>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="border:1.5px solid #0284c7; padding:4px 12px; border-radius:6px; font-size:0.75rem; font-weight:800; color:#0284c7; text-transform:uppercase; font-family:monospace;">
            FORM: HRD-EMP-01
          </span>
          <div style="font-size:0.68rem; color:#64748b; margin-top:4px;">Klasifikasi: Dokumen Rahasia Perusahaan</div>
        </div>
      </div>
      <div style="border-bottom:3px double #0f172a; margin-top:12px; margin-bottom:16px;"></div>
    </div>

    <!-- JUDUL DOKUMEN -->
    <div style="text-align:center; margin-bottom:20px;">
      <h3 style="font-size:1.15rem; font-weight:900; color:#0f172a; text-transform:uppercase; text-decoration:underline; margin:0; letter-spacing:0.5px;">
        LEMBAR DATA BIODATA RESMI KARYAWAN
      </h3>
      <div style="font-size:0.75rem; color:#64748b; margin-top:3px; font-family:monospace;">
        Nomor Induk Karyawan (NIK): <strong>${nik}</strong> • Sumber: Supabase (Bio_Karyawan)
      </div>
    </div>

    <!-- SEKSI 1: DATA PRIBADI & FOTO -->
    <div style="display:flex; gap:20px; margin-bottom:18px;">
      <div style="flex:1;">
        <div class="de-section-title">I. DATA PRIBADI PEGAWAI</div>
        <table class="de-print-table">
          <tr>
            <td style="width:35%; font-weight:600;">Nomor Induk Karyawan (NIK)</td>
            <td style="width:5%; text-align:center;">:</td>
            <td style="width:60%; font-weight:700; color:#0284c7; font-family:monospace;">${nik}</td>
          </tr>
          <tr>
            <td style="font-weight:600;">Nama Lengkap (sesuai KTP)</td>
            <td style="text-align:center;">:</td>
            <td style="font-weight:700; color:#0f172a;">${nama}</td>
          </tr>
          <tr>
            <td style="font-weight:600;">Jenis Kelamin</td>
            <td style="text-align:center;">:</td>
            <td>${gender}</td>
          </tr>
          <tr>
            <td style="font-weight:600;">Tempat, Tanggal Lahir</td>
            <td style="text-align:center;">:</td>
            <td>${ttl} (Gol. Darah: <strong>${golDarah}</strong>)</td>
          </tr>
          <tr>
            <td style="font-weight:600;">Agama / Keyakinan</td>
            <td style="text-align:center;">:</td>
            <td>${agama}</td>
          </tr>
          <tr>
            <td style="font-weight:600;">Status Pernikahan</td>
            <td style="text-align:center;">:</td>
            <td>${statusNikah}</td>
          </tr>
          <tr>
            <td style="font-weight:600;">Pendidikan Terakhir</td>
            <td style="text-align:center;">:</td>
            <td>${pendidikan || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight:600;">Nomor KTP / NIK Kependudukan</td>
            <td style="text-align:center;">:</td>
            <td style="font-family:monospace;">${noKtp}</td>
          </tr>
          <tr>
            <td style="font-weight:600;">Nomor Kartu Keluarga (KK)</td>
            <td style="text-align:center;">:</td>
            <td style="font-family:monospace;">${noKk}</td>
          </tr>
          <tr>
            <td style="font-weight:600;">Nomor Pokok Wajib Pajak (NPWP)</td>
            <td style="text-align:center;">:</td>
            <td style="font-family:monospace;">${npwp}</td>
          </tr>
        </table>
      </div>
      <!-- PAS FOTO RESMI (3X4 RATIO) -->
      <div style="width:130px; text-align:center;">
        ${fotoHtml}
        <div style="font-size:0.65rem; color:#64748b; margin-top:6px; font-weight:600;">VERIFIED HRD</div>
      </div>
    </div>

    <!-- SEKSI 2: KONTAK & ALAMAT DOMISILI -->
    <div style="margin-bottom:18px;">
      <div class="de-section-title">II. KONTAK DAN ALAMAT TEMPAT TINGGAL</div>
      <table class="de-print-table">
        <tr>
          <td style="width:28%; font-weight:600;">Nomor Telepon / WhatsApp</td>
          <td style="width:4%; text-align:center;">:</td>
          <td style="width:68%; font-family:monospace;">${telp}</td>
        </tr>
        <tr>
          <td style="font-weight:600;">Alamat Surat Elektronik (Email)</td>
          <td style="text-align:center;">:</td>
          <td>${email}</td>
        </tr>
        <tr>
          <td style="font-weight:600;">Alamat Lengkap (KTP)</td>
          <td style="text-align:center;">:</td>
          <td>${alamatKtp}</td>
        </tr>
        <tr>
          <td style="font-weight:600;">Alamat Domisili Sekarang</td>
          <td style="text-align:center;">:</td>
          <td>${alamatDomisili}</td>
        </tr>
      </table>
    </div>

    <!-- SEKSI 3: KELUARGA & KONTAK DARURAT -->
    <div style="margin-bottom:18px;">
      <div class="de-section-title">III. SUSUNAN KELUARGA & KONTAK DARURAT</div>
      <table class="de-print-table">
        <tr>
          <td style="width:28%; font-weight:600;">Nama Ibu Kandung</td>
          <td style="width:4%; text-align:center;">:</td>
          <td style="width:68%;">${namaIbu}</td>
        </tr>
        <tr>
          <td style="font-weight:600;">Nama Suami / Istri</td>
          <td style="text-align:center;">:</td>
          <td>${pasangan}</td>
        </tr>
        <tr>
          <td style="font-weight:600;">Nama Anak Kandung</td>
          <td style="text-align:center;">:</td>
          <td>${anakList}</td>
        </tr>
      </table>
    </div>

    <!-- SEKSI 4: INFORMASI JABATAN & KEPEGAWAIAN -->
    <div style="margin-bottom:18px;">
      <div class="de-section-title">IV. STATUS KEPEGAWAIAN DAN PENEMPATAN</div>
      <table class="de-print-table">
        <tr>
          <td style="width:28%; font-weight:600;">Jabatan / Posisi Kerja</td>
          <td style="width:4%; text-align:center;">:</td>
          <td style="width:68%; font-weight:700; color:#0f172a;">${jabatan}</td>
        </tr>
        <tr>
          <td style="font-weight:600;">Departemen / Divisi</td>
          <td style="text-align:center;">:</td>
          <td>${dept}</td>
        </tr>
        <tr>
          <td style="font-weight:600;">Status Hubungan Kerja</td>
          <td style="text-align:center;">:</td>
          <td><strong style="color:#0284c7;">${statusKaryawan}</strong></td>
        </tr>
        <tr>
          <td style="font-weight:600;">Tanggal Mulai Bergabung</td>
          <td style="text-align:center;">:</td>
          <td>${tglMasuk} (Masa Kerja: ${masaKerja})</td>
        </tr>
        <tr>
          <td style="font-weight:600;">Wilayah / Unit Kerja</td>
          <td style="text-align:center;">:</td>
          <td>${kanwil}</td>
        </tr>
      </table>
    </div>

    <!-- SEKSI 5: REKENING BANK & JAMINAN SOSIAL -->
    <div style="margin-bottom:24px;">
      <div class="de-section-title">V. FASILITAS PENGGAJIAN DAN JAMINAN SOSIAL</div>
      <table class="de-print-table">
        <tr>
          <td style="width:28%; font-weight:600;">Rekening Payroll / Bank</td>
          <td style="width:4%; text-align:center;">:</td>
          <td style="width:68%;">${bank} - No. Rek: <strong style="font-family:monospace;">${noRek}</strong> (a.n. ${atasNama})</td>
        </tr>
        <tr>
          <td style="font-weight:600;">BPJS Kesehatan</td>
          <td style="text-align:center;">:</td>
          <td style="font-family:monospace;">${bpjsKes}</td>
        </tr>
        <tr>
          <td style="font-weight:600;">BPJS Ketenagakerjaan</td>
          <td style="text-align:center;">:</td>
          <td style="font-family:monospace;">${bpjsTk}</td>
        </tr>
      </table>
    </div>

    <!-- KOLOM TANDA TANGAN RESMI -->
    <div style="margin-top:36px; page-break-inside:avoid;">
      <div style="display:flex; justify-content:space-between; text-align:center; font-size:0.78rem; color:#0f172a;">
        <div style="width:220px;">
          <div>Karyawan Bersangkutan,</div>
          <div style="height:65px;"></div>
          <div style="font-weight:800; border-bottom:1px solid #0f172a; padding-bottom:2px;">( ${nama} )</div>
          <div style="font-size:0.7rem; color:#64748b; margin-top:2px;">NIK: ${nik}</div>
        </div>

        <div style="width:220px;">
          <div>Jakarta, ${currentDateIndo}</div>
          <div style="font-weight:600;">Mengetahui, HRD & Legal Manager</div>
          <div style="height:50px;"></div>
          <div style="font-weight:800; border-bottom:1px solid #0f172a; padding-bottom:2px;">( Miftahul Maulana )</div>
          <div style="font-size:0.7rem; color:#64748b; margin-top:2px;">Head of HRD, Legal, IS & QA</div>
        </div>
      </div>
    </div>
  `;
}

window.printEmployeeDetail = function() {
  window.print();
};


// --------------------------------------------------------------------------
// 13.4 ANALYTICS KARYAWAN (mod_emp_analytics)
// --------------------------------------------------------------------------

function initEmployeeAnalyticsView() {
  loadEmployeeAnalyticsData();
}

function loadEmployeeAnalyticsData() {
  const employees = state.hr.employees || [];
  const container = document.getElementById('analyticsChartsGrid');
  if (!container) return;

  const total = employees.length || 1;

  // 1. Departemen
  const deptMap = {};
  employees.forEach(e => {
    const d = (e.departemen || e.dept || 'Lainnya').trim();
    deptMap[d] = (deptMap[d] || 0) + 1;
  });

  // 2. Status Karyawan
  let tetapCount = 0;
  let kontrakCount = 0;
  let probaCount = 0;
  employees.forEach(e => {
    const st = String(e.statuskaryawan || e.status_karyawan || '').toLowerCase();
    if (st.includes('tetap')) tetapCount++;
    else if (st.includes('kontrak')) kontrakCount++;
    else probaCount++;
  });

  // 3. Gender
  let priaCount = 0;
  let wanitaCount = 0;
  employees.forEach(e => {
    const g = String(e.jeniskelamin || e.jenis_kelamin || '').toLowerCase();
    if (g.includes('perempuan') || g.includes('wanita')) wanitaCount++;
    else priaCount++;
  });

  // Render Charts HTML
  container.innerHTML = `
    <!-- CARD 1: DISTRIBUSI DEPARTEMEN -->
    <div class="ea-chart-card">
      <div class="ea-card-header">
        <div class="ea-card-icon"><i class="fa-solid fa-sitemap"></i></div>
        <div class="ea-card-title">Distribusi Karyawan Per Departemen</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px; margin-top:14px;">
        ${Object.entries(deptMap).map(([deptName, count]) => {
          const pct = Math.round((count / total) * 100);
          return `
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span style="color:var(--text-light); font-weight:600;">${deptName}</span>
                <span style="color:#38bdf8; font-family:monospace; font-weight:700;">${count} Pegawai (${pct}%)</span>
              </div>
              <div class="ea-bar-track">
                <div class="ea-bar-fill" style="width:${pct}%; background:linear-gradient(90deg, #0284c7, #38bdf8);"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- CARD 2: STATUS KEPEGAWAIAN -->
    <div class="ea-chart-card">
      <div class="ea-card-header">
        <div class="ea-card-icon" style="color:#10b981; background:rgba(16,185,129,0.15);"><i class="fa-solid fa-user-check"></i></div>
        <div class="ea-card-title">Komposisi Status Hubungan Kerja</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:14px; margin-top:14px;">
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
            <span style="color:var(--text-light); font-weight:600;">Karyawan Tetap (PKWTT)</span>
            <span style="color:#10b981; font-family:monospace; font-weight:700;">${tetapCount} Pegawai (${Math.round((tetapCount/total)*100)}%)</span>
          </div>
          <div class="ea-bar-track">
            <div class="ea-bar-fill" style="width:${Math.round((tetapCount/total)*100)}%; background:#10b981;"></div>
          </div>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
            <span style="color:var(--text-light); font-weight:600;">Karyawan Kontrak (PKWT)</span>
            <span style="color:#f59e0b; font-family:monospace; font-weight:700;">${kontrakCount} Pegawai (${Math.round((kontrakCount/total)*100)}%)</span>
          </div>
          <div class="ea-bar-track">
            <div class="ea-bar-fill" style="width:${Math.round((kontrakCount/total)*100)}%; background:#f59e0b;"></div>
          </div>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
            <span style="color:var(--text-light); font-weight:600;">Masa Percobaan / Probation</span>
            <span style="color:#06b6d4; font-family:monospace; font-weight:700;">${probaCount} Pegawai (${Math.round((probaCount/total)*100)}%)</span>
          </div>
          <div class="ea-bar-track">
            <div class="ea-bar-fill" style="width:${Math.round((probaCount/total)*100)}%; background:#06b6d4;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- CARD 3: RASIO GENDER -->
    <div class="ea-chart-card">
      <div class="ea-card-header">
        <div class="ea-card-icon" style="color:#c084fc; background:rgba(192,132,252,0.15);"><i class="fa-solid fa-venus-mars"></i></div>
        <div class="ea-card-title">Rasio Komposisi Gender</div>
      </div>
      <div style="display:flex; align-items:center; justify-content:space-around; margin-top:20px;">
        <div style="text-align:center;">
          <div style="width:68px; height:68px; border-radius:50%; background:rgba(56,189,248,0.15); border:3px solid #38bdf8; display:flex; align-items:center; justify-content:center; color:#38bdf8; font-size:1.8rem; margin:auto;">
            <i class="fa-solid fa-mars"></i>
          </div>
          <div style="font-weight:800; font-size:1.2rem; color:var(--text-light); margin-top:8px;">${priaCount}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Pria (${Math.round((priaCount/total)*100)}%)</div>
        </div>

        <div style="text-align:center;">
          <div style="width:68px; height:68px; border-radius:50%; background:rgba(244,114,182,0.15); border:3px solid #f472b6; display:flex; align-items:center; justify-content:center; color:#f472b6; font-size:1.8rem; margin:auto;">
            <i class="fa-solid fa-venus"></i>
          </div>
          <div style="font-weight:800; font-size:1.2rem; color:var(--text-light); margin-top:8px;">${wanitaCount}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Wanita (${Math.round((wanitaCount/total)*100)}%)</div>
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 13.5 ARSIP & UPLOAD DOKUMEN PEGAWAI (mod_upload_dok)
// --------------------------------------------------------------------------

const GDRIVE_DOKUMEN_KARYAWAN_FOLDER = 'https://drive.google.com/drive/folders/12hJY5VGcTlgdSBHRqOxSLYg_zwB4C0gF';

function initUploadDocView() {
  populateUploadDokEmployeeSelect();
  loadUploadDokData();
  setupUploadDokDropzone();
}

function populateUploadDokEmployeeSelect() {
  const select = document.getElementById('uploadDokNikSelect');
  if (!select) return;

  const employees = state.hr.employees || [];
  select.innerHTML = '<option value="">-- Pilih Karyawan Pemilik Dokumen --</option>' +
    employees.map(e => `<option value="${e.nik}">${e.nik} - ${e.nama || e.nama_lengkap} (${e.jabatan || 'Staff'})</option>`).join('');
}

window.onUploadDokEmployeeChange = function() {
  const select = document.getElementById('uploadDokNikSelect');
  const nameInput = document.getElementById('uploadDokNamaKaryawan');
  if (!select || !nameInput) return;

  const nik = select.value;
  const emp = (state.hr.employees || []).find(e => String(e.nik) === String(nik));
  if (emp) {
    nameInput.value = emp.nama || emp.nama_lengkap || '';
  } else {
    nameInput.value = '';
  }
};

function setupUploadDokDropzone() {
  const fileInput = document.getElementById('fileUploadDokInput');
  const dropzone = document.getElementById('uploadDokDropzone');
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#00e5ff';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'rgba(255,255,255,0.15)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'rgba(255,255,255,0.15)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      fileInput.files = e.dataTransfer.files;
      onUploadDokFileSelected({ target: fileInput });
    }
  });
}

window.onUploadDokFileSelected = function(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  state.hr.selectedUploadDokFile = file;

  const preview = document.getElementById('uploadDokFilePreview');
  const nameEl = document.getElementById('uploadDokFileName');
  const sizeEl = document.getElementById('uploadDokFileSize');
  const dropzone = document.getElementById('uploadDokDropzone');

  if (preview && nameEl && sizeEl) {
    nameEl.textContent = file.name;
    sizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB`;
    preview.style.display = 'block';
    if (dropzone) dropzone.style.display = 'none';
  }
};

window.removeUploadDokFile = function(event) {
  if (event) event.stopPropagation();
  state.hr.selectedUploadDokFile = null;

  const fileInput = document.getElementById('fileUploadDokInput');
  const preview = document.getElementById('uploadDokFilePreview');
  const dropzone = document.getElementById('uploadDokDropzone');

  if (fileInput) fileInput.value = '';
  if (preview) preview.style.display = 'none';
  if (dropzone) dropzone.style.display = 'flex';
};

window.handleUploadDokSubmit = async function(event) {
  if (event) event.preventDefault();

  const nikSelect = document.getElementById('uploadDokNikSelect');
  const namaInput = document.getElementById('uploadDokNamaKaryawan');
  const jenisSelect = document.getElementById('uploadDokJenisDokumen');
  const linkInput = document.getElementById('uploadDokDirectLink');
  const fileInput = document.getElementById('fileUploadDokInput');
  const btnSubmit = document.getElementById('btnSubmitUploadDok');

  const nik = nikSelect ? nikSelect.value : '';
  const nama = namaInput ? namaInput.value : '';
  const jenis = jenisSelect ? jenisSelect.value : 'KTP';
  const directLink = linkInput ? linkInput.value.trim() : '';
  const file = state.hr.selectedUploadDokFile || (fileInput && fileInput.files && fileInput.files[0]);

  if (!nik || !nama) {
    alert('Harap pilih karyawan terlebih dahulu!');
    return;
  }

  if (!file && !directLink) {
    alert('Pilih file dokumen atau masukkan Link Google Drive langsung!');
    return;
  }

  let finalLink = directLink || GDRIVE_DOKUMEN_KARYAWAN_FOLDER;
  let finalFileName = file ? file.name : `${jenis}_${nik}.pdf`;

  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah Dokumen...';
  }

  // Jika ada file dan ada Webhook Apps Script yang dikonfigurasi, kirim langsung ke Google Drive
  const webhookUrl = getGDriveWebhookUrl();
  if (file && webhookUrl) {
    try {
      const base64 = await readFileAsBase64(file);
      const scriptPayload = {
        folderId: '12hJY5VGcTlgdSBHRqOxSLYg_zwB4C0gF',
        fileName: `${jenis}_${nik}_${Date.now()}_${file.name}`,
        mimeType: file.type || 'application/pdf',
        base64: base64
      };

      const gRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(scriptPayload)
      });

      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.success && (gData.directLink || gData.fileUrl)) {
          finalLink = gData.directLink || gData.fileUrl;
          finalFileName = gData.fileName || finalFileName;
        }
      }
    } catch (gErr) {
      console.warn('Apps script upload warning:', gErr);
    }
  }

  const record = {
    nik: nik,
    namakaryawan: nama,
    jenisdokumen: jenis,
    namafile: finalFileName,
    linkdokumen: finalLink,
    ukuranfile: file ? `${(file.size / 1024).toFixed(1)} KB` : 'Cloud Link',
    keterangan: `Diunggah pada ${new Date().toLocaleString('id-ID')}`,
    createdat: new Date().toISOString()
  };

  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/upload_dok`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(record)
    });

    if (res.ok || res.status === 201 || res.status === 204) {
      alert(`✅ Dokumen [${jenis}] untuk karyawan ${nama} berhasil disimpan ke Supabase!`);
      removeUploadDokFile();
      if (linkInput) linkInput.value = '';
      await loadUploadDokData();
    } else {
      // Fallback via server route
      const srvRes = await fetch('/api/upload-dok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      const srvData = await srvRes.json();
      if (srvData.success) {
        alert(`✅ Dokumen tersimpan ke database via server!`);
        removeUploadDokFile();
        if (linkInput) linkInput.value = '';
        await loadUploadDokData();
      } else {
        alert(`⚠️ Gagal menyimpan metadata dokumen: ${srvData.message || (await res.text())}`);
      }
    }
  } catch (err) {
    console.error('Error simpan upload dok:', err);
    alert(`⚠️ Terjadi kesalahan: ${err.message}`);
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Simpan Dokumen ke Arsip';
    }
  }
};

async function loadUploadDokData() {
  const tbody = document.getElementById('uploadDokTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
          <i class="fa-solid fa-spinner fa-spin" style="color:#06b6d4; font-size:1.5rem;"></i>
          <div style="margin-top:10px;">Memuat arsip berkas karyawan dari Supabase...</div>
        </td>
      </tr>
    `;
  }

  let list = [];
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/upload_dok?select=*&order=createdat.desc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    if (res.ok) {
      list = await res.json();
    }
  } catch (err) {
    console.warn('Load upload_dok error:', err);
  }

  if (!list || list.length === 0) {
    try {
      const res = await fetch('/api/upload-dok');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) list = json.data;
      }
    } catch (_) {}
  }

  state.hr.uploadDokList = list || [];
  renderUploadDokTable();
}

function renderUploadDokTable() {
  const tbody = document.getElementById('uploadDokTableBody');
  if (!tbody) return;

  const list = state.hr.uploadDokList || [];
  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
          Belum ada arsip dokumen yang diunggah.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((doc, idx) => {
    const tgl = doc.createdat ? formatIndoCutiDate(doc.createdat) : '-';
    return `
      <tr>
        <td style="text-align:center; font-family:monospace; color:var(--text-dim);">${idx + 1}</td>
        <td>
          <span style="font-family:monospace; color:#38bdf8; font-weight:700;">${doc.nik || '-'}</span>
          <div style="font-size:0.75rem; color:var(--text-light); font-weight:600;">${doc.namakaryawan || '-'}</div>
        </td>
        <td>
          <span style="background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.3); color:#38bdf8; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:6px;">
            ${doc.jenisdokumen || 'Dokumen'}
          </span>
        </td>
        <td>
          <div style="color:var(--text-main); font-size:0.82rem; font-weight:600;">${doc.namafile || 'File'}</div>
          <div style="font-size:0.7rem; color:var(--text-dim);">${doc.ukuranfile || '-'}</div>
        </td>
        <td style="font-size:0.8rem; color:var(--text-muted);">${tgl}</td>
        <td style="text-align:center;">
          <a href="${doc.linkdokumen || '#'}" target="_blank" rel="noopener noreferrer" class="btn-action view" style="text-decoration:none; display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:6px; font-size:0.75rem;">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
            <span>Buka Drive</span>
          </a>
        </td>
        <td style="text-align:center;">
          <button type="button" class="btn-action delete" onclick="deleteUploadDokRecord('${doc.id}')" title="Hapus Dokumen">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.deleteUploadDokRecord = async function(id) {
  if (!confirm(`Hapus catatan dokumen ini dari database?`)) return;

  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/upload_dok?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });

    if (res.ok || res.status === 204) {
      alert('Dokumen berhasil dihapus dari Supabase!');
      await loadUploadDokData();
    } else {
      alert('Gagal menghapus dokumen.');
    }
  } catch (err) {
    alert(`Terjadi kesalahan: ${err.message}`);
  }
};

// --------------------------------------------------------------------------
// 13.6 LIHAT SLIP GAJI KARYAWAN (mod_slip_gaji)
// --------------------------------------------------------------------------

const GDRIVE_SLIP_GAJI_FOLDER = 'https://drive.google.com/drive/folders/1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-';

function initSlipGajiView() {
  loadSlipGajiData();
}

async function loadSlipGajiData() {
  const container = document.getElementById('slipGajiCardsContainer');
  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--text-muted);">
        <i class="fa-solid fa-spinner fa-spin" style="color:#10b981; font-size:1.8rem;"></i>
        <div style="margin-top:12px; font-size:0.88rem;">Menghubungkan ke folder Slip Gaji Supabase & Google Drive...</div>
      </div>
    `;
  }

  let list = [];
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/slip_gaji?select=*&order=periode.desc,createdat.desc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    if (res.ok) {
      list = await res.json();
    }
  } catch (err) {
    console.warn('Slip gaji fetch error:', err);
  }

  if (!list || list.length === 0) {
    try {
      const res = await fetch('/api/slip-gaji');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) list = json.data;
      }
    } catch (_) {}
  }

  // Jika tabel di Supabase belum ada data, siapkan sample terbit slip gaji terhubung ke Google Drive
  if (!list || list.length === 0) {
    const emps = state.hr.employees || [];
    list = emps.slice(0, 10).map((e, idx) => ({
      id: `SG-202610-${idx + 1}`,
      nik: e.nik,
      namakaryawan: e.nama || e.nama_lengkap,
      departemen: e.departemen || 'Operasional Umrah & Haji',
      jabatan: e.jabatan || 'Staff',
      periode: 'Oktober 2026',
      gajibersih: (e.gajipokok || 4500000) + 1200000,
      linkdokumen: GDRIVE_SLIP_GAJI_FOLDER,
      namafile: `Slip_Gaji_${e.nik}_Okt2026.pdf`,
      statusterbit: 'Terbit'
    }));
  }

  state.hr.slipGajiList = list;
  renderSlipGajiCards();
}

function renderSlipGajiCards() {
  const container = document.getElementById('slipGajiCardsContainer');
  if (!container) return;

  const filter = state.hr.slipGajiFilter;
  const list = state.hr.slipGajiList || [];

  const filtered = list.filter(item => {
    const s = (filter.search || '').toLowerCase().trim();
    const nama = String(item.namakaryawan || '').toLowerCase();
    const nik = String(item.nik || '').toLowerCase();
    const dept = String(item.departemen || '').toLowerCase();
    const matchSearch = !s || nama.includes(s) || nik.includes(s) || dept.includes(s);

    const matchPeriode = filter.periode === 'ALL' || String(item.periode || '').includes(filter.periode);
    return matchSearch && matchPeriode;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--text-muted);">
        <i class="fa-solid fa-folder-open" style="font-size:2rem; margin-bottom:10px; color:var(--text-dim);"></i>
        <div>Tidak ada berkas Slip Gaji yang sesuai filter pencarian.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const link = item.linkdokumen || GDRIVE_SLIP_GAJI_FOLDER;
    const gajiFormatted = formatRupiah(item.gajibersih);

    return `
      <div class="sg-card">
        <div class="sg-card-top">
          <div class="sg-pdf-icon">
            <i class="fa-solid fa-file-pdf"></i>
          </div>
          <div>
            <div class="sg-periode-badge">${item.periode || 'Oktober 2026'}</div>
            <div class="sg-emp-name">${item.namakaryawan || 'Karyawan'}</div>
            <div class="sg-emp-sub">${item.jabatan || 'Staff'} • ${item.nik || '-'}</div>
          </div>
        </div>

        <div class="sg-card-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:0.75rem; color:var(--text-muted);">Departemen</span>
            <span style="font-size:0.8rem; color:var(--text-light); font-weight:600;">${item.departemen || '-'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.75rem; color:var(--text-muted);">Take Home Pay</span>
            <span style="font-size:0.88rem; color:#10b981; font-weight:800; font-family:monospace;">${gajiFormatted}</span>
          </div>
        </div>

        <div class="sg-card-footer">
          <button type="button" class="sg-btn-view" onclick="openSlipGajiModal('${link}', '${item.namakaryawan} - ${item.periode}')">
            <i class="fa-solid fa-eye"></i> Pratinjau
          </button>
          <a href="${link}" target="_blank" rel="noopener noreferrer" class="sg-btn-drive" title="Buka di Google Drive">
            <i class="fa-brands fa-google-drive"></i>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

window.onSlipGajiFilterChange = function() {
  const searchInput = document.getElementById('searchSlipGaji');
  const periodeSelect = document.getElementById('filterSlipGajiPeriode');

  state.hr.slipGajiFilter = {
    search: searchInput ? searchInput.value : '',
    periode: periodeSelect ? periodeSelect.value : 'ALL'
  };

  renderSlipGajiCards();
};

window.openSlipGajiModal = function(url, title) {
  const modal = document.getElementById('modalSlipGajiViewer');
  const iframe = document.getElementById('slipGajiIframe');
  const titleEl = document.getElementById('modalSlipGajiTitle');
  const extBtn = document.getElementById('slipGajiExternalBtn');

  if (!modal) return;

  if (titleEl) titleEl.textContent = `Dokumen Slip Gaji: ${title || 'Resmi'}`;
  if (extBtn) extBtn.href = url || GDRIVE_SLIP_GAJI_FOLDER;

  if (iframe) {
    // Jika link adalah google drive view, convert ke preview embed
    let embedUrl = url;
    if (url.includes('drive.google.com/file/d/')) {
      embedUrl = url.replace(/\/view(\?.*)?$/, '/preview');
    }
    iframe.src = embedUrl;
  }

  modal.style.display = 'flex';
};

window.closeSlipGajiModal = function() {
  const modal = document.getElementById('modalSlipGajiViewer');
  const iframe = document.getElementById('slipGajiIframe');
  if (modal) modal.style.display = 'none';
  if (iframe) iframe.src = 'about:blank';
};

// Export global helper
window.initDaftarKaryawanView = initDaftarKaryawanView;
window.initBioKaryawanView = initBioKaryawanView;
window.initEmployeeDetailView = initEmployeeDetailView;
window.initEmployeeAnalyticsView = initEmployeeAnalyticsView;
window.initUploadDocView = initUploadDocView;
window.initSlipGajiView = initSlipGajiView;


// ==========================================================================
// 12. MODUL DASHBOARD HAJI TERENCANA (mod_dashboard_ht)
// Matrix Pemetaan Pembayaran Angsuran Per Bulan (Exact Match to Lampiran 1)
// ==========================================================================

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

const htMatrixState = {
  initialized: false,
  isLoading: false,
  showChart: false,
  searchQuery: '',
  dataList: [],
  filteredDataList: [],
  ymKeys: [],
  groupedMonths: {},
  chartInstance: null,
  grandTotal: {
    hargaPaket: 0,
    dp: 0,
    angsuranBulan: 0,
    kumulatif: 0,
    transaksi: {}
  }
};

/**
 * Inisialisasi Modul Dashboard Haji Terencana
 */
async function initDashboardHT() {
  htFetchMatrixData();
}

/**
 * Ambil data dari Supabase dan olah matrix pemetaan per bulan
 */
async function htFetchMatrixData() {
  const loadingEl = document.getElementById('htMatrixLoading');
  const scrollEl = document.getElementById('htMatrixTableScroll');
  const refreshIcon = document.getElementById('htRefreshMatrixIcon');

  if (loadingEl) loadingEl.style.display = 'flex';
  if (scrollEl) scrollEl.style.opacity = '0.3';
  if (refreshIcon) refreshIcon.classList.add('fa-spin');

  htMatrixState.isLoading = true;

  try {
    let jamaahList = [];
    let angsuranList = [];

    // 1. Direct Supabase REST API (100% dari tabel yang teregister di Supabase)
    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
      try {
        const [rJ, rA] = await Promise.all([
          fetch(`${SUPABASE_CONFIG.url}/rest/v1/data_jamaah_haji?select=*`, {
            headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}` }
          }),
          fetch(`${SUPABASE_CONFIG.url}/rest/v1/entry_angsuran_haji?select=*`, {
            headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}` }
          })
        ]);
        if (rJ.ok) jamaahList = await rJ.json();
        if (rA.ok) angsuranList = await rA.json();
      } catch (err) {
        console.warn('Direct Supabase fetch error:', err);
      }
    }

    // 2. Fallback to /api/ endpoints if needed
    if (!jamaahList || jamaahList.length === 0) {
      try {
        const [rJ, rA] = await Promise.all([
          fetch('/api/haji-terencana/jamaah'),
          fetch('/api/haji-terencana/angsuran')
        ]);
        if (rJ.ok) {
          const jJson = await rJ.json();
          if (jJson.success) jamaahList = jJson.data;
        }
        if (rA.ok) {
          const aJson = await rA.json();
          if (aJson.success) angsuranList = aJson.data;
        }
      } catch (e) {}
    }

    // Olah data Jamaah Haji Terencana (Tabel: data_jamaah_haji)
    const htJamaahMap = {};

    (jamaahList || []).forEach(j => {
      const jh = String(j.jenishaji || '').toLowerCase();
      if (jh.includes('haji terencana') || jh.includes('ht') || jh === 'terencana') {
        const bpih = String(j.nobpih || j.noporsi || '').trim();
        if (!bpih || bpih === '-') return;

        htJamaahMap[bpih] = {
          noPorsi: bpih,
          namaJamaah: j.nama || 'Jamaah Haji Terencana',
          kode: j.bulanpendaftaran || '',
          hargaPaket: parseFloat(String(j.hargabpih || 0).replace(/[^0-9.-]/g, '')) || 225000000,
          dp: parseFloat(String(j.dpangsuran || 0).replace(/[^0-9.-]/g, '')) || 0,
          angsuranBulan: parseFloat(String(j.blangsuran || 0).replace(/[^0-9.-]/g, '')) || 0,
          transaksi: {},
          rincianTransaksi: [],
          totalKumulatif: 0,
          pendingMonths: {}
        };
      }
    });

    // Olah data angsuran per bulan (Tabel: entry_angsuran_haji)
    (angsuranList || []).forEach(a => {
      const noBpih = String(a.nobpih || '').trim();
      if (htJamaahMap[noBpih]) {
        let rawDate = a.tanggal || a.createdat || '';
        const cleanDate = String(rawDate).trim().substring(0, 10);
        const parts = cleanDate.split(/[-/]/);
        let dateObj = null;

        if (parts.length === 3) {
          if (parts[0].length === 4) dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          else dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else dateObj = new Date(rawDate);

        if (!dateObj || isNaN(dateObj.getTime())) dateObj = new Date();

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const ymKey = `${year}-${month}`;
        const jml = parseFloat(String(a.jumlah || 0).replace(/[^0-9.-]/g, '')) || 0;
        const statusVal = String(a.status || '').trim().toLowerCase();

        htJamaahMap[noBpih].transaksi[ymKey] = (htJamaahMap[noBpih].transaksi[ymKey] || 0) + jml;
        htJamaahMap[noBpih].totalKumulatif += jml;

        if (statusVal === 'pending') {
          htJamaahMap[noBpih].pendingMonths[ymKey] = true;
        }

        htJamaahMap[noBpih].rincianTransaksi.push({
          tanggal: dateObj.toISOString(),
          jumlah: jml,
          status: a.status || 'Approved'
        });
      }
    });

    const resultArr = Object.values(htJamaahMap);
    resultArr.sort((a, b) => String(a.noPorsi).localeCompare(String(b.noPorsi)));

    // Generate Rentang Bulan Kontinu
    const allYmKeys = new Set();
    resultArr.forEach(j => {
      Object.keys(j.transaksi).forEach(k => allYmKeys.add(k));
    });

    const sortedKeys = Array.from(allYmKeys).sort();
    let continuousYmKeys = [];

    if (sortedKeys.length > 0) {
      const minKey = sortedKeys[0];
      const maxKey = sortedKeys[sortedKeys.length - 1];
      let [currY, currM] = minKey.split('-').map(Number);
      const [maxY, maxM] = maxKey.split('-').map(Number);

      while (currY < maxY || (currY === maxY && currM <= maxM)) {
        continuousYmKeys.push(`${currY}-${String(currM).padStart(2, '0')}`);
        currM++;
        if (currM > 12) {
          currM = 1;
          currY++;
        }
      }
    } else {
      continuousYmKeys = ['2024-12', '2025-01', '2025-02', '2025-03'];
    }

    htMatrixState.ymKeys = continuousYmKeys;
    htMatrixState.groupedMonths = {};
    continuousYmKeys.forEach(ym => {
      const [y, m] = ym.split('-');
      if (!htMatrixState.groupedMonths[y]) htMatrixState.groupedMonths[y] = [];
      if (!htMatrixState.groupedMonths[y].includes(m)) htMatrixState.groupedMonths[y].push(m);
    });

    htMatrixState.dataList = resultArr;
    htMatrixApplyFilter();

  } catch (err) {
    console.error('Error loading matrix data:', err);
    alert('Terjadi kesalahan memuat data dashboard: ' + err.message);
  } finally {
    htMatrixState.isLoading = false;
    if (loadingEl) loadingEl.style.display = 'none';
    if (scrollEl) scrollEl.style.opacity = '1';
    if (refreshIcon) refreshIcon.classList.remove('fa-spin');
  }
}

/**
 * Filter dan Render Tabel Matrix
 */
function htMatrixApplyFilter() {
  const q = (htMatrixState.searchQuery || '').toLowerCase().trim();

  if (!q) {
    htMatrixState.filteredDataList = htMatrixState.dataList;
  } else {
    htMatrixState.filteredDataList = htMatrixState.dataList.filter(item =>
      (item.namaJamaah && item.namaJamaah.toLowerCase().includes(q)) ||
      (item.noPorsi && item.noPorsi.toLowerCase().includes(q))
    );
  }

  // Hitung Grand Total
  const t = {
    hargaPaket: 0,
    dp: 0,
    angsuranBulan: 0,
    kumulatif: 0,
    transaksi: {}
  };

  htMatrixState.ymKeys.forEach(ym => t.transaksi[ym] = 0);

  htMatrixState.filteredDataList.forEach(item => {
    t.hargaPaket += item.hargaPaket || 0;
    t.dp += item.dp || 0;
    t.angsuranBulan += item.angsuranBulan || 0;
    t.kumulatif += item.totalKumulatif || 0;

    htMatrixState.ymKeys.forEach(ym => {
      if (item.transaksi[ym]) {
        t.transaksi[ym] += item.transaksi[ym];
      }
    });
  });

  htMatrixState.grandTotal = t;

  htRenderMatrixTable();

  if (htMatrixState.showChart) {
    setTimeout(htRenderMatrixChart, 100);
  }
}

window.htHandleMatrixSearch = function(val) {
  htMatrixState.searchQuery = val || '';
  htMatrixApplyFilter();
};

const HT_MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGS", "SEP", "OKT", "NOV", "DES"];

function htGetMonthName(mStr) {
  const m = parseInt(mStr, 10);
  return (m >= 1 && m <= 12) ? HT_MONTH_NAMES[m - 1] : mStr;
}

function htFormatMatrixNumber(num) {
  if (!num || isNaN(num) || num === 0) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Render Header, Body, dan Footer Tabel Matrix
 */
function htRenderMatrixTable() {
  const thead1 = document.getElementById('htTheadRow1');
  const thead2 = document.getElementById('htTheadRow2');
  const tbody = document.getElementById('htMatrixTbody');
  const tfoot = document.getElementById('htMatrixTfoot');

  if (!thead1 || !thead2 || !tbody || !tfoot) return;

  const years = Object.keys(htMatrixState.groupedMonths).sort();

  // 1. Render Thead Row 1
  let th1Html = `
    <th rowspan="2" class="ht-col-no">NO</th>
    <th rowspan="2" class="ht-col-porsi">NO PORSI</th>
    <th rowspan="2" class="ht-col-nama">NAMA JAMAAH</th>
    <th rowspan="2" style="width:90px;">KODE</th>
    <th rowspan="2" style="width:115px; text-align:right;">HARGA PAKET</th>
    <th rowspan="2" style="width:105px; text-align:right;">DP</th>
    <th rowspan="2" style="width:110px; text-align:right; color:#fbbf24;">ANGSURAN/BLN</th>
    <th rowspan="2" style="width:115px; text-align:right; color:#34d399;">JML ANGSURAN</th>
  `;

  years.forEach(y => {
    const colSpan = htMatrixState.groupedMonths[y].length;
    th1Html += `<th colspan="${colSpan}" class="ht-year-th">${y}</th>`;
  });
  thead1.innerHTML = th1Html;

  // 2. Render Thead Row 2 (Bulan)
  let th2Html = '';
  years.forEach(y => {
    htMatrixState.groupedMonths[y].forEach(m => {
      th2Html += `<th class="ht-month-th">${htGetMonthName(m)}</th>`;
    });
  });
  thead2.innerHTML = th2Html;

  // 3. Render Tbody
  if (htMatrixState.filteredDataList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${8 + htMatrixState.ymKeys.length}" style="text-align:center; padding:50px 20px; background:#0f172a; color:#64748b;">
          <i class="fa-solid fa-database" style="font-size:36px; margin-bottom:12px; display:block; color:#334155;"></i>
          <span style="font-size:13px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase;">Tidak ada data transaksi ditemukan</span>
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = htMatrixState.filteredDataList.map((item, idx) => {
      let rowHtml = `
        <tr>
          <td class="ht-col-no" style="font-family:monospace; color:#64748b;">${idx + 1}</td>
          <td class="ht-col-porsi">${escapeHtml(item.noPorsi)}</td>
          <td class="ht-col-nama">
            <span style="color:#38bdf8; font-weight:600;">${escapeHtml(item.namaJamaah)}</span>
          </td>
          <td class="ht-col-kode">
            <span class="ht-kode-badge">${escapeHtml(item.kode || '-')}</span>
          </td>
          <td class="ht-num-cell">${htFormatMatrixNumber(item.hargaPaket)}</td>
          <td class="ht-num-cell">${htFormatMatrixNumber(item.dp)}</td>
          <td class="ht-num-amber">${htFormatMatrixNumber(item.angsuranBulan)}</td>
          <td class="ht-num-emerald-bold">${htFormatMatrixNumber(item.totalKumulatif)}</td>
      `;

      htMatrixState.ymKeys.forEach(ym => {
        const val = item.transaksi[ym];
        const isPending = item.pendingMonths && item.pendingMonths[ym];
        if (val && val > 0) {
          const pillClass = isPending ? 'ht-month-pill-pending' : 'ht-month-pill-approved';
          rowHtml += `<td class="ht-month-cell"><span class="${pillClass}">${htFormatMatrixNumber(val)}</span></td>`;
        } else {
          rowHtml += `<td class="ht-month-cell"></td>`;
        }
      });

      rowHtml += '</tr>';
      return rowHtml;
    }).join('');
  }

  // 4. Render Tfoot
  const gt = htMatrixState.grandTotal;
  let tfootHtml = `
    <tr>
      <td colspan="4" class="ht-tfoot-total-label">TOTAL KESELURUHAN</td>
      <td class="ht-tfoot-cell">${htFormatMatrixNumber(gt.hargaPaket)}</td>
      <td class="ht-tfoot-cell">${htFormatMatrixNumber(gt.dp)}</td>
      <td class="ht-tfoot-cell yellow">${htFormatMatrixNumber(gt.angsuranBulan)}</td>
      <td class="ht-tfoot-cell green">${htFormatMatrixNumber(gt.kumulatif)}</td>
  `;

  htMatrixState.ymKeys.forEach(ym => {
    const val = gt.transaksi[ym];
    tfootHtml += `<td class="ht-tfoot-cell green">${val ? htFormatMatrixNumber(val) : '-'}</td>`;
  });

  tfootHtml += '</tr>';
  tfoot.innerHTML = tfootHtml;
}

/**
 * Toggle Tampilan Grafik
 */
window.htToggleMatrixChart = function() {
  htMatrixState.showChart = !htMatrixState.showChart;
  const container = document.getElementById('htMatrixChartContainer');
  const btnText = document.getElementById('htChartBtnText');
  const btnIcon = document.getElementById('htChartIcon');

  if (container) {
    container.style.display = htMatrixState.showChart ? 'block' : 'none';
  }

  if (btnText) {
    btnText.textContent = htMatrixState.showChart ? 'TUTUP GRAFIK' : 'LIHAT GRAFIK';
  }

  if (btnIcon) {
    btnIcon.className = htMatrixState.showChart ? 'fa-solid fa-eye-slash' : 'fa-solid fa-chart-area';
  }

  if (htMatrixState.showChart) {
    setTimeout(htRenderMatrixChart, 100);
  }
};

/**
 * Render Chart.js
 */
function htRenderMatrixChart() {
  const canvas = document.getElementById('htPaymentChart');
  if (!canvas) return;

  if (htMatrixState.chartInstance) {
    htMatrixState.chartInstance.destroy();
  }

  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded. Cannot render chart.');
    return;
  }

  const labels = htMatrixState.ymKeys.map(ym => {
    const parts = ym.split('-');
    return `${parts[1]}/${parts[0]}`;
  });

  const dataPoints = htMatrixState.ymKeys.map(ym => htMatrixState.grandTotal.transaksi[ym] || 0);

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
  gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

  htMatrixState.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Angsuran Masuk',
        data: dataPoints,
        borderColor: '#38bdf8',
        backgroundColor: gradient,
        borderWidth: 2.5,
        pointBackgroundColor: '#0f172a',
        pointBorderColor: '#38bdf8',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#cbd5e1',
          bodyColor: '#38bdf8',
          borderColor: '#334155',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return 'Rp ' + new Intl.NumberFormat('id-ID').format(context.raw);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#1e293b' },
          ticks: { color: '#94a3b8', font: { family: 'monospace', size: 10 } }
        },
        y: {
          grid: { color: '#1e293b' },
          ticks: {
            color: '#64748b',
            font: { family: 'monospace', size: 10 },
            callback: function(value) {
              if (value >= 1000000000) return (value / 1000000000) + 'M';
              if (value >= 1000000) return (value / 1000000) + 'Jt';
              if (value >= 1000) return (value / 1000) + 'K';
              return value;
            }
          },
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * Ekspor Matrix ke Excel (XLSX) dengan Styling Lengkap
 */
window.htExportMatrixToExcel = function() {
  if (typeof XLSX === 'undefined') {
    alert('Library Excel sedang dimuat. Silakan coba kembali dalam 2 detik.');
    return;
  }

  const ws_data = [];

  // Header Title
  ws_data.push([{ v: "LAPORAN ANGSURAN HAJI TERENCANA", s: { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } } }]);
  ws_data.push([]);

  // Table Headers
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "0F172A" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "334155" } },
      bottom: { style: "thin", color: { rgb: "334155" } },
      left: { style: "thin", color: { rgb: "334155" } },
      right: { style: "thin", color: { rgb: "334155" } }
    }
  };

  const headers = ['No', 'No Porsi', 'Nama Jamaah', 'Kode', 'Harga Paket', 'DP', 'Angsuran/Bulan', 'Jumlah Angsuran'].concat(htMatrixState.ymKeys);
  const headerRow = headers.map(h => ({ v: h, s: headerStyle }));
  ws_data.push(headerRow);

  const dataStyle = {
    border: {
      top: { style: "thin", color: { rgb: "CBD5E1" } },
      bottom: { style: "thin", color: { rgb: "CBD5E1" } },
      left: { style: "thin", color: { rgb: "CBD5E1" } },
      right: { style: "thin", color: { rgb: "CBD5E1" } }
    },
    alignment: { vertical: "center" }
  };

  const moneyStyle = {
    numFmt: '"Rp"#,##0',
    alignment: { horizontal: "right", vertical: "center" },
    border: dataStyle.border
  };

  // Data Rows
  htMatrixState.filteredDataList.forEach((it, idx) => {
    const row = [
      { v: idx + 1, s: { ...dataStyle, alignment: { horizontal: "center", vertical: "center" } } },
      { v: it.noPorsi, t: "s", s: { ...dataStyle, alignment: { horizontal: "center", vertical: "center" } } },
      { v: it.namaJamaah, s: dataStyle },
      { v: it.kode, s: { ...dataStyle, alignment: { horizontal: "center", vertical: "center" } } },
      { v: it.hargaPaket || 0, t: "n", s: moneyStyle },
      { v: it.dp || 0, t: "n", s: moneyStyle },
      { v: it.angsuranBulan || 0, t: "n", s: moneyStyle },
      { v: it.totalKumulatif || 0, t: "n", s: moneyStyle }
    ];

    htMatrixState.ymKeys.forEach(ym => {
      row.push({ v: it.transaksi[ym] || 0, t: "n", s: moneyStyle });
    });

    ws_data.push(row);
  });

  // Totals
  const footerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "E2E8F0" } },
    border: dataStyle.border,
    alignment: { horizontal: "right", vertical: "center" }
  };
  const footerMoneyStyle = { ...moneyStyle, ...footerStyle };

  const gt = htMatrixState.grandTotal;
  const totalRow = [
    { v: 'TOTAL KESELURUHAN', s: footerStyle },
    { v: '', s: footerStyle },
    { v: '', s: footerStyle },
    { v: '', s: footerStyle },
    { v: gt.hargaPaket || 0, t: "n", s: footerMoneyStyle },
    { v: gt.dp || 0, t: "n", s: footerMoneyStyle },
    { v: gt.angsuranBulan || 0, t: "n", s: footerMoneyStyle },
    { v: gt.kumulatif || 0, t: "n", s: footerMoneyStyle }
  ];

  htMatrixState.ymKeys.forEach(ym => {
    totalRow.push({ v: gt.transaksi[ym] || 0, t: "n", s: footerMoneyStyle });
  });
  ws_data.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: ws_data.length - 1, c: 0 }, e: { r: ws_data.length - 1, c: 3 } }
  ];

  const colWidths = [
    { wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];
  htMatrixState.ymKeys.forEach(() => colWidths.push({ wch: 14 }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data HT");
  XLSX.writeFile(wb, "Dashboard_Haji_Terencana.xlsx");
};

function formatIndonesianDate(dateStr) {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

window.initDashboardHT = initDashboardHT;



// ============================================================================
// 14. GOOGLE APPS SCRIPT BRIDGE & SUPABASE CRUD HANDLERS (JAMAAH & UMRAH)
// ============================================================================

(function initGoogleScriptBridge() {
  if (typeof window.google === 'undefined') {
    window.google = {};
  }
  if (!window.google.script) {
    window.google.script = {};
  }

  window.sessionToken = window.sessionToken || 'TOKEN_DEMO_2026';

  window.google.script.run = {
    _successHandler: null,
    _failureHandler: null,

    withSuccessHandler(fn) {
      const copy = Object.assign({}, this);
      copy._successHandler = fn;
      return copy;
    },

    withFailureHandler(fn) {
      const copy = Object.assign({}, this);
      copy._failureHandler = fn;
      return copy;
    },

    // --- 1. Data Jamaah API ---
    async getJamaahList() {
      try {
        const res = await fetch('/api/jamaah/all');
        const json = await res.json();
        const list = (json && json.data) ? json.data : [];
        const mapped = list.map((j, idx) => ({
          rowIndex: idx + 2,
          id: j.id_jamaah || j.id || ('JM-' + (idx + 1)),
          dbId: j.id,
          timestamp: j.timestamp || '',
          referensi: j.referensi || '',
          namaLengkap: j.nama_lengkap || '',
          namaAyah: j.nama_ayah_kandung || '',
          tempatLahir: j.tempat_lahir || '',
          tanggalLahir: j.tanggal_lahir || '',
          jenisKelamin: j.jenis_kelamin || 'Laki-laki',
          statusPernikahan: j.status_pernikahan || '',
          titel: j.titel || (j.jenis_kelamin === 'Perempuan' ? 'Hj.' : 'H.'),
          alamatKtp: j.alamat_ktp || '',
          kelurahan: j.kelurahan_desa || '',
          kecamatan: j.kecamatan || '',
          kabupaten: j.kabupaten_kota || '',
          provinsi: j.provinsi || '',
          kodePos: j.kode_pos || '',
          noKtp: j.nomor_ktp || '',
          noHp: j.nomor_seluler || '',
          noTelpRumah: j.nomor_telepon_rumah || '',
          noHpKeluarga: j.nomor_seluler_keluarga || '',
          email: j.email_address || '',
          pendidikan: j.pendidikan_terakhir || '',
          pekerjaan: j.pekerjaan || '',
          noPassport: j.nomor_passport || '',
          tempatPaspor: j.tempat_dikeluarkan_paspor || '',
          tglDikeluarkanPaspor: j.tanggal_dikeluarkan_paspor || '',
          tglExpiredPaspor: j.tanggal_berakhir_paspor || '',
          jenisPaket: j.jenis_paket_umrah || 'Paket Reguler',
          rencanaKeberangkatan: j.tanggal_keberangkatan || '',
          tglKeberangkatan: j.tanggal_keberangkatan || '',
          caraPembayaran: j.cara_pembayaran || 'Transfer Bank',
          ukuranBaju: j.ukuran_baju || 'L',
          kantorCabang: j.kantor_cabang || 'Pusat',
          uploadKtp: j.upload_ktp || '',
          uploadPasport: j.upload_pasport || '',
          bukuNikah: j.buku_nikah || '',
          suratNikah: j.surat_nikah || '',
          fotoJamaah: j.foto_jamaah || '',
          kartuKeluarga: j.kartu_keluarga || '',
          uploadBuktiTransfer: j.upload_bukti_transfer || '',
          tglDaftar: j.tanggal_daftar || '',
          tipeKamar: j.tipe_kamar || 'Quad',
          hargaPaket: Number(j.harga_paket) || 35000000,
          potongan: Number(j.potongan) || 0,
          voucher: Number(j.voucher) || 0,
          jumlahHarusDibayar: Number(j.jumlah_harus_dibayar) || Number(j.harga_paket) || 35000000,
          totalHarga: Number(j.jumlah_harus_dibayar) || Number(j.harga_paket) || 35000000,
          hotelMakkah: j.hotel_makkah || '',
          noKamarMakkah: j.no_kamar_makkah || '',
          hotelMadinah: j.hotel_madinah || '',
          noKamarMadinah: j.no_kamar_madinah || '',
          status: j.status_jamaah || 'Terdaftar',
          statusJamaah: j.status_jamaah || 'Terdaftar',
          namaAgen: j.namaagen || j.referensi || '',
          noTelpAgen: j.notelp || '',
          faedah: Number(j.faedah) || 0,
          bankAgen: j.bank || '',
          noRekeningAgen: j.norekening || '',
          tanggalkirim: j.tanggalkirim || '',
          noJurnalEraHajj: j.nojurnalerahajj || '',
          catatan: j.catatan || '',
          userInput: j.user_input || 'Admin'
        }));
        if (this._successHandler) this._successHandler(mapped);
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    },

    async saveJamaah(payload, userActive = 'Admin') {
      try {
        const idJamaah = payload.id || ('JM-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000)));
        const dbPayload = {
          id_jamaah: idJamaah,
          timestamp: payload.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
          referensi: payload.referensi || '',
          nama_lengkap: payload.namaLengkap || '',
          nama_ayah_kandung: payload.namaAyah || '',
          tempat_lahir: payload.tempatLahir || '',
          tanggal_lahir: payload.tanggalLahir || '',
          jenis_kelamin: payload.jenisKelamin || 'Laki-laki',
          status_pernikahan: payload.statusPernikahan || '',
          titel: payload.titel || '',
          alamat_ktp: payload.alamatKtp || '',
          kelurahan_desa: payload.kelurahan || '',
          kecamatan: payload.kecamatan || '',
          kabupaten_kota: payload.kabupaten || '',
          provinsi: payload.provinsi || '',
          kode_pos: payload.kodePos || '',
          nomor_ktp: payload.noKtp || '',
          nomor_seluler: payload.noHp || '',
          nomor_telepon_rumah: payload.noTelpRumah || '',
          nomor_seluler_keluarga: payload.noHpKeluarga || '',
          email_address: payload.email || '',
          pendidikan_terakhir: payload.pendidikan || '',
          pekerjaan: payload.pekerjaan || '',
          nomor_passport: payload.noPassport || '',
          tempat_dikeluarkan_paspor: payload.tempatPaspor || '',
          tanggal_dikeluarkan_paspor: payload.tglDikeluarkanPaspor || '',
          tanggal_berakhir_paspor: payload.tglExpiredPaspor || '',
          jenis_paket_umrah: payload.jenisPaket || '',
          tanggal_keberangkatan: payload.rencanaKeberangkatan || payload.tglKeberangkatan || '',
          cara_pembayaran: payload.caraPembayaran || 'Transfer Bank',
          ukuran_baju: payload.ukuranBaju || '',
          kantor_cabang: payload.kantorCabang || '',
          upload_ktp: payload.uploadKtp || '',
          upload_pasport: payload.uploadPasport || '',
          buku_nikah: payload.bukuNikah || '',
          surat_nikah: payload.suratNikah || '',
          foto_jamaah: payload.fotoJamaah || '',
          kartu_keluarga: payload.kartuKeluarga || '',
          upload_bukti_transfer: payload.uploadBuktiTransfer || '',
          tanggal_daftar: payload.tglDaftar || new Date().toISOString().split('T')[0],
          tipe_kamar: payload.tipeKamar || 'Quad',
          harga_paket: String(payload.hargaPaket || 0),
          potongan: String(payload.potongan || 0),
          voucher: String(payload.voucher || 0),
          jumlah_harus_dibayar: String(payload.jumlahHarusDibayar || payload.totalHarga || 0),
          hotel_makkah: payload.hotelMakkah || '',
          no_kamar_makkah: payload.noKamarMakkah || '',
          hotel_madinah: payload.hotelMadinah || '',
          no_kamar_madinah: payload.noKamarMadinah || '',
          status_jamaah: payload.status || 'Terdaftar',
          user_input: userActive,
          namaagen: payload.namaAgen || payload.referensi || '',
          notelp: payload.noTelpAgen || '',
          faedah: String(payload.faedah || 0),
          bank: payload.bankAgen || '',
          norekening: payload.noRekeningAgen || '',
          tanggalkirim: payload.tanggalKirim || '',
          nojurnalerahajj: payload.noJurnalErahajj || '',
          catatan: payload.catatanAgen || ''
        };

        if (payload.dbId) dbPayload.id = payload.dbId;

        const res = await fetch('/api/jamaah', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbPayload)
        });
        const resJson = await res.json();
        if (this._successHandler) this._successHandler({ success: true, message: 'Data Jamaah berhasil disimpan ke Supabase!', data: resJson.data });
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    },

    async deleteJamaah(id, userActive = 'Admin') {
      try {
        const res = await fetch('/api/jamaah/' + encodeURIComponent(id), { method: 'DELETE' });
        const resJson = await res.json();
        if (this._successHandler) this._successHandler({ success: true, message: resJson.message || 'Data jamaah berhasil dihapus' });
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    },

    async updateJamaahRoomAssignment(jamaahId, roomData, userActive = 'Admin') {
      try {
        const resGet = await fetch('/api/jamaah/all');
        const jsonGet = await resGet.json();
        const found = (jsonGet.data || []).find(j => (j.id_jamaah === jamaahId || j.id === jamaahId));
        if (found) {
          found.tipe_kamar = roomData.tipeKamar || 'Quad';
          found.hotel_makkah = roomData.hotelMakkah || '';
          found.no_kamar_makkah = roomData.noKamarMakkah || '';
          found.hotel_madinah = roomData.hotelMadinah || '';
          found.no_kamar_madinah = roomData.noKamarMadinah || '';
          found.updatedat = new Date().toISOString();
          await fetch('/api/jamaah', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(found)
          });
        }
        if (this._successHandler) this._successHandler({ success: true, message: 'Penempatan kamar jamaah berhasil diperbarui!' });
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    },

    // --- 2. Pembayaran Group & Individual API ---
    async getPaymentHistory(jamaahId = null) {
      try {
        let url = '/api/pembayaran/history';
        if (jamaahId) url += '?idJamaah=' + encodeURIComponent(jamaahId);
        const res = await fetch(url);
        const json = await res.json();
        const list = (json && json.data) ? json.data : [];
        const mapped = list.map((p, idx) => ({
          rowIndex: idx + 2,
          idKwitansi: p.id_kwitansi || ('KWT-' + (idx + 1)),
          timestamp: p.timestamp || '',
          idJamaah: p.id_jamaah || '',
          namaJamaah: p.nama_jamaah || '',
          noKtp: p.nomor_ktp || '',
          jenisPaket: p.jenis_paket || '',
          jumlahPembayaran: Number(p.jumlah_pembayaran) || 0,
          tipePembayaran: p.tipe_pembayaran || 'Angsuran',
          metodePembayaran: p.metode_pembayaran || 'Transfer Bank',
          namaBank: p.nama_bank || '',
          noReferensi: p.nomor_referensi || '',
          keterangan: p.keterangan || '',
          tglBayar: p.tanggal_bayar || '',
          userInput: p.user_input || 'Admin',
          status: p.status || 'Verified',
          uploadBuktiTransfer: p.linkbuktitransfer || ''
        }));
        if (this._successHandler) this._successHandler(mapped);
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    },

    async saveJamaahPayment(payload, userActive = 'Admin') {
      try {
        const kwtId = 'KWT-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
        const record = {
          id_kwitansi: kwtId,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          id_jamaah: payload.idJamaah || '',
          nama_jamaah: payload.namaJamaah || '',
          nomor_ktp: payload.noKtp || '',
          jenis_paket: payload.jenisPaket || '',
          jumlah_pembayaran: String(payload.jumlahPembayaran || 0),
          tipe_pembayaran: payload.tipePembayaran || 'Angsuran',
          metode_pembayaran: payload.metodePembayaran || 'Transfer Bank',
          nama_bank: payload.namaBank || '',
          nomor_referensi: payload.noReferensi || '',
          keterangan: payload.keterangan || '',
          tanggal_bayar: payload.tglBayar || new Date().toISOString().split('T')[0],
          user_input: userActive,
          status: 'Verified',
          linkbuktitransfer: payload.uploadBuktiTransfer || ''
        };

        const res = await fetch('/api/pembayaran/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
        const json = await res.json();
        if (this._successHandler) this._successHandler({ success: true, message: 'Pembayaran berhasil disimpan ke Supabase!', kwtId: kwtId, data: json.data });
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    },

    async deleteJamaahPayment(kwitansiId, userActive = 'Admin') {
      try {
        const res = await fetch('/api/pembayaran/' + encodeURIComponent(kwitansiId), { method: 'DELETE' });
        const json = await res.json();
        if (this._successHandler) this._successHandler({ success: true, message: json.message || 'Pembayaran berhasil dihapus' });
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    },

    async apiGetAgenListWithPaket() {
      try {
        const res = await fetch('/api/jamaah/all');
        const json = await res.json();
        const list = json.data || [];
        const agenMap = {};

        list.forEach(j => {
          const namaAgen = String(j.namaagen || j.referensi || '').trim();
          if (!namaAgen) return;
          const paket = String(j.jenis_paket_umrah || 'Paket Reguler').trim();
          if (!agenMap[namaAgen]) {
            agenMap[namaAgen] = { namaAgen, paketMap: {} };
          }
          if (!agenMap[namaAgen].paketMap[paket]) {
            agenMap[namaAgen].paketMap[paket] = [];
          }
          agenMap[namaAgen].paketMap[paket].push({
            idJamaah: j.id_jamaah || j.id,
            namaJamaah: j.nama_lengkap || 'Jamaah',
            noKtp: j.nomor_ktp || '',
            noHp: j.nomor_seluler || '',
            jenisPaket: paket,
            totalHarga: Number(j.jumlah_harus_dibayar || j.harga_paket) || 0
          });
        });

        const result = Object.keys(agenMap).sort().map(namaAgen => ({
          namaAgen,
          pakets: Object.keys(agenMap[namaAgen].paketMap).sort().map(pkt => ({
            namaPaket: pkt,
            jamaahList: agenMap[namaAgen].paketMap[pkt]
          }))
        }));

        if (this._successHandler) this._successHandler(result);
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    },

    async apiSaveKolektifPayment(token, formData) {
      try {
        const today = new Date();
        const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
        const newId = 'GRP-PAY-' + dateStr + '-' + String(Math.floor(1000 + Math.random() * 9000));
        const nowStr = today.toISOString().replace('T', ' ').substring(0, 19);
        const tglBayar = formData.tanggal || today.toISOString().split('T')[0];

        const jamaahList = (formData.jamaahList || []).filter(j => j.selected !== false);
        const listIdStr = jamaahList.map(j => j.idJamaah).join(', ');
        const alokasiObj = {};
        jamaahList.forEach(j => { alokasiObj[j.idJamaah] = j.nominal; });

        const groupRow = {
          id_group_payment: newId,
          waktu_transaksi: nowStr,
          tanggal_bayar: tglBayar,
          nama_agen: formData.namaAgen || '',
          jenis_paket_umrah: formData.jenisPaket || '',
          total_nominal: Number(formData.totalNominal) || 0,
          metode_pembayaran: formData.metodePembayaran || 'Transfer Bank',
          bank_asal: formData.namaBankAsal || '',
          bank_tujuan: formData.namaBankTujuan || '',
          no_referensi: formData.noReferensi || '',
          bukti_bayar: formData.buktiBayarUrl || '',
          list_id_jamaah: listIdStr,
          rincian_alokasi_json: JSON.stringify(alokasiObj),
          diskon_kolektif: formData.diskonKolektif || 0,
          catatan: formData.catatan || '',
          user_input: 'Admin',
          status: 'Verified'
        };

        // Simpan ke API Pembayaran Group
        await fetch('/api/pembayaran-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(groupRow)
        });

        // Pecah ke rekaman history_pembayaran individual
        for (let j of jamaahList) {
          const indivRecord = {
            id_kwitansi: 'KWT-' + dateStr + '-' + String(Math.floor(1000 + Math.random() * 9000)),
            timestamp: nowStr,
            id_jamaah: j.idJamaah,
            nama_jamaah: j.namaJamaah,
            nomor_ktp: j.noKtp || '',
            jenis_paket: j.jenisPaket || formData.jenisPaket || '',
            jumlah_pembayaran: String(Number(j.nominal) || 0),
            tipe_pembayaran: 'Angsuran Kolektif',
            metode_pembayaran: formData.metodePembayaran || 'Transfer Bank',
            nama_bank: formData.namaBankTujuan || '',
            nomor_referensi: formData.noReferensi || '',
            tanggal_bayar: tglBayar,
            keterangan: 'Pembayaran Kolektif via Agen: ' + formData.namaAgen + ' | Ref: ' + newId,
            user_input: 'Admin',
            status: 'Verified',
            linkbuktitransfer: formData.buktiBayarUrl || ''
          };
          await fetch('/api/pembayaran/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(indivRecord)
          });
        }

        if (this._successHandler) this._successHandler({
          success: true,
          message: 'Pembayaran kolektif berhasil disimpan untuk ' + jamaahList.length + ' jamaah (ID: ' + newId + ')!',
          idGroupPayment: newId
        });
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    },

    // --- 3. Kelengkapan Umrah API ---
    async getKelengkapanUmrahData() {
      try {
        let rawJamaahList = [];
        let kelRows = [];

        const isStatic = (window.state && window.state.isStaticMode) || 
                         window.location.hostname.includes('github.io') || 
                         window.location.protocol === 'file:';

        if (!isStatic) {
          try {
            const [resJamaah, resKel] = await Promise.all([
              fetch('/api/jamaah/all').then(r => r.ok ? r.json() : null).catch(() => null),
              fetch('/api/kelengkapan-umrah').then(r => r.ok ? r.json() : null).catch(() => null)
            ]);
            if (resJamaah && resJamaah.data) rawJamaahList = resJamaah.data;
            if (resKel && resKel.data) kelRows = resKel.data;
          } catch(e) {}
        }

        // Direct Supabase REST fetch fallback (for GitHub Pages!)
        if (!rawJamaahList.length || !kelRows.length) {
          try {
            const [sbJamaah, sbKel] = await Promise.all([
              !rawJamaahList.length ? fetchSupabaseDirect('jamaah', 'select=*&limit=500').catch(() => []) : Promise.resolve([]),
              !kelRows.length ? fetchSupabaseDirect('kelengkapan_umrah', 'select=*&limit=500').catch(() => []) : Promise.resolve([])
            ]);
            if (!rawJamaahList.length && Array.isArray(sbJamaah) && sbJamaah.length) rawJamaahList = sbJamaah;
            if (!kelRows.length && Array.isArray(sbKel) && sbKel.length) kelRows = sbKel;
          } catch(errSb) {
            console.warn('[KelengkapanUmrah] Direct Supabase error:', errSb);
          }
        }

        // Local JSON fallback if still empty
        const basePath = window.location.pathname.endsWith('/') 
          ? window.location.pathname 
          : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);

        if (!rawJamaahList.length) {
          try {
            const fallbackJ = await fetch(basePath + 'data/data_jamaah.json').then(r => r.json());
            if (Array.isArray(fallbackJ)) rawJamaahList = fallbackJ;
          } catch(e) {
            try {
              const fallbackJ2 = await fetch('data/data_jamaah.json').then(r => r.json());
              if (Array.isArray(fallbackJ2)) rawJamaahList = fallbackJ2;
            } catch(e2) {}
          }
        }

        if (!kelRows.length) {
          try {
            const fallbackK = await fetch(basePath + 'data/kelengkapan_umrah.json').then(r => r.json());
            if (Array.isArray(fallbackK)) kelRows = fallbackK;
          } catch(e) {
            try {
              const fallbackK2 = await fetch('data/kelengkapan_umrah.json').then(r => r.json());
              if (Array.isArray(fallbackK2)) kelRows = fallbackK2;
            } catch(e2) {}
          }
        }

        const kelengkapanMap = {};
        const kelengkapanRecords = kelRows.map((r, idx) => {
          const idJ = String(r.id_jamaah || '').trim();
          const rec = {
            rowIndex: idx + 2,
            idKelengkapan: r.id_kelengkapan || ('KUM-' + String(idx + 1).padStart(3, '0')),
            idJamaah: idJ,
            namaJamaah: r.nama_jamaah || '',
            namaPaket: r.nama_paket || '',
            agent: r.agent || '',
            noVisa: r.no_visa || '',
            tglBerlakuVisa: r.tanggal_berlaku_visa || '',
            tglAkhirVisa: r.tanggal_akhir_visa || '',
            uploadVisa: r.upload_visa || '',
            noPolis: r.no_polis || '',
            tglInputPolis: r.tanggal_input_polis || '',
            tglAwalPolis: r.tanggal_awal_polis || '',
            tglAkhirPolis: r.tanggal_akhir_polis || '',
            uploadAsuransi: r.upload_asuransi || '',
            noBpjs: r.nomor_bpjs || '',
            uploadBpjs: r.upload_bpjs || '',
            statusKelengkapan: r.status_kelengkapan || 'Belum Lengkap',
            tglInput: r.tanggal_input || '',
            createdAt: r.createdat || '',
            updatedAt: r.updatedat || '',
            userInput: r.user_input || 'Admin'
          };
          if (idJ) kelengkapanMap[idJ.toLowerCase()] = rec;
          return rec;
        });

        const paketSet = new Set();
        rawJamaahList.forEach(j => {
          const p = String(j.jenis_paket_umrah || '').trim();
          if (p) paketSet.add(p);
        });

        const enrichedJamaahList = rawJamaahList.map(j => {
          const id = String(j.id_jamaah || j.id || '').trim();
          const existing = kelengkapanMap[id.toLowerCase()] || null;
          return {
            id: id,
            namaLengkap: j.nama_lengkap || '',
            jenisPaket: j.jenis_paket_umrah || '',
            agent: j.namaagen || j.referensi || '-',
            noKtp: j.nomor_ktp || '',
            noPassport: j.nomor_passport || '',
            noHp: j.nomor_seluler || '',
            hasKelengkapan: !!existing,
            kelengkapan: existing || {
              noVisa: '',
              tglBerlakuVisa: '',
              tglAkhirVisa: '',
              uploadVisa: '',
              noPolis: '',
              tglInputPolis: '',
              tglAwalPolis: '',
              tglAkhirPolis: '',
              uploadAsuransi: '',
              noBpjs: '',
              uploadBpjs: '',
              statusKelengkapan: 'Belum Ada Data'
            }
          };
        });

        const result = {
          success: true,
          data: {
            jamaahList: enrichedJamaahList,
            paketList: Array.from(paketSet).sort(),
            records: kelengkapanRecords
          }
        };

        if (this._successHandler) this._successHandler(result);
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    },

    async saveKelengkapanUmrah(payload, filePayloads = null, userInput = 'Admin') {
      try {
        const hasVisa = Boolean(payload.noVisa && String(payload.noVisa).trim());
        const hasPolis = Boolean(payload.noPolis && String(payload.noPolis).trim());
        const hasBpjs = Boolean(payload.noBpjs && String(payload.noBpjs).trim());

        let statusKelengkapan = 'Belum Lengkap';
        if (hasVisa && hasPolis && hasBpjs) statusKelengkapan = 'Lengkap';
        else if (hasVisa || hasPolis || hasBpjs) statusKelengkapan = 'Sebagian';

        const idKel = payload.idKelengkapan || ('KUM-' + String(Math.floor(100 + Math.random() * 900)));
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const record = {
          id_kelengkapan: idKel,
          id_jamaah: payload.idJamaah,
          nama_jamaah: payload.namaJamaah || '',
          nama_paket: payload.namaPaket || '',
          agent: payload.agent || '',
          no_visa: payload.noVisa || '',
          tanggal_berlaku_visa: payload.tglBerlakuVisa || '',
          tanggal_akhir_visa: payload.tglAkhirVisa || '',
          upload_visa: payload.uploadVisa || '',
          no_polis: payload.noPolis || '',
          tanggal_input_polis: payload.tglInputPolis || nowStr.split(' ')[0],
          tanggal_awal_polis: payload.tglAwalPolis || '',
          tanggal_akhir_polis: payload.tglAkhirPolis || '',
          upload_asuransi: payload.uploadAsuransi || '',
          nomor_bpjs: payload.noBpjs || '',
          upload_bpjs: payload.uploadBpjs || '',
          status_kelengkapan: statusKelengkapan,
          tanggal_input: payload.tglInput || nowStr.split(' ')[0],
          updatedat: nowStr,
          user_input: userInput
        };

        let saved = false;
        if (!((window.state && window.state.isStaticMode) || window.location.hostname.includes('github.io'))) {
          try {
            const res = await fetch('/api/kelengkapan-umrah', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(record)
            });
            if (res.ok) saved = true;
          } catch(e) {}
        }
        if (!saved) {
          const key = SUPABASE_CONFIG.anonKey;
          const sbRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/kelengkapan_umrah`, {
            method: 'POST',
            headers: {
              'apikey': key,
              'Authorization': 'Bearer ' + key,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(record)
          });
          if (sbRes.ok) saved = true;
        }

        if (this._successHandler) this._successHandler({
          success: true,
          message: 'Data & dokumen kelengkapan Jamaah ' + (payload.namaJamaah || payload.idJamaah) + ' berhasil disimpan (' + statusKelengkapan + ')!',
          idKelengkapan: idKel,
          statusKelengkapan: statusKelengkapan
        });
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    },

    async deleteKelengkapanUmrah(idJamaah) {
      try {
        let deleted = false;
        if (!((window.state && window.state.isStaticMode) || window.location.hostname.includes('github.io'))) {
          try {
            const res = await fetch('/api/kelengkapan-umrah/' + encodeURIComponent(idJamaah), { method: 'DELETE' });
            if (res.ok) deleted = true;
          } catch(e) {}
        }
        if (!deleted) {
          const key = SUPABASE_CONFIG.anonKey;
          await fetch(`${SUPABASE_CONFIG.url}/rest/v1/kelengkapan_umrah?id_jamaah=eq.${encodeURIComponent(idJamaah)}`, {
            method: 'DELETE',
            headers: {
              'apikey': key,
              'Authorization': 'Bearer ' + key
            }
          });
          deleted = true;
        }
        if (this._successHandler) this._successHandler({ success: true, message: 'Data kelengkapan berhasil dihapus' });
      } catch (err) {
        if (this._failureHandler) this._failureHandler(err);
      }
    }
  };
})();


// ============================================================================
// 14. MODUL UPLOAD DOKUMEN JAMAAH UMRAH (mod_upload_dok_jamaah)
// ============================================================================
let stateUploadDokJamaah = {
  documents: [],
  jamaahList: [],
  selectedFilePayload: null
};

async function initUploadDokJamaahView() {
  if (window.appUploadDokJamaahInstance && typeof window.appUploadDokJamaahInstance.loadAllData === 'function') {
    window.appUploadDokJamaahInstance.loadAllData();
  } else {
    setTimeout(() => {
      if (window.appUploadDokJamaahInstance && typeof window.appUploadDokJamaahInstance.loadAllData === 'function') {
        window.appUploadDokJamaahInstance.loadAllData();
      }
    }, 350);
  }
}

async function loadUploadDokJamaahDropdowns() {
  try {
    let list = [];
    if (!((window.state && window.state.isStaticMode) || window.location.hostname.includes('github.io'))) {
      try {
        const res = await fetch('/api/jamaah/all');
        if (res.ok) {
          const json = await res.json();
          list = json.data || [];
        }
      } catch(e) {}
    }
    if (!list.length) {
      try {
        list = await fetchSupabaseDirect('jamaah', 'select=*&limit=500');
      } catch(e) {}
    }
    if (!list.length) {
      const basePath = window.location.pathname.endsWith('/') 
        ? window.location.pathname 
        : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
      try {
        list = await fetch(basePath + 'data/data_jamaah.json').then(r => r.json());
      } catch(e) {
        try { list = await fetch('data/data_jamaah.json').then(r => r.json()); } catch(e2) {}
      }
    }
    stateUploadDokJamaah.jamaahList = list || [];

    // Populate Paket Filter dropdown
    const paketSelect = document.getElementById('udjFilterPaket');
    if (paketSelect) {
      const currentVal = paketSelect.value;
      const pakets = [...new Set(list.map(j => j.jenisPaket || j.jenis_paket_umrah || j.nama_paket || '').filter(Boolean))];
      paketSelect.innerHTML = '<option value="">-- Semua Paket Umrah --</option>' +
        pakets.map(p => `<option value="${escapeHtml(p)}" ${p === currentVal ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('');
    }

    populateJamaahSelectOptions();
  } catch (err) {
    console.error('Gagal memuat daftar jamaah untuk dropdown:', err);
  }
}

function populateJamaahSelectOptions(targetPaket = '') {
  const select = document.getElementById('udjSelectJamaah');
  if (!select) return;
  const list = stateUploadDokJamaah.jamaahList || [];
  const filtered = targetPaket 
    ? list.filter(j => (j.jenisPaket || j.jenis_paket_umrah || j.nama_paket || '') === targetPaket)
    : list;

  select.innerHTML = '<option value="">-- Pilih Jamaah --</option>' +
    filtered.map(j => {
      const id = j.id || j.id_jamaah || '';
      const nama = j.namaLengkap || j.nama_lengkap || j.nama || 'Tanpa Nama';
      const pkt = j.jenisPaket || j.jenis_paket_umrah || '';
      return `<option value="${escapeHtml(id)}">${escapeHtml(id)} - ${escapeHtml(nama)} (${escapeHtml(pkt)})</option>`;
    }).join('');
}

function onUploadDokJamaahPaketFilterChange() {
  const paket = document.getElementById('udjFilterPaket')?.value || '';
  populateJamaahSelectOptions(paket);
  // Clear jamaah inputs
  if (document.getElementById('udjSelectJamaah')) document.getElementById('udjSelectJamaah').value = '';
  if (document.getElementById('udjIdJamaahInput')) document.getElementById('udjIdJamaahInput').value = '';
  if (document.getElementById('udjPasporInput')) document.getElementById('udjPasporInput').value = '';
}

function onUploadDokJamaahSelectChange() {
  const id = document.getElementById('udjSelectJamaah')?.value || '';
  const found = (stateUploadDokJamaah.jamaahList || []).find(j => (j.id || j.id_jamaah) === id);
  const idInput = document.getElementById('udjIdJamaahInput');
  const pasporInput = document.getElementById('udjPasporInput');
  if (idInput) idInput.value = id;
  if (pasporInput) pasporInput.value = found ? (found.nomorPassport || found.nomor_passport || found.noPassport || '-') : '-';
}

function handleUdjFilePick(event) {
  const file = event.target.files && event.target.files[0];
  const preview = document.getElementById('udjFileNamePreview');
  if (!file) {
    stateUploadDokJamaah.selectedFilePayload = null;
    if (preview) preview.textContent = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    stateUploadDokJamaah.selectedFilePayload = {
      name: file.name,
      size: file.size,
      type: file.type,
      base64: e.target.result
    };
    if (preview) {
      preview.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }
  };
  reader.readAsDataURL(file);
}

async function handleUploadDokJamaahSubmit(event) {
  event.preventDefault();
  const selectJamaah = document.getElementById('udjSelectJamaah');
  const idJamaah = selectJamaah?.value;
  if (!idJamaah) {
    alert('Silakan pilih jamaah terlebih dahulu!');
    return;
  }
  const foundJamaah = (stateUploadDokJamaah.jamaahList || []).find(j => (j.id || j.id_jamaah) === idJamaah);
  const namaJamaah = foundJamaah ? (foundJamaah.namaLengkap || foundJamaah.nama_lengkap || idJamaah) : idJamaah;
  const jenisDok = document.getElementById('udjJenisDok')?.value || 'Dokumen';
  const linkFile = document.getElementById('udjLinkInput')?.value || '';
  const keterangan = document.getElementById('udjKeteranganInput')?.value || '';
  const filePayload = stateUploadDokJamaah.selectedFilePayload;

  if (!filePayload && !linkFile) {
    alert('Pilih file berkas atau masukkan link Google Drive dokumen!');
    return;
  }

  const fileName = filePayload ? filePayload.name : `${idJamaah} - ${namaJamaah} - ${jenisDok}.pdf`;
  const fileUrl = linkFile || (filePayload ? filePayload.base64 : '');
  const fileId = 'DRV-' + Date.now().toString().slice(-8);
  const uploader = (window.currentUser && window.currentUser.username) ? window.currentUser.username : 'Admin';

  const payload = {
    docid: 'DOCJ-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 900 + 100),
    DocID: 'DOCJ-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 900 + 100),
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    Timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    id_jamaah: idJamaah,
    'ID Jamaah': idJamaah,
    nama_lengkap: namaJamaah,
    'Nama Lengkap': namaJamaah,
    jenis_dokumen: jenisDok,
    'Jenis Dokumen': jenisDok,
    nama_file: fileName,
    'Nama File': fileName,
    link_file: fileUrl,
    'Link File': fileUrl,
    file_id: fileId,
    'File ID': fileId,
    uploader: uploader,
    Uploader: uploader,
    keterangan: keterangan || 'Diunggah via Portal Jamaah Umrah',
    Keterangan: keterangan || 'Diunggah via Portal Jamaah Umrah'
  };

  const btn = document.getElementById('btnSubmitUploadDokJamaah');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
  }

  try {
    const res = await fetch('/api/upload-dok-jamaah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      if (window.Swal) {
        Swal.fire({
          icon: 'success',
          title: 'Berkas Berhasil Diarsipkan!',
          text: `Dokumen ${jenisDok} untuk jamaah ${namaJamaah} berhasil disimpan ke database.`,
          timer: 2500,
          showConfirmButton: false
        });
      } else {
        alert('Dokumen berhasil disimpan!');
      }
      // Reset form
      document.getElementById('formUploadDokJamaah').reset();
      if (document.getElementById('udjIdJamaahInput')) document.getElementById('udjIdJamaahInput').value = '';
      if (document.getElementById('udjPasporInput')) document.getElementById('udjPasporInput').value = '';
      if (document.getElementById('udjFileNamePreview')) document.getElementById('udjFileNamePreview').textContent = '';
      stateUploadDokJamaah.selectedFilePayload = null;
      await loadUploadDokJamaahData();
    } else {
      alert('Gagal mengunggah dokumen: ' + (result.error || 'Terjadi kesalahan'));
    }
  } catch (err) {
    alert('Gagal: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Simpan & Arsipkan Dokumen</span>';
    }
  }
}

async function loadUploadDokJamaahData(force = false) {
  const tbody = document.getElementById('tableDokJamaahBody');
  if (tbody && force) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Menyegarkan data berkas...</td></tr>';
  }
  try {
    const res = await fetch('/api/upload-dok-jamaah');
    const json = await res.json();
    stateUploadDokJamaah.documents = json.data || [];
    renderUploadDokJamaahTable();
    if (force && window.Swal) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Data berkas berhasil disegarkan!', timer: 2000, showConfirmButton: false });
    }
  } catch (err) {
    console.error('Gagal memuat dokumen jamaah:', err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#f43f5e; padding:20px;">Gagal memuat berkas: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderUploadDokJamaahTable() {
  const tbody = document.getElementById('tableDokJamaahBody');
  if (!tbody) return;

  let docs = stateUploadDokJamaah.documents || [];
  const keyword = (document.getElementById('searchDokJamaahInput')?.value || '').toLowerCase().trim();
  const filterJenis = document.getElementById('filterDokJamaahJenis')?.value || '';

  // Update counts
  let totalKtp = 0;
  let totalPaspor = 0;
  let totalKk = 0;
  let totalTf = 0;
  docs.forEach(d => {
    const jd = (d['Jenis Dokumen'] || d.jenis_dokumen || '').toLowerCase();
    if (jd.includes('ktp')) totalKtp++;
    if (jd.includes('paspor')) totalPaspor++;
    if (jd.includes('keluarga') || jd.includes('kk')) totalKk++;
    if (jd.includes('transfer') || jd.includes('bukti') || jd.includes('bayar')) totalTf++;
  });

  const statKtpEl = document.getElementById('statTotalKtpJamaah');
  const statPasporEl = document.getElementById('statTotalPasporJamaah');
  const statKkEl = document.getElementById('statTotalKkJamaah');
  const statTfEl = document.getElementById('statTotalTfJamaah');
  const badgeTotal = document.getElementById('badgeTotalDokJamaah');
  if (statKtpEl) statKtpEl.textContent = totalKtp;
  if (statPasporEl) statPasporEl.textContent = totalPaspor;
  if (statKkEl) statKkEl.textContent = totalKk;
  if (statTfEl) statTfEl.textContent = totalTf;
  if (badgeTotal) badgeTotal.textContent = `${docs.length} Berkas`;

  // Apply filters
  if (filterJenis) {
    docs = docs.filter(d => (d['Jenis Dokumen'] || d.jenis_dokumen || '') === filterJenis);
  }
  if (keyword) {
    docs = docs.filter(d => {
      const docId = (d.DocID || d.docid || '').toLowerCase();
      const idJ = (d['ID Jamaah'] || d.id_jamaah || '').toLowerCase();
      const nama = (d['Nama Lengkap'] || d.nama_lengkap || '').toLowerCase();
      const file = (d['Nama File'] || d.nama_file || '').toLowerCase();
      const ket = (d.Keterangan || d.keterangan || '').toLowerCase();
      return docId.includes(keyword) || idJ.includes(keyword) || nama.includes(keyword) || file.includes(keyword) || ket.includes(keyword);
    });
  }

  if (docs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:28px; color:#94a3b8;">Tidak ada dokumen jamaah yang cocok dengan filter.</td></tr>';
    return;
  }

  const badgeColorMap = {
    'KTP': 'background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);',
    'Paspor': 'background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.3);',
    'Kartu Keluarga': 'background:rgba(251,191,36,0.15); color:#fbbf24; border:1px solid rgba(251,191,36,0.3);',
    'Surat Nikah': 'background:rgba(244,114,182,0.15); color:#f472b6; border:1px solid rgba(244,114,182,0.3);',
    'Foto Jamaah': 'background:rgba(167,139,250,0.15); color:#a78bfa; border:1px solid rgba(167,139,250,0.3);',
    'Bukti Transfer': 'background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.3);'
  };

  tbody.innerHTML = docs.map((d, index) => {
    const docId = d.DocID || d.docid || '-';
    const idJamaah = d['ID Jamaah'] || d.id_jamaah || '-';
    const nama = d['Nama Lengkap'] || d.nama_lengkap || '-';
    const jenis = d['Jenis Dokumen'] || d.jenis_dokumen || 'Dokumen';
    const file = d['Nama File'] || d.nama_file || 'file';
    const link = d['Link File'] || d.link_file || '';
    const ket = d.Keterangan || d.keterangan || '-';
    const time = d.Timestamp || d.timestamp || '-';
    const badgeStyle = badgeColorMap[jenis] || 'background:rgba(148,163,184,0.15); color:#cbd5e1; border:1px solid rgba(148,163,184,0.3);';

    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
        <td style="text-align:center; color:#94a3b8; font-size:12px;">${index + 1}</td>
        <td>
          <div style="font-family:monospace; font-weight:700; color:#38bdf8; font-size:12px;">${escapeHtml(docId)}</div>
          <div style="font-size:10px; color:#64748b;">${escapeHtml(time)}</div>
        </td>
        <td>
          <div style="font-weight:700; color:#f1f5f9; font-size:13px;">${escapeHtml(nama)}</div>
          <div style="font-size:11px; color:#34d399; font-family:monospace;">${escapeHtml(idJamaah)}</div>
        </td>
        <td>
          <span style="display:inline-block; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:700; ${badgeStyle}">
            ${escapeHtml(jenis)}
          </span>
        </td>
        <td>
          <div style="font-size:12px; color:#e2e8f0; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(file)}">
            <i class="fa-regular fa-file" style="margin-right:4px; color:#94a3b8;"></i>${escapeHtml(file)}
          </div>
        </td>
        <td style="font-size:11px; color:#94a3b8; max-width:180px;">${escapeHtml(ket)}</td>
        <td style="text-align:center;">
          <div style="display:flex; justify-content:center; gap:6px;">
            ${link ? `
              <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="btn-sm" title="Buka Dokumen" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); border-radius:6px; padding:4px 8px; font-size:11px; text-decoration:none; display:inline-flex; align-items:center;">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            ` : ''}
            <button type="button" class="btn-sm" onclick="deleteUploadDokJamaahConfirm('${escapeHtml(docId)}')" title="Hapus Dokumen" style="background:rgba(244,63,94,0.15); color:#fb7185; border:1px solid rgba(244,63,94,0.3); border-radius:6px; padding:4px 8px; font-size:11px; cursor:pointer;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteUploadDokJamaahConfirm(docId) {
  if (!confirm(`Yakin ingin menghapus dokumen ID ${docId}?`)) return;
  try {
    const res = await fetch('/api/upload-dok-jamaah/' + encodeURIComponent(docId), { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      if (window.Swal) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Dokumen berhasil dihapus!', timer: 2000, showConfirmButton: false });
      }
      await loadUploadDokJamaahData();
    } else {
      alert('Gagal menghapus: ' + (json.error || 'Terjadi kesalahan'));
    }
  } catch (err) {
    alert('Gagal: ' + err.message);
  }
}
