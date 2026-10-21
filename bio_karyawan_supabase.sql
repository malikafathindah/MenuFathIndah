-- =========================================================================
-- SCRIPT PEMBUATAN TABEL "Bio Karyawan" DI SUPABASE
-- Sumber Data: Google Sheets "Bio Karyawan"
-- URL: https://docs.google.com/spreadsheets/d/1VL8trcMIcZ6n5Be-2-9YwmC1pOsKliO_wbILmU_cC1s/edit?usp=sharing
-- =========================================================================

-- 1. Buat Tabel "Bio Karyawan" jika belum ada
CREATE TABLE IF NOT EXISTS "Bio Karyawan" (
    "nik" VARCHAR(50) PRIMARY KEY,
    "nama_karyawan" VARCHAR(255) NOT NULL,
    "jenis_kelamin" VARCHAR(50),
    "tempat_lahir" VARCHAR(100),
    "tanggal_lahir" DATE,
    "golongan_darah" VARCHAR(10),
    "alamat" TEXT,
    "kode_pos" VARCHAR(20),
    "kelurahan" VARCHAR(100),
    "kecamatan" VARCHAR(100),
    "kota_kabupaten" VARCHAR(100),
    "provinsi" VARCHAR(100),
    "nomor_hp" VARCHAR(50),
    "email" VARCHAR(150),
    "pendidikan_terakhir" VARCHAR(100),
    "jurusan" VARCHAR(150),
    "lembaga_pendidikan" VARCHAR(200),
    "nama_ibu_kandung" VARCHAR(150),
    "nama_pasangan" VARCHAR(150),
    "tgl_lahir_pasangan" DATE,
    "anak_1_nama" VARCHAR(150),
    "anak_1_tgl_lahir" DATE,
    "anak_2_nama" VARCHAR(150),
    "anak_2_tgl_lahir" DATE,
    "anak_3_nama" VARCHAR(150),
    "anak_3_tgl_lahir" DATE,
    "anak_4_nama" VARCHAR(150),
    "anak_4_tgl_lahir" DATE,
    "no_kk" VARCHAR(50),
    "no_ktp" VARCHAR(50),
    "npwp" VARCHAR(50),
    "bpjs_ketenagakerjaan" VARCHAR(50),
    "bpjs_kesehatan" VARCHAR(50),
    "penanggung_bpjs" VARCHAR(100),
    "bank_atas_nama" VARCHAR(150),
    "nama_bank" VARCHAR(100),
    "no_rekening" VARCHAR(50),
    "status" VARCHAR(50) DEFAULT 'Aktif',
    "tanggal_input" DATE,
    "tanggal_masuk" DATE,
    "keterangan" TEXT,
    "divisi" VARCHAR(150),
    "jabatan" VARCHAR(150),
    "fungsional" VARCHAR(150),
    "kantor" VARCHAR(100) DEFAULT 'Pusat',
    "upload_ktp" TEXT,
    "upload_npwp" TEXT,
    "upload_kk" TEXT,
    "upload_foto" TEXT,
    "umur" INTEGER,
    "status_emp" VARCHAR(50) DEFAULT 'PKWTT',
    "evaluasi" DATE,
    "masa_kerja" NUMERIC(5,1),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indeks untuk Mempercepat Pencarian Data
CREATE INDEX IF NOT EXISTS idx_bio_karyawan_nama ON "Bio Karyawan"("nama_karyawan");
CREATE INDEX IF NOT EXISTS idx_bio_karyawan_kantor ON "Bio Karyawan"("kantor");
CREATE INDEX IF NOT EXISTS idx_bio_karyawan_divisi ON "Bio Karyawan"("divisi");
CREATE INDEX IF NOT EXISTS idx_bio_karyawan_status ON "Bio Karyawan"("status");

-- 3. Buat View Alias Kompatibilitas ("Bio_Karyawan" & "bio_karyawan")
-- (PENTING: Agar kode frontend dan backend yang memanggil Bio_Karyawan / bio_karyawan tetap berfungsi 100%)
CREATE OR REPLACE VIEW "Bio_Karyawan" AS SELECT * FROM "Bio Karyawan";
CREATE OR REPLACE VIEW "bio_karyawan" AS SELECT * FROM "Bio Karyawan";

-- 4. Aktifkan Row Level Security (RLS) & Hak Akses Supabase API
ALTER TABLE "Bio Karyawan" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all on Bio Karyawan" ON "Bio Karyawan";
CREATE POLICY "Allow public all on Bio Karyawan" ON "Bio Karyawan" FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE "Bio Karyawan" TO anon, authenticated, service_role;
GRANT ALL ON "Bio_Karyawan" TO anon, authenticated, service_role;
GRANT ALL ON "bio_karyawan" TO anon, authenticated, service_role;

-- 5. Insert Data Karyawan dari Google Sheet (Total: 31 Baris Data)
INSERT INTO "Bio Karyawan" (
    "nik", "nama_karyawan", "jenis_kelamin", "tempat_lahir", "tanggal_lahir",
    "golongan_darah", "alamat", "kode_pos", "kelurahan", "kecamatan",
    "kota_kabupaten", "provinsi", "nomor_hp", "email", "pendidikan_terakhir",
    "jurusan", "lembaga_pendidikan", "nama_ibu_kandung", "nama_pasangan",
    "tgl_lahir_pasangan", "anak_1_nama", "anak_1_tgl_lahir", "anak_2_nama",
    "anak_2_tgl_lahir", "anak_3_nama", "anak_3_tgl_lahir", "anak_4_nama",
    "anak_4_tgl_lahir", "no_kk", "no_ktp", "npwp", "bpjs_ketenagakerjaan",
    "bpjs_kesehatan", "penanggung_bpjs", "bank_atas_nama", "nama_bank",
    "no_rekening", "status", "tanggal_input", "tanggal_masuk", "keterangan",
    "divisi", "jabatan", "fungsional", "kantor", "upload_ktp",
    "upload_npwp", "upload_kk", "upload_foto", "umur", "status_emp",
    "evaluasi", "masa_kerja", "created_at"
)
VALUES
  ('19-0101', 'Kadari', 'Laki-laki', 'Pati', '1969-12-31', 'AB', 'JL. Jeruk Raya No 307 RT005/RW005', '17135', 'Kranji', 'Bekasi Barat', 'Kota Bekasi', 'Jawa Barat', '0811145185', 'kadari.tunastours@gmail.com', 'Magister (S2)', 'HRD-Finance-Pajak', NULL, 'Roesmi', 'Neneng Prihatin', '1976-01-20', 'Sabilla Widiyanti', '1998-02-15', 'Richael Alfasha', '2003-04-24', 'Aufari Ahmad Fadlan', '2013-10-21', NULL, NULL, '3275021812060070', '3275023112690047', '09.259.981.0-407.000', '24005522982', '0001658010879', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '1991-01-01', NULL, 'Top Manajemen', 'Direktur Utama', NULL, 'Pusat', 'https://drive.google.com/open?id=1J4TPA1sVgJJAtFGDydPy0tDowD29b1FO', 'https://drive.google.com/open?id=17TcRHBf4i6dh74DCYaGiqj9GHP2Quj7I', NULL, 'https://drive.google.com/open?id=1bJDFQ3e6SC_n6oKAoAGTxxNjmP1liswi', 56, 'PKWTT', NULL, 35, '2025-10-29 10:52:43+07'),
  ('25-0501', 'Miftahul Maulana', 'Laki-laki', 'Jakarta', '1968-06-11', 'B', 'Jl. Legoso Al Mabrur Rt.001 Rw.01 No. 7', '15419', 'Pisangan', 'Ciputat Timur', 'Tangerang Selatan', 'Banten', '085281156830', 'miftah.maulana@gmail.com', 'Magister (S2)', 'Manajemen Teknologi Informasi', NULL, 'Musyrifah', 'Liliek Rahmawati', '1975-04-10', 'Muhammad Fadhillah Hafiz', '1996-11-09', 'Nadhifa Maulidiya', '2000-02-12', NULL, NULL, NULL, NULL, '3674052401105586', '3674051106680003', '69.217.771.0-411.000', '25074194868', '0000037398328', 'Kementerian/Lembaga Pemerindah/Daerah/Pusat', NULL, NULL, NULL, 'Aktif', NULL, '2025-05-02', NULL, 'HRD, LEGAL, IS & QA', NULL, NULL, 'Pusat', 'https://drive.google.com/open?id=1V6ZzeoAXEcyoSD39ieuX_5kpdvUBr4PJ', 'https://drive.google.com/open?id=1hqD56OFz4GCiyeZPSLa8efXieuYrQMyp', NULL, 'https://drive.google.com/file/d/1xgYyr_e3Kbl7ywmwGsw5srcoRgTuA71T/view?usp=drivesdk', 58, 'PKWTT', NULL, 1, '2025-10-29 11:03:02+07'),
  ('16-0401', 'Siska Kartika', 'Perempuan', 'Bekasi', '1993-07-25', 'O', 'Kp. Pulo Rt.002/009', '17435', 'Jatikarya', 'Jatisampurna', 'Bekasi', 'Jawa Barat', '087770047686', 'siska.kartika96@gmail.com', 'Diploma 3 (D3)', 'Business Administration', NULL, 'Karsih', 'Muhamad Sardiansyah', '1992-08-07', 'Elsyahrawi Putra Sardiansyah', '2018-09-30', 'Elpasha Putra Sardiansyah', '2022-08-03', NULL, NULL, NULL, NULL, '3275102502190009', '3201036507930002', '71.442.256.5-436.000', '25014005794', '0002354680067', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2016-01-04', NULL, 'SALES & MARKETING', 'Area Manager', 'Sales Operation', 'Pusat', 'https://drive.google.com/open?id=1KLsu3km1W-9Scj6-MTohce3C6LxA7iYD', 'https://drive.google.com/open?id=1BIRF-JleP75rDHyu9F2u-0bG7SboatGy', NULL, 'https://drive.google.com/open?id=13MtfhZ39Im69fszPIn-saaoPELfKmqdy', 33, 'PKWTT', NULL, 10, '2025-10-29 11:29:58+07'),
  ('24-0101', 'Siti Azizah Salamah', 'Perempuan', 'Cianjur', '2000-02-10', 'O', 'Jl. Bengkuring Raya I Blok Sawi 7, RT 29', '75119', 'Sempaja Timur', 'Samarinda Utara', 'Samarinda', 'Kalimantan Timur', '0813133225251', 'sitiazizahslm@gmail.com', 'SMA / SMK / Sederajat', 'IPA', NULL, 'Dewi Ika Sukaesih', 'Muhammad Agung Kaisar Andi Saad Arung Malolo', '2001-03-16', 'ELAIA AL MECCA KAISAR', '2025-12-31', NULL, NULL, NULL, NULL, NULL, NULL, '6472051707250006', '3203015002000023', '32.030.150.0-200.023', '25111358922', '0001002572548', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2023-12-21', NULL, 'Kanwil', 'Officer', 'Administration', 'Samarinda', 'https://drive.google.com/open?id=1R80z6wXwvvQUZxV0CpLm_CHZtAiI1TK5', 'https://drive.google.com/open?id=17Zmm2a_OIcxKAJXXpPH79idHc4z1IDYd', NULL, 'https://drive.google.com/open?id=1pSz_8AlVyXPekkSeDORMPLBSYxBBgBSz', 26, 'PKWTT', NULL, 2, '2025-10-29 11:33:20+07'),
  ('22-0101', 'Samsudin', 'Laki-laki', 'KUNINGAN', '1985-04-09', 'O', 'JL. WARAKAS III GG. 6 NO. 25A, RT. 011/004', '14370', 'WARAKAS', 'TANJUNG PRIOK', 'JAKARTA UTARA', 'DKI JAKARTA', '08170117290', 'SAMSUDINKUNINGAN@GMAIL.COM', 'SMA / SMK / Sederajat', 'ILMU PENGETAHUAN ALAM', NULL, 'CARMAH', 'SUSI SUSANTI', '1990-12-28', 'MIFTAH RAFASYA', '2012-12-16', 'DZAKIRA HUMAIRA RAFIFAH', '2015-03-13', 'ELSHANUM ALFADIYA SYAM', '2023-04-07', 'EHSAN RAMADHAN SYAM', '2023-04-07', '3172020204121042', '3208070904850002', '93.248.571.7-042.000', '22136612516', '0000445293898', 'Kementerian/Lembaga Pemerindah/Daerah/Pusat', NULL, NULL, NULL, 'Aktif', NULL, '2022-01-01', NULL, 'OPERATION & PENGADAAN', 'Officer', 'Visa & Document', 'Sumarrecon', 'https://drive.google.com/open?id=1Wkehfj0YQUEI83YSnxN63ZfmwD9DfiGJ', 'https://drive.google.com/open?id=1GKvlS8aESJH58MzXV6jEhJzeC0FAh07J', NULL, 'https://drive.google.com/open?id=1RilFGyHb5fKjbOcKyQoUGaJioFiiQCTL', 41, 'PKWTT', NULL, 4, '2025-10-29 11:37:17+07'),
  ('25-0825', 'Lisa Nur Savitri', 'Perempuan', 'Bekasi', '1998-03-01', 'AB', 'Bumi Anggrek Blok K No. 148 Rt.02/Rw.007', '17510', 'Karangsatria', 'Tambun Utara', 'Kabupaten Bekasi', 'Jawa Barat', '08980449453', 'lisanursavitri@gmail.com', 'Sarjana (S1)', 'Manajemen', NULL, 'Sulastri', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3216051812101112', '3216054103980006', '60.829.926.9-435.000', '25158419561', '0003305259472', 'Mandiri', NULL, NULL, NULL, 'Aktif', NULL, '2025-08-25', NULL, 'FINANCE', 'Officer', 'Invoicing', 'Sumarrecon', 'https://drive.google.com/open?id=1foAS1GXBzKWV-0-WDeGIFcwwrgZ0v2if', 'https://drive.google.com/open?id=18CywgOiM14VTdhLPViWtq859EZ5vYRb0', NULL, 'https://drive.google.com/open?id=19fwYJ7lu54B4zX2_aAdD2qHKzWONsXLP', 28, 'PKWTT', NULL, 1, '2025-10-29 11:40:20+07'),
  ('24-0801', 'Eko Prasetyo', 'Laki-laki', 'JAKARTA', '1988-11-18', 'A', 'Tridaya Residence Blok A no. 12', '17510', 'Tridaya Sakti', 'Tambun Selatan', 'Kab. Bekasi', 'Jawa Barat', '082213181188', 'ekofaris@gmail.com', 'Diploma 3 (D3)', 'MANAJEMEN ADMINISTRASI', NULL, 'JUWARIAH', 'WASRI DEFI', '1987-03-21', 'SALMAN AL FARISI', '2018-07-14', 'SHAFWAN HANAFI', '2021-05-05', NULL, NULL, NULL, NULL, '3275041608180006', '3275041811880007', '87.083.962.8-432.000', '6002751128', '0001135257377', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2024-08-12', NULL, 'OPERATION & PENGADAAN', 'Manager', 'Pengadaan', 'Sumarrecon', 'https://drive.google.com/open?id=16jvvD3P6oaaJY7z7U9xMxBDZDRFejz5F', 'https://drive.google.com/open?id=1w36YjLmS34mwYNQTbv-Dpi6o8JDeX4XK', NULL, 'https://drive.google.com/open?id=1YRDmOy6-mYJL57QfMZpzwHWh7a9GIBKr', 37, 'PKWTT', NULL, 2, '2025-10-29 11:45:49+07'),
  ('25-0502', 'Tatu Euis Hassanah', 'Perempuan', 'Jakarta', '1976-02-07', 'O', 'Petamburan 3', '10260', 'Petamburan', 'Tanah Abang', 'Jakarta Pusat', 'DKI Jakarta', '087880808674', 'hassanahhanah@gmail.com', 'Diploma 3 (D3)', 'Keuangan Perbankan', NULL, 'Hafsah', 'Jeky Mareno', '1974-09-08', 'Caesar Hecsel Alkautsar', '2003-10-27', 'Ratu Mechalle Myardova', '2006-04-26', 'Kenzo Alvaro Ibrahim', '2012-05-28', NULL, NULL, '3171072001098893', '3171074702760006', '88.939.971.3-072.000', '25074194876', '0001396523709', 'Lain-lain', NULL, NULL, NULL, 'Non Aktif', '2026-07-27', '2025-05-19', 'Mengundurkan Diri', 'FINANCE', 'Manager', 'Finance Operation', 'Pusat', 'https://drive.google.com/open?id=110SQpH1tR31KkBSWq80rDGzCU8hdNU4q', 'https://drive.google.com/open?id=1GjcunELRdMDUZ7E0s0I-YSmYDf__mOEk', NULL, 'https://drive.google.com/open?id=1cJyE07KLYNO84MdW0WI--3kQ6AtdATMn', 50, 'PKWTT', NULL, 1, '2025-10-29 11:51:28+07'),
  ('24-0102', 'Endang Sukandi', 'Laki-laki', 'Cianjur', '1983-05-25', 'B', 'Jl. Bengkuring Raya I, Blok Sawi 7 RT 29', '75119', 'Sempaja Timur', 'Samarinda Utara', 'Samarinda', 'Kalimantan Timur', '082254429000', 'ustadzahmad88@gmail.com', 'SMA / SMK / Sederajat', 'IPS', NULL, 'Siti Nur Ratna Sumiati', 'Deani Sartika', '1990-01-01', 'Siti Aufa Umdatul Qory', '2008-11-14', 'Muhammad Arsyad Bafaqih Assyabany', '2013-06-27', 'Siti Azzura Umdatus Salik', '2019-09-15', 'Muhammad Alawy Zain Abdul Ghani', '2021-12-02', '6472062206120002', '3203012505830015', '42.357.470.6-722.000', NULL, '0002723636621', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2025-02-18', NULL, 'Kanwil', 'Kepala Cabang', NULL, 'Samarinda', 'https://drive.google.com/open?id=1EqVCGvdC9KFU-BdsclP9LqerMc846c1N', 'https://drive.google.com/open?id=1ufYYzkH5LazOhq08futZpsLWfpDfwrrC', NULL, 'https://drive.google.com/open?id=1YVbZhVZI-eP0rJx3l7WLL0nNFHPC2MpR', 43, 'PKWTT', NULL, 1, '2025-10-29 11:55:32+07'),
  ('25-0903', 'Rizka Syifa Nabilla', 'Perempuan', 'Banyumas', '2001-01-23', 'O', 'Ciberung RT 01 RW 02', '53163', 'Ciberung', 'Ajibarang', 'Banyumas', 'Jawa Tengah', '082314289699', 'rizkasyifa19150@gmail.com', 'Sarjana (S1)', 'Agroteknologi', NULL, 'Suhesti', 'Mika Heaven Festde', '2002-08-01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3302142710060015', '3302146301010003', NULL, '25158419652', '0001718513807', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2025-08-29', NULL, 'Kanwil', 'Officer', 'Administration', 'Banyumas', 'https://drive.google.com/open?id=1iBuHbnoPj9rgxErBz5LkxKzOuk9vrt4u', 'https://drive.google.com/file/d/1brZH16SzxmOUinYzCJMIGHdpMm6eMU2m/view?usp=drivesdk', NULL, 'https://drive.google.com/open?id=16z4GGfDVPDQjtVCtoEdPSLt3ZMr4m3eO', 25, 'PKWTT', NULL, 1, '2025-10-29 12:18:51+07'),
  ('25-0902', 'Saiful Rohman', 'Laki-laki', 'Banyumas', '1990-06-19', 'B', 'Rancamaya RT 03 RW 03', '53162', 'Rancamaya', 'Cilongok', 'Banyumas', 'Jawa Tengah', '085229890664', 'juniorsaiful@gmail.com', 'SMA / SMK / Sederajat', NULL, NULL, 'Siti Munjiatun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3302171602051933', '3302171906900001', '96.795.088.2-521.000', '25158419629', '0001150128729', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2025-08-29', NULL, 'Kanwil', 'Officer', 'Operatinal', 'Banyumas', 'https://drive.google.com/open?id=1QJ7yODM7XRKPWY1srOylzz-pqyaSZV1t', 'https://drive.google.com/open?id=1zwEeTPNNZt4IkvXzW3rRqsP43IDXvfRd', NULL, 'https://drive.google.com/open?id=11AjSp-LhTxrEYJQLrpmPcY4R7Dni81yW', 36, 'PKWTT', NULL, 1, '2025-10-29 12:27:17+07'),
  ('25-0901', 'Mohammad Luqman Miftahul Murtadlo', 'Laki-laki', 'Banyumas', '1987-01-09', 'AB', 'Pasir Wetan RT 03 RW 02', '53174', 'Pasir Wetan', 'Karanglewas', 'Banyumas', 'Jawa Tengah', '085640343480', 'moh.luqman1987@gmail.com', 'SMA / SMK / Sederajat', NULL, NULL, 'Pariha', 'Galuh Kuntarso Setyowati', '1985-09-10', 'Mohammad Ghifari Ainul Murtadlo', '2020-11-06', NULL, NULL, NULL, NULL, NULL, NULL, '3302182811120001', '3302180901870003', '05.932.496.2-521.000', '25158419595', '0002519268412', 'Mandiri', NULL, NULL, NULL, 'Aktif', NULL, '2025-08-29', NULL, 'Kanwil', 'Pimpinan Cabang', NULL, 'Banyumas', 'https://drive.google.com/open?id=1iiQD4kuT_3juX6KeVLSsZDVkOxp8EngP', 'https://drive.google.com/open?id=1s6bnkemvS8Ez-9Pwdwpy_KvA-AErDCQ-', NULL, 'https://drive.google.com/open?id=1z5jsAs57eZaPTlhbL5LL8-oMkpAYNUbU', 39, 'PKWTT', NULL, 1, '2025-10-29 12:41:05+07'),
  ('23-0902', 'Suparno', 'Laki-laki', 'Sragen', '1972-04-08', 'AB', 'Kp.Karang Mulya Rt.008/008', '17510', 'Karang satria', 'Tambun utara', 'Bekasi', 'Jawa barat', '08161447657', 'fathindah699@gmail.com', 'Sarjana (S1)', 'Ips', NULL, 'Suyati', 'Sutarti', '1975-09-19', 'Ghina Rizkirabbani Labibah', '2004-09-03', NULL, NULL, NULL, NULL, NULL, NULL, '3216051912101170', '3216050804720009', '59.540.128.2-435.000', '24005522990', '0001802018081', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2023-09-01', NULL, 'OPERATION & PENGADAAN', 'Handling domestik', 'Operation Domestic', 'Sumarrecon', 'https://drive.google.com/open?id=13Gw_DIpc6EacZAVon_pZ2morUWj_PtJh', 'https://drive.google.com/open?id=11L_gVsJY2YuZ7yY9L84fYslUC3f2FQZ-', NULL, 'https://drive.google.com/open?id=12hirHsjqhKxn6x7aXAZpuNaLm_heeiBq', 54, 'PKWTT', NULL, 3, '2025-10-29 13:25:30+07'),
  ('25-0803', 'Hamid Pamungkas', 'Laki-laki', 'Sukoharjo', '1995-11-29', 'B', 'Banaran RT 02/01 Serut Nguter Sukoharjo', '57571', 'SERUT', 'NGUTER', 'SUKOHARJO', 'JAWA TENGAH', '085740306010', 'hamidpamungkas4@gmail.com', 'Sarjana (S1)', 'Pendidikan Bahasa dan Sastra Indonesia', NULL, 'NOOR WAQIAH SUPRIYATI', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3311051206070002', '3311052911950002', '90.661.352.6-532.000', '25158419678', '0001529805712', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2025-07-23', NULL, 'Kanwil', 'Officer', 'Administration', 'Sukoharjo', 'https://drive.google.com/open?id=1QSj7Gw7Enp1JJKR5jlf4omSbJDuN_r3x', 'https://drive.google.com/open?id=1p0yQomS2nLio-ZdcIh6v0tc-zuLT0xbi', NULL, 'https://drive.google.com/open?id=14BbTiBDsL0M1456fJaV_YVUWswN5Mqbv', 30, 'PKWTT', NULL, 1, '2025-10-29 13:47:18+07'),
  ('25-0802', 'Aan Syumardi', 'Laki-laki', 'PANDEGLANG', '1986-10-11', NULL, 'PANGTELU RT 002 RW 007', '57571', 'KEDUNGWINONG', 'NGUTER', 'SUKOHARJO', 'JAWA TENGAH', '0812-2683-1017', 'aansyumardi86@gmail.com', 'SMA / SMK / Sederajat', NULL, NULL, 'SUHAETI', 'WIWIK YULIANINGSIH', '1998-01-28', 'MUZAYYINIL MILLAH', '2017-04-11', 'SITI ANISATUL MARDIYYAH', '2021-09-22', NULL, NULL, NULL, NULL, '3521122910180003', '1301101110860005', '1301.1011.1086.0005', '25158419736', '0003039353234', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2025-07-27', NULL, 'Kanwil', 'Officer', 'Operational', 'Sukoharjo', 'https://drive.google.com/open?id=17bpLkpeJZ8pWcuHRiVvT1-7rUYjR26-N', NULL, NULL, 'https://drive.google.com/open?id=19cRSv5JeZG_RkP6XBOYdUL24bIwpNm_j', 40, 'PKWTT', NULL, 1, '2025-10-29 14:12:58+07'),
  ('25-0801', 'Muhammad Andika', 'Laki-laki', 'SUKOHARJO', '1984-02-12', 'O', 'KRAGILAN 002/006 KEDUNGWINONG', '57571', 'KEDUNGWINONG', 'NGUTER', 'SUKOHARJO', 'JAWA TENGAH', '0813133225251', 'andikamuhammad805@gmail.com', 'SMA / SMK / Sederajat', NULL, NULL, 'SURATMI', 'KARTIKA CANDRA WIDYANINGRUM', '1983-05-25', 'MUHAMMAD HARISUDDIN ASSIDQI', '2009-03-05', 'MUHAMMAD FATIH ASSIDQI', '2016-04-07', NULL, NULL, NULL, NULL, '3311050902090001', '3311051202840004', '24.570.670.0-532.000', '25158419660', '0002770443832', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2025-07-27', NULL, 'Kanwil', 'KEPALA CABANG', NULL, 'Sukoharjo', 'https://drive.google.com/open?id=1cmkxGNRASSMmXFwEnHOEzrrCtMheaUF1', 'https://drive.google.com/open?id=1QAZVv5i7ZtzX4Hk5FQl-RACG53yJIBf0', NULL, 'https://drive.google.com/open?id=1o7t9WExJ-bsI9tLNAFaoIUHbf0kW5Brp', 42, 'PKWTT', NULL, 1, '2025-10-30 10:06:49+07'),
  ('11-0301', 'Apipah', 'Perempuan', 'GRESIK', '1976-04-03', 'O', 'KARANG EMPAT GANG V NO. 25', '60133', 'PLOSO', 'TAMBAKSARI', 'SURABAYA', 'JAWA TIMUR', '081280010795', 'pipe.iksan@gmail.com', 'Sarjana (S1)', 'EKONOMI AKUNTANSI', NULL, 'SAPAATIN', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3578112904130005', '3578114304760001', '26.527.115.5-616.000', '16048466268', '0001658010969', 'Perusahaan Lain', NULL, NULL, NULL, 'Aktif', NULL, '2011-03-01', NULL, 'Kanwil', 'Officer', 'Administration', 'Surabaya', 'https://drive.google.com/open?id=1ZdgeZny3Tq4hRj-ST6UzqrDPudyGDAr_', 'https://drive.google.com/open?id=1acDxCXhlxrbxt42kYBQdnslN6R_dXUyQ', NULL, 'https://drive.google.com/open?id=1Qf4-DxUEpwev-04C1C6VQVI_Dc19OClU', 50, 'PKWTT', NULL, 15, '2025-10-30 12:05:55+07'),
  ('25-0228', 'Dea Esania Putri', 'Perempuan', 'Jakarta', '1999-04-10', 'AB', 'Jl. Bunga Matahari XIX, Perumahan Jatiwarna Indah, Blok S No. 1', '17415', 'Jatiwarna', 'Pondok Melati', 'Bekasi', 'Jawa Barat', '081311675810', 'desaniaputri@gmail.com', 'Sarjana (S1)', 'Ekonomi Pembangunan', NULL, 'Sintha Yunita', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3175105004990001', '3175105004990001', '31.751.050.0-499.0001', '25049917740', '0001371881834', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2024-02-28', NULL, 'SALES & MARKETING', 'Area Manajer', 'Market Reaserch & NPD', 'Pusat', 'https://drive.google.com/open?id=1jCN7fSJ-AqrqAw-Ix-Sx0uOZ2h7M_vYT', 'https://drive.google.com/open?id=1xYZe31UBprmn6uKapePO9fT_Tbbcvg4x', NULL, 'https://drive.google.com/open?id=15GFWjMfHm60bhSGHELYlNklo2vDVfwGU', 27, 'PKWTT', NULL, 2, '2025-10-30 14:49:33+07'),
  ('23-1201', 'Amir Yusuf Faisal', 'Laki-laki', 'Bekasi', '2000-02-01', NULL, 'Bekasi Timur Regensi, Blok U7 No 3', '17320', 'Burangkeng', 'Setu', 'Kabupaten Bekasi', 'Jawa Barat', '082213726554', 'amir@fathindah.id', 'Sarjana (S1)', 'Ilmu Komunikasi', NULL, 'Elis Sumarni', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3216182606120030', '3216180102000004', '20.929.257.2-413.000', '24093990778', '0001658010857', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2023-12-01', NULL, 'OPERATION & PENGADAAN', 'Manajer', 'Operatioan Arab Saudi', 'Sumarrecon', 'https://drive.google.com/open?id=1xbpFWcDbmVflbuS5M6jrO-Sp2xzbjo0t', 'https://drive.google.com/open?id=1lgaohWFZWiL55w6_F7RlANEQxMhCXESG', NULL, 'https://drive.google.com/open?id=1uZLY-leUOPvSCQ5sWY4-Q-mOPWDfMtN0', 26, 'PKWTT', NULL, 2, '2025-10-30 16:27:32+07'),
  ('24-0202', 'Imam Bukhori', 'Laki-laki', 'Jakarta', '1998-06-30', 'A', 'Bumi Anggrek Blok U No.126', '17510', 'Karangsatria', 'Tambun Utara', 'Kabupaten Bekasi', 'Jawa Barat', '085158989806', 'bukhorimam98@gmail.com', 'Sarjana (S1)', 'Pendidikan Matematika', NULL, 'Onie Riana', 'Dinda Lutfiyani', '2001-05-23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3216051411110095', '3216050506980004', '32.160.505.0-698.0004', '24093990786', '0000044325044', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2024-02-21', NULL, 'SALES & MARKETING', 'Manajer', 'Marketing', 'Pusat', 'https://drive.google.com/open?id=18shSZjo0WV9oOXisfXe2ZySzPYbfKmq7', 'https://drive.google.com/open?id=1wKSGPEmD5uI2d5kr420fIJtTn7lqzHox', NULL, 'https://drive.google.com/open?id=1XvxkKRtHc4eaRWkhn-UYn1ncFqemP_v_', 28, 'PKWTT', NULL, 2, '2025-10-31 11:18:42+07'),
  ('24-0201', 'Akhini Bihalalika', 'Perempuan', 'BEKASI', '1998-08-12', NULL, 'JL. NURUL IMAN RT.008 / RW. 001 NO. 11', '17145', 'JAKASAMPURNA', 'BEKASI BARAT', 'KOTA BEKASI', 'JAWA BARAT', '081290138213', 'bihalallika@gmail.com', 'SMA / SMK / Sederajat', 'AKUNTANSI', NULL, 'ASMUNIH', 'SEPTIAN ANGGA PRATAMA', '1998-09-13', 'CYRA MYSHA ELSHANUM', '2022-11-08', NULL, NULL, NULL, NULL, NULL, NULL, '3275022410230012', '3275024208980008', '76.670.923.2-427.000', '24093990794', '0002486611956', 'Kementerian/Lembaga Pemerindah/Daerah/Pusat', NULL, NULL, NULL, 'Aktif', NULL, '2024-02-01', NULL, 'FINANCE', 'Officer', 'Cash & Bank', 'Pusat', 'https://drive.google.com/open?id=1tzqeUD_RS4jSoD6Axj8eCtHxfVQXQv3Q', 'https://drive.google.com/open?id=1v2RNyzeOCbw0WdnmKar2XR3yLR4zqB1v', NULL, 'https://drive.google.com/open?id=1VDaqyiddtTTiGPASu36Lxp1Z8r6uvHiB', 28, 'PKWTT', NULL, 2, '2025-10-31 11:34:20+07'),
  ('19-0105', 'Betty Nurbaety', 'Perempuan', 'Jakarta', '1964-06-30', 'A', 'Jl. Harimau Raya H153 Pd.Timur Indah rt/rw.011/017', '17510', 'Jatimulya', 'Tambun Selatan', 'Bekasi', 'Jawa Barat', '081219397544', 'betty@fathindah.id', 'Sarjana (S1)', 'Ekonomi', NULL, 'SUPINAH', 'Hein Johny Syarif Sayangbati', '1964-10-08', 'Bion Aldo Syarif Sayangbati', '1992-01-18', 'Bion Lovia Tatcha Sayangbati', '1995-06-19', NULL, NULL, NULL, NULL, NULL, '3216067006640018', '47.034.566.1-432.000', '18022881546', '0001640287023', 'Fath Indah', NULL, NULL, NULL, 'Non Aktif', '2026-07-01', '2018-04-01', 'Pensiun', 'FINANCE', 'Manajer', 'Analysis & Reporting', 'Pusat', 'https://drive.google.com/open?id=1p3dbDB4evJyXzGFq2nRkz5VxPBSy19Qh', 'https://drive.google.com/open?id=1MvIOlf_Y6F1R-dcebTEiwSG2poqHi8hj', NULL, 'https://drive.google.com/open?id=1OAZrhzo0ALEVJXD2KMJZ7rDmi-xBsL_l', 62, 'PKWTT', NULL, 8, '2025-10-31 14:23:17+07'),
  ('23-0701', 'Rian Purnama Rasyid', 'Laki-laki', 'Bekasi', '1991-05-23', 'B', 'Kp, Bojong Gunung Putri RT 02 RW 06', '16961', 'Gunung Putri', 'Gunung Putri', 'Kabupaten Bogor', 'Jawa Barat', '085881633244', 'rianp1899@gmail.com', 'Sarjana (S1)', 'Teknik Industri', NULL, 'Euis Puspitawati', 'Hilda Fadzhilla', '2000-05-02', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3201023009250002', '3201022305910002', '85.047.227.5-403.000', '24005523014', '0002503065947', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2023-07-01', NULL, 'SALES & MARKETING', 'Officer', 'Pricing', 'Pusat', 'https://drive.google.com/open?id=1HKoQhW2JfqWfXxmuuY7g_oQ0_chaCfDS', 'https://drive.google.com/open?id=1zg5ynKA3vKg5n-r1s4XmZ8zcWVQG6anz', NULL, 'https://drive.google.com/open?id=122XAHAK7L5yl8AziVpx_Fe0JrReEaq29', 35, 'PKWTT', NULL, 3, '2025-10-31 14:40:01+07'),
  ('13-0101', 'Prastiyo', 'Laki-laki', 'Pati', '1991-12-25', 'B', 'Bekasi Timur Regensi 7 Cluster Bromelia Blok B6 No 2', '17320', 'Burangkeng', 'Setu', 'Bekasi', 'Jawa barat', '082310804240', 'tiyofathindah45@gmail.com', 'SMA / SMK / Sederajat', 'IPA', NULL, 'Rusmi', 'Tri lestari', '1995-01-01', 'Satria Rizky', '2013-02-09', 'Naufal Rafardhan Athalla', '2016-06-28', 'Almer Shaqil Alfarezek', '2021-07-18', NULL, NULL, '3216182511150005', '3216182512910009', '81.042.267.5-413.000', '24005522974', '0001894469771', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2013-01-01', NULL, 'OPERATION & PENGADAAN', 'Direktur', NULL, 'Sumarrecon', 'https://drive.google.com/open?id=10U1AYEJ_OPoW-CUbdz4Bj9oXXlONpjeq', 'https://drive.google.com/open?id=1xc9ZUSp0DmO7PuPL1VaIZAM08m-HBkMd', NULL, 'https://drive.google.com/open?id=1GgJTSJgIoTcNH0mEiAljV6n1RxkqNaI5', 34, 'PKWTT', NULL, 13, '2025-10-31 14:58:57+07'),
  ('25-0110', 'Hikmatulloh Ramadhan', 'Laki-laki', 'Kota Bekasi', '2000-12-10', 'O', 'Kp. karanggenteng Rt 001 / Rw 02', '43185', 'Desa Kalibunder', 'Kali Bunder', 'Kabupaten Sukabumi', 'Jawa Barat', '085759893173', 'hikmatulloh.fathindah@gmail.com', 'SMA / SMK / Sederajat', 'IPA', NULL, 'Erni Faizah', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3202230306140001', '3275111012010003', NULL, '25049917732', '0002770358409', 'Mandiri', NULL, NULL, NULL, 'Aktif', NULL, '2025-01-10', NULL, 'SALES & MARKETING', 'Officer', 'IS & Graphic Design', 'Pusat', 'https://drive.google.com/open?id=1plyBREG6S9jY7aldfySZ0YYb5oI3s81D', NULL, NULL, 'https://drive.google.com/open?id=19xFyyFiVpyDpcSJl93DOpkeHpvc6xxOg', 25, 'PKWTT', NULL, 1, '2025-11-07 11:28:11+07'),
  ('26-0103', 'Dwi Astri Wihastuti Intani', 'Perempuan', 'Pemalang', '2000-09-28', 'A', 'Jl Abdurrasyid Karang Bulu RT 02/03 Sima kec. Moga Kab. Pemalang, Prov. Jawa Tengah', '52354', 'Sima', 'Moga', 'Pemalang', 'Jawa Tengah', '088225120918', 'dwiastri373@gmail.com', 'Sarjana (S1)', 'Pendidikan Bahasa Inggris', NULL, 'Istikharoh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3327010411090011', '3327016809000004', '3327016809000004', '26072591717', '0000078836681', 'Lain-lain', NULL, NULL, NULL, 'Aktif', NULL, '2026-01-01', NULL, 'Kanwil', 'Officer', 'Administration', 'Pemalang', 'https://drive.google.com/open?id=1J8pO5FtvYfwxWiHpW3pmDV8lFjfiYX0l', 'https://drive.google.com/open?id=1gSAi-r-TQMpMO5UNKxi6HF1_oWl9Vlym', NULL, 'https://drive.google.com/open?id=1mR6MaaYbZQj3_LtlmlzU6CCyYheIthYD', 26, 'PKWTT', NULL, NULL, '2026-01-29 09:35:56+07'),
  ('26-0102', 'Firmanudin', 'Laki-laki', 'Pemalang', '1990-03-24', NULL, 'Pondoknangka barat rt 07 rw 02', '52356', 'Beluk', 'Belik', 'Pemalang', 'Jawa tengah', '082322541324', 'firmanarzk@gmail.com', 'SMA / SMK / Sederajat', 'Pondok pesantren A.P.I Tegalrejo Magelang', NULL, 'Khalimah', 'Dairoh', '1998-08-10', 'Muhammad arzaq naf''ul khobir', '2016-03-28', 'Syakira najwa handayani', '2023-10-08', NULL, NULL, NULL, NULL, '3327031406160006', '3327022403900004', NULL, '26072591709', '0003348780625', 'Kementerian/Lembaga Pemerindah/Daerah/Pusat', NULL, NULL, NULL, 'Aktif', NULL, '2026-01-01', NULL, 'Kanwil', 'Oprasional', 'Operation', 'Pemalang', 'https://drive.google.com/open?id=1ZSUHHTiBTQZfk0fBLXVfWXBrSvVsa1Kb', NULL, NULL, 'https://drive.google.com/open?id=13XJnDuakglDW0Nc4Tcxf6NsZIZJ34-6B', 36, 'PKWTT', NULL, NULL, '2026-02-05 11:32:12+07'),
  ('26-0101', 'Aminul Fikar Masruri', 'Laki-laki', 'Pemalang', '1984-04-17', NULL, 'Manadiraja RT 06/01 Kec. moga Kab. Pemalang, Provinsi Jawa Tengah', '52354', 'Mandiraja', 'Moga', 'Pemalang', 'Jawa Tengah', '085226062979', NULL, 'Sarjana (S1)', NULL, NULL, 'Qa''yunin', 'Vina Afiatul Khusna', '1987-09-10', 'M. Mirzihim Kafabih', '2009-04-11', 'Hanun Zuhrufia Al Amin', '2015-05-08', NULL, NULL, NULL, NULL, '3327011904120001', '3327011704840009', '70.658.746.4-502.000', NULL, '0001801310174', 'SMA Muhammadiyah', NULL, NULL, NULL, 'Aktif', NULL, '2026-01-01', NULL, 'Kanwil', 'Kepala Cabang Pemalang', 'Kepala Cabang', 'Pemalang', 'https://drive.google.com/open?id=1XRo3If6L6UWK726ETYld75B1_hRRzRlC', 'https://drive.google.com/open?id=1EZ7vO6_yC9vcTKjCqsOp9wsk7VzsvaW6', NULL, 'https://drive.google.com/open?id=1EZECG_V46KgzIaNtB4zS9oDARAuRThJN', 42, 'PKWTT', NULL, NULL, '2026-02-06 09:27:15+07'),
  ('26-0201', 'Sabilla Widiyanti', 'Perempuan', 'Bekasi', '1998-02-15', 'B', 'Perumahan Bumi Anggrek JKL blok K no 17-18', '17510', 'Karang Satria', 'Tambun Utara', 'Kabupaten Bekasi', 'Jawa Barat', '081387870445', 'sabillawidiyanti98@gmail.com', 'Sarjana (S1)', 'Accounting', NULL, 'Neneng Prihatin', 'Qa''qa Zaky Fadhilah', '1997-05-10', 'Muhammad Triosaqa Al Fadhilah', '2025-10-03', NULL, NULL, NULL, NULL, NULL, NULL, '3275031402250001', '3275025502980011', '94.194.492.8-427.000', '26090343661', '0001658010903', 'Fath Indah', NULL, NULL, NULL, 'Aktif', NULL, '2026-02-05', NULL, 'Finance', 'Officer', 'Cost Control & Analyst', 'Pusat', 'https://drive.google.com/open?id=1_Kbdw_TYUCSBfMUnDNiZNGTQ3ilFsKFR', 'https://drive.google.com/open?id=1lu7p2D9pOEjw6LFDxV6elBCypU2RocP6', NULL, 'https://drive.google.com/file/d/1fY1rvBpiaVkLThpZq1acxFES_U-C_bV-/view?usp=drivesdk', 28, 'PKWTT', NULL, NULL, '2026-02-09 11:45:57+07'),
  ('26-0701', 'Bagas Rahmat Dani', 'Laki-laki', 'Bekasi', '2006-12-09', 'O', 'Perumahan Taman Raya Blok C4 NO. 16', '17510', 'Mangun Jaya', 'Tambun Selatan', 'Bekasi', 'Jawa Barat', '081211947505', 'bagasrahmatdani18@gmail.com', 'SMA / SMK / Sederajat', 'Ilmu Pengetahuan Alam', NULL, 'Margiyanti', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3216060412120191', '3216060912060016', '3216 0609 1206 0016', NULL, '0001636163774', 'Mandiri', NULL, NULL, NULL, 'Aktif', NULL, '2026-07-03', NULL, 'OPERATION & PENGADAAN', 'Staff Perlengkapan', 'Pengadaan', 'Sumarrecon', 'https://drive.google.com/open?id=19f4S5yBDd0es8KxN0LIu4lIt8UQXKh_a', 'https://drive.google.com/file/d/1W1GBHWGDn7tWP1IkjHync873zg8aoe3G/view?usp=drivesdk', NULL, 'https://drive.google.com/open?id=1wsgUYAJwDV-MwL0slaX-roDfjwOvDyWL', 19, 'PKWT', '2027-01-03', NULL, '2026-07-20 13:58:16+07'),
  ('26-0801', 'ANDINI RIZKY WIJANARKO', 'Perempuan', 'JAKARTA', '1989-01-17', 'O', 'PERUM BALI RESORT CLUSTER KINTAMANI BLOK KE 06, BOGOR', '16310', 'BANTAR JAYA', 'RANCA BUNGUR', 'KABUPATEN BOGOR', 'JAWA BARAT', '085717681184', 'andinirizkyw@gmail.com', 'Sarjana (S1)', 'ILMU MANAGEMENT KOMUNIKASI', 'UNIVERSITAS PADJADJARAN BANDUNG', 'DJUMAINI', 'ADHIGUNA WICAKSONO', '1989-03-03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3201342912230002', '3216055701890003', '552210296435000', '13022939204', '1622573559', 'Mandiri', 'ANDINI RIZKY WIJANARKO', 'BCA', '662358078', 'Aktif', NULL, '2026-08-26', NULL, 'Finance', 'Officer', 'Account Recievable', 'Pusat', 'https://drive.google.com/file/d/1us88sE_m7kkklsrbq1r-HqrIvcDrWCsW/view?usp=drivesdk', 'https://drive.google.com/file/d/1Gnv3G3JSyC6fjH5W3Nj8jgZR2Gw1tNg2/view?usp=drivesdk', 'https://drive.google.com/file/d/1Wevp-gND9ljVQWxc72ymBas9VVmkatqQ/view?usp=drivesdk', 'https://drive.google.com/file/d/1KDoWZPtKuRU0Gog3iJIBHJ9Ba-YRHJIg/view?usp=drivesdk', 37, 'PKWT', '2027-02-26', NULL, '2026-08-26 13:34:34+07')
ON CONFLICT ("nik") DO UPDATE SET
    "nama_karyawan" = EXCLUDED."nama_karyawan",
    "jenis_kelamin" = EXCLUDED."jenis_kelamin",
    "tempat_lahir" = EXCLUDED."tempat_lahir",
    "tanggal_lahir" = EXCLUDED."tanggal_lahir",
    "golongan_darah" = EXCLUDED."golongan_darah",
    "alamat" = EXCLUDED."alamat",
    "kode_pos" = EXCLUDED."kode_pos",
    "kelurahan" = EXCLUDED."kelurahan",
    "kecamatan" = EXCLUDED."kecamatan",
    "kota_kabupaten" = EXCLUDED."kota_kabupaten",
    "provinsi" = EXCLUDED."provinsi",
    "nomor_hp" = EXCLUDED."nomor_hp",
    "email" = EXCLUDED."email",
    "pendidikan_terakhir" = EXCLUDED."pendidikan_terakhir",
    "jurusan" = EXCLUDED."jurusan",
    "lembaga_pendidikan" = EXCLUDED."lembaga_pendidikan",
    "nama_ibu_kandung" = EXCLUDED."nama_ibu_kandung",
    "nama_pasangan" = EXCLUDED."nama_pasangan",
    "tgl_lahir_pasangan" = EXCLUDED."tgl_lahir_pasangan",
    "anak_1_nama" = EXCLUDED."anak_1_nama",
    "anak_1_tgl_lahir" = EXCLUDED."anak_1_tgl_lahir",
    "anak_2_nama" = EXCLUDED."anak_2_nama",
    "anak_2_tgl_lahir" = EXCLUDED."anak_2_tgl_lahir",
    "anak_3_nama" = EXCLUDED."anak_3_nama",
    "anak_3_tgl_lahir" = EXCLUDED."anak_3_tgl_lahir",
    "anak_4_nama" = EXCLUDED."anak_4_nama",
    "anak_4_tgl_lahir" = EXCLUDED."anak_4_tgl_lahir",
    "no_kk" = EXCLUDED."no_kk",
    "no_ktp" = EXCLUDED."no_ktp",
    "npwp" = EXCLUDED."npwp",
    "bpjs_ketenagakerjaan" = EXCLUDED."bpjs_ketenagakerjaan",
    "bpjs_kesehatan" = EXCLUDED."bpjs_kesehatan",
    "penanggung_bpjs" = EXCLUDED."penanggung_bpjs",
    "bank_atas_nama" = EXCLUDED."bank_atas_nama",
    "nama_bank" = EXCLUDED."nama_bank",
    "no_rekening" = EXCLUDED."no_rekening",
    "status" = EXCLUDED."status",
    "tanggal_input" = EXCLUDED."tanggal_input",
    "tanggal_masuk" = EXCLUDED."tanggal_masuk",
    "keterangan" = EXCLUDED."keterangan",
    "divisi" = EXCLUDED."divisi",
    "jabatan" = EXCLUDED."jabatan",
    "fungsional" = EXCLUDED."fungsional",
    "kantor" = EXCLUDED."kantor",
    "upload_ktp" = EXCLUDED."upload_ktp",
    "upload_npwp" = EXCLUDED."upload_npwp",
    "upload_kk" = EXCLUDED."upload_kk",
    "upload_foto" = EXCLUDED."upload_foto",
    "umur" = EXCLUDED."umur",
    "status_emp" = EXCLUDED."status_emp",
    "evaluasi" = EXCLUDED."evaluasi",
    "masa_kerja" = EXCLUDED."masa_kerja";
