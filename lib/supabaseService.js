const fs = require('fs');
const path = require('path');
const { getDbConfig } = require('../config/database');

async function testSupabaseConnection(overrideConfig = null) {
  const config = overrideConfig || getDbConfig().supabase;
  if (!config.url || !config.anonKey) {
    return { ok: false, error: 'URL atau Anon Key Supabase belum diisi' };
  }

  const cleanUrl = config.url.replace(/\/+$/, '');
  const testUrl = `${cleanUrl}/rest/v1/`;

  try {
    const res = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`
      }
    });

    if (res.ok || res.status === 200 || res.status === 404 || res.status === 401) {
      // If we got a valid response from the Supabase REST endpoint
      if (res.status === 401) {
        return { ok: false, error: 'Anon Key tidak valid atau otorisasi gagal' };
      }
      return { ok: true, message: 'Koneksi ke Supabase REST API berhasil!' };
    }
    return { ok: false, error: `Supabase merespon status ${res.status}: ${res.statusText}` };
  } catch (err) {
    return { ok: false, error: `Koneksi gagal: ${err.message}` };
  }
}

async function getSupabaseUsers() {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/${config.usersTable || 'users'}?select=*`;

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil users dari Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

async function getSupabaseModules() {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/${config.modulesTable || 'modules'}?select=*&order=order_num.asc`;

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil modules dari Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

async function getSupabaseLogs() {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/${config.logsTable || 'activity_logs'}?select=*&order=timestamp.desc&limit=200`;

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil activity logs dari Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

async function insertSupabaseLog(logEntry) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) return false;

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/${config.logsTable || 'activity_logs'}`;

  try {
    const payload = {
      log_id: logEntry.LogID,
      timestamp: logEntry.Timestamp,
      username: logEntry.Username,
      ip_address: logEntry.IP_Address,
      maps_url: logEntry.Maps_URL,
      location: logEntry.Location,
      action: logEntry.Action,
      module: logEntry.Module
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    console.error('Error inserting log to Supabase:', e.message);
    return false;
  }
}

async function getSupabaseJamaah(limit = 100) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/jamaah?select=*&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil data jamaah dari Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

async function getSupabaseAbsensi(limit = 500) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/absensi?select=*&order=timestamp.desc&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil data absensi dari Supabase: HTTP ${res.status}`);
  }
  const records = await res.json();
  return records.map(r => ({
    ...r,
    tanggal: r.tanggal ? String(r.tanggal).slice(0, 10) : (r.timestamp ? String(r.timestamp).slice(0, 10) : ''),
    Tanggal: r.tanggal ? String(r.tanggal).slice(0, 10) : (r.timestamp ? String(r.timestamp).slice(0, 10) : '')
  }));
}

async function getSupabaseCuti(limit = 60) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/cuti_karyawan?select=*&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil data cuti dari Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

