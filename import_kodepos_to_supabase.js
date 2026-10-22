const fs = require('fs');
const readline = require('readline');
const { getDbConfig } = require('./config/database');

async function importKodepos() {
  const config = getDbConfig().supabase;
  const url = `${config.url.replace(/\/+$/, '')}/rest/v1/Kodepos`;
  const key = config.serviceKey || config.anonKey;

  console.log('Membaca file Kodepos_Supabase.csv...');
  const fileStream = fs.createReadStream('Kodepos_Supabase.csv');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let batch = [];
  const BATCH_SIZE = 1000;
  let isHeader = true;
  let totalInserted = 0;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    if (!line.trim()) continue;

    // parse CSV line
    const parts = line.split(',');
    if (parts.length >= 5) {
      batch.push({
        Kodepos: parts[0].trim(),
        Provinsi: parts[1].trim(),
        Kota: parts[2].trim(),
        Kecamatan: parts[3].trim(),
        Kelurahan: parts[4].trim()
      });
    }

    if (batch.length >= BATCH_SIZE) {
      await sendBatch(url, key, batch);
      totalInserted += batch.length;
      console.log(`Berhasil mengimpor ${totalInserted} baris...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await sendBatch(url, key, batch);
    totalInserted += batch.length;
    console.log(`Berhasil mengimpor ${totalInserted} baris... Selesai!`);
  }
}

async function sendBatch(url, key, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal upload batch: HTTP ${res.status} - ${errText}`);
  }
}

importKodepos().catch(err => {
  console.error('Error saat impor:', err.message);
});
