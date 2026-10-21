require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const { getDbConfig, updateDbConfig } = require('./config/database');
const googleSheets = require('./lib/googleSheetsService');
const supabase = require('./lib/supabaseService');
const activityLogger = require('./lib/activityLogger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Client IP Helper
function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1 (Localhost)';
  }
  return ip.replace('::ffff:', '');
}

// --------------------------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------------------------

// 1. AUTH LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { username, password, latitude, longitude, mapsUrl: clientMapsUrl, location: clientLocation } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi!' });
  }

  const clientIp = getClientIp(req);
  const config = getDbConfig();

  // Compute maps URL if coordinates supplied
  let mapsUrl = clientMapsUrl;
  if (!mapsUrl && latitude && longitude) {
    mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
  if (!mapsUrl) {
    mapsUrl = 'https://www.google.com/maps?q=-6.200000,106.816666'; // Default Jakarta Pusat
  }

  const location = clientLocation || 'Jakarta, Indonesia';

  try {
    let users = [];
    if (config.activeSource === 'supabase' && config.supabase.url) {
      const rawUsers = await supabase.getSupabaseUsers();
      users = rawUsers.map(u => ({
        ID: u.id,
        Username: u.username,
        Password: u.password,
        FullName: u.full_name,
        Kanwil: u.kanwil,
        Kantor: u.kantor,
        Role: u.role,
        Status: u.status
      }));
    } else {
      users = await googleSheets.getUsers();
    }

    // Match username (case-insensitive)
    const trimmedInputUser = username.trim().toLowerCase();
    const matchedUser = users.find(u => (u.Username || '').trim().toLowerCase() === trimmedInputUser);

    if (!matchedUser) {
      await activityLogger.recordActivity({
        username,
        ip: clientIp,
        mapsUrl,
        location,
        action: `LOGIN_FAILED (Username "${username}" tidak terdaftar)`,
        module: 'Auth'
      });
      return res.status(401).json({ success: false, message: 'Username atau password tidak cocok.' });
    }

    // Password verification: supports both SHA-256 and Plaintext stored in sheet
    const inputHash = crypto.createHash('sha256').update(password.trim()).digest('hex');
    const storedPassword = (matchedUser.Password || '').trim();

    const isMatch = (inputHash === storedPassword) || (password.trim() === storedPassword);

    if (!isMatch) {
      await activityLogger.recordActivity({
        username: matchedUser.Username,
        ip: clientIp,
        mapsUrl,
        location,
        action: `LOGIN_FAILED (Password salah untuk ${matchedUser.Username})`,
        module: 'Auth'
      });
      return res.status(401).json({ success: false, message: 'Password salah. Silakan coba lagi.' });
    }

    // Check account status
    const status = (matchedUser.Status || '').trim().toLowerCase();
    if (status && status !== 'active') {
      await activityLogger.recordActivity({
        username: matchedUser.Username,
        ip: clientIp,
        mapsUrl,
        location,
        action: `LOGIN_BLOCKED (Akun ${matchedUser.Username} berstatus ${matchedUser.Status})`,
        module: 'Auth'
      });
      return res.status(403).json({ success: false, message: 'Akun Anda berstatus Inactive / Non-aktif. Hubungi Administrator.' });
    }

    // LOGIN SUCCESSFUL!
    const logAction = `LOGIN_SUCCESS (User ${matchedUser.FullName} berhasil login pada ${activityLogger.formatWibTimestamp()})`;
    const logEntry = await activityLogger.recordActivity({
      username: matchedUser.Username,
      ip: clientIp,
      mapsUrl,
      location,
      action: logAction,
      module: 'Auth'
    });

    // Return safe user object
    const safeUser = {
      id: matchedUser.ID || `USR-${Date.now()}`,
      username: matchedUser.Username,
      fullName: matchedUser.FullName || matchedUser.Username,
      kanwil: matchedUser.Kanwil || 'Pusat',
      kantor: matchedUser.Kantor || 'Pusat',
      role: matchedUser.Role || 'Staff',
      status: matchedUser.Status || 'Active'
    };

    return res.json({
      success: true,
      message: 'Login berhasil! Selamat datang di Portal PT. Fath Indah Travel Service.',
      user: safeUser,
      logEntry,
      databaseSource: config.activeSource
    });

  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat otentikasi: ' + error.message });
  }
});