async function getSupabaseRekapAbsensi(month = 10, year = 2026) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const m = parseInt(month || '10', 10);
  const y = parseInt(year || '2026', 10);

  // 1. Ambil daftar Nama Karyawan dari Tabel users dengan Header full_name
  // Dimana NoUrut bernilai lebih dari 1 atau not NULL dan diurutkan NoUrut secara ascending
  const usersUrl = `${cleanUrl}/rest/v1/${config.usersTable || 'users'}?select=id,username,nama,full_name,kanwil,kantor,status,NoUrut&NoUrut=not.is.null&order=NoUrut.asc`;

  let users = [];
  try {
    const userRes = await fetch(usersUrl, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`
      }
    });
    if (userRes.ok) {
      users = await userRes.json();
    } else {
      // Fallback load all users
      users = await getSupabaseUsers();
    }
  } catch (uErr) {
    console.warn('[Supabase Rekap] Gagal mengambil users dengan filter NoUrut:', uErr.message);
    try {
      users = await getSupabaseUsers();
    } catch (fallbackErr) {
      console.error('[Supabase Rekap] Fallback getSupabaseUsers gagal:', fallbackErr.message);
    }
  }

  // Filter: NoUrut bernilai > 1 atau not NULL (angka valid >= 1 dan bukan null)
  const validUsers = (users || []).filter(u => {
    if (u.NoUrut === null || u.NoUrut === undefined || u.NoUrut === '') return false;
    const num = Number(u.NoUrut);
    return !isNaN(num) && (num >= 1 || u.NoUrut !== null);
  });

  // Urutkan header NoUrut secara ascending
  validUsers.sort((a, b) => Number(a.NoUrut) - Number(b.NoUrut));

  // Deduplikasi berdasarkan full_name agar setiap karyawan hanya muncul 1 baris
  const employees = [];
  const seenNames = new Set();
  const empIndexMap = {};

  validUsers.forEach(u => {
    const fullName = (u.full_name || u.nama || u.username || '').trim().toUpperCase();
    if (!fullName || seenNames.has(fullName)) return;
    seenNames.add(fullName);

    const empObj = {
      no: String(u.NoUrut),
      name: fullName,
      location: (u.kantor || u.kanwil || 'PUSAT').toUpperCase(),
      days: {}
    };
    empIndexMap[fullName] = empObj;
    employees.push(empObj);
  });

  // 2. Ambil data presensi dari Tabel absensi sesuai bulan & tahun
  const absensiUrl = `${cleanUrl}/rest/v1/absensi?select=*&bulan=eq.${m}&tahun=eq.${y}&limit=5000`;
  const absensiRes = await fetch(absensiUrl, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!absensiRes.ok) {
    throw new Error(`Gagal mengambil data absensi dari Supabase: HTTP ${absensiRes.status}`);
  }
  const records = await absensiRes.json();

  // 3. Petakan kode kehadiran dari Tabel Absensi ke karyawan yang terdaftar
  records.forEach(r => {
    const empName = (r.nama_karyawan || r.nama_user || '').trim().toUpperCase();
    if (!empName || !empIndexMap[empName]) return;

    const day = parseInt((r.tanggal || '').slice(8, 10), 10);
    if (day && r.kode) {
      empIndexMap[empName].days[day] = r.kode.toUpperCase();
    }
  });

  return {
    month: m,
    year: y,
    count: employees.length,
    employees,
    source: 'supabase'
  };
}

async function getSupabaseLogBrosur() {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/LogBrosur?select=*&order=created_at.desc`;

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil LogBrosur: HTTP ${res.status}`);
  }
  const data = await res.json();
  return (data || []).map(item => ({
    ...item,
    wilayah: item.wilayah || item.lokasibrosur || 'Pusat'
  }));
}

const DEFAULT_MNU_LOG_BROSUR = [
  { id: '1', catagory: 'Umrah', brosurname: 'Paket Umrah Reguler 9 Hari', status: 'Active', catatan: 'Brosur paket standar bintang 4' },
  { id: '2', catagory: 'Umrah', brosurname: 'Paket Umrah Ramadhan Awal', status: 'Active', catatan: 'Brosur paket awal Ramadhan' },
  { id: '3', catagory: 'Umrah', brosurname: 'Paket Umrah Ramadhan Lailatul Qadar', status: 'Active', catatan: 'Brosur paket 10 hari akhir Ramadhan' },
  { id: '4', catagory: 'Umrah', brosurname: 'Paket Umrah Plus Turki 12 Hari', status: 'Active', catatan: 'Wisata sejarah Istanbul & Bursa' },
  { id: '5', catagory: 'Umrah', brosurname: 'Paket Umrah Plus Dubai', status: 'Active', catatan: 'Wisata Dubai & Abu Dhabi' },
  { id: '6', catagory: 'Umrah', brosurname: 'Paket Umrah VIP Bintang 5', status: 'Active', catatan: 'Hotel depan pelataran Masjidil Haram' },
  { id: '7', catagory: 'Haji Khusus & Furoda', brosurname: 'Brosur Haji Khusus Kuota Kemenag', status: 'Active', catatan: 'Masa tunggu resmi kemenag' },
  { id: '8', catagory: 'Haji Khusus & Furoda', brosurname: 'Brosur Haji Furoda / Mujamalah VVIP', status: 'Active', catatan: 'Berangkat langsung tanpa antri' },
  { id: '9', catagory: 'Haji Khusus & Furoda', brosurname: 'Brosur Rincian Fasilitas Maktab Haji', status: 'Active', catatan: 'Maktab VIP tenda AC berkarpet' },
  { id: '10', catagory: 'Haji Terencana', brosurname: 'Brosur Program Tabungan Haji Terencana', status: 'Active', catatan: 'Skema porsi awal terencana' },
  { id: '11', catagory: 'Haji Terencana', brosurname: 'Brosur Skema Angsuran Terencana', status: 'Active', catatan: 'Tabel angsuran berkala' },
  { id: '12', catagory: 'Wisata Halal', brosurname: 'Brosur Tour Muslim Turki Cappadochia', status: 'Active', catatan: 'Paket liburan musim dingin & semi' },
  { id: '13', catagory: 'Wisata Halal', brosurname: 'Brosur Wisata Halal Aqsho - Jordan - Mesir', status: 'Active', catatan: 'Napak tilas tiga masjid suci' },
  { id: '14', catagory: 'Wisata Halal', brosurname: 'Brosur Tour Muslim Eropa Barat', status: 'Active', catatan: 'Paris, Swiss, Italia & Belanda' },
  { id: '15', catagory: 'Promo & Seasonal', brosurname: 'Flyer Promo Early Bird 1448H', status: 'Active', catatan: 'Diskon khusus pendaftar awal' },
  { id: '16', catagory: 'Promo & Seasonal', brosurname: 'Katalog Brosur Milad PT Fath Indah', status: 'Active', catatan: 'Edisi spesial milad travel' }
];

async function getSupabaseMnuLogBrosur() {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/MnuLogBrosur?select=*&order=catagory.asc,brosurname.asc`;

  try {
    const res = await fetch(url, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Gagal fetch MnuLogBrosur dari Supabase:', err.message);
  }

  return DEFAULT_MNU_LOG_BROSUR;
}

const DEFAULT_KANWIL_FATH_INDAH = [
  { id: 1, namakanwil: 'Pusat', namakanwill: 'Pusat' },
  { id: 2, namakanwil: 'Jabodetabek', namakanwill: 'Jabodetabek' },
  { id: 3, namakanwil: 'Solo Raya', namakanwill: 'Solo Raya' },
  { id: 4, namakanwil: 'Samarinda', namakanwill: 'Samarinda' },
  { id: 5, namakanwil: 'Surabaya', namakanwill: 'Surabaya' },
  { id: 6, namakanwil: 'Pemalang', namakanwill: 'Pemalang' },
  { id: 7, namakanwil: 'Pekalongan', namakanwill: 'Pekalongan' }
];

async function getSupabaseKanwil() {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/KanwilFathIndah?select=*`;

  try {
    const res = await fetch(url, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Gagal fetch KanwilFathIndah dari Supabase:', err.message);
  }

  return DEFAULT_KANWIL_FATH_INDAH;
}

const DEFAULT_CAT_PAKET = [
  { id: 1, catagory: 'Umrah' },
  { id: 2, catagory: 'Haji Khusus & Furoda' },
  { id: 3, catagory: 'Haji Terencana' },
  { id: 4, catagory: 'Wisata Halal' },
  { id: 5, catagory: 'Promo & Seasonal' }
];

async function getSupabaseCatPaket() {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/CatPaket?select=*&order=catagory.asc`;

  try {
    const res = await fetch(url, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Gagal fetch CatPaket dari Supabase:', err.message);
  }

  return DEFAULT_CAT_PAKET;
}

async function insertSupabaseLogBrosur(entry) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/LogBrosur`;

  const payload = {
    catagory: entry.catagory,
    brosurname: entry.brosurname,
    namapaket: entry.namapaket || null,
    lokasibrosur: entry.lokasibrosur || entry.wilayah || 'Pusat',
    link: entry.link || 'https://drive.google.com/drive/folders/1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc',
    validuntil: entry.validuntil || null,
    tglupload: entry.tglupload || new Date().toISOString().slice(0, 10),
    status: entry.status || 'Aktif',
    catatan: entry.catatan || ''
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menyimpan LogBrosur: HTTP ${res.status} - ${errText}`);
  }
  const result = await res.json();
  const savedItem = Array.isArray(result) ? result[0] : result;
  return {
    ...savedItem,
    wilayah: savedItem.lokasibrosur || savedItem.wilayah || payload.lokasibrosur
  };
}

