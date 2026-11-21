# Panduan Instalasi — Tes Online TKJ (UjianKu Pro v1.3)

Aplikasi CBT online dengan dua bagian:

| Bagian | Isi | Tempat |
|---|---|---|
| **Backend** | 7 berkas `.gs` + `appsscript.json` | Google Apps Script (akun Google sekolah) |
| **Frontend** | `index.html`, `css/`, `js/`, ikon | GitHub Pages (gratis) |

Data tersimpan di Google Sheets milik akun Anda. Gambar soal, logo, template, dan arsip dokumen tersimpan di Google Drive akun yang sama.

---

## Bagian A — Memasang backend (Google Apps Script)

### A1. Buat proyek

1. Buka <https://script.google.com> dengan akun Google sekolah, lalu klik **Proyek baru**.
2. Ganti judul proyek (kiri atas) menjadi `Tes Online TKJ`.

### A2. Tempel berkas kode

Buat 7 berkas lewat tombol **＋ → Skrip**. Ganti nama `Code.gs` bawaan menjadi `Kode`. Lalu salin seluruh isi tiap berkas:

| Berkas | Isi |
|---|---|
| `Kode.gs` | Inti: router API, keamanan, cache, akses data |
| `Setup.gs` | Setup awal dan migrasi skema (aman diulang) |
| `Ujian.gs` | Alur siswa, autosave, anti-curang, Kode Ruang, penilaian |
| `Guru.gs` | Bank soal, paket, token, kehadiran, monitoring, koreksi, rekap |
| `Admin.gs` | Pengguna, mapel, siswa, pengaturan, logo, log |
| `Dokumen.gs` | Doc Engine (template `{{...}}` → PDF/DOCX/XLSX) |
| `Impor.gs` | Impor Excel dan migrasi dari spreadsheet lama |

Ketik nama tanpa `.gs`, karena editor menambahkannya sendiri.

### A3. Tempel manifest

1. Klik **⚙️ Setelan Proyek**, lalu centang **Tampilkan file manifes "appsscript.json" di editor**.
2. Kembali ke **Editor**, buka `appsscript.json`, ganti seluruh isinya dengan berkas `appsscript.json` dari paket ini, lalu klik **Simpan**.

Manifest ini mengatur zona waktu Asia/Jakarta, runtime V8, dan izin yang dibutuhkan (Sheets, Drive, Docs, ekspor dokumen, dan pemicu).

### A4. Jalankan setup (sekali)

1. Di toolbar, pilih fungsi **`setupAplikasi`**, lalu klik **▶ Jalankan**.
2. Klik **Tinjau izin**, pilih akun Anda, lalu **Lanjutan → Buka Tes Online TKJ (tidak aman) → Izinkan**. Peringatan ini wajar untuk skrip buatan sendiri.
3. Buka **Log eksekusi**. Anda akan melihat:
   ```
   🔑 LOGIN ADMIN AWAL (catat sekarang, hanya tampil sekali)
      Username   : admin
      Kata sandi : XXXXXXXXXXXX
   ```
   **Catat kata sandi ini.** Kata sandi ini tidak disimpan di mana pun dalam bentuk asli.

Setup membuat folder Drive **📁 Tes Online TKJ**, berisi spreadsheet database, folder gambar, logo, arsip, dan template dokumen. Setup juga membuat 12 sheet, 4 template dokumen bawaan, rahasia di Script Properties, dan pemicu tiap 5 menit.

`setupAplikasi` **aman dijalankan ulang**. Data lama tidak dihapus dan rahasia tidak ditimpa. Jalankan lagi bila suatu saat ada sheet atau kolom yang terhapus.

> **Opsional, untuk uji coba:** jalankan `isiDataContoh`. Fungsi ini membuat 2 mapel contoh, 12 siswa, 11 soal, 1 paket, dan 12 token. Akun admin juga otomatis mengampu mapel contoh.

### A5. Deploy sebagai Web App

1. Klik **Terapkan → Deployment baru**, lalu klik ikon ⚙️ dan pilih **Aplikasi web**.
2. Isi:
   - **Jalankan sebagai:** *Saya*
   - **Yang memiliki akses:** *Siapa saja*. Ini wajib, karena siswa tidak memakai akun Google.
