const { getRekapAbsensi } = require('./googleSheetsService');
const config = require('../config/database').getDbConfig().supabase;

function getRekapCodeLabel(code) {
  switch (code) {
    case 'H': return 'Hadir';
    case 'S': return 'Sakit';
    case 'I': return 'Izin';
    case 'A': return 'Alpha';
    case 'P': return 'Perjalanan Dinas';
    case 'C': return 'Cuti';
    case 'L': return 'Lain-lain';
    case 'W': return 'WFH';
    case 'T': return 'Terlambat';
    default: return code;
  }
}

async function migrate() {
  console.log('Fetching Rekap Absensi data from Google Sheets...');
  const data = await getRekapAbsensi(true);
  console.log(`Found ${data.employees.length} employees for Month ${data.month}, Year ${data.year}`);

  const recordsToInsert = [];
  data.employees.forEach((emp, empIdx) => {
    for (let d = 1; d <= 31; d++) {
      const code = emp.days[d];
      if (code) {
        const dayStr = String(d).padStart(2, '0');
        const monthStr = String(data.month).padStart(2, '0');
        const dateStr = `${data.year}-${monthStr}-${dayStr}`;
        
        // Ensure strictly unique timestamp per employee and day
        const minute = String((empIdx * 2 + 1) % 60).padStart(2, '0');
        const second = String((empIdx * 3 + 7) % 60).padStart(2, '0');
        const hour = '08';
        const ts = `${dateStr}T${hour}:${minute}:${second}`;

        recordsToInsert.push({
          timestamp: ts,
          nama_karyawan: emp.name,
          nama_user: emp.name,
          tipe: getRekapCodeLabel(code),
          tanggal: dateStr,
          kode: code,
          bulan: String(data.month),
          tahun: String(data.year),
          catatan: `Lokasi: ${emp.location}`
        });
      }
    }
  });

  console.log(`Total records prepared: ${recordsToInsert.length}`);

  // Insert in batches of 40
  const BATCH_SIZE = 40;
  let inserted = 0;
  for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
    const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
    const url = `${config.url}/rest/v1/absensi`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(batch)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed (HTTP ${res.status}):`, errText);
    } else {
      inserted += batch.length;
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} inserted (${inserted}/${recordsToInsert.length})`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`SUCCESS! Berhasil memindahkan ${inserted} record absensi ke Supabase tabel 'absensi'!`);
  console.log(`======================================================`);
}

migrate().catch(console.error);