async function updateSupabaseLogBrosurStatus(id, newStatus) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/LogBrosur?id=eq.${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ status: newStatus })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal update status LogBrosur: HTTP ${res.status} - ${errText}`);
  }

  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

async function deleteSupabaseLogBrosur(id) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/LogBrosur?id=eq.${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menghapus LogBrosur: HTTP ${res.status} - ${errText}`);
  }

  return true;
}

async function getSupabaseBioKaryawan() {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  
  // 1. Coba dari tabel Bio_Karyawan di Supabase (mendukung tabel Bio_Karyawan, Bio Karyawan, maupun bio_karyawan)
  const candidateTables = ['Bio_Karyawan', 'Bio%20Karyawan', 'bio_karyawan'];
  for (const tbl of candidateTables) {
    try {
      const url = `${cleanUrl}/rest/v1/${tbl}?select=*&order=nik.asc`;
      const res = await fetch(url, {
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn(`[Supabase ${tbl} fetch warning]:`, e.message);
    }
  }

  // 2. Fallback live dari Google Sheet "Bio Karyawan"
  try {
    const sheetId = '1VL8trcMIcZ6n5Be-2-9YwmC1pOsKliO_wbILmU_cC1s';
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Bio Karyawan')}`;
    const gres = await fetch(sheetUrl);
    if (gres.ok) {
      const text = await gres.text();
      const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const data = JSON.parse(jsonStr);
      const cols = data.table.cols.map(c => (c ? c.label : ''));
      const rows = data.table.rows.map((r, idx) => {
        const obj = {};
        cols.forEach((colName, cidx) => {
          const cell = r.c ? r.c[cidx] : null;
          obj[colName] = cell && cell.v !== undefined ? cell.v : '';
        });
        return {
          nik: String(obj['NIK'] || `EMP-${String(idx + 1).padStart(3, '0')}`).trim(),
          nama_karyawan: String(obj['Nama Karyawan'] || '').trim(),
          jenis_kelamin: String(obj['Jenis Kelamin'] || '').trim(),
          jabatan: String(obj['Jabatan'] || obj['Divisi'] || 'Staff').trim(),
          divisi: String(obj['Divisi'] || '').trim(),
          kantor: String(obj['Kantor'] || 'Pusat').trim(),
          nomor_hp: String(obj['Nomor Telephone/HP'] || '').trim(),
          email: String(obj['Email'] || '').trim(),
          status: String(obj['Status'] || 'Aktif').trim(),
          status_emp: String(obj['STATUSEMP'] || '').trim(),
          alamat: String(obj['Alamat Rumah Lengkap'] || '').trim(),
          tempat_lahir: String(obj['Tempat Lahir'] || '').trim(),
          pendidikan_terakhir: String(obj['Pendidikan Terakhir'] || '').trim(),
          no_ktp: String(obj['Nomor Kartu Tanda Penduduk (KTP)'] || '').trim(),
          npwp: String(obj['NPWP'] || '').trim(),
          nama_bank: String(obj['Nama Bank'] || '').trim(),
          no_rekening: String(obj['No Rekening'] || '').trim()
        };
      }).filter(k => k.nama_karyawan);
      return rows;
    }
  } catch (err) {
    console.warn('[Bio Karyawan Google Sheet fallback warning]:', err.message);
  }

  return [];
}

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

async function insertOrUpdateBioKaryawan(data) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanData = {};
  for (const [k, v] of Object.entries(data)) {
    if (VALID_BIO_COLS.has(k)) {
      cleanData[k] = v;
    }
  }

  const cleanUrl = config.url.replace(/\/+$/, '');
  const candidateTables = ['Bio_Karyawan', 'Bio%20Karyawan', 'bio_karyawan'];
  let lastErr = null;

  for (const tbl of candidateTables) {
    try {
      const url = `${cleanUrl}/rest/v1/${tbl}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(cleanData)
      });

      if (res.ok) {
        const result = await res.json();
        return Array.isArray(result) ? result[0] : result;
      }
      lastErr = await res.text();
    } catch (e) {
      lastErr = e.message;
    }
  }

  throw new Error(`Gagal menyimpan Bio Karyawan ke Supabase: ${lastErr}`);
}

async function getSupabaseDataAttendance(limit = 100) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/data_absensi?select=*&order=timestamp.desc&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (res.ok) {
    return await res.json();
  }
  return [];
}

async function insertSupabaseDataAttendance(data) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/data_absensi`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menambah data absensi: HTTP ${res.status} - ${errText}`);
  }

  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

async function getSupabaseUploadDok(limit = 100) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/upload_dok?select=*&order=timestamp.desc&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (res.ok) {
    return await res.json();
  }
  return [];
}

async function insertSupabaseUploadDok(data) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/upload_dok`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menyimpan upload dokumen: HTTP ${res.status} - ${errText}`);
  }

  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

async function deleteSupabaseUploadDok(id) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/upload_dok?id=eq.${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menghapus dokumen: HTTP ${res.status} - ${errText}`);
  }

  return true;
}

async function getSupabaseSlipGaji(nik = '', limit = 100) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  let url = `${cleanUrl}/rest/v1/slip_gaji?select=*&order=tanggal_upload.desc&limit=${limit}`;
  if (nik) {
    url += `&nik=eq.${encodeURIComponent(nik)}`;
  }

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (res.ok) {
    return await res.json();
  }
  return [];
}

