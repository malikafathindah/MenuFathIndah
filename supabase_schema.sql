-- =========================================================================
-- DATABASE SCHEMA & SEED DATA FOR PT. FATH INDAH TRAVEL SERVICE
-- Compatibility: Supabase / PostgreSQL
-- Generated automatically from Google Sheets: 
-- https://docs.google.com/spreadsheets/d/1VL8trcMIcZ6n5Be-2-9YwmC1pOsKliO_wbILmU_cC1s
-- =========================================================================

-- 1. Enable UUID Extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Create Users Table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    kanwil VARCHAR(100),
    kantor VARCHAR(100),
    role VARCHAR(50) DEFAULT 'Staff',
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "NoUrut" INTEGER
);

-- 4. Create ActivityLogs Table
CREATE TABLE activity_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username VARCHAR(100),
    ip_address VARCHAR(100),
    maps_url TEXT,
    location TEXT,
    action TEXT,
    module VARCHAR(100) DEFAULT 'Auth',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_nourut ON users("NoUrut");
CREATE INDEX idx_activity_logs_username ON activity_logs(username);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);

-- Enable Row Level Security (RLS) but allow anon read/insert for app access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read activity_logs" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert activity_logs" ON activity_logs FOR INSERT WITH CHECK (true);

-- 5. Seed Users from Google Sheets
INSERT INTO users (id, username, password, full_name, kanwil, kantor, role, status, created_at)
VALUES
  ('USR-001', 'admin', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 'Administrator Utama', 'Pusat', 'Pusat', 'Admin', 'Active', '2026-08-24 11:57:23'),
  ('USR-002', 'manager', '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5', 'Manajer Operasional', 'Pusat', 'Pusat', 'Manager', 'Active', '2026-08-24 11:57:23'),
  ('USR-003', 'staff', '10176e7b7b24d317acfcf8d2064cfd2f24e154f7b5a96603077d5ef813d6a6b6', 'Staff Operasional', 'Pusat', 'Pusat', 'Staff', 'Active', '2026-08-24 11:57:24'),
  ('USR-004', 'hrd', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 'Manajer HRD & Absensi', 'Pusat', 'Pusat', 'Staff', 'Active', '2026-08-24 11:57:24'),
  ('USR-005', 'finance', '48f7312924d74358e75294e3b3613f2319d99e944184b69550f528577ca082fb', 'Staff Keuangan', 'Pusat', 'Pusat', 'Staff', 'Inactive', '2026-08-24 11:57:24'),
  ('USR-006', 'a', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 'Administrator Utama', 'Pusat', 'Pusat', 'Admin', 'Active', '2026-08-24 11:57:23'),
  ('USR-008', 'Andini', '7a036503a4073c7084ab83155ad14d272251464e0993fd1dcf8644ba58be9a02', 'Andini Rizky Wijanarko', 'Pusat', 'Pusat', 'Staff', 'Active', NOW()),
  ('USR-006', 'Miftah', 'a', 'Miftahul Maulana', 'Pusat', 'Pusat', 'StaffHaji', 'Active', '2026-08-24 11:57:23'),
  ('USR-015', 'test', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Tester', 'Kanwil', 'Solo Raya', 'Admin', 'Active', '2026-09-11 19:54:50'),
  ('USR-016', 'Kadari', '0811145185', 'H. Kadari Damin', 'Pusat', 'Pusat', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-017', 'Tiyo', '082310804240', 'Prastiyo', 'Pusat', 'Jabodetabek', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-018', 'Siska', 'c13ee1b11f9a36c6e08ad919f2482659ce92b09144e81640333a9872ceaae7f1', 'Siska Kartika', 'Pusat', 'Pusat', 'StaffHaji', 'Active', '2026-09-11 19:54:50'),
  ('USR-019', 'Imam', '451f04ff99572f2bc61d288be1d1667c5cb91fef101b3cb8757feb080e62135b', 'Imam Bukhori', 'Pusat', 'Pusat', 'StaffUmrah', 'Active', '2026-09-11 19:54:50'),
  ('USR-020', 'Amir', '082125958180', 'Amir Yusuf Faisal', 'Pusat', 'Jabodetabek', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-021', 'Endang', '082254429000', 'Ust. Endang', 'Kanwil', 'Samarinda', 'StaffKanwil', 'Active', '2026-09-11 19:54:50'),
  ('USR-022', 'Samsudin', '08111075407', 'Samsudin', 'Pusat', 'Jabodetabek', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-023', 'Suparno', '08111075406', 'Suparno', 'Pusat', 'Jabodetabek', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-024', 'Rian', '857c18aab313ef639da203c7c8aa54a2e3348ac37f61a2ce800b1af6d0062371', 'Rian Purnama Rasyid', 'Pusat', 'Pusat', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-025', 'Ulfa', '089530444458', 'Maria Ulfa', 'Pusat', 'Pusat', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-026', 'Lika', '6a874ab6c31b2b47c0947a5bff3c4fe80c79289ad9544c3d891bbf0fe59b2581', 'Bihalallika', 'Pusat', 'Pusat', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-027', 'Zia', '085216115533', 'Siti Azizah Salamah', 'Kanwil', 'Samarinda', 'StaffKanwil', 'Active', '2026-09-11 19:54:50'),
  ('USR-028', 'Eko', '082213181188', 'Eko Prasetyo', 'Pusat', 'Jabodetabek', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-029', 'Apipah', '8735b7fa1da93fe9bd0580befddb3105090092ea8cd709eca044b390dabb6002', 'Apipah', 'Kanwil', 'Surabaya', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-030', 'Hikmat', '083895364699', 'Hikmatullah Ramadan', 'Pusat', 'Pusat', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-031', 'Dea', '081311675810', 'Dea Esania Putri', 'Pusat', 'Pusat', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-032', 'Dika', '089678920348', 'Dika Raga', 'Pusat', 'Jabodetabek', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-033', 'Lisa', '03d0cc9d1e974100cf764033264a51120c4d8f7cd1ec3f7d5436500f16daa6b4', 'Lisa Nur Savitri', 'Pusat', 'Jabodetabek', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-034', 'Andika', '25b80a1d13f51fc00d92b9ddb55d1f04dc364edf768cbb69f2f7f1f15169e577', 'Muhammad Andika', 'Kanwil', 'Solo Raya', 'StaffKanwil', 'Active', '2026-09-11 19:54:50'),
  ('USR-035', 'Aan', 'c16e6ba05d45ace273309d2325518340411cf2bdfde268bacea00550cf53c96c', 'Aan Syumardi', 'Kanwil', 'Solo Raya', 'StaffKanwil', 'Active', '2026-09-11 19:54:50'),
  ('USR-036', 'Hamid', '9c1b5de1f23c96c876ab2db65682abd26f954f9340783eaf00f84b0debfe4b0a', 'Hamid Pamungkas', 'Kanwil', 'Solo Raya', 'StaffKanwil', 'Active', '2026-09-11 19:54:50'),
  ('USR-037', 'Luqman', 'eaf4461e5306b284021fd02bcf090038d8e6ab3136919bf7162a3c01cf1ce09c', 'M Luqman Miftahul M', 'Kanwil', 'Pemalang', 'StaffKanwil', 'Active', '2026-09-11 19:54:50'),
  ('USR-038', 'Ipul', '56298c006917ecb295a873b3445c1da9c34d4a63c07cfaf9d9a1e875547d586d', 'Saiful Rohman', 'Kanwil', 'Pemalang', 'StaffKanwil', 'Active', '2026-09-11 19:54:50'),
  ('USR-039', 'Nabilla', '082314289699', 'Rizka Syifa Nabilla', 'Kanwil', 'Pemalang', 'StaffKanwil', 'Active', '2026-09-11 19:54:50'),
  ('USR-040', 'Fasha', '082117931849', 'Richael Alfasha', 'Pusat', 'Jabodetabek', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-041', 'Fikar', '82f5a814810d02bfa25c00ab1a2e9972146c86636fc740d136e2b537701f390c', 'Aminul Fikar Masruri', 'Kanwil', 'Pekalongan', 'StaffKanwil', 'Active', '2026-09-11 19:54:50'),
  ('USR-042', 'Firman', '082322541324', 'Firmanuddin', 'Kanwil', 'Pekalongan', 'StaffKanwil', 'Active', '2026-09-11 19:54:50'),
  ('USR-043', 'Dwi', 'dc8708d8baa4c76da59ce8fa1ffb625ae90ef839b42a8a1b55fa59d46fb29a7a', 'Dwi Astri Wihastuti Intani', 'Kanwil', 'Pekalongan', 'StaffKanwil', 'Active', '2026-09-11 19:54:50'),
  ('USR-044', 'Bila', '014c7a333632b4d24de1217b504cf3e46b3b2f18f0fb3a6dd0e3ecd6455d17bb', 'Sabila Widiyanti', 'Pusat', 'Pusat', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-045', 'Husnan', '', 'Kh Husnan Basuni, Lc', 'Cabang', 'Pati', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-046', 'Bagas', '4c907721afb3a20ff951fbf208476bdea88b37c707226b1289c53821fd93353f', 'Bagas Rahmat Dani', 'Pusat', 'Jabodetabek', 'Staff', 'Active', '2026-09-11 19:54:50'),
  ('USR-047', 'Zul', '087884341568', 'Zulkifli', 'Pusat', 'Pusat', 'Staff', 'Active', '2026-09-11 19:54:50');

-- 6. Seed Recent Activity Logs from Google Sheets
INSERT INTO activity_logs (log_id, timestamp, username, ip_address, maps_url, location, action, module)
VALUES
  ('LOG-MU0XX3XK', '2026-09-14 14:47:32', 'siska', '103.108.156.117', 'https://www.google.com/maps?q=-6.9092,107.5934', 'Bandung, West Java, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU0XY4AS', '2026-09-14 14:48:19', 'Siska', '103.108.156.117', 'https://www.google.com/maps?q=-6.247918611176233,106.9802480497629', 'Jl. Kalimalang Jemb. 2 Jl. KH. Noer Ali No.89a, RT.003/RW.025, Kayuringin Jaya, Kec. Bekasi Sel., Kota Bks, Jawa Barat 17144, Indonesia', 'LOGIN_SUCCESS (User berhasil login pada 2026-09-14 14:48:19)', 'Auth'),
  ('LOG-MU0Y413L', '2026-09-14 14:52:55', 'Siska', 'Client Web Device', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'SAVE_CUTI (Pengajuan cuti Cuti Tahunan untuk Siska Kartika)', 'Cuti Karyawan'),
  ('LOG-MU0Y941U', '2026-09-14 14:56:52', 'Siska', '103.108.156.117', 'https://www.google.com/maps?q=-6.247859165706483,106.98033497773956', 'Jl. Kalimalang Jemb. 2 Jl. KH. Noer Ali No.89a, RT.003/RW.025, Kayuringin Jaya, Kec. Bekasi Sel., Kota Bks, Jawa Barat 17144, Indonesia', 'LOGIN_SUCCESS (User berhasil login pada 2026-09-14 14:56:51)', 'Auth'),
  ('LOG-MU0YAGPZ', '2026-09-14 14:57:55', 'Siska', 'Client Web Device', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGOUT (User logout dari sistem)', 'Auth'),
  ('LOG-MU3Q7M0Q', '2026-09-16 13:35:03', 'aan syumardi', '182.9.2.177', 'https://www.google.com/maps?q=-7.5515,110.8089', 'Surakarta, Central Java, Indonesia', 'LOGIN_FAILED (Username tidak ditemukan)', 'Auth'),
  ('LOG-MU3Q7ZEU', '2026-09-16 13:35:21', 'Miftah', '103.108.156.117', 'https://www.google.com/maps?q=-6.9092,107.5934', 'Bandung, West Java, Indonesia', 'LOGIN_SUCCESS (User berhasil login pada 2026-09-16 13:35:21)', 'Auth'),
  ('LOG-MU3Q8CAJ', '2026-09-16 13:35:37', 'Aan', '182.9.2.177', 'https://www.google.com/maps?q=-7.5515,110.8089', 'Surakarta, Central Java, Indonesia', 'LOGIN_SUCCESS (User berhasil login pada 2026-09-16 13:35:37)', 'Auth'),
  ('LOG-MU5C8LG8', '2026-09-17 16:39:27', 'Aan', '103.108.156.117', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGIN_SUCCESS (User berhasil login pada 2026-09-17 16:39:27)', 'Auth'),
  ('LOG-MU5CAB3F', '2026-09-17 16:40:47', 'Aan', 'Client Web Device', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGOUT (User logout dari sistem)', 'Auth'),
  ('LOG-MU5CNQGR', '2026-09-17 16:51:13', 'Luqman', '103.108.156.117', 'https://www.google.com/maps?q=-6.247924482481133,106.98032249565587', 'Jl. Kalimalang Jemb. 2 Jl. KH. Noer Ali No.89a, RT.003/RW.025, Kayuringin Jaya, Kec. Bekasi Sel., Kota Bks, Jawa Barat 17144, Indonesia', 'LOGIN_SUCCESS (User berhasil login pada 2026-09-17 16:51:13)', 'Auth'),
  ('LOG-MU5COEKT', '2026-09-17 16:51:45', 'Luqman', 'Client Web Device', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGOUT (User logout dari sistem)', 'Auth'),
  ('LOG-MU5FTVOI', '2026-09-17 18:19:59', 'Miftah', '118.99.107.56', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGIN_SUCCESS (User berhasil login pada 2026-09-17 18:19:59)', 'Auth'),
  ('LOG-MU6AY2XX', '2026-09-18 8:51:03', 'Hamid', '182.9.2.114', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGIN_SUCCESS (User berhasil login pada 2026-09-18 08:51:03)', 'Auth'),
  ('LOG-MU6B4DXJ', '2026-09-18 8:55:57', 'aan', '182.9.2.114', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU6B4QTZ', '2026-09-18 8:56:14', 'aan', '182.9.2.114', 'https://www.google.com/maps?q=-7.685180870556774,110.84388026444377', 'Jl. Slamet Riyadi No.37, Johosari, Gayam, Kec. Sukoharjo, Kabupaten Sukoharjo, Jawa Tengah 57513, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU6B5HLL', '2026-09-18 8:56:49', 'aan', '182.9.2.114', 'https://www.google.com/maps?q=-7.685180870556774,110.84388026444377', 'Jl. Slamet Riyadi No.37, Johosari, Gayam, Kec. Sukoharjo, Kabupaten Sukoharjo, Jawa Tengah 57513, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU6B5ROM', '2026-09-18 8:57:02', 'aan', '182.9.2.114', 'https://www.google.com/maps?q=-7.685180870556774,110.84388026444377', 'Jl. Slamet Riyadi No.37, Johosari, Gayam, Kec. Sukoharjo, Kabupaten Sukoharjo, Jawa Tengah 57513, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU6B68F4', '2026-09-18 8:57:23', 'aan syumardi', '182.9.2.114', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGIN_FAILED (Username tidak ditemukan)', 'Auth'),
  ('LOG-MU6B6NX7', '2026-09-18 8:57:43', 'aan', '182.9.2.114', 'https://www.google.com/maps?q=-7.685209127782758,110.8438899083702', 'Jl. Slamet Riyadi No.34, Balesari, Gayam, Kec. Sukoharjo, Kabupaten Sukoharjo, Jawa Tengah 57513, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU6B7FI9', '2026-09-18 8:58:19', 'aan', '182.9.2.114', 'https://www.google.com/maps?q=-7.685209127782758,110.8438899083702', 'Jl. Slamet Riyadi No.34, Balesari, Gayam, Kec. Sukoharjo, Kabupaten Sukoharjo, Jawa Tengah 57513, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU6B8GMI', '2026-09-18 8:59:07', 'aan', '182.9.2.114', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU6E8BXP', '2026-09-18 10:23:00', 'imam', '125.161.134.94', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU6E8QE4', '2026-09-18 10:23:19', 'imam', '125.161.134.94', 'https://www.google.com/maps?q=-6.22202601607588,107.01338536773245', 'Jl. Raya Perjuangan No.102, RT.002/RW.001, Harapan Baru, Kec. Bekasi Utara, Kota Bks, Jawa Barat 17123, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU6E8XBJ', '2026-09-18 10:23:28', 'imam', '125.161.134.94', 'https://www.google.com/maps?q=-6.22202601607588,107.01338536773245', 'Jl. Raya Perjuangan No.102, RT.002/RW.001, Harapan Baru, Kec. Bekasi Utara, Kota Bks, Jawa Barat 17123, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU6E9682', '2026-09-18 10:23:39', 'imam', '125.161.134.94', 'https://www.google.com/maps?q=-6.22202601607588,107.01338536773245', 'Jl. Raya Perjuangan No.102, RT.002/RW.001, Harapan Baru, Kec. Bekasi Utara, Kota Bks, Jawa Barat 17123, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU7N2YK2', '2026-09-19 7:18:32', 'admin', '114.10.148.182', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGIN_SUCCESS (User berhasil login pada 2026-09-19 07:18:32)', 'Auth'),
  ('LOG-MU7QX8VW', '2026-09-19 9:06:04', 'imam', 'Client Web Device', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU7QY1IY', '2026-09-19 9:06:41', 'imam', 'Client Web Device', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth'),
  ('LOG-MU7R0Q1B', '2026-09-19 9:08:46', 'imam', '114.10.148.182', 'https://www.google.com/maps?q=Jakarta%2C%20Indonesia', 'Jakarta, Indonesia', 'LOGIN_FAILED (Password salah)', 'Auth');

-- =========================================================================
-- 7. Create Absensi Table (Tabel Absensi & Rekapitulasi Presensi)
-- =========================================================================
CREATE TABLE IF NOT EXISTS absensi (
    timestamp TIMESTAMP WITHOUT TIME ZONE PRIMARY KEY,
    nama_user VARCHAR(150),
    nama_karyawan VARCHAR(150),
    tipe VARCHAR(50),
    latitude NUMERIC,
    longitude NUMERIC,
    link_google_maps TEXT,
    tanggal DATE,
    kode VARCHAR(10),
    bulan VARCHAR(10),
    tahun VARCHAR(10),
    catatan TEXT,
    foto_bukti TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_absensi_nama ON absensi(nama_karyawan);
CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON absensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_absensi_bulan_tahun ON absensi(bulan, tahun);

-- Enable RLS and public read/insert
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read absensi" ON absensi FOR SELECT USING (true);
CREATE POLICY "Allow public insert absensi" ON absensi FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete absensi" ON absensi FOR DELETE USING (true);

-- =========================================================================
-- =========================================================================
-- 8. Create CatPaket, KanwilFathIndah, MnuLogBrosur & LogBrosur Tables (Modul Launching Brosur)
-- =========================================================================
CREATE TABLE IF NOT EXISTS "CatPaket" (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    catagory VARCHAR(100) NOT NULL UNIQUE,
    keterangan TEXT,
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS "KanwilFathIndah" (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    namakanwill VARCHAR(100) NOT NULL UNIQUE,
    alamat TEXT,
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS "MnuLogBrosur" (
    id VARCHAR(50) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    catagory VARCHAR(100) NOT NULL,
    brosurname VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    catatan TEXT
);

CREATE TABLE IF NOT EXISTS "LogBrosur" (
    id VARCHAR(50) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    wilayah VARCHAR(100),
    lokasibrosur VARCHAR(100),
    catagory VARCHAR(100) NOT NULL,
    brosurname VARCHAR(255) NOT NULL,
    namapaket VARCHAR(255),
    validuntil VARCHAR(20),
    tglupload VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Aktif',
    link TEXT,
    catatan TEXT
);

-- Migrasi penambahan kolom LogBrosur jika tabel sudah dibuat sebelumnya
ALTER TABLE "LogBrosur" ADD COLUMN IF NOT EXISTS namapaket VARCHAR(255);
ALTER TABLE "LogBrosur" ADD COLUMN IF NOT EXISTS validuntil VARCHAR(20);
ALTER TABLE "LogBrosur" ADD COLUMN IF NOT EXISTS tglupload VARCHAR(20);
ALTER TABLE "LogBrosur" ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Aktif';
ALTER TABLE "LogBrosur" ADD COLUMN IF NOT EXISTS lokasibrosur VARCHAR(100);

-- Migrasi penambahan kolom namakanwil di KanwilFathIndah
ALTER TABLE "KanwilFathIndah" ADD COLUMN IF NOT EXISTS namakanwil VARCHAR(100);
UPDATE "KanwilFathIndah" SET namakanwil = namakanwill WHERE (namakanwil IS NULL OR namakanwil = '') AND namakanwill IS NOT NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_catpaket_catagory ON "CatPaket"(catagory);
CREATE INDEX IF NOT EXISTS idx_kanwilfathindah_namakanwill ON "KanwilFathIndah"(namakanwill);
CREATE INDEX IF NOT EXISTS idx_kanwilfathindah_namakanwil ON "KanwilFathIndah"(namakanwil);
CREATE INDEX IF NOT EXISTS idx_mnulogbrosur_catagory ON "MnuLogBrosur"(catagory);
CREATE INDEX IF NOT EXISTS idx_logbrosur_catagory ON "LogBrosur"(catagory);
CREATE INDEX IF NOT EXISTS idx_logbrosur_created_at ON "LogBrosur"(created_at DESC);

-- Grant privileges to anon & authenticated
GRANT ALL ON TABLE "CatPaket" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "KanwilFathIndah" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "MnuLogBrosur" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "LogBrosur" TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Enable RLS and create public policies
ALTER TABLE "CatPaket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KanwilFathIndah" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MnuLogBrosur" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LogBrosur" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all on CatPaket" ON "CatPaket";
CREATE POLICY "Allow public all on CatPaket" ON "CatPaket" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on KanwilFathIndah" ON "KanwilFathIndah";
CREATE POLICY "Allow public all on KanwilFathIndah" ON "KanwilFathIndah" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on MnuLogBrosur" ON "MnuLogBrosur";
CREATE POLICY "Allow public all on MnuLogBrosur" ON "MnuLogBrosur" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on LogBrosur" ON "LogBrosur";
CREATE POLICY "Allow public all on LogBrosur" ON "LogBrosur" FOR ALL USING (true) WITH CHECK (true);

-- Seed Initial Data for CatPaket (header catagory)
INSERT INTO "CatPaket" (catagory, status)
VALUES
  ('Umrah', 'Active'),
  ('Haji Khusus & Furoda', 'Active'),
  ('Haji Terencana', 'Active'),
  ('Wisata Halal', 'Active'),
  ('Promo & Seasonal', 'Active')
ON CONFLICT (catagory) DO NOTHING;

-- Seed Initial Data for KanwilFathIndah (header namakanwil)
INSERT INTO "KanwilFathIndah" (namakanwil, status)
VALUES
  ('Pusat', 'Active'),
  ('Jabodetabek', 'Active'),
  ('Solo Raya', 'Active'),
  ('Samarinda', 'Active'),
  ('Surabaya', 'Active'),
  ('Pemalang', 'Active'),
  ('Pekalongan', 'Active')
ON CONFLICT DO NOTHING;

-- Seed Initial Data for MnuLogBrosur (Dropdown Master Data)
INSERT INTO "MnuLogBrosur" (id, created_at, catagory, brosurname, status, catatan)
VALUES
  ('MNU-BRS-001', NOW(), 'Umrah', 'Paket Umrah Reguler 9 Hari', 'Active', 'Brosur paket standar bintang 4'),
  ('MNU-BRS-002', NOW(), 'Umrah', 'Paket Umrah Ramadhan Awal', 'Active', 'Brosur paket awal Ramadhan'),
  ('MNU-BRS-003', NOW(), 'Umrah', 'Paket Umrah Ramadhan Lailatul Qadar', 'Active', 'Brosur paket 10 hari akhir Ramadhan'),
  ('MNU-BRS-004', NOW(), 'Umrah', 'Paket Umrah Plus Turki 12 Hari', 'Active', 'Wisata sejarah Istanbul & Bursa'),
  ('MNU-BRS-005', NOW(), 'Umrah', 'Paket Umrah Plus Dubai', 'Active', 'Wisata Dubai & Abu Dhabi'),
  ('MNU-BRS-006', NOW(), 'Umrah', 'Paket Umrah VIP Bintang 5', 'Active', 'Hotel depan pelataran Masjidil Haram'),
  ('MNU-BRS-007', NOW(), 'Haji Khusus & Furoda', 'Brosur Haji Khusus Kuota Kemenag', 'Active', 'Masa tunggu resmi kemenag'),
  ('MNU-BRS-008', NOW(), 'Haji Khusus & Furoda', 'Brosur Haji Furoda / Mujamalah VVIP', 'Active', 'Berangkat langsung tanpa antri'),
  ('MNU-BRS-009', NOW(), 'Haji Khusus & Furoda', 'Brosur Rincian Fasilitas Maktab Haji', 'Active', 'Maktab VIP tenda AC berkarpet'),
  ('MNU-BRS-010', NOW(), 'Haji Terencana', 'Brosur Program Tabungan Haji Terencana', 'Active', 'Skema porsi awal terencana'),
  ('MNU-BRS-011', NOW(), 'Haji Terencana', 'Brosur Skema Angsuran Terencana', 'Active', 'Tabel angsuran berkala'),
  ('MNU-BRS-012', NOW(), 'Wisata Halal', 'Brosur Tour Muslim Turki Cappadochia', 'Active', 'Paket liburan musim dingin & semi'),
  ('MNU-BRS-013', NOW(), 'Wisata Halal', 'Brosur Wisata Halal Aqsho - Jordan - Mesir', 'Active', 'Napak tilas tiga masjid suci'),
  ('MNU-BRS-014', NOW(), 'Wisata Halal', 'Brosur Tour Muslim Eropa Barat', 'Active', 'Paris, Swiss, Italia & Belanda'),
  ('MNU-BRS-015', NOW(), 'Promo & Seasonal', 'Flyer Promo Early Bird 1448H', 'Active', 'Diskon khusus pendaftar awal'),
  ('MNU-BRS-016', NOW(), 'Promo & Seasonal', 'Katalog Brosur Milad PT Fath Indah', 'Active', 'Edisi spesial milad travel')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 9. MODUL CUTI: CUTI KARYAWAN & CUTI BERSAMA
-- =========================================================================

-- 9.1 Tabel Cuti Karyawan (mod_cuti_karyawan)
CREATE TABLE IF NOT EXISTS "cuti_karyawan" (
    "cutiid" VARCHAR(100) PRIMARY KEY,
    "tanggalpengajuan" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "nik" VARCHAR(100),
    "namakaryawan" VARCHAR(200) NOT NULL,
    "jabatan" VARCHAR(150),
    "tipecuti" VARCHAR(100) DEFAULT 'Cuti Tahunan',
    "tanggalmulai" DATE NOT NULL,
    "tanggalselesai" DATE NOT NULL,
    "jumlahhari" NUMERIC(5, 1) DEFAULT 1,
    "keterangan" TEXT,
    "statusapproval" VARCHAR(50) DEFAULT 'Pending',
    "approvedby" VARCHAR(200),
    "approvedat" TIMESTAMP WITH TIME ZONE,
    "catatanapproval" TEXT,
    "createdat" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "linkdokumen" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.2 Tabel Cuti Bersama (mod_cuti_bersama)
CREATE TABLE IF NOT EXISTS "cuti_bersama" (
    "id" VARCHAR(100) PRIMARY KEY,
    "tahun" VARCHAR(10) NOT NULL,
    "tanggal" DATE NOT NULL,
    "namaharilibur" VARCHAR(255) NOT NULL,
    "jumlahhari" NUMERIC(5, 1) DEFAULT 1,
    "potongcutitahunan" VARCHAR(10) DEFAULT 'Ya',
    "status" VARCHAR(50) DEFAULT 'Aktif',
    "keterangan" TEXT,
    "createdat" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cuti_karyawan_nik ON "cuti_karyawan"("nik");
CREATE INDEX IF NOT EXISTS idx_cuti_karyawan_status ON "cuti_karyawan"("statusapproval");
CREATE INDEX IF NOT EXISTS idx_cuti_karyawan_tgl_mulai ON "cuti_karyawan"("tanggalmulai" DESC);
CREATE INDEX IF NOT EXISTS idx_cuti_bersama_tahun ON "cuti_bersama"("tahun");
CREATE INDEX IF NOT EXISTS idx_cuti_bersama_tanggal ON "cuti_bersama"("tanggal" ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE "cuti_karyawan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cuti_bersama" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public / anon / authenticated full CRUD access
DROP POLICY IF EXISTS "Allow public all on cuti_karyawan" ON "cuti_karyawan";
CREATE POLICY "Allow public all on cuti_karyawan" ON "cuti_karyawan" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on cuti_bersama" ON "cuti_bersama";
CREATE POLICY "Allow public all on cuti_bersama" ON "cuti_bersama" FOR ALL USING (true) WITH CHECK (true);

-- Explicit GRANT permissions for Supabase roles (anon, authenticated, service_role)
GRANT ALL ON TABLE "cuti_karyawan" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "cuti_bersama" TO anon, authenticated, service_role;

-- =========================================================================
-- 10. TABEL BIO KARYAWAN (Bio_Karyawan) DARI GOOGLE SHEET "Bio Karyawan"
-- Spreadsheet ID: 1VL8trcMIcZ6n5Be-2-9YwmC1pOsKliO_wbILmU_cC1s
-- Digunakan untuk modul Cuti Karyawan, Cuti Bersama, dan modul personalia lainnya
-- =========================================================================

CREATE TABLE IF NOT EXISTS "Bio_Karyawan" (
    "nik" VARCHAR(50) PRIMARY KEY,
    "nama_karyawan" VARCHAR(255) NOT NULL,
    "jenis_kelamin" VARCHAR(50),
    "jabatan" VARCHAR(150),
    "divisi" VARCHAR(150),
    "kantor" VARCHAR(100) DEFAULT 'Pusat',
    "nomor_hp" VARCHAR(50),
    "email" VARCHAR(150),
    "status" VARCHAR(50) DEFAULT 'Aktif',
    "status_emp" VARCHAR(50),
    "alamat" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bio_karyawan_nama ON "Bio_Karyawan"("nama_karyawan");
CREATE INDEX IF NOT EXISTS idx_bio_karyawan_status ON "Bio_Karyawan"("status");

-- Enable Row Level Security (RLS)
ALTER TABLE "Bio_Karyawan" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read and write
DROP POLICY IF EXISTS "Allow public all on Bio_Karyawan" ON "Bio_Karyawan";
CREATE POLICY "Allow public all on Bio_Karyawan" ON "Bio_Karyawan" FOR ALL USING (true) WITH CHECK (true);

-- Explicit GRANT permissions for Supabase roles (anon, authenticated, service_role)
GRANT ALL ON TABLE "Bio_Karyawan" TO anon, authenticated, service_role;

-- Views / Aliases for flexible naming
CREATE OR REPLACE VIEW "bio_karyawan" AS SELECT * FROM "Bio_Karyawan";
CREATE OR REPLACE VIEW "Bio Karyawan" AS SELECT * FROM "Bio_Karyawan";
GRANT ALL ON "bio_karyawan" TO anon, authenticated, service_role;
GRANT ALL ON "Bio Karyawan" TO anon, authenticated, service_role;

-- Seed Data from Google Sheet "Bio Karyawan"
INSERT INTO "Bio_Karyawan" ("nik", "nama_karyawan", "jenis_kelamin", "jabatan", "divisi", "kantor", "nomor_hp", "email", "status", "status_emp", "alamat", "created_at")
VALUES
  ('19-0101', 'Kadari', 'Laki-laki', 'Direktur Utama', 'Top Manajemen', 'Pusat', '0811145185', 'kadari.tunastours@gmail.com', 'Aktif', 'PKWTT', 'JL. Jeruk Raya No 307 RT005/RW005', NOW()),
  ('25-0501', 'Miftahul Maulana', 'Laki-laki', 'HRD, LEGAL, IS & QA', 'HRD, LEGAL, IS & QA', 'Pusat', '085281156830', 'miftah.maulana@gmail.com', 'Aktif', 'PKWTT', 'Jl. Legoso Al Mabrur Rt.001 Rw.01 No. 7', NOW()),
  ('16-0401', 'Siska Kartika', 'Perempuan', 'Area Manager', 'SALES & MARKETING', 'Pusat', '087770047686', 'siska.kartika96@gmail.com', 'Aktif', 'PKWTT', 'Kp. Pulo Rt.002/009', NOW()),
  ('24-0101', 'Siti Azizah Salamah', 'Perempuan', 'Officer', 'Kanwil', 'Samarinda', '0813133225251', 'sitiazizahslm@gmail.com', 'Aktif', 'PKWTT', 'Jl. Bengkuring Raya I Blok Sawi 7, RT 29', NOW()),
  ('22-0101', 'Samsudin', 'Laki-laki', 'Officer', 'OPERATION & PENGADAAN', 'Sumarrecon', '08170117290', 'SAMSUDINKUNINGAN@GMAIL.COM', 'Aktif', 'PKWTT', 'JL. WARAKAS III GG. 6 NO. 25A, RT. 011/004', NOW()),
  ('25-0825', 'Lisa Nur Savitri', 'Perempuan', 'Officer', 'FINANCE', 'Sumarrecon', '08980449453', 'lisanursavitri@gmail.com', 'Aktif', 'PKWTT', 'Bumi Anggrek Blok K No. 148 Rt.02/Rw.007', NOW()),
  ('24-0801', 'Eko Prasetyo', 'Laki-laki', 'Manager', 'OPERATION & PENGADAAN', 'Sumarrecon', '082213181188', 'ekofaris@gmail.com', 'Aktif', 'PKWTT', 'Tridaya Residence Blok A no. 12', NOW()),
  ('25-0502', 'Tatu Euis Hassanah', 'Perempuan', 'Manager', 'FINANCE', 'Pusat', '087880808674', 'hassanahhanah@gmail.com', 'Non Aktif', 'PKWTT', 'Petamburan 3', NOW()),
  ('24-0102', 'Endang Sukandi', 'Laki-laki', 'Kepala Cabang', 'Kanwil', 'Samarinda', '082254429000', 'ustadzahmad88@gmail.com', 'Aktif', 'PKWTT', 'Jl. Bengkuring Raya I, Blok Sawi 7 RT 29', NOW()),
  ('25-0903', 'Rizka Syifa Nabilla', 'Perempuan', 'Officer', 'Kanwil', 'Banyumas', '082314289699', 'rizkasyifa19150@gmail.com', 'Aktif', 'PKWTT', 'Ciberung RT 01 RW 02', NOW()),
  ('25-0902', 'Saiful Rohman', 'Laki-laki', 'Officer', 'Kanwil', 'Banyumas', '085229890664', 'juniorsaiful@gmail.com', 'Aktif', 'PKWTT', 'Rancamaya RT 03 RW 03', NOW()),
  ('25-0901', 'Mohammad Luqman Miftahul Murtadlo', 'Laki-laki', 'Pimpinan Cabang', 'Kanwil', 'Banyumas', '085640343480', 'moh.luqman1987@gmail.com', 'Aktif', 'PKWTT', 'Pasir Wetan RT 03 RW 02', NOW()),
  ('23-0902', 'Suparno', 'Laki-laki', 'Handling domestik', 'OPERATION & PENGADAAN', 'Sumarrecon', '08161447657', 'fathindah699@gmail.com', 'Aktif', 'PKWTT', 'Kp.Karang Mulya Rt.008/008', NOW()),
  ('25-0803', 'Hamid Pamungkas', 'Laki-laki', 'Officer', 'Kanwil', 'Sukoharjo', '085740306010', 'hamidpamungkas4@gmail.com', 'Aktif', 'PKWTT', 'Banaran RT 02/01 Serut Nguter Sukoharjo', NOW()),
  ('25-0802', 'Aan Syumardi', 'Laki-laki', 'Officer', 'Kanwil', 'Sukoharjo', '0812-2683-1017', 'aansyumardi86@gmail.com', 'Aktif', 'PKWTT', 'PANGTELU RT 002 RW 007', NOW()),
  ('25-0801', 'Muhammad Andika', 'Laki-laki', 'KEPALA CABANG', 'Kanwil', 'Sukoharjo', '0813133225251', 'andikamuhammad805@gmail.com', 'Aktif', 'PKWTT', 'KRAGILAN 002/006 KEDUNGWINONG', NOW()),
  ('11-0301', 'Apipah', 'Perempuan', 'Officer', 'Kanwil', 'Surabaya', '081280010795', 'pipe.iksan@gmail.com', 'Aktif', 'PKWTT', 'KARANG EMPAT GANG V NO. 25', NOW()),
  ('25-0228', 'Dea Esania Putri', 'Perempuan', 'Area Manajer', 'SALES & MARKETING', 'Pusat', '081311675810', 'desaniaputri@gmail.com', 'Aktif', 'PKWTT', 'Jl. Bunga Matahari XIX, Perumahan Jatiwarna Indah, Blok S No. 1', NOW()),
  ('23-1201', 'Amir Yusuf Faisal', 'Laki-laki', 'Manajer', 'OPERATION & PENGADAAN', 'Sumarrecon', '082213726554', 'amir@fathindah.id', 'Aktif', 'PKWTT', 'Bekasi Timur Regensi, Blok U7 No 3', NOW()),
  ('24-0202', 'Imam Bukhori', 'Laki-laki', 'Manajer', 'SALES & MARKETING', 'Pusat', '085158989806', 'bukhorimam98@gmail.com', 'Aktif', 'PKWTT', 'Bumi Anggrek Blok U No.126', NOW()),
  ('24-0201', 'Akhini Bihalalika', 'Perempuan', 'Officer', 'FINANCE', 'Pusat', '081290138213', 'bihalallika@gmail.com', 'Aktif', 'PKWTT', 'JL. NURUL IMAN RT.008 / RW. 001 NO. 11', NOW()),
  ('19-0105', 'Betty Nurbaety', 'Perempuan', 'Manajer', 'FINANCE', 'Pusat', '081219397544', 'betty@fathindah.id', 'Non Aktif', 'PKWTT', 'Jl. Harimau Raya H153 Pd.Timur Indah rt/rw.011/017', NOW()),
  ('23-0701', 'Rian Purnama Rasyid', 'Laki-laki', 'Officer', 'SALES & MARKETING', 'Pusat', '085881633244', 'rianp1899@gmail.com', 'Aktif', 'PKWTT', 'Kp, Bojong Gunung Putri RT 02 RW 06', NOW()),
  ('13-0101', 'Prastiyo', 'Laki-laki', 'Direktur', 'OPERATION & PENGADAAN', 'Sumarrecon', '082310804240', 'tiyofathindah45@gmail.com', 'Aktif', 'PKWTT', 'Bekasi Timur Regensi 7 Cluster Bromelia Blok B6 No 2', NOW()),
  ('25-0110', 'Hikmatulloh Ramadhan', 'Laki-laki', 'Officer', 'SALES & MARKETING', 'Pusat', '085759893173', 'hikmatulloh.fathindah@gmail.com', 'Aktif', 'PKWTT', 'Kp. karanggenteng Rt 001 / Rw 02', NOW()),
  ('26-0103', 'Dwi Astri Wihastuti Intani', 'Perempuan', 'Officer', 'Kanwil', 'Pemalang', '088225120918', 'dwiastri373@gmail.com', 'Aktif', 'PKWTT', 'Jl Abdurrasyid Karang Bulu RT 02/03 Sima kec. Moga Kab. Pemalang, Prov. Jawa Tengah', NOW()),
  ('26-0102', 'Firmanudin', 'Laki-laki', 'Oprasional', 'Kanwil', 'Pemalang', '082322541324', 'firmanarzk@gmail.com', 'Aktif', 'PKWTT', 'Pondoknangka barat rt 07 rw 02', NOW()),
  ('26-0101', 'Aminul Fikar Masruri', 'Laki-laki', 'Kepala Cabang Pemalang', 'Kanwil', 'Pemalang', '085226062979', '', 'Aktif', 'PKWTT', 'Manadiraja RT 06/01 Kec. moga Kab. Pemalang, Provinsi Jawa Tengah', NOW()),
  ('26-0201', 'Sabilla Widiyanti', 'Perempuan', 'Officer', 'Finance', 'Pusat', '081387870445', 'sabillawidiyanti98@gmail.com', 'Aktif', 'PKWTT', 'Perumahan Bumi Anggrek JKL blok K no 17-18', NOW()),
  ('26-0701', 'Bagas Rahmat Dani', 'Laki-laki', 'Staff Perlengkapan', 'OPERATION & PENGADAAN', 'Sumarrecon', '081211947505', 'bagasrahmatdani18@gmail.com', 'Aktif', 'PKWT', 'Perumahan Taman Raya Blok C4 NO. 16', NOW()),
  ('26-0801', 'ANDINI RIZKY WIJANARKO', 'Perempuan', 'Officer', 'Finance', 'Pusat', '085717681184', 'andinirizkyw@gmail.com', 'Aktif', 'PKWT', 'PERUM BALI RESORT CLUSTER KINTAMANI BLOK KE 06, BOGOR', NOW())
ON CONFLICT ("nik") DO UPDATE SET
  "nama_karyawan" = EXCLUDED."nama_karyawan",
  "jenis_kelamin" = EXCLUDED."jenis_kelamin",
  "jabatan" = EXCLUDED."jabatan",
  "divisi" = EXCLUDED."divisi",
  "kantor" = EXCLUDED."kantor",
  "nomor_hp" = EXCLUDED."nomor_hp",
  "email" = EXCLUDED."email",
  "status" = EXCLUDED."status",
  "status_emp" = EXCLUDED."status_emp",
  "alamat" = EXCLUDED."alamat";