3. Klik **Terapkan**, lalu **salin URL yang berakhiran `/exec`**.
4. Tes dengan membuka URL itu di browser. Hasilnya harus berupa JSON yang berisi `"message":"API aktif"`.

---

## Bagian B — Memasang frontend (GitHub Pages)

### B1. Isi URL backend

Ekstrak ZIP frontend. **Folder hasil ekstraksi itulah folder proyek**, dengan `index.html` langsung di dalamnya.

Buka `js/config.js` dengan Notepad, lalu ganti `GANTI_DENGAN_ID_DEPLOYMENT` sehingga berisi URL `/exec` Anda:

```js
window.APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycb.../exec'
};
```

URL `/exec` bukan rahasia. Keamanan dijaga oleh token sesi dan pemeriksaan peran di server.

### B2. Unggah ke GitHub (lewat terminal)

> Jangan memakai **Upload files** di web GitHub, karena struktur folder `css/` dan `js/` akan rusak.

1. Pasang Git dari <https://git-scm.com>, lalu buat akun di <https://github.com>.
2. Di GitHub, klik **＋ → New repository**. Beri nama `tes-online-tkj`, pilih **Public**, dan **jangan** centang README.
3. Buka PowerShell **di folder proyek**. Caranya: buka folder di File Explorer, klik address bar, ketik `powershell`, lalu Enter. Pastikan dulu:
   ```powershell
   dir
   ```
   Daftar paling atas harus berisi `index.html`, `css`, dan `js`. Kalau tidak ada, Anda berada di folder yang salah.
4. Jalankan **satu per satu**:
   ```powershell
   git config --global user.name "Nama Anda"
   git config --global user.email "email@akun-github.com"
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/tes-online-tkj.git
   git push -u origin main
   ```
   Saat diminta **Password**, tempel **Personal Access Token**, bukan sandi akun. Buat token di <https://github.com/settings/tokens>: **Generate new token (classic)**, centang **repo**, lalu salin. Layar terminal memang tidak menampilkan apa pun saat token ditempel.
5. Di repository GitHub, buka **Settings → Pages**. Pilih **Source: Deploy from a branch**, **Branch: main / (root)**, lalu **Save**. Centang **Enforce HTTPS**.
6. Tunggu 1–2 menit. Situs akan aktif di `https://USERNAME.github.io/tes-online-tkj/`.

**Memperbarui situs** (misalnya setelah mengganti `config.js`):

```powershell
git add .
git commit -m "Perbarui konfigurasi"
git push
```

Setelah itu, tekan **Ctrl+Shift+R** di browser.

---

## Bagian C — Pengaturan awal (sekitar 10 menit)

Buka situs, lalu klik **Login Guru / Administrator** dan masuk dengan `admin` dan sandi dari log setup.

1. **Akun Saya → Ganti kata sandi**. Wajib dilakukan setelah login pertama.
2. **Pengaturan → Umum & Identitas:** nama sekolah, tahun ajaran, kepala sekolah, KKM, dan **unggah logo** (PNG transparan disarankan). Logo otomatis tampil di login, sidebar, kartu token, dan dokumen.
3. **Pengaturan → Anti-Curang & Kode Ruang:** saklar **Wajibkan Kode Ruang**, interval kode, layar penuh, deteksi pindah tab, batas pelanggaran, dan batas percobaan PIN.
4. **Master Mapel:** tambahkan mata pelajaran.
5. **Pengguna:** beri mapel yang diampu. Kalau hanya Anda yang mengajar, ubah akun **admin** dan centang mapel Anda, sehingga admin sekaligus bertindak sebagai guru.
6. **Siswa & Kelas → Impor Excel:** unduh template, isi NIS, Nama, dan Kelas, lalu impor. Data juga bisa ditempel langsung dari Excel. NIS yang diawali 0 tetap utuh.

## Bagian D — Alur ujian