async function getSupabaseKodepos(kodepos = '') {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const cleanKp = String(kodepos || '').trim();
  if (!cleanKp) return [];

  const candidateQueries = [
    'Kodepos?Kodepos=eq.' + encodeURIComponent(cleanKp),
    'Kodepos?KodePos=eq.' + encodeURIComponent(cleanKp),
    'Kodepos?kodepos=eq.' + encodeURIComponent(cleanKp),
    'kodepos?kodepos=eq.' + encodeURIComponent(cleanKp),
    'KodePos?KodePos=eq.' + encodeURIComponent(cleanKp)
  ];

  for (const q of candidateQueries) {
    try {
      const url = `${cleanUrl}/rest/v1/${q}&select=*`;
      const res = await fetch(url, {
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`
        }
      });
      if (res.ok) {
        const rawList = await res.json();
        if (Array.isArray(rawList) && rawList.length > 0) {
          return rawList.map(item => ({
            kodepos: item.kodepos || item.Kodepos || item.KodePos || cleanKp,
            kelurahan: item.kelurahan || item.Kelurahan || item.urban || '',
            kecamatan: item.kecamatan || item.Kecamatan || item.subdistrict || '',
            kota: item.kota || item.Kota || item.kabupaten || item.Kabupaten || item.city || '',
            provinsi: item.provinsi || item.Provinsi || item.province || ''
          }));
        }
      }
    } catch (e) {
      // lanjut coba kandidat berikutnya
    }
  }
  return [];
}

/**
 * ============================================================================
 * MODUL DASHBOARD HAJI TERENCANA (mod_dashboard_ht)
 * ============================================================================
 */

async function getSupabaseDataJamaahHaji(options = {}) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  let url = `${cleanUrl}/rest/v1/data_jamaah_haji?select=*`;

  if (options.noBPIH) {
    const raw = String(options.noBPIH).trim();
    const clean = raw.replace(/^0+/, '');
    url += `&or=(nobpih.eq.${clean},nobpih.eq.0${clean},nobpih.eq.${raw})`;
  } else if (options.noHP) {
    url += `&nohp=eq.${encodeURIComponent(String(options.noHP).trim())}`;
  } else if (options.idJamaah) {
    url += `&idjamaah=eq.${encodeURIComponent(String(options.idJamaah).trim())}`;
  }

  url += '&order=nama.asc';
  if (options.limit) {
    url += `&limit=${parseInt(options.limit, 10)}`;
  }

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil data jamaah haji dari Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

async function getSupabaseEntryAngsuranHaji(options = {}) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  let url = `${cleanUrl}/rest/v1/entry_angsuran_haji?select=*`;

  if (options.noBPIH) {
    const raw = String(options.noBPIH).trim();
    const clean = raw.replace(/^0+/, '');
    url += `&or=(nobpih.eq.${clean},nobpih.eq.0${clean},nobpih.eq.${raw})`;
  } else if (options.noHP) {
    url += `&nohp=eq.${encodeURIComponent(String(options.noHP).trim())}`;
  }

  if (options.status && options.status !== 'all' && options.status !== 'Semua') {
    url += `&status=eq.${encodeURIComponent(options.status)}`;
  }

  url += '&order=tanggal.desc,id_1.desc';

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil entry angsuran haji dari Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

async function insertSupabaseEntryAngsuranHaji(records) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const items = Array.isArray(records) ? records : [records];
  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/entry_angsuran_haji`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(items)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menyimpan angsuran haji ke Supabase: HTTP ${res.status} - ${errText}`);
  }
  return await res.json();
}

async function getSupabaseMahram(noBPIH = null) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  let url = `${cleanUrl}/rest/v1/mahram?select=*`;

  if (noBPIH) {
    const raw = String(noBPIH).trim();
    const clean = raw.replace(/^0+/, '');
    url += `&or=(nobpih.eq.${clean},nobpih.eq.0${clean},nobpih.eq.${raw})`;
  }

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    return [];
  }
  return await res.json();
}

async function getSupabaseRunningText() {
  const config = getDbConfig().supabase;
  const fs = require('fs');
  const path = require('path');

  if (config && config.url && config.anonKey) {
    try {
      const cleanUrl = config.url.replace(/\/+$/, '');
      const url = `${cleanUrl}/rest/v1/running_text?select=*&status=eq.Aktif`;
      const res = await fetch(url, {
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  // Fallback to local data/running_text.json
  try {
    const localPath = path.join(__dirname, '../data/running_text.json');
    if (fs.existsSync(localPath)) {
      return JSON.parse(fs.readFileSync(localPath, 'utf8'));
    }
  } catch (err) {
    // ignore
  }

  return [
    { text: 'Selamat Datang di Aplikasi Haji Khusus - Fath Indah', link_url: null, status: 'Aktif', icon: 'megaphone' },
    { text: 'Dapatkan Produk Unggulan Fath Indah .... Silahkan Klik Text ini', link_url: 'https://tiktok.com/@fathindah', status: 'Aktif', icon: 'megaphone' }
  ];
}


// ============================================================================
// MODUL JAMAAH & PEMBAYARAN UMRAH SUPABASE METHODS
// ============================================================================

/**
 * Mengambil data jamaah dari tabel 'jamaah'
 */
async function getAllSupabaseJamaah(limit = 1000) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/jamaah?select=*&order=created_at.desc&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil data jamaah dari Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Menyimpan atau memperbarui data jamaah pada tabel 'jamaah'
 */
async function upsertSupabaseJamaah(record) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const isUpdate = record.id && String(record.id).length > 20; // UUID check

  let url = `${cleanUrl}/rest/v1/jamaah`;
  let method = 'POST';

  if (isUpdate) {
    url = `${cleanUrl}/rest/v1/jamaah?id=eq.${record.id}`;
    method = 'PATCH';
  }

  const res = await fetch(url, {
    method,
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(record)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal upsert jamaah ke Supabase: HTTP ${res.status} - ${errText}`);
  }
  return await res.json();
}

/**
 * Menghapus data jamaah berdasarkan ID atau ID Jamaah
 */
async function deleteSupabaseJamaah(id) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const isUuid = String(id).includes('-');
  const filter = isUuid ? `id=eq.${id}` : `id_jamaah=eq.${id}`;
  const url = `${cleanUrl}/rest/v1/jamaah?${filter}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal menghapus jamaah: HTTP ${res.status}`);
  }
  return true;
}

