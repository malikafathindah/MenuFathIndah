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
        (m.ModuleID === 'mod_data_jamaah' && state.activeModule === 'jamaah') ||
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
  else if (moduleName === 'mod_logs') viewId = 'logs';
  else if (moduleName === 'mod_users' || moduleName === 'mod_sistem_user') viewId = 'users';
  else if (moduleName === 'mod_attendance' || moduleName === 'rekap_absensi' || moduleName === 'mod_rekap_absensi') viewId = 'rekap_absensi';
  else if (moduleName === 'mod_data_attendance' || moduleName === 'log_absensi' || moduleName === 'riwayat_log_absensi') viewId = 'log_absensi';
  else if (moduleName === 'mod_cuti_karyawan' || moduleName === 'mod_presensi') viewId = 'cuti_absensi';
  else if (moduleName === 'mod_input_brosur' || moduleName === 'launching_brosur' || moduleName === 'mod_view_brochure') viewId = 'launching_brosur';
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
    cuti_absensi: { title: 'Presensi & Cuti Karyawan', breadcrumb: 'SDM / Absensi & Pengajuan Cuti' },
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
  { id: 1, namakanwill: 'Pusat' },
  { id: 2, namakanwill: 'Solo Raya' },
  { id: 3, namakanwill: 'Samarinda' },
  { id: 4, namakanwill: 'Surabaya' },
  { id: 5, namakanwill: 'Pemalang' },
  { id: 6, namakanwill: 'Pekalongan' }
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
    renderBrosurTable();
  }
};

async function loadBrosurData(force = false) {
  // 0. Load KanwilFathIndah (Master Wilayah Brosur dari tabel KanwilFathIndah header namakanwill)
  let kanwilData = [];
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/KanwilFathIndah?select=*&order=namakanwill.asc`, {
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
  // 1. Wilayah Brosur: ONLY from KanwilFathIndah header namakanwill (Requirement #4)
  const kanwilList = (state.data.kanwilFathIndah && state.data.kanwilFathIndah.length > 0)
    ? state.data.kanwilFathIndah
    : DEFAULT_KANWIL_FATH_INDAH;
  const wilNames = [...new Set(kanwilList.map(k => (k.namakanwill || k.namakanwil || '').trim()).filter(Boolean))].sort();

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
    } else {
      groupCustom.style.display = 'none';
      const customInput = document.getElementById('inputBrosurCustomHari');
      if (customInput) customInput.value = '';
    }
  }
  updateBrosurCompositeName();
};

window.updateBrosurCompositeName = function() {
  const wilayah = (document.getElementById('inputBrosurWilayah')?.value || '').trim();
  const paket = (document.getElementById('inputBrosurNamaPaket')?.value || '').trim();
  const hariSelect = document.getElementById('inputBrosurJumlahHari')?.value || '';
  let hari = hariSelect;
  if (hariSelect === 'custom') {
    hari = (document.getElementById('inputBrosurCustomHari')?.value || '').trim();
  }
  const tglBerangkat = document.getElementById('inputBrosurTglBerangkat')?.value || '';

  const displayBox = document.getElementById('generatedSpecificFileName');

  if (!wilayah && !paket && !hari && !tglBerangkat) {
    if (displayBox) {
      displayBox.textContent = '[Wilayah] [Nama Paket] [Jumlah Hari] [Tanggal Berangkat]';
      displayBox.style.color = 'var(--text-muted)';
    }
    state.generatedSpecificFileName = '';
    return;
  }

  const partWilayah = wilayah ? `[${wilayah}]` : '[Wilayah]';
  const partPaket = paket ? `[${paket}]` : '[Nama Paket]';
  const partHari = hari ? `[${hari}D]` : '[Jumlah Hari]';

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

  // Requirement #2: [Wilayah] [Nama Paket] [Jumlah Hari +"D"] [dd mmm yyyy]
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
  // Format: [Wilayah] [Nama Paket] [Jumlah Hari +"D"] [dd mmm yyyy]
  const paket = (document.getElementById('inputBrosurNamaPaket')?.value || '').trim();
  const hariSelect = document.getElementById('inputBrosurJumlahHari')?.value || '';
  let hari = hariSelect;
  if (hariSelect === 'custom') {
    hari = (document.getElementById('inputBrosurCustomHari')?.value || '').trim();
  }
  const tglBerangkat = document.getElementById('inputBrosurTglBerangkat')?.value || '';

  let generatedNamaPaket = '';
  if (wilayah || paket || hari || tglBerangkat) {
    const partWilayah = wilayah ? `[${wilayah}]` : '';
    const partPaket = paket ? `[${paket}]` : '';
    const partHari = hari ? `[${hari}D]` : '';
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

function renderBrosurTable() {
  const tbody = document.getElementById('logBrosurTableBody');
  if (!tbody) return;

  const list = state.data.logBrosur || [];
  const search = (state.brosurFilter.search || '').toLowerCase();
  const category = state.brosurFilter.category || 'ALL';
  const wilayahFilter = state.brosurFilter.wilayah || 'ALL';
  const statusFilter = state.brosurFilter.status || 'Aktif';
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter
  const filtered = list.filter(item => {
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

  // Update Stats
  const elTotal = document.getElementById('brosurStatTotal');
  const elCat = document.getElementById('brosurStatCategory');
  const elActive = document.getElementById('brosurStatActive');
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

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:36px; color:#64748b;">
          <i class="fa-regular fa-folder-open" style="font-size:2rem; color:var(--gold-light); margin-bottom:10px;"></i>
          <div>Tidak ada brosur yang sesuai filter. Klik <strong>Input Brosur Baru</strong> untuk mendaftarkan brosur.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((item, idx) => {
    const no = idx + 1;
    const wil = item.lokasibrosur || item.wilayah || 'Pusat';
    const cat = item.catagory || item.category || 'Umum';
    const name = item.brosurname || item.name || '-';
    const notes = item.catatan || '-';
    const link = item.link || GDRIVE_BROSUR_FOLDER_URL;
    const idBadge = item.id ? (typeof item.id === 'number' ? `ID: #${item.id}` : item.id) : '';

    // Requirement #4: Tanggal Upload & Valid Until dibuat format dd mmm yy (Lampiran 3)
    let rawTglUpload = item.tglupload || '';
    if (!rawTglUpload && item.created_at) {
      rawTglUpload = String(item.created_at).slice(0, 10);
    }
    const tglUploadDisplay = formatDateDdMmmYy(rawTglUpload);
    const validUntilDisplay = formatDateDdMmmYy(item.validuntil);

    // Status Brosur (Aktif / Expired)
    let rawStatus = (item.status || 'Aktif').trim();
    const isPastDate = item.validuntil && item.validuntil < todayStr;
    const isExpired = rawStatus.toLowerCase() === 'expired' || isPastDate;
    const statusLabel = isExpired ? 'Expired' : 'Aktif';
    const statusPillClass = isExpired ? 'expired' : 'aktif';
    const statusIcon = isExpired ? 'fa-clock-rotate-left' : 'fa-circle-check';

    // Category Badge Class
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
