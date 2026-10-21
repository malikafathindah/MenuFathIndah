-- =========================================================================
-- HR & KARYAWAN SUITE SUPABASE SCHEMA MIGRATION
-- Modul:
--   1. mod_bio_karyawan   (Tabel "Bio_Karyawan")
--   2. mod_daftar_karyawan (Tabel "Bio_Karyawan")
--   3. mod_data_attendance (Tabel "data_absensi" / "Data Absensi")
--   4. mod_upload_dok     (Tabel "upload_dok" / "UploadDok")
--   5. mod_detail_emp     (Tabel "Bio_Karyawan")
--   6. mod_emp_analytics  (Tabel "Bio_Karyawan" & "data_absensi")
--   7. mod_slip_gaji      (Tabel "slip_gaji" / "Slip Gaji")
-- =========================================================================

-- 1. EXTEND TABEL "Bio_Karyawan" DENGAN KOLOM DETAIL BIODATA LENGKAP
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
    "status_emp" VARCHAR(50) DEFAULT 'PKWTT',
    "alamat" TEXT,
    "tempat_lahir" VARCHAR(100),
    "tanggal_lahir" DATE,
    "agama" VARCHAR(50) DEFAULT 'Islam',
    "status_nikah" VARCHAR(50) DEFAULT 'Menikah',
    "pendidikan_terakhir" VARCHAR(100),
    "rt_rw" VARCHAR(50),
    "kelurahan" VARCHAR(100),
    "kecamatan" VARCHAR(100),
    "kota_kabupaten" VARCHAR(100),
    "provinsi" VARCHAR(100),
    "kode_pos" VARCHAR(20),
    "no_ktp" VARCHAR(50),
    "no_kk" VARCHAR(50),
    "npwp" VARCHAR(50),
    "bpjs_kesehatan" VARCHAR(50),
    "bpjs_ketenagakerjaan" VARCHAR(50),
    "tanggal_masuk" DATE DEFAULT CURRENT_DATE,
    "kontak_darurat_nama" VARCHAR(150),
    "kontak_darurat_hp" VARCHAR(50),
    "kontak_darurat_hubungan" VARCHAR(50),
    "foto_url" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Penambahan kolom pada Bio_Karyawan jika tabel sudah dibuat sebelumnya
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "tempat_lahir" VARCHAR(100);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "tanggal_lahir" DATE;
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "agama" VARCHAR(50) DEFAULT 'Islam';
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "status_nikah" VARCHAR(50) DEFAULT 'Menikah';
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "pendidikan_terakhir" VARCHAR(100);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "rt_rw" VARCHAR(50);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "kelurahan" VARCHAR(100);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "kecamatan" VARCHAR(100);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "kota_kabupaten" VARCHAR(100);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "provinsi" VARCHAR(100);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "kode_pos" VARCHAR(20);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "no_ktp" VARCHAR(50);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "no_kk" VARCHAR(50);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "npwp" VARCHAR(50);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "bpjs_kesehatan" VARCHAR(50);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "bpjs_ketenagakerjaan" VARCHAR(50);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "tanggal_masuk" DATE DEFAULT CURRENT_DATE;
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "kontak_darurat_nama" VARCHAR(150);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "kontak_darurat_hp" VARCHAR(50);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "kontak_darurat_hubungan" VARCHAR(50);
ALTER TABLE "Bio_Karyawan" ADD COLUMN IF NOT EXISTS "foto_url" TEXT;