1. **Bank Soal:** tambah soal manual (PG A–E atau esai dengan rubrik) atau **Impor dari Excel**.
2. **Paket Ujian → Buat:** pilih kumpulan soal (misalnya 80 soal), lalu tentukan jumlah yang **tampil per siswa** (misalnya 30 PG + 5 esai, diundi acak). Atur persentase nilai PG/esai, jadwal, dan pengamanan, lalu klik **Terbitkan**.
3. **Token Siswa → Buat Token Massal** per kelas, lalu **Cetak Kartu (A4, 6 kartu per halaman)** atau **Daftar Token (PDF)**.
4. **Saat ujian:**
   - **Kode Ruang:** tampilkan kode di proyektor dengan tombol layar penuh, bila diwajibkan.
   - **Monitoring:** progres, sisa waktu, status online, dan pelanggaran diperbarui tiap 5 detik. Dari sini Anda bisa membuka kunci (alasan wajib), menambah waktu, mereset perangkat, atau menghentikan sesi.
   - **Kehadiran:** siswa yang ditandai Tidak Hadir/Izin/Sakit otomatis diblokir. Gunakan **Aktifkan Ulang (Susulan)** dengan masa berlaku baru.
5. **Koreksi Esai:** lihat jawaban, rubrik, dan panel forensik ketikan (diketik vs ditempel, kecepatan, status). Beri skor, lalu klik **Simpan & Lanjut** atau tekan Ctrl+Enter.
6. **Rekap Nilai:** filter dan grafik. Unduh **Excel/PDF resmi** (Doc Engine) atau CSV.
7. **Dokumen:** Berita Acara, Daftar Hadir, Daftar Token, dan Rekap Nilai. Salinan setiap dokumen tersimpan di folder **Arsip Dokumen** di Drive.

## Bagian E — Rahasia & keamanan (Script Properties)

Semua nilai di bawah ini **dibuat otomatis** oleh `setupAplikasi` dan tersimpan di **⚙️ Setelan Proyek → Script Properties**. Tidak ada yang perlu diketik manual.

| Kunci | Jenis | Keterangan |
|---|---|---|
| `SESSION_SECRET` | Rahasia | Penanda tangan token login (HMAC) |
| `KODE_RUANG_SECRET` | Rahasia | Sumber kode 6 digit Kode Ruang (TOTP) |
| `SPREADSHEET_ID`, `ROOT_FOLDER_ID`, `FOLDER_*` | Identitas | Lokasi database dan folder Drive |
| `REV_<id>` | Status | Pencabutan sesi saat sandi diganti atau akun dinonaktifkan |

- Kata sandi guru dan admin disimpan sebagai **hash + salt**, bukan teks asli.
- Kunci jawaban dan rubrik **tidak pernah dikirim** ke browser siswa.
- **Jangan membagikan** spreadsheet database kepada siswa, dan **jangan menambah editor** proyek Apps Script sembarangan. Editor proyek dapat melihat Script Properties.

**Fungsi darurat** (pilih di toolbar editor, lalu klik ▶):

| Fungsi | Gunanya |
|---|---|
| `resetSandiAdmin` | Lupa sandi admin. Sandi baru muncul di log. |
| `rotasiSecretSesi` | Curiga ada kebocoran. Semua pengguna harus login ulang. |
| `pasangPemicu` / `hapusPemicu` | Memasang atau melepas pemicu 5 menit |
| `cekPerforma` | Status cache, pemicu, jumlah baris, dan ukuran Script Properties |

## Bagian F — Memperbarui kode backend

1. Tempel kode baru, lalu klik **Simpan**.
2. Klik **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan**.
   **Jangan** membuat "Deployment baru", karena URL `/exec` akan berubah.
3. Jalankan `setupAplikasi` sekali bila ada sheet atau kolom baru. Fungsi ini hanya menambah, tidak menghapus.

## Bagian G — Pindah dari aplikasi lama

Buka **Pengaturan → Impor & Migrasi Data**, lalu tempel URL spreadsheet lama dan lakukan langkah berikut:

1. Klik **Pindai** dan periksa jumlah data yang akan ditambah atau diperbarui.
2. Klik **Jalankan Impor**.
3. Tepat sebelum beralih ke aplikasi baru, jalankan impor sekali lagi untuk menangkap data yang masuk ke aplikasi lama selama transisi.

Spreadsheet lama hanya dibaca, dan impor ulang tidak membuat data dobel. Akun pengguna lama tidak ikut diimpor.

## Bagian H — Doc Engine (mengubah desain dokumen)

