
-- =========================================================================
-- 10. TABEL BIO KARYAWAN (Bio_Karyawan) DARI GOOGLE SHEET "Bio Karyawan"
-- Spreadsheet ID: 1VL8trcMIcZ6n5Be-2-9YwmC1pOsKliO_wbILmU_cC1s
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
