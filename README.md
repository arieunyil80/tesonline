# Tes Online TKJ — UjianKu Pro v1.3

Frontend aplikasi CBT (Computer Based Test) online. Ini halaman statis HTML/CSS/JS tanpa framework, dan backend-nya REST API di Google Apps Script.

- **Siswa:** masuk dengan Token PIN, mengerjakan soal PG dan esai, autosave dan mode offline, timer dari server, serta sensor pindah tab dan layar penuh.
- **Guru:** bank soal, paket dengan undian acak, token, kehadiran, monitoring live, Kode Ruang (TOTP), koreksi esai dengan forensik ketikan, rekap, dan dokumen PDF/Excel.
- **Admin:** pengguna dan mapel, siswa, pengaturan (identitas, logo, anti-curang), impor/migrasi, dan log.

## Struktur

```
index.html            halaman tunggal (SPA, rute #/...)
css/style.css         sistem desain soft UI krem + teal
js/config.js          ← satu-satunya yang perlu diisi: GAS_URL (/exec)
js/api.js             fetch ke GAS, cache SWR, batch, dedupe
js/ui.js              komponen, tabel, grafik SVG
js/app.js             router, kerangka, login
js/siswa.js           dashboard, daftar ujian, persiapan, hasil
js/ujian.js           mesin ujian (IndexedDB, anti-curang, analitik ketik)
js/guru.js            menu guru
js/admin.js           menu admin
manifest.webmanifest  mode "Tambahkan ke Layar Utama"
```

Panduan lengkap ada di **PANDUAN-INSTALASI.md**.

Untuk melihat kinerja, buka console browser (F12) lalu jalankan `Perf.summary()`.