/**
 * Mengambil data kelengkapan Umrah dari tabel 'kelengkapan_umrah'
 */
async function getSupabaseKelengkapanUmrah() {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/kelengkapan_umrah?select=*&order=id_jamaah.asc`;

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil kelengkapan umrah dari Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Menyimpan / update kelengkapan Umrah pada tabel 'kelengkapan_umrah'
 */
async function upsertSupabaseKelengkapanUmrah(record) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  
  // Cek apakah data id_jamaah sudah ada
  const checkUrl = `${cleanUrl}/rest/v1/kelengkapan_umrah?id_jamaah=eq.${encodeURIComponent(record.id_jamaah)}&select=id`;
  const checkRes = await fetch(checkUrl, {
    headers: { 'apikey': config.anonKey, 'Authorization': `Bearer ${config.anonKey}` }
  });
  const existing = checkRes.ok ? await checkRes.json() : [];

  let method = 'POST';
  let targetUrl = `${cleanUrl}/rest/v1/kelengkapan_umrah`;

  if (existing && existing.length > 0) {
    method = 'PATCH';
    targetUrl = `${cleanUrl}/rest/v1/kelengkapan_umrah?id_jamaah=eq.${encodeURIComponent(record.id_jamaah)}`;
  }

  const res = await fetch(targetUrl, {
    method,
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(record)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal upsert kelengkapan umrah ke Supabase: HTTP ${res.status} - ${errText}`);
  }
  return await res.json();
}