-- 2. TABEL DATA ABSENSI (data_absensi / Data Absensi)
CREATE TABLE IF NOT EXISTS "data_absensi" (
    "id" VARCHAR(100) PRIMARY KEY,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "nama_karyawan" VARCHAR(200) NOT NULL,
    "nik" VARCHAR(50),
    "tipe" VARCHAR(50) DEFAULT 'Masuk',
    "kode" VARCHAR(20) DEFAULT 'H',
    "link_maps" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABEL UPLOAD DOKUMEN KARYAWAN (upload_dok / UploadDok)
CREATE TABLE IF NOT EXISTS "upload_dok" (
    "id" VARCHAR(100) PRIMARY KEY,
    "doc_id" VARCHAR(100),
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "nama_karyawan" VARCHAR(200) NOT NULL,
    "nik" VARCHAR(50),
    "jenis_dokumen" VARCHAR(100) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_id" VARCHAR(150),
    "uploader" VARCHAR(150) DEFAULT 'admin',
    "keterangan" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABEL SLIP GAJI (slip_gaji / Slip Gaji)
CREATE TABLE IF NOT EXISTS "slip_gaji" (
    "id" VARCHAR(100) PRIMARY KEY,
    "file_id" VARCHAR(150),
    "file_name" VARCHAR(255) NOT NULL,
    "nama_karyawan" VARCHAR(200) NOT NULL,
    "nik" VARCHAR(50),
    "bulan" VARCHAR(20),
    "tahun" VARCHAR(10),
    "file_url" TEXT NOT NULL,
    "embed_url" TEXT,
    "download_url" TEXT,
    "size" VARCHAR(50),
    "tanggal_upload" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- INDEXES FOR PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_data_absensi_nik ON "data_absensi"("nik");
CREATE INDEX IF NOT EXISTS idx_data_absensi_nama ON "data_absensi"("nama_karyawan");
CREATE INDEX IF NOT EXISTS idx_data_absensi_ts ON "data_absensi"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_upload_dok_nik ON "upload_dok"("nik");
CREATE INDEX IF NOT EXISTS idx_upload_dok_nama ON "upload_dok"("nama_karyawan");
CREATE INDEX IF NOT EXISTS idx_upload_dok_jenis ON "upload_dok"("jenis_dokumen");
CREATE INDEX IF NOT EXISTS idx_slip_gaji_nik ON "slip_gaji"("nik");
CREATE INDEX IF NOT EXISTS idx_slip_gaji_nama ON "slip_gaji"("nama_karyawan");
CREATE INDEX IF NOT EXISTS idx_slip_gaji_periode ON "slip_gaji"("tahun", "bulan");

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- =========================================================================
ALTER TABLE "Bio_Karyawan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "data_absensi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "upload_dok" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "slip_gaji" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all on Bio_Karyawan" ON "Bio_Karyawan";
CREATE POLICY "Allow public all on Bio_Karyawan" ON "Bio_Karyawan" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on data_absensi" ON "data_absensi";
CREATE POLICY "Allow public all on data_absensi" ON "data_absensi" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on upload_dok" ON "upload_dok";
CREATE POLICY "Allow public all on upload_dok" ON "upload_dok" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on slip_gaji" ON "slip_gaji";
CREATE POLICY "Allow public all on slip_gaji" ON "slip_gaji" FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- GRANT PERMISSIONS TO SUPABASE ROLES (anon, authenticated, service_role)
-- =========================================================================
GRANT ALL ON TABLE "Bio_Karyawan" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "data_absensi" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "upload_dok" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "slip_gaji" TO anon, authenticated, service_role;

-- =========================================================================
-- VIEWS / ALIASES
-- =========================================================================
CREATE OR REPLACE VIEW "bio_karyawan" AS SELECT * FROM "Bio_Karyawan";
CREATE OR REPLACE VIEW "Bio Karyawan" AS SELECT * FROM "Bio_Karyawan";
CREATE OR REPLACE VIEW "Data Absensi" AS SELECT * FROM "data_absensi";
CREATE OR REPLACE VIEW "UploadDok" AS SELECT * FROM "upload_dok";
CREATE OR REPLACE VIEW "Slip Gaji" AS SELECT * FROM "slip_gaji";

GRANT ALL ON "bio_karyawan" TO anon, authenticated, service_role;
GRANT ALL ON "Bio Karyawan" TO anon, authenticated, service_role;
GRANT ALL ON "Data Absensi" TO anon, authenticated, service_role;
GRANT ALL ON "UploadDok" TO anon, authenticated, service_role;
GRANT ALL ON "Slip Gaji" TO anon, authenticated, service_role;

-- =========================================================================
-- SEED DATA CONTOH UNTUK LOG ABSENSI, UPLOAD DOKUMEN & SLIP GAJI
-- =========================================================================

-- Sample Log Absensi Karyawan
INSERT INTO "data_absensi" ("id", "timestamp", "nama_karyawan", "nik", "tipe", "kode", "link_maps", "catatan")
VALUES
  ('ABS-20261021-001', '2026-10-21 07:45:12+07', 'Kadari', '19-0101', 'Masuk', 'H', 'https://www.google.com/maps?q=-6.2088,106.8456', 'Presensi Kantor Pusat'),
  ('ABS-20261021-002', '2026-10-21 07:55:00+07', 'Miftahul Maulana', '25-0501', 'Masuk', 'H', 'https://www.google.com/maps?q=-6.3021,106.7589', 'Presensi Tepat Waktu'),
  ('ABS-20261021-003', '2026-10-21 08:02:15+07', 'Siska Kartika', '16-0401', 'Masuk', 'H', 'https://www.google.com/maps?q=-6.2088,106.8456', 'Presensi Area Sales'),
  ('ABS-20261021-004', '2026-10-21 08:15:30+07', 'Siti Azizah Salamah', '24-0101', 'Masuk', 'H', 'https://www.google.com/maps?q=-0.5021,117.1536', 'Cabang Samarinda'),
  ('ABS-20261021-005', '2026-10-21 08:30:00+07', 'Samsudin', '22-0101', 'Dinas', 'P', 'https://www.google.com/maps?q=-6.2255,106.9982', 'Dinas Perlengkapan Summarecon'),
  ('ABS-20261021-006', '2026-10-21 08:45:10+07', 'Lisa Nur Savitri', '25-0825', 'Masuk', 'H', 'https://www.google.com/maps?q=-6.2255,106.9982', 'Kantor Summarecon Finance'),
  ('ABS-20261021-007', '2026-10-21 09:00:00+07', 'Mohammad Luqman Miftahul Murtadlo', '25-0901', 'Masuk', 'H', 'https://www.google.com/maps?q=-7.4243,109.2302', 'Cabang Banyumas')
ON CONFLICT ("id") DO NOTHING;

-- Sample Dokumen Karyawan
INSERT INTO "upload_dok" ("id", "doc_id", "timestamp", "nama_karyawan", "nik", "jenis_dokumen", "file_name", "file_url", "file_id", "uploader", "keterangan")
VALUES
  ('DOK-001', 'DOC-KTP-19-0101', '2026-08-24 10:15:00+07', 'Kadari', '19-0101', 'KTP', 'KTP - Kadari.pdf', 'https://drive.google.com/drive/folders/1bFKhZU6i04YF00mpxCZkbI8_va-pmsbt', '1bFKhZU6i04YF00mpxCZkbI8_va-pmsbt', 'HRD', 'Kartu Tanda Penduduk'),
  ('DOK-002', 'DOC-KK-25-0501', '2026-08-25 11:20:00+07', 'Miftahul Maulana', '25-0501', 'Kartu Keluarga (KK)', 'KK - Miftahul Maulana.pdf', 'https://drive.google.com/drive/folders/1JaxYGzqSZyMFH13x4OoFmht-2uDI67w5', '1JaxYGzqSZyMFH13x4OoFmht-2uDI67w5', 'HRD', 'Kartu Keluarga'),
  ('DOK-003', 'DOC-NPWP-16-0401', '2026-08-26 14:00:00+07', 'Siska Kartika', '16-0401', 'NPWP', 'NPWP - Siska Kartika.pdf', 'https://drive.google.com/drive/folders/112RfJNbaV1YNCgYw6mSWKoX3zgCvmyh7', '112RfJNbaV1YNCgYw6mSWKoX3zgCvmyh7', 'HRD', 'NPWP Karyawan'),
  ('DOK-004', 'DOC-KONTRAK-24-0801', '2026-09-01 09:30:00+07', 'Eko Prasetyo', '24-0801', 'Kontrak Kerja', 'Kontrak Kerja - Eko Prasetyo.pdf', 'https://drive.google.com/drive/folders/1qbq99TgCc6-V0w0V_c-ZPXM1uVSqeZvm', '1qbq99TgCc6-V0w0V_c-ZPXM1uVSqeZvm', 'HRD', 'Perjanjian Kerja PKWTT')
ON CONFLICT ("id") DO NOTHING;

-- Sample Slip Gaji
INSERT INTO "slip_gaji" ("id", "file_id", "file_name", "nama_karyawan", "nik", "bulan", "tahun", "file_url", "embed_url", "download_url", "size")
VALUES
  ('SLIP-2026-09-01', '1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', 'Slip Gaji September 2026 - Kadari.pdf', 'Kadari', '19-0101', 'September', '2026', 'https://drive.google.com/drive/folders/1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', 'https://drive.google.com/file/d/1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-/preview', 'https://drive.google.com/uc?export=download&id=1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', '245 KB'),
  ('SLIP-2026-09-02', '1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', 'Slip Gaji September 2026 - Miftahul Maulana.pdf', 'Miftahul Maulana', '25-0501', 'September', '2026', 'https://drive.google.com/drive/folders/1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', 'https://drive.google.com/file/d/1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-/preview', 'https://drive.google.com/uc?export=download&id=1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', '238 KB'),
  ('SLIP-2026-09-03', '1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', 'Slip Gaji September 2026 - Siska Kartika.pdf', 'Siska Kartika', '16-0401', 'September', '2026', 'https://drive.google.com/drive/folders/1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', 'https://drive.google.com/file/d/1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-/preview', 'https://drive.google.com/uc?export=download&id=1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', '250 KB'),
  ('SLIP-2026-09-04', '1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', 'Slip Gaji September 2026 - Samsudin.pdf', 'Samsudin', '22-0101', 'September', '2026', 'https://drive.google.com/drive/folders/1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', 'https://drive.google.com/file/d/1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-/preview', 'https://drive.google.com/uc?export=download&id=1fXIwxUVijMdQ3urXKmqP1zDdI0e695Z-', '220 KB')
ON CONFLICT ("id") DO NOTHING;
