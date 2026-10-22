-- ============================================================================
-- 1. Tabel data_koordinator_grup
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.data_koordinator_grup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_koordinator TEXT,
  nama_koordinator TEXT,
  no_ktp TEXT,
  no_hp TEXT,
  alamat TEXT,
  list_jamaah_json TEXT,
  timestamp TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.data_koordinator_grup (id_koordinator, nama_koordinator, no_ktp, no_hp, alamat, list_jamaah_json, timestamp, status) VALUES
('KOOR-261009-001', 'miftah', '', '', '', '[{"jenisPaket":"TOPAZ SUHEM","namaJamaah":"KARTIKA CANDRA WIDYANINGRUM","idJamaah":"JM-2026-0072"},{"idJamaah":"JM-2025-0001","namaJamaah":"Dedi Rosadi","jenisPaket":"Topaz"},{"idJamaah":"JM-2025-0025","namaJamaah":"MUHAMMAD ANDIKA","jenisPaket":"SUHEM"}]', '2026-10-09 10:04:21', 'Active'),
('KOOR-261009-002', 'bbbbb', '', '', '', '[{"idJamaah":"JM-2025-0004","jenisPaket":"TOPAZ","namaJamaah":"DULAH MIHARJO"}]', '2026-10-09 09:49:17', 'Active'),
('KOOR-261009-003', 'radi', '', '', '', '[{"jenisPaket":"Sapphire","namaJamaah":"Dea Esania Putri","idJamaah":"JM-2026-0013"}]', '2026-10-09 10:02:34', 'Active');


-- Create Table data_pembayaran_group in Supabase
CREATE TABLE IF NOT EXISTS public.data_pembayaran_group (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_group_payment TEXT,
  waktu_transaksi TEXT,
  tanggal_bayar TEXT,
  nama_agen TEXT,
  jenis_paket_umrah TEXT,
  total_nominal NUMERIC,
  metode_pembayaran TEXT,
  bank_asal TEXT,
  bank_tujuan TEXT,
  no_referensi TEXT,
  bukti_bayar TEXT,
  list_id_jamaah TEXT,
  rincian_alokasi_json TEXT,
  diskon_kolektif NUMERIC,
  catatan TEXT,
  user_input TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.data_pembayaran_group (id_group_payment, waktu_transaksi, tanggal_bayar, nama_agen, jenis_paket_umrah, total_nominal, metode_pembayaran, bank_asal, bank_tujuan, no_referensi, bukti_bayar, list_id_jamaah, rincian_alokasi_json, diskon_kolektif, catatan, user_input, status) VALUES
('GRP-PAY-261009-0001', '2026-10-09 09:48:09', '2026-10-09', 'KOOR-261009-001', 'miftah', 20000000.0, 'Transfer Bank', '', '', '', '', 'JM-2026-0072, JM-2025-0001', '{"JM-2026-0072":10000000,"JM-2025-0001":10000000}', 0.0, '', 'Admin', 'Verified'),
('GRP-PAY-261009-0002', '2026-10-09 09:49:37', '2026-10-09', 'KOOR-261009-002', 'bbbbb', 8000000.0, 'Transfer Bank', '', '', '', '', 'JM-2025-0004', '{"JM-2025-0004":8000000}', 0.0, '', 'Admin', 'Verified'),
('GRP-PAY-261012-0001', '2026-10-12 12:28:30', '2026-10-12', 'Ust Aan', 'SAPPHIRE SUHEM', 100000000.0, 'Transfer Bank', '', '', '', 'https://drive.google.com/file/d/1F0llry_Yj-UdzGmJZbIOaDhpwxcwWEOD/view?usp=drivesdk', 'JM-2026-0087, JM-2026-0088', '{"JM-2026-0087":50000000,"JM-2026-0088":50000000}', 0.0, '', 'Admin', 'Verified'),
('GRP-PAY-261012-0002', '2026-10-12 13:37:32', '2026-10-16', 'Aan', '2 Desember 2026 [Emerald Super Hemat][12D]', 5000000.0, 'Transfer Bank', '', 'BSI (Bank Syariah Indonesia)', '', 'https://drive.google.com/file/d/1iEtvoiOXsHElHnefSPgD09zHunYGrR-S/view?usp=drivesdk', 'JM-2026-0103', '{"JM-2026-0103":5000000}', 0.0, '', 'Admin', 'Verified'),
('GRP-PAY-261012-0003', '2026-10-12 13:42:44', '2026-10-16', 'Ust Aan', 'TOPAZ SUHEM', 100000000.0, 'Transfer Bank', '', 'Bank Rakyat Indonesia (BRI)', '', 'https://drive.google.com/file/d/1yrWciaL-Yg9Ne3WkS3Faz-W-YbCWd-9d/view?usp=drivesdk', 'JM-2026-0090, JM-2026-0091, JM-2026-0092, JM-2026-0093', '{"JM-2026-0090":25000000,"JM-2026-0091":25000000,"JM-2026-0092":25000000,"JM-2026-0093":25000000}', 0.0, '', 'Admin', 'Verified'),
('GRP-PAY-261015-0001', '2026-10-15 17:04:04', '2026-10-15', 'Ust Aan', 'TOPAZ SUHEM', 50000000.0, 'Transfer Bank', '', 'BSI (Bank Syariah Indonesia)', '', '', 'JM-2026-0090, JM-2026-0091, JM-2026-0092, JM-2026-0093', '{"JM-2026-0090":12500000,"JM-2026-0091":12500000,"JM-2026-0092":12500000,"JM-2026-0093":12500000}', 0.0, '', 'Admin', 'Verified');