/**
 * Menghapus kelengkapan Umrah dari tabel 'kelengkapan_umrah'
 */
async function deleteSupabaseKelengkapanUmrah(idJamaah) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/kelengkapan_umrah?id_jamaah=eq.${encodeURIComponent(idJamaah)}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal menghapus kelengkapan umrah: HTTP ${res.status}`);
  }
  return true;
}

/**
 * Mengambil riwayat pembayaran dari tabel 'history_pembayaran'
 */
async function getSupabaseHistoryPembayaran(idJamaah = null) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  let url = `${cleanUrl}/rest/v1/history_pembayaran?select=*&order=created_at.desc`;
  if (idJamaah) {
    url = `${cleanUrl}/rest/v1/history_pembayaran?id_jamaah=eq.${encodeURIComponent(idJamaah)}&order=created_at.desc`;
  }

  const res = await fetch(url, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil history pembayaran dari Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Menyimpan pembayaran baru ke tabel 'history_pembayaran'
 */
async function insertSupabaseHistoryPembayaran(record) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/history_pembayaran`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(record)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menyimpan pembayaran ke Supabase: HTTP ${res.status} - ${errText}`);
  }
  return await res.json();
}

/**
 * Menghapus pembayaran dari tabel 'history_pembayaran'
 */
async function deleteSupabaseHistoryPembayaran(idKwitansi) {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) throw new Error('Supabase belum dikonfigurasi');

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/history_pembayaran?id_kwitansi=eq.${encodeURIComponent(idKwitansi)}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal menghapus pembayaran: HTTP ${res.status}`);
  }
  return true;
}

