const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'db_config.json');

const defaultConfig = {
  activeSource: 'supabase', // 'googlesheets' | 'supabase'
  googleSheets: {
    spreadsheetId: '1VL8trcMIcZ6n5Be-2-9YwmC1pOsKliO_wbILmU_cC1s',
    usersSheet: 'Users',
    logsSheet: 'ActivityLogs',
    jamaahSheet: 'Metadata',
    absensiSheet: 'Absensi',
    cutiSheet: 'CutiKaryawan',
    modulesSheet: 'Modules'
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://utqexpkwtatwzknjftpx.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cWV4cGt3dGF0d3prbmpmdHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxODQ5MTYsImV4cCI6MjEwNzc2MDkxNn0.s17as0ZuXm11AMJyYp01omnHkiqTRTGrKtYZfAI7kwE',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    usersTable: 'users',
    logsTable: 'activity_logs',
    modulesTable: 'modules'
  }
};

function getDbConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return { ...defaultConfig, ...data };
    } catch (e) {
      console.error('Error reading db_config.json, using defaults:', e.message);
    }
  }
  return defaultConfig;
}

function updateDbConfig(newConfig) {
  const current = getDbConfig();
  const merged = {
    ...current,
    ...newConfig,
    googleSheets: { ...current.googleSheets, ...(newConfig.googleSheets || {}) },
    supabase: { ...current.supabase, ...(newConfig.supabase || {}) }
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

module.exports = {
  getDbConfig,
  updateDbConfig
};
