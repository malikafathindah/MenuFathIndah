-- ====================================================================
-- SKEMA & MIGRASI DATABASE MODUL DASHBOARD HAJI TERENCANA (mod_dashboard_ht)
-- PT. Fath Indah Travel Service
-- Supabase Project: https://utqexpkwtatwzknjftpx.supabase.co
-- ====================================================================

-- 1. TABEL RUNNING TEXT (Marquee Pengumuman)
CREATE TABLE IF NOT EXISTS public.running_text (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    link_url TEXT,
    status VARCHAR(50) DEFAULT 'Aktif',
    icon VARCHAR(50) DEFAULT 'megaphone',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- Seed Data Running Text dari Google Spreadsheet Database
INSERT INTO public.running_text (text, link_url, status, icon) VALUES
('Selamat Datang di Aplikasi Haji Khusus - Fath Indah', NULL, 'Aktif', 'megaphone'),
('Dapatkan Produk Unggulan Fath Indah .... Silahkan Klik Text ini', 'https://tiktok.com/@fathindah', 'Aktif', 'megaphone'),
('Untuk Mengenal Lebih Dekat Dengan Fath Indah .... Silahkan klik Text Ini', 'https://fathindah.com/', 'Aktif', 'megaphone'),
('Tiktok', 'https://www.tiktok.com/@fathindah.official', 'Aktif', 'tiktok'),
('Instagram', 'https://www.instagram.com/fathindah.official/', 'Aktif', 'instagram'),
('PIC - Siska Kartika', 'https://wa.me/6287770047686', 'Aktif', 'whatsapp')
ON CONFLICT DO NOTHING;

-- 2. TABEL DATA JAMAAH HAJI (DataJamaahHaji)
CREATE TABLE IF NOT EXISTS public.data_jamaah_haji (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TEXT,
    idjamaah VARCHAR(100),
    nobpih VARCHAR(100),
    nama VARCHAR(255),
    bulanpendaftaran VARCHAR(100),
    nohp VARCHAR(100),
    jenishaji VARCHAR(100),
    banksetorawal VARCHAR(100),
    createdat TEXT,
    updatedat TEXT,
    bpjs TEXT,
    buktiangsuran TEXT,
    buktisetor TEXT,
    buktitransfer TEXT,
    kartukeluarga TEXT,
    ktp TEXT,
    paspor TEXT,
    spph TEXT,
    foto TEXT,
    bukunikah TEXT,
    visa TEXT,
    tasreh TEXT,
    bpihlunas TEXT,
    doclain TEXT,
    noktp VARCHAR(100),
    namaortu VARCHAR(255),
    tempatlahir VARCHAR(100),
    tanggallahir VARCHAR(50),
    umur VARCHAR(20),
    jeniskelamin VARCHAR(50),
    kewarganegaraan VARCHAR(100),
    alamat TEXT,
    desakel VARCHAR(100),
    kecamatan VARCHAR(100),
    kabkot VARCHAR(50),
    kabkota VARCHAR(100),
    provinsi VARCHAR(50),
    nmprovinsi VARCHAR(100),
    kodepos VARCHAR(20),
    pendidikan VARCHAR(100),
    pekerjaan VARCHAR(100),
    pergihaji VARCHAR(50),
    mahram TEXT,
    hubmahram VARCHAR(100),
    nopendaftaran VARCHAR(100),
    goldarah VARCHAR(10),
    statusnikah VARCHAR(50),
    tglspph VARCHAR(50),
    pin VARCHAR(50),
    travel VARCHAR(100),
    telp VARCHAR(100),
    statusbpih VARCHAR(50),
    nospph VARCHAR(100),
    bank VARCHAR(100),
    tglinput VARCHAR(50),
    tgllunas VARCHAR(50),
    hargabpih TEXT,
    dpangsuran TEXT,
    blangsuran TEXT,
    tinggi VARCHAR(20),
    alis VARCHAR(50),
    hidung VARCHAR(50),
    berat VARCHAR(20),
    rw VARCHAR(20),
    muka VARCHAR(50),
    rt VARCHAR(20),
    kode_diagnosis VARCHAR(100),
    rambut VARCHAR(50),
    nodaftarmahram VARCHAR(100),
    nomor_jurnal_erahhajj VARCHAR(100),
    faedah_rupiah TEXT,
    diskon_usd TEXT,
    kurs_paket TEXT,
    tipe_kamar VARCHAR(50),
    tanggal_bayar_agen VARCHAR(50),
    nama_paket_haji VARCHAR(255),
    diskon_rupiah TEXT,
    harga_usd TEXT,
    catatan_paket TEXT,
    harga_rupiah TEXT,
    total_harga_usd TEXT,
    bank_agen VARCHAR(100),
    total_harga_rupiah TEXT,
    nama_agen VARCHAR(255),
    no_hp_agen VARCHAR(100),
    faedah_usd TEXT,
    catatan_agen TEXT,
    noporsi VARCHAR(100),
    namajamaah VARCHAR(255),
    statushaji VARCHAR(100),
    kanwil VARCHAR(100),
    downpayment TEXT,
    nomor_rekening_agent VARCHAR(100),
    estimasiberangkat VARCHAR(100),
    tglestimasi VARCHAR(50),
    doc TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 3. TABEL ENTRY ANGSURAN HAJI (EntryAngsuranHaji)
CREATE TABLE IF NOT EXISTS public.entry_angsuran_haji (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TEXT,
    id_1 VARCHAR(100),
    nojurnal VARCHAR(100),
    idjamaah VARCHAR(100),
    nobpih VARCHAR(100),
    namanasabah VARCHAR(255),
    bank VARCHAR(150),
    uraian TEXT,
    jumlah TEXT,
    nilaikurs VARCHAR(50),
    user_entry VARCHAR(100),
    tanggal VARCHAR(50),
    metodepembayaran VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending',
    createdat TEXT,
    typehaji VARCHAR(100) DEFAULT 'Haji Terencana',
    nohp VARCHAR(100),
    linkdokumen TEXT,
    nojurnalerahajj VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 4. TABEL MAHRAM (Relasi Mahram Jamaah Haji)
CREATE TABLE IF NOT EXISTS public.mahram (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nobpih VARCHAR(100),
    nama VARCHAR(255),
    hubungan VARCHAR(100),
    kodemahram VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 5. REGISTRY MODUL: Pastikan mod_dashboard_ht terdaftar aktif
INSERT INTO public.modules (moduleid, modulename, category, status, icon, accessrole, order_num, description)
VALUES (
    'mod_dashboard_ht',
    'Dashboard Haji Terencana',
    'Haji',
    'Active',
    'fa-solid fa-kaaba',
    'Admin,StaffHaji',
    30,
    'Dashboard agregasi angsuran khusus jamaah Haji Terencana'
)
ON CONFLICT (moduleid) DO UPDATE SET
    modulename = EXCLUDED.modulename,
    category = EXCLUDED.category,
    status = 'Active',
    icon = EXCLUDED.icon,
    accessrole = EXCLUDED.accessrole,
    order_num = EXCLUDED.order_num,
    description = EXCLUDED.description;

-- Indeks Performa
CREATE INDEX IF NOT EXISTS idx_jamaah_nobpih ON public.data_jamaah_haji(nobpih);
CREATE INDEX IF NOT EXISTS idx_jamaah_nohp ON public.data_jamaah_haji(nohp);
CREATE INDEX IF NOT EXISTS idx_jamaah_idjamaah ON public.data_jamaah_haji(idjamaah);
CREATE INDEX IF NOT EXISTS idx_angsuran_nobpih ON public.entry_angsuran_haji(nobpih);
CREATE INDEX IF NOT EXISTS idx_angsuran_nohp ON public.entry_angsuran_haji(nohp);
CREATE INDEX IF NOT EXISTS idx_angsuran_status ON public.entry_angsuran_haji(status);
CREATE INDEX IF NOT EXISTS idx_angsuran_tanggal ON public.entry_angsuran_haji(tanggal);
CREATE INDEX IF NOT EXISTS idx_mahram_nobpih ON public.mahram(nobpih);
CREATE INDEX IF NOT EXISTS idx_mahram_kodemahram ON public.mahram(kodemahram);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.running_text ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_jamaah_haji ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_angsuran_haji ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mahram ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Penuh untuk Anon & Authenticated
DROP POLICY IF EXISTS "Akses Penuh RunningText" ON public.running_text;
CREATE POLICY "Akses Penuh RunningText" ON public.running_text FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh DataJamaahHaji" ON public.data_jamaah_haji;
CREATE POLICY "Akses Penuh DataJamaahHaji" ON public.data_jamaah_haji FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EntryAngsuranHaji" ON public.entry_angsuran_haji;
CREATE POLICY "Akses Penuh EntryAngsuranHaji" ON public.entry_angsuran_haji FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Mahram" ON public.mahram;
CREATE POLICY "Akses Penuh Mahram" ON public.mahram FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Berikan GRANT permission
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.running_text TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.data_jamaah_haji TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.entry_angsuran_haji TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.mahram TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
