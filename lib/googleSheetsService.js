const { parseCSV } = require('./csvParser');
const { getDbConfig } = require('../config/database');

// In-memory cache to maintain snappy performance
const cache = {
  Users: { data: null, timestamp: 0 },
  ActivityLogs: { data: null, timestamp: 0 },
  Metadata: { data: null, timestamp: 0 },
  Absensi: { data: null, timestamp: 0 },
  CutiKaryawan: { data: null, timestamp: 0 }
};

const CACHE_TTL_MS = 15000; // 15 seconds cache

async function fetchSheet(sheetName, forceRefresh = false) {
  const config = getDbConfig();
  const spreadsheetId = config.googleSheets.spreadsheetId;
  const now = Date.now();

  if (!forceRefresh && cache[sheetName] && cache[sheetName].data && (now - cache[sheetName].timestamp < CACHE_TTL_MS)) {
    return cache[sheetName].data;
  }

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet "${sheetName}": HTTP ${response.status}`);
    }
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    cache[sheetName] = {
      data: rows,
      timestamp: now
    };
    return rows;
  } catch (err) {
    console.error(`[GoogleSheetsService] Error fetching sheet ${sheetName}:`, err.message);
    if (cache[sheetName] && cache[sheetName].data) {
      console.warn(`[GoogleSheetsService] Returning stale cached data for ${sheetName}`);
      return cache[sheetName].data;
    }
    throw err;
  }
}

async function getUsers(force = false) {
  const config = getDbConfig();
  return fetchSheet(config.googleSheets.usersSheet, force);
}

async function getActivityLogs(force = false) {
  const config = getDbConfig();
  return fetchSheet(config.googleSheets.logsSheet, force);
}

async function getJamaah(force = false) {
  const config = getDbConfig();
  return fetchSheet(config.googleSheets.jamaahSheet, force);
}

async function getAbsensi(force = false) {
  const config = getDbConfig();
  return fetchSheet(config.googleSheets.absensiSheet, force);
}

async function getCuti(force = false) {
  const config = getDbConfig();
  return fetchSheet(config.googleSheets.cutiSheet, force);
}

async function getModules(force = false) {
  const config = getDbConfig();
  return fetchSheet(config.googleSheets.modulesSheet || 'Modules', force);
}

function parseCSVMatrix(csvText) {
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

async function getRekapAbsensi(force = false) {
  const config = getDbConfig();
  const spreadsheetId = config.googleSheets.spreadsheetId;
  const sheetName = 'Rekap Absensi';
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet "${sheetName}": HTTP ${response.status}`);
  }
  const csvText = await response.text();
  const matrix = parseCSVMatrix(csvText);

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

  return {
    month: sheetMonth,
    year: sheetYear,
    count: employees.length,
    employees
  };
}

module.exports = {
  fetchSheet,
  getUsers,
  getModules,
  getActivityLogs,
  getJamaah,
  getAbsensi,
  getCuti,
  getRekapAbsensi
};