// 2. GET USERS LIST (Safe, without passwords)
app.get('/api/users', async (req, res) => {
  try {
    const config = getDbConfig();
    let users = [];
    if (config.activeSource === 'supabase' && config.supabase.url) {
      users = await supabase.getSupabaseUsers();
    } else {
      users = await googleSheets.getUsers();
    }

    const safeUsers = users.map(u => ({
      ID: u.id || u.ID,
      Username: u.username || u.Username,
      FullName: u.full_name || u.FullName,
      Kanwil: u.kanwil || u.Kanwil,
      Kantor: u.kantor || u.Kantor,
      Role: u.role || u.Role,
      Status: u.status || u.Status,
      CreatedAt: u.created_at || u.CreatedAt,
      NoUrut: u.NoUrut !== undefined ? u.NoUrut : (u.no_urut || null)
    }));

    res.json({ success: true, count: safeUsers.length, users: safeUsers, source: config.activeSource });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2b. GET MODULES LIST (Supabase Tabel Modules / Google Sheets Modules)
app.get('/api/modules', async (req, res) => {
  try {
    const config = getDbConfig();
    let modules = [];
    if (config.activeSource === 'supabase' && config.supabase.url) {
      try {
        const raw = await supabase.getSupabaseModules();
        modules = raw.map(m => ({
          ModuleID: m.moduleid || m.ModuleID || m.id,
          ModuleName: m.modulename || m.ModuleName || m.name,
          Category: m.category || m.Category || 'Umum',
          Status: m.status || m.Status || 'Active',
          Icon: m.icon || m.Icon || 'fa-solid fa-cube',
          AccessRole: m.accessrole || m.AccessRole || '',
          Order: m.order_num || m.Order || '99',
          Description: m.description || m.Description || ''
        }));
      } catch (sbErr) {
        console.warn('[Supabase Modules Fallback]', sbErr.message);
        modules = await googleSheets.getModules();
      }
    } else {
      modules = await googleSheets.getModules();
    }

    // Filter out inactive modules so they are not served/displayed
    if (req.query.include_inactive !== 'true') {
      modules = modules.filter(m => {
        const st = String(m.Status || m.status || 'Active').trim().toLowerCase();
        return st !== 'inactive' && st !== 'non-aktif' && st !== 'nonaktif' && st !== 'off' && st !== 'disabled';
      });
    }

    res.json({
      success: true,
      count: modules.length,
      modules: modules,
      source: config.activeSource
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET ACTIVITY LOGS
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await activityLogger.getAllLogs();
    const config = getDbConfig();
    res.json({
      success: true,
      count: logs.length,
      logs: logs,
      source: config.activeSource
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET JAMAAH DATA (Supabase Tabel jamaah)
app.get('/api/jamaah', async (req, res) => {
  try {
    const config = getDbConfig();
    let jamaah = [];
    if (config.supabase.url) {
      try {
        jamaah = await supabase.getSupabaseJamaah(150);
      } catch (err) {
        console.warn('[Supabase Jamaah Fallback]', err.message);
        jamaah = await googleSheets.getJamaah();
      }
    } else {
      jamaah = await googleSheets.getJamaah();
    }

    res.json({
      success: true,
      count: jamaah.length,
      jamaah: jamaah,
      source: 'supabase'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET ABSENSI (Supabase Tabel absensi)
app.get('/api/absensi', async (req, res) => {
  try {
    const config = getDbConfig();
    let absensi = [];
    if (config.activeSource === 'supabase' && config.supabase.url) {
      try {
        absensi = await supabase.getSupabaseAbsensi(500);
      } catch (err) {
        console.warn('[Supabase Absensi Fallback]', err.message);
        absensi = await googleSheets.getAbsensi();
      }
    } else {
      absensi = await googleSheets.getAbsensi();
    }

    // Pastikan field tanggal selalu diformat yyyy-mm-dd
    const formatted = absensi.map(a => {
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

      return {
        ...a,
        tanggal: tanggalStr,
        Tanggal: tanggalStr
      };
    });

    res.json({ success: true, count: formatted.length, absensi: formatted, source: config.activeSource });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5b. GET REKAPITULASI ABSENSI BULANAN (Supabase Tabel absensi / Google Sheets Fallback)
app.get('/api/rekap-absensi', async (req, res) => {
  try {
    const config = getDbConfig();
    const month = parseInt(req.query.month || '10', 10);
    const year = parseInt(req.query.year || '2026', 10);

    let data = null;
    if (config.activeSource === 'supabase' && config.supabase.url) {
      try {
        data = await supabase.getSupabaseRekapAbsensi(month, year);
      } catch (sbErr) {
        console.warn('[Supabase Rekap Fallback]', sbErr.message);
        data = await googleSheets.getRekapAbsensi(req.query.force === 'true');
      }
    } else {
      data = await googleSheets.getRekapAbsensi(req.query.force === 'true');
    }

    res.json({
      success: true,
      ...data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET CUTI KARYAWAN (Supabase Tabel cuti_karyawan)
app.get('/api/cuti', async (req, res) => {
  try {
    const config = getDbConfig();
    let cuti = [];
    if (config.supabase.url) {
      try {
        cuti = await supabase.getSupabaseCuti(100);
      } catch (err) {
        console.warn('[Supabase Cuti Fallback]', err.message);
        cuti = await googleSheets.getCuti();
      }
    } else {
      cuti = await googleSheets.getCuti();
    }

    res.json({ success: true, count: cuti.length, cuti: cuti, source: 'supabase' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6a. GET BIO KARYAWAN (Supabase Tabel Bio_Karyawan / Google Sheet "Bio Karyawan")
app.get('/api/bio-karyawan', async (req, res) => {
  try {
    const list = await supabase.getSupabaseBioKaryawan();
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6b. BROSUR API (Supabase Tabel LogBrosur & MnuLogBrosur)
app.get('/api/brosur/log', async (req, res) => {
  try {
    const list = await supabase.getSupabaseLogBrosur();
    res.json({ success: true, count: list.length, data: list, source: 'supabase' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/brosur/menu', async (req, res) => {
  try {
    const list = await supabase.getSupabaseMnuLogBrosur();
    res.json({ success: true, count: list.length, data: list, source: 'supabase' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/brosur/kanwil', async (req, res) => {
  try {
    const list = await supabase.getSupabaseKanwil();
    res.json({ success: true, count: list.length, data: list, source: 'supabase' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/brosur/catpaket', async (req, res) => {
  try {
    const list = await supabase.getSupabaseCatPaket();
    res.json({ success: true, count: list.length, data: list, source: 'supabase' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/brosur/log', async (req, res) => {
  try {
    const { id, created_at, wilayah, lokasibrosur, catagory, brosurname, link, catatan, validuntil, tglupload, status } = req.body;
    if (!catagory || !brosurname) {
      return res.status(400).json({ success: false, message: 'catagory dan brosurname wajib diisi' });
    }
    const inserted = await supabase.insertSupabaseLogBrosur({
      id,
      created_at,
      wilayah: wilayah || lokasibrosur || '',
      lokasibrosur: lokasibrosur || wilayah || '',
      catagory,
      brosurname,
      link,
      validuntil,
      tglupload,
      status,
      catatan
    });
    res.json({ success: true, message: 'Brosur berhasil disimpan ke LogBrosur Supabase', data: inserted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/brosur/log/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status wajib diisi' });
    }
    const updated = await supabase.updateSupabaseLogBrosurStatus(id, status);
    res.json({ success: true, message: 'Status brosur berhasil diperbarui', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/brosur/log/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.deleteSupabaseLogBrosur(id);
    res.json({ success: true, message: 'Brosur berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// 7. GET DATABASE SETTINGS
app.get('/api/settings/db', (req, res) => {
  const config = getDbConfig();
  // Mask sensitive keys for response
  const maskedConfig = {
    ...config,
    supabase: {
      ...config.supabase,
      anonKey: config.supabase.anonKey ? `${config.supabase.anonKey.substring(0, 12)}...` : '',
      serviceKey: config.supabase.serviceKey ? `${config.supabase.serviceKey.substring(0, 12)}...` : ''
    }
  };
  res.json({ success: true, config: maskedConfig });
});

// 8. UPDATE DATABASE SETTINGS (Switch between Google Sheets and Supabase)
app.post('/api/settings/db', (req, res) => {
  try {
    const { activeSource, supabase: supabaseUpdates } = req.body;
    const current = getDbConfig();

    const updates = {};
    if (activeSource && ['googlesheets', 'supabase'].includes(activeSource)) {
      updates.activeSource = activeSource;
    }
    if (supabaseUpdates) {
      updates.supabase = {
        url: supabaseUpdates.url !== undefined ? supabaseUpdates.url : current.supabase.url,
        anonKey: (supabaseUpdates.anonKey && !supabaseUpdates.anonKey.includes('...')) ? supabaseUpdates.anonKey : current.supabase.anonKey,
        serviceKey: (supabaseUpdates.serviceKey && !supabaseUpdates.serviceKey.includes('...')) ? supabaseUpdates.serviceKey : current.supabase.serviceKey,
        usersTable: supabaseUpdates.usersTable || 'users',
        logsTable: supabaseUpdates.logsTable || 'activity_logs'
      };
    }

    const updated = updateDbConfig(updates);
    res.json({
      success: true,
      message: `Database berhasil dialihkan ke mode: ${updated.activeSource.toUpperCase()}`,
      activeSource: updated.activeSource
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. TEST SUPABASE CONNECTION
app.post('/api/settings/test-supabase', async (req, res) => {
  try {
    const { url, anonKey } = req.body;
    const configToTest = (url && anonKey) ? { url, anonKey } : null;
    const result = await supabase.testSupabaseConnection(configToTest);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 10. DOWNLOAD SUPABASE SCHEMA SQL
app.get('/api/download-sql', (req, res) => {
  const filePath = path.join(__dirname, 'supabase_schema.sql');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'fath_indah_supabase_schema.sql');
  } else {
    res.status(404).send('File SQL belum tersedia.');
  }
});

// 11. BROSUR API ENDPOINTS
app.get('/api/brosur/log', async (req, res) => {
  try {
    const list = await supabase.getSupabaseLogBrosur();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/brosur/log', async (req, res) => {
  try {
    const saved = await supabase.insertSupabaseLogBrosur(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/brosur/update-status', async (req, res) => {
  try {
    const { id, status } = req.body;
    const updated = await supabase.updateSupabaseLogBrosurStatus(id, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/brosur/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const deleted = await supabase.deleteSupabaseLogBrosur(id);
    res.json({ success: true, data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`PT. FATH INDAH TRAVEL SERVICE - WEB PORTAL`);
  console.log(`Server aktif pada: http://localhost:${PORT}`);
  console.log(`Mode Database: ${getDbConfig().activeSource.toUpperCase()}`);
  console.log(`====================================================`);
});