1. Buka **Dokumen → Edit template** (khusus admin). Template terbuka di Google Docs atau Sheets.
2. Ubah kop, tata letak, atau huruf sesuka Anda. **Pertahankan penanda** `{{...}}` yang dibutuhkan.
3. Kembali ke aplikasi, lalu klik **Pindai ulang**.

Teks pengganti mengikuti huruf dan ukuran penanda. Daftar penanda tersedia di bawah setiap jenis dokumen. Pengubah yang bisa dipakai: `{{NAMA|kapital}}`, `{{TANGGAL|tanggal:dd/MM/yyyy}}`, `{{X|bawaan:-}}`, dan `{{N|terbilang}}`. Baris tabel berulang memakai `{{#PESERTA}}` dengan kolom `{{PESERTA.NAMA}}`.

## Bagian I — Batasan yang perlu diketahui

- **Server "tidur":** permintaan pertama setelah lama tidak dipakai butuh 2–5 detik. Aplikasi memanaskan server otomatis saat halaman login dibuka. Buka halaman login 1–2 menit sebelum ujian.
- **Monitoring bukan real-time murni:** Apps Script tidak mendukung WebSocket, jadi data diperbarui tiap 5 detik (polling).
- **Batas eksekusi serentak** Apps Script sekitar 30. Untuk lebih dari 60 siswa, minta siswa login bergelombang per kelas, selisih 1–2 menit. Autosave tiap 30 detik aman untuk puluhan siswa.
- **Layar penuh di iPhone** tidak didukung browser. Siswa iPhone memakai **Bagikan → Tambahkan ke Layar Utama**. Sensor pindah tab tetap aktif.
- **Analitik ketikan esai adalah indikator, bukan bukti mutlak.** Keputusan akhir ada pada guru.
- **Kuota pemicu:** pemicu 5 menit memakai sekitar 10–15 menit runtime per hari, di bawah batas akun Gmail (±90 menit per hari).

## Bagian J — Kendala umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| Layar "Konfigurasi belum lengkap" | `GAS_URL` belum diisi | Isi `js/config.js`, lalu `git push` |
| "Respons server tidak valid" | Akses deployment bukan *Siapa saja* | Edit deployment → akses *Siapa saja* |
| Situs 404 | Folder yang di-push salah | Pastikan `index.html` ada di root repository |
| Tampilan tanpa gaya (CSS hilang) | Diunggah lewat web GitHub | Push ulang lewat terminal |
| "Sheet ... tidak ditemukan" | Sheet terhapus atau terganti nama | Jalankan `setupAplikasi` |
| Dokumen gagal dibuat | Template terhapus | **Dokumen → Kembalikan bawaan** |
| Siswa: "Token dipakai di perangkat lain" | Siswa berganti HP | **Monitoring → ⚙ → Reset perangkat** |
| Sesi siswa terkunci | Batas pelanggaran tercapai | **Monitoring → Buka Kunci** (alasan wajib) |
| Data yang diubah langsung di Sheets belum tampil | Cache server | Klik tombol **⟳ Segarkan** di halaman terkait |

---

## Hasil pengujian sebelum diserahkan

- **Backend (simulator Apps Script di Node):** 52 skenario lulus. Skenario mencakup setup ulang yang idempoten, login, kunci PIN 3× per 60 detik per perangkat, undian soal tanpa bocoran kunci, autosave, pelanggaran dan penguncian, buka kunci, Kode Ruang dengan saklar global dan override paket, nilai ternormalisasi, koreksi esai, token hangus oleh pemicu, impor, migrasi, Doc Engine, dan hak akses.
- **Uji beban (simulator):** 40 siswa serentak. Satu autosave = **0 baca + 1 tulis** sheet (3 sel), dan monitoring guru = 0–2 baca per pembaruan. Tidak ada galat.
- **Browser (Chrome headless):** 42 skenario lulus di desktop 1440 px dan ponsel 375 px. Skenario mencakup login, ujian, peringatan, layar terkunci, mode offline, kirim jawaban, seluruh menu guru dan admin, cetak kartu, dan tanpa galat JavaScript.

Pengujian dilakukan di simulator. Uji ulang singkat di akun Google Anda tetap diperlukan: jalankan `setupAplikasi` + `isiDataContoh`, lakukan satu ujian contoh dari HP, lalu buat satu dokumen PDF.
