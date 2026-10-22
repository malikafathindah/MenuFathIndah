-- ============================================================================
-- SUPABASE MIGRATION SCRIPT: MODUL UMRAH PT. FATH INDAH TRAVEL SERVICE
-- Modul:
-- 1. mod_upload_dok_jamaah (Tabel: upload_dok_jamaah)
-- 2. mod_kelengkapan_umrah  (Tabel: kelengkapan_umrah)
-- 3. mod_data_jamaah & mod_form_input_jamaah (Tabel: jamaah)
-- 4. mod_pembayaran_group  (Tabel: data_pembayaran_group, data_koordinator_grup, history_pembayaran)
-- ============================================================================

-- 1. TABEL UPLOAD DOKUMEN JAMAAH (mod_upload_dok_jamaah)
CREATE TABLE IF NOT EXISTS public.upload_dok_jamaah (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  docid TEXT,
  timestamp TEXT,
  id_jamaah TEXT,
  nama_lengkap TEXT,
  jenis_dokumen TEXT,
  nama_file TEXT,
  link_file TEXT,
  file_id TEXT,
  uploader TEXT,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_dok_jamaah_id ON public.upload_dok_jamaah(id_jamaah);
CREATE INDEX IF NOT EXISTS idx_upload_dok_jamaah_docid ON public.upload_dok_jamaah(docid);

ALTER TABLE public.upload_dok_jamaah ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Penuh upload_dok_jamaah" ON public.upload_dok_jamaah;
CREATE POLICY "Akses Penuh upload_dok_jamaah" ON public.upload_dok_jamaah FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.upload_dok_jamaah TO anon, authenticated, service_role;

-- 2. TABEL KOORDINATOR GRUP (mod_pembayaran_group)
CREATE TABLE IF NOT EXISTS public.data_koordinator_grup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_koordinator TEXT,
  nama_koordinator TEXT,
  no_ktp TEXT,
  no_hp TEXT,
  alamat TEXT,
  list_jamaah_json TEXT,
  timestamp TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.data_koordinator_grup ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Penuh data_koordinator_grup" ON public.data_koordinator_grup;
CREATE POLICY "Akses Penuh data_koordinator_grup" ON public.data_koordinator_grup FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.data_koordinator_grup TO anon, authenticated, service_role;

-- 3. TABEL DATA PEMBAYARAN GROUP (mod_pembayaran_group)
CREATE TABLE IF NOT EXISTS public.data_pembayaran_group (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_group_payment TEXT,
  waktu_transaksi TEXT,
  tanggal_bayar TEXT,
  nama_koordinator TEXT,
  no_ktp_koordinator TEXT,
  no_hp_koordinator TEXT,
  total_nominal NUMERIC,
  metode_pembayaran TEXT,
  bank_asal TEXT,
  bank_tujuan TEXT,
  no_referensi TEXT,
  bukti_bayar TEXT,
  list_id_jamaah TEXT,
  rincian_alokasi_json TEXT,
  diskon_kolektif NUMERIC DEFAULT 0,
  catatan TEXT,
  user_input TEXT,
  status TEXT DEFAULT 'Verified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.data_pembayaran_group ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Penuh data_pembayaran_group" ON public.data_pembayaran_group;
CREATE POLICY "Akses Penuh data_pembayaran_group" ON public.data_pembayaran_group FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.data_pembayaran_group TO anon, authenticated, service_role;

-- 4. INSERT SEED DATA DARI GOOGLE SHEETS

-- Seed upload_dok_jamaah
INSERT INTO public.upload_dok_jamaah (docid, timestamp, id_jamaah, nama_lengkap, jenis_dokumen, nama_file, link_file, file_id, uploader, keterangan)
VALUES
  ('DOCJ-0001-643', '2026-10-12 13:33:53', 'JM-2026-0103', 'Miftahul M', 'KTP', 'JM-2026-0103 - Miftahul M - KTP.png', 'https://drive.google.com/file/d/1YbL2brzAMHoAjQn49ejWG2-mVL3065WE/view?usp=drivesdk', '1YbL2brzAMHoAjQn49ejWG2-mVL3065WE', 'Admin', 'Diunggah bersamaan dengan Form Input Jamaah'),
  ('DOCJ-0002-671', '2026-10-12 13:33:55', 'JM-2026-0103', 'Miftahul M', 'Paspor', 'JM-2026-0103 - Miftahul M - Paspor.png', 'https://drive.google.com/file/d/14gCi_F9wBs2k3ao0JExpAiWwn9uwfrYH/view?usp=drivesdk', '14gCi_F9wBs2k3ao0JExpAiWwn9uwfrYH', 'Admin', 'Diunggah bersamaan dengan Form Input Jamaah'),
  ('DOCJ-0003-870', '2026-10-12 13:33:58', 'JM-2026-0103', 'Miftahul M', 'Surat Nikah', 'JM-2026-0103 - Miftahul M - Surat Nikah.png', 'https://drive.google.com/file/d/1B3pXqFwkI-nNsrNecH9YztyfN2X9P2o4/view?usp=drivesdk', '1B3pXqFwkI-nNsrNecH9YztyfN2X9P2o4', 'Admin', 'Diunggah bersamaan dengan Form Input Jamaah'),
  ('DOCJ-0004-466', '2026-10-12 13:34:00', 'JM-2026-0103', 'Miftahul M', 'Foto Jamaah', 'JM-2026-0103 - Miftahul M - Foto Jamaah.png', 'https://drive.google.com/file/d/1AK6A_t50EzrPhqCjb-1XNNWUvG-VREI7/view?usp=drivesdk', '1AK6A_t50EzrPhqCjb-1XNNWUvG-VREI7', 'Admin', 'Diunggah bersamaan dengan Form Input Jamaah'),
  ('DOCJ-0005-172', '2026-10-12 13:34:02', 'JM-2026-0103', 'Miftahul M', 'Kartu Keluarga', 'JM-2026-0103 - Miftahul M - Kartu Keluarga.png', 'https://drive.google.com/file/d/1a9PwvmsjhIsxxhFhgRnKgKo7iBxAC-8o/view?usp=drivesdk', '1a9PwvmsjhIsxxhFhgRnKgKo7iBxAC-8o', 'Admin', 'Diunggah bersamaan dengan Form Input Jamaah'),
  ('DOCJ-0006-284', '2026-10-12 13:34:04', 'JM-2026-0103', 'Miftahul M', 'Upload Bukti Transfer', 'JM-2026-0103 - Miftahul M - Upload Bukti Transfer.png', 'https://drive.google.com/file/d/1cID5XIPjG4mAa6I5BeOdCsfgTpGphR3H/view?usp=drivesdk', '1cID5XIPjG4mAa6I5BeOdCsfgTpGphR3H', 'Admin', 'Diunggah bersamaan dengan Form Input Jamaah'),
  ('DOCJ-0007-926', '2026-10-12 13:35:53', 'JM-2026-0103', 'Miftahul M', 'Bukti Transfer', 'KWT-2026-0007 - Miftahul M.pdf', 'https://drive.google.com/file/d/1xQKE88Up8V-7FODmzSjbedc91mvAcZmm/view?usp=drivesdk', '1xQKE88Up8V-7FODmzSjbedc91mvAcZmm', 'Admin', 'Bukti Transfer Pembayaran Kwitansi KWT-2026-0007'),
  ('DOCJ-0008-613', '2026-10-15 17:05:14', 'JM-2026-0097', 'Jamaah Tanpa Nama', 'Foto Jamaah', 'JM-2026-0097 - Jamaah Tanpa Nama - Foto Jamaah.jpeg', 'https://drive.google.com/file/d/14QKrj0YFvglbSYO7RogUx0DoqJgTf2Xd/view?usp=drivesdk', '14QKrj0YFvglbSYO7RogUx0DoqJgTf2Xd', 'admin', NULL);

-- Seed data_koordinator_grup
INSERT INTO public.data_koordinator_grup (id_koordinator, nama_koordinator, no_ktp, no_hp, alamat, list_jamaah_json, timestamp, status)
VALUES
  ('KOOR-261009-001', 'miftah', NULL, NULL, NULL, '[{"jenisPaket":"TOPAZ SUHEM","namaJamaah":"KARTIKA CANDRA WIDYANINGRUM","idJamaah":"JM-2026-0072"},{"idJamaah":"JM-2025-0001","namaJamaah":"Dedi Rosadi","jenisPaket":"Topaz"},{"idJamaah":"JM-2025-0025","namaJamaah":"MUHAMMAD ANDIKA","jenisPaket":"SUHEM"}]', '2026-10-09 10:04:21', 'Active'),
  ('KOOR-261009-002', 'bbbbb', NULL, NULL, NULL, '[{"idJamaah":"JM-2025-0004","jenisPaket":"TOPAZ","namaJamaah":"DULAH MIHARJO"}]', '2026-10-09 9:49:17', 'Active'),
  ('KOOR-261009-003', 'radi', NULL, NULL, NULL, '[{"jenisPaket":"Sapphire","namaJamaah":"Dea Esania Putri","idJamaah":"JM-2026-0013"}]', '2026-10-09 10:02:34', 'Active');

-- Seed data_pembayaran_group
INSERT INTO public.data_pembayaran_group (id_group_payment, waktu_transaksi, tanggal_bayar, nama_koordinator, no_ktp_koordinator, no_hp_koordinator, total_nominal, metode_pembayaran, bank_asal, bank_tujuan, no_referensi, bukti_bayar, list_id_jamaah, rincian_alokasi_json, diskon_kolektif, catatan, user_input, status)
VALUES
  ('GRP-PAY-261009-0001', '2026-10-09 9:48:09', '2026-10-09', 'KOOR-261009-001', 'miftah', '20000000', 0, NULL, NULL, NULL, NULL, 'JM-2026-0072, JM-2025-0001', '{"JM-2026-0072":10000000,"JM-2025-0001":10000000}', '0', 0, 'Admin', 'Verified', 'Verified'),
  ('GRP-PAY-261009-0002', '2026-10-09 9:49:37', '2026-10-09', 'KOOR-261009-002', 'bbbbb', '8000000', 0, NULL, NULL, NULL, NULL, 'JM-2025-0004', '{"JM-2025-0004":8000000}', '0', 0, 'Admin', 'Verified', 'Verified'),
  ('GRP-PAY-261012-0001', '2026-10-12 12:28:30', '2026-10-12', 'Ust Aan', 'SAPPHIRE SUHEM', '100000000', 0, NULL, NULL, NULL, 'https://drive.google.com/file/d/1F0llry_Yj-UdzGmJZbIOaDhpwxcwWEOD/view?usp=drivesdk', 'JM-2026-0087, JM-2026-0088', '{"JM-2026-0087":50000000,"JM-2026-0088":50000000}', '0', 0, 'Admin', 'Verified', 'Verified'),
  ('GRP-PAY-261012-0002', '2026-10-12 13:37:32', '2026-10-16', 'Aan', '2 Desember 2026 [Emerald Super Hemat][12D]', '5000000', 0, NULL, 'BSI (Bank Syariah Indonesia)', NULL, 'https://drive.google.com/file/d/1iEtvoiOXsHElHnefSPgD09zHunYGrR-S/view?usp=drivesdk', 'JM-2026-0103', '{"JM-2026-0103":5000000}', '0', 0, 'Admin', 'Verified', 'Verified'),
  ('GRP-PAY-261012-0003', '2026-10-12 13:42:44', '2026-10-16', 'Ust Aan', 'TOPAZ SUHEM', '100000000', 0, NULL, 'Bank Rakyat Indonesia (BRI)', NULL, 'https://drive.google.com/file/d/1yrWciaL-Yg9Ne3WkS3Faz-W-YbCWd-9d/view?usp=drivesdk', 'JM-2026-0090, JM-2026-0091, JM-2026-0092, JM-2026-0093', '{"JM-2026-0090":25000000,"JM-2026-0091":25000000,"JM-2026-0092":25000000,"JM-2026-0093":25000000}', '0', 0, 'Admin', 'Verified', 'Verified'),
  ('GRP-PAY-261015-0001', '2026-10-15 17:04:04', '2026-10-15', 'Ust Aan', 'TOPAZ SUHEM', '50000000', 0, NULL, 'BSI (Bank Syariah Indonesia)', NULL, NULL, 'JM-2026-0090, JM-2026-0091, JM-2026-0092, JM-2026-0093', '{"JM-2026-0090":12500000,"JM-2026-0091":12500000,"JM-2026-0092":12500000,"JM-2026-0093":12500000}', '0', 0, 'Admin', 'Verified', 'Verified');