const pGroupAccurate = fs.existsSync(path.resolve(__dirname, '../data/data_pembayaran_group.json'))
  ? path.resolve(__dirname, '../data/data_pembayaran_group.json')
  : path.resolve(__dirname, '../scratch/data_pembayaran_group_accurate.json');
let memoryGroupPayments = [];
try {
  if (fs.existsSync(pGroupAccurate)) {
    memoryGroupPayments = JSON.parse(fs.readFileSync(pGroupAccurate, 'utf8'));
  }
} catch(e) {}

async function getSupabasePembayaranGroup() {
  const config = getDbConfig().supabase;
  if (!config.url || !config.anonKey) return memoryGroupPayments;

  const cleanUrl = config.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/data_pembayaran_group?select=*`;

  try {
    const res = await fetch(url, {
      headers: { 'apikey': config.anonKey, 'Authorization': `Bearer ${config.anonKey}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch(e) {}
  return memoryGroupPayments;
}

async function insertSupabasePembayaranGroup(record) {
  const config = getDbConfig().supabase;
  if (config.url && config.anonKey) {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const url = `${cleanUrl}/rest/v1/data_pembayaran_group`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(record)
      });
      if (res.ok) return await res.json();
    } catch(e) {}
  }
  memoryGroupPayments.unshift(record);
  try {
    fs.writeFileSync(pGroupAccurate, JSON.stringify(memoryGroupPayments, null, 2), 'utf8');
  } catch(e) {}
  return record;
}


module.exports = {
  getAllSupabaseJamaah,
  upsertSupabaseJamaah,
  deleteSupabaseJamaah,
  getSupabaseKelengkapanUmrah,
  upsertSupabaseKelengkapanUmrah,
  deleteSupabaseKelengkapanUmrah,
  getSupabaseHistoryPembayaran,
  insertSupabaseHistoryPembayaran,
  deleteSupabaseHistoryPembayaran,
  getSupabasePembayaranGroup,
  insertSupabasePembayaranGroup,
  testSupabaseConnection,
  getSupabaseUsers,
  getSupabaseModules,
  getSupabaseLogs,
  insertSupabaseLog,
  getSupabaseJamaah,
  getSupabaseAbsensi,
  getSupabaseCuti,
  getSupabaseRekapAbsensi,
  getSupabaseLogBrosur,
  getSupabaseMnuLogBrosur,
  getSupabaseKanwil,
  getSupabaseCatPaket,
  insertSupabaseLogBrosur,
  updateSupabaseLogBrosurStatus,
  deleteSupabaseLogBrosur,
  getSupabaseBioKaryawan,
  insertOrUpdateBioKaryawan,
  getSupabaseDataAttendance,
  insertSupabaseDataAttendance,
  getSupabaseUploadDok,
  insertSupabaseUploadDok,
  deleteSupabaseUploadDok,
  getSupabaseSlipGaji,
  getSupabaseKodepos,
  getSupabaseDataJamaahHaji,
  getSupabaseEntryAngsuranHaji,
  insertSupabaseEntryAngsuranHaji,
  getSupabaseMahram,
  getSupabaseRunningText
};




