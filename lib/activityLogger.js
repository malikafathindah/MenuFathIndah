const fs = require('fs');
const path = require('path');
const { getDbConfig } = require('../config/database');
const { getActivityLogs } = require('./googleSheetsService');
const { getSupabaseLogs, insertSupabaseLog } = require('./supabaseService');

const LOGS_FILE = path.join(__dirname, '..', 'data', 'activity_logs.json');

// Ensure data directory exists
const dataDir = path.dirname(LOGS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function getLocalLogs() {
  if (fs.existsSync(LOGS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading local activity logs:', e.message);
    }
  }
  return [];
}

function saveLocalLog(entry) {
  const logs = getLocalLogs();
  logs.unshift(entry); // newest first
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

function generateLogId() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 8; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LOG-${rand}`;
}

function formatWibTimestamp(date = new Date()) {
  // Format to YYYY-MM-DD HH:mm:ss in WIB (UTC+7)
  const d = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function recordActivity({ username, ip, mapsUrl, location, action, module = 'Auth' }) {
  const timestamp = formatWibTimestamp();
  const logId = generateLogId();

  const entry = {
    LogID: logId,
    Timestamp: timestamp,
    Username: username || 'Unknown',
    IP_Address: ip || '127.0.0.1',
    Maps_URL: mapsUrl || 'https://www.google.com/maps?q=-6.200000,106.816666',
    Location: location || 'Jakarta, Indonesia',
    Action: action || 'User login',
    Module: module,
    isNewSessionLog: true
  };

  // 1. Save to local persistent storage
  saveLocalLog(entry);

  // 2. If Supabase is configured, also push to Supabase
  const config = getDbConfig();
  if (config.supabase.url && config.supabase.anonKey) {
    insertSupabaseLog(entry).catch(err => {
      console.warn('[ActivityLogger] Supabase log push background error:', err.message);
    });
  }

  return entry;
}

async function getAllLogs() {
  const config = getDbConfig();
  const localLogs = getLocalLogs();

  let remoteLogs = [];
  try {
    if (config.activeSource === 'supabase' && config.supabase.url) {
      remoteLogs = await getSupabaseLogs();
      // map supabase columns to sheet format if needed
      remoteLogs = remoteLogs.map(l => ({
        LogID: l.log_id || l.LogID,
        Timestamp: l.timestamp || l.Timestamp,
        Username: l.username || l.Username,
        IP_Address: l.ip_address || l.IP_Address,
        Maps_URL: l.maps_url || l.Maps_URL,
        Location: l.location || l.Location,
        Action: l.action || l.Action,
        Module: l.module || l.Module
      }));
    } else {
      remoteLogs = await getActivityLogs();
    }
  } catch (err) {
    console.error('[ActivityLogger] Error fetching remote logs:', err.message);
  }

  // Deduplicate by LogID: local logs take precedence
  const logMap = new Map();
  for (const log of localLogs) {
    if (log.LogID) logMap.set(log.LogID, log);
  }
  for (const log of remoteLogs) {
    if (log.LogID && !logMap.has(log.LogID)) {
      logMap.set(log.LogID, log);
    }
  }

  const combined = Array.from(logMap.values());
  // Sort descending by Timestamp
  combined.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
  return combined;
}

module.exports = {
  recordActivity,
  getAllLogs,
  getLocalLogs,
  formatWibTimestamp
};
