# PT. FATH INDAH TRAVEL SERVICE - PORTAL EKSEKUTIF & SISTEM MANAJEMEN

Sistem portal web manajemen dan otentikasi login berbasis web untuk **PT. Fath Indah Travel Service** (Umrah & Hajj Service).

---

## 🌟 Fitur Utama & Keunggulan

1. **Otentikasi Terintegrasi Google Sheets (Tanpa Apps Script)**:
   - Terhubung langsung ke spreadsheet publik Google Sheets: [Google Sheets Database](https://docs.google.com/spreadsheets/d/1VL8trcMIcZ6n5Be-2-9YwmC1pOsKliO_wbILmU_cC1s/edit?usp=sharing).
   - Memvalidasi akun dari tabel **`Users`** (mendukung SHA-256 hash maupun password plaintext yang tersimpan di sheet).
   - Validasi status akun (hanya user aktif yang diizinkan masuk).
2. **Pencatatan Audit Trail & Geolocation Otomatis (`ActivityLogs`)**:
   - Setelah login terotorisasi, sistem langsung mencatat log aktivitas ke tabel **`ActivityLogs`**.
   - Menyimpan `LogID`, `Timestamp` (WIB), `Username`, `IP_Address`, `Maps_URL` (tautan Google Maps dengan koordinat GPS), `Location` (alamat/kota), `Action`, dan `Module`.
   - Dilengkapi deteksi otomatis Geolocation API peramban dengan fallback cerdas.
3. **Layar Kerja & Tata Letak Responsif**:
   - **Header Atas**: Judul modul dinamis, rekam jejak (breadcrumb), jam digital real-time (WIB), badge status database, dan profil pengguna.
   - **Sidebar Kiri Collapsible**: Menampilkan logo resmi PT. Fath Indah Travel Service dan navigasi modul yang dapat **disembunyikan / diminimize** di desktop maupun perangkat mobile.
   - **Area Kerja Utama**: Area kerja dinamis dengan modul:
     - 📊 *Dashboard Utama*
     - 👥 *Data Jamaah* (Data langsung dari sheet `Metadata`)
     - 📝 *Log Aktivitas* (Audit trail lengkap dengan tombol buka Google Maps & ekspor CSV)
     - 👤 *Manajemen Users* (Data 42 pengguna dari sheet `Users`)
     - 🗓️ *Presensi & Cuti Karyawan* (Sheet `Absensi` & `CutiKaryawan`)
     - ⚙️ *Konfigurasi Database* (Saklar pengalihan Google Sheets <-> Supabase)
4. **Palet Warna Elegan & Modern**:
   - Menghindari warna biru standar.
   - Menggunakan tema kemewahan eksekutif: *Obsidian Slate*, *Islamic Emerald Jade*, dan *Warm Champagne Gold*.
5. **Mobile Responsive (Smartphone Ready)**:
   - Tampilan adaptif untuk smartphone Android / iPhone dengan menu drawer samping dan tabel responsif.
6. **Dukungan Penuh Pengalihan ke Supabase**:
   - Arsitektur berlapis (*Adapter Pattern*) yang memungkinkan pengalihan basis data ke **Supabase (PostgreSQL)** secara instan.
   - Sudah disediakan skrip migrasi siap pakai: `supabase_schema.sql` (tabel `users` & `activity_logs` beserta data awal).

---

## 🚀 Cara Menjalankan

1. **Pastikan Node.js terinstal** (v18 ke atas disarankan).
2. **Jalankan Aplikasi**:
   ```bash
   node server.js
   ```
3. **Buka di Browser**:
   ```
   http://localhost:3000
   ```

---

## 🔑 Akun Demo Cepat untuk Pengujian

| Username | Password | Role | Keterangan |
| :--- | :--- | :--- | :--- |
| `admin` | `a` | Admin | Administrator Utama (Pusat) |
| `Miftah` | `a` | StaffHaji | Staff Haji (Pusat) |
| `Andini` | `085717681184` | Staff | Staff Operasional (Pusat) |
| `Kadari` | `0811145185` | Staff | Staff (Pusat) |

*(Tersedia tombol demo sekali klik pada halaman login untuk kemudahan testing)*.

---

## 🔄 Cara Mengalihkan ke Supabase

1. Buka dashboard project Anda di [supabase.com](https://supabase.com).
2. Jalankan skrip [supabase_schema.sql](file:///d:/PROJECT%20AI/MenuFathIndah/supabase_schema.sql) pada **SQL Editor** Supabase.
3. Di dalam aplikasi web, buka menu **Konfigurasi DB**:
   - Masukkan **Project URL** dan **Anon Key** Supabase Anda.
   - Klik **Simpan Konfigurasi** lalu klik kartu **Supabase (PostgreSQL)** untuk mengaktifkannya.

---

## 📂 Integrasi Auto-Upload Google Drive (Modul Launching Brosur)

File yang diunggah pada modul **Launching Brosur** ditargetkan ke folder resmi Google Drive PT. Fath Indah:
- **Tautan Folder Target**: [Brosur - Google Drive](https://drive.google.com/drive/folders/1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc)
- **Folder ID**: `1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc`

### Cara Mengaktifkan Auto-Upload (1 Menit):
1. Buka [script.google.com](https://script.google.com) menggunakan akun Google pemilik folder.
2. Buat proyek baru dan salin isi file [google_drive_uploader.gs](file:///d:/PROJECT%20AI/MenuFathIndah/google_drive_uploader.gs).
3. Klik **Deploy** -> **New deployment** -> pilih **Web app**.
4. Atur:
   - **Execute as**: `Me (email-anda@gmail.com)`
   - **Who has access**: `Anyone (Siapa saja)`
5. Klik **Deploy**, izinkan akses, lalu salin URL Web App yang dihasilkan.
6. Tempel URL Web App ke menu **Konfigurasi DB** atau melalui tombol **⚙️ Pengaturan Auto-Upload** pada modul Launching Brosur.
7. Sekarang, setiap file brosur lokal yang dipilih akan otomatis diunggah ke Google Drive dan tautan publiknya langsung tersimpan ke Supabase `LogBrosur`!

