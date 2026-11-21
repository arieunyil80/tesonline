/**
 * siswa.js — dashboard siswa, daftar ujian, cek sebelum ujian, hasil
 */
const Siswa = {
  data: null,
  async muat(el, gambar, paksa) {
    try { await API.swr('s.dashboard', {}, d => { this.data = d; gambar(d); }, { maxAge: paksa ? 0 : 15000 }); }
    catch (e) { el.innerHTML = UI.galat(e, 'App.rute()'); }
  },
  statusUjian(u, now) {
    if (!u) return { label: 'Tidak ada', kelas: '' };
    if (u.sesi && (u.sesi.status === 'Berjalan' || u.sesi.status === 'Terkunci')) return { label: 'Berlangsung', kelas: 'ok', jalan: true };
    if (u.sesi) return { label: 'Selesai', kelas: 'tl', selesai: true };
    if (now < new Date(u.buka).getTime()) return { label: 'Mendatang', kelas: 'sand', belum: true };
    if (now > new Date(u.akhir).getTime()) return { label: 'Ditutup', kelas: '', tutup: true };
    return { label: 'LIVE', kelas: 'ok', buka: true };
  },
  tombolUjian(u, st, besar) {
    const k = besar ? 'btn lg' : 'btn primary';
    if (st.jalan) return '<a class="' + k + '" href="#/s/kerjakan">' + ikon('main') + 'Lanjutkan Ujian</a>';
    if (st.buka) return '<a class="' + k + '" href="#/s/pra">' + ikon('main') + 'Mulai Ujian</a>';
    if (st.selesai) return '<a class="' + (besar ? 'btn lg' : 'btn') + '" href="#/s/hasil">' + ikon('medali') + 'Lihat Hasil</a>';
    if (st.belum) return '<button class="btn" disabled>' + ikon('kunci', 16) + 'Belum Dibuka</button>';
    return '<button class="btn" disabled>Ditutup</button>';
  }
};

/* ---------------- DASHBOARD SISWA ---------------- */
App.daftar('s/beranda', { peran: 'siswa', judul: 'Dashboard', render(el) {
  el.innerHTML = '<div class="sk sk-card" style="height:200px;border-radius:24px"></div><div class="grid g4 mt">' + UI.sk(4, true) + '</div>';
  Siswa.muat(el, d => {
    const u = d.ujian, now = API.sekarang(), st = Siswa.statusUjian(u, now), nama = (d.siswa.nama || '').split(' ')[0];
    const terakhir = d.riwayat.filter(r => r.nilai !== null).slice(-1)[0];
    let teks = 'Belum ada ujian aktif untuk token ini.';
    if (u) teks = st.jalan ? 'Ujian "' + u.nama + '" sedang berlangsung. Lanjutkan sebelum waktu habis.' : st.buka ? 'Ujian "' + u.nama + '" sudah dibuka. Pastikan koneksi stabil sebelum memulai.' :
      st.belum ? 'Ujian "' + u.nama + '" dibuka ' + F.tglP(u.buka) + ' pukul ' + F.jam(u.buka) + '.' : st.selesai ? 'Ujian "' + u.nama + '" sudah Anda selesaikan. Terima kasih!' : 'Waktu ujian "' + u.nama + '" sudah ditutup.';
    const sisaKartu = u && st.jalan ? '<div class="float"><div class="ik">' + ikon('pasir', 20) + '</div><div class="grow"><div class="over">Sisa waktu ujian</div><div class="v" id="hero-sisa">--:--</div><div class="small muted">' + esc(u.nama) + '</div></div></div>'
      : u ? '<div class="float"><div class="ik">' + ikon('jam', 20) + '</div><div class="grow"><div class="over">' + (st.belum ? 'Dibuka' : 'Durasi ujian') + '</div><div class="v">' + (st.belum ? F.jam(u.buka) : u.durasi + ' mnt') + '</div><div class="small muted">' + esc(u.mapel) + '</div></div></div>' : '';
    const skorKartu = terakhir ? '<div class="float"><div class="ik" style="background:var(--sand-l);color:#7A5527">' + ikon('medali', 20) + '</div><div class="grow"><div class="over">Skor terakhir</div><div class="row gap-s"><span class="v">' + F.n(terakhir.nilai) + '</span>' + UI.status(terakhir.lulus ? 'Lulus' : 'Remedial') + '</div><div class="small muted">' + esc(terakhir.mapel) + '</div></div></div>' : '';
    const nilaiTren = d.riwayat.filter(r => r.nilai !== null);
    el.innerHTML =
      '<section class="hero"><div style="position:relative;z-index:1"><span class="tag">' + esc((App.pub.SEMESTER || '') + ' ' + (App.pub.TAHUN_AJARAN || '')) + '</span>' +
      '<h1>Selamat Datang Kembali, ' + esc(nama) + '!</h1><p class="mt-s">' + esc(teks) + '</p><div class="row wrap mt">' + (u ? Siswa.tombolUjian(u, st, true) : '') +
      '<a class="btn ghost" href="#/s/hasil">' + ikon('perisai', 16) + 'Riwayat &amp; Nilai</a></div></div><div class="col" style="position:relative;z-index:1;justify-content:center">' + sisaKartu + skorKartu + '</div></section>' +
      '<div class="grid g4 mt" style="margin-top:22px">' +
      [['s/ujian', 'Mulai Ujian', 'Akses sesi terjadwal menggunakan Token PIN.', 'main', 'tint-teal', '#0F5561', 'PIN CBT', 'Masukkan Token'],
        [st.jalan ? 's/kerjakan' : 's/ujian', 'Ujian Langsung', st.jalan ? 'Sesi Anda sedang berjalan.' : 'Ujian yang sedang dibuka saat ini.', 'live', 'tint-ok', '#2F7D5B', st.jalan || st.buka ? '● LIVE' : '—', st.jalan ? 'Lanjutkan' : 'Lihat'],
        ['s/hasil', 'Hasil & Nilai', 'Rekap nilai, status lulus, dan riwayat ujian.', 'medali', 'tint-plum', '#6B5B95', 'Akademik', 'Lihat Rapor'],
        ['s/hasil', 'Analitik', 'Tren nilai dan performa per mata pelajaran.', 'naik', 'tint-sand', '#9A6B33', 'Tren', 'Lihat Tren']]
        .map(a => '<a class="card aksi-card ' + a[4] + '" href="#/' + a[0] + '" style="text-decoration:none;color:inherit"><span class="badge ' + (a[6].indexOf('LIVE') >= 0 ? 'ok' : 'tl') + ' pojok">' + esc(a[6]) + '</span><div class="ik" style="background:' + a[5] + '">' + ikon(a[3], 22) + '</div><h3>' + a[1] + '</h3><p class="small muted" style="margin:0">' + a[2] + '</p><span class="btn sm" style="background:' + a[5] + ';color:#fff;align-self:flex-start">' + a[7] + ikon('panah', 14) + '</span></a>').join('') + '</div>' +
      '<div class="grid g-main mt" style="margin-top:22px"><div class="col gap-l">' +
      '<div class="card"><div class="card-h"><div><h3>Ringkasan Performa Belajar</h3><p class="small muted" style="margin:0">Statistik dari ujian yang sudah dinilai</p></div></div><div class="grid g4 stack-xs">' +
      [['Ujian dikerjakan', d.stat.dikerjakan, 'cekb', ''], ['Rata-rata nilai', d.stat.rata === null ? '-' : F.n(d.stat.rata), 'chart', ''], ['Ujian lulus', d.stat.lulus + '<small>/' + d.stat.dinilai + '</small>', 'medali', ''], ['Total nilai', F.n(d.stat.total, 0), 'bintang', '']]
        .map(s => '<div class="stat inset" style="padding:14px"><div class="hd"><span class="over">' + s[0] + '</span><span style="color:var(--teal)">' + ikon(s[2], 18) + '</span></div><div class="val">' + s[1] + '</div></div>').join('') + '</div></div>' +
      '<div class="grid g-split"><div class="card"><div class="card-h"><h3>' + ikon('naik') + 'Tren Nilai</h3><span class="badge">KKM ' + esc(d.kkm) + '</span></div>' +
      (d.tampilNilai ? Grafik.garis({ nilai: nilaiTren.map(r => r.nilai), label: nilaiTren.map(r => r.mapel), kkm: d.kkm, kosong: 'Tren muncul setelah ujian pertama Anda dinilai.' }) : '<div class="empty small">Nilai disembunyikan oleh pengaturan sekolah.</div>') + '</div>' +
      '<div class="card"><div class="card-h"><h3>' + ikon('chart') + 'Per Mata Pelajaran</h3></div>' + (d.perMapel.length ? Grafik.donat({ data: d.perMapel.map(m => ({ l: m.mapel, v: m.rata })), tengah: d.stat.rata === null ? '-' : F.n(d.stat.rata), sub: 'RATA-RATA' }) : '<div class="empty small">Belum ada data.</div>') + '</div></div></div>' +
      '<div class="col gap-l"><div class="card"><div class="row">' + UI.avatar(d.siswa.nama) + '<div class="grow"><b>' + esc(d.siswa.nama) + '</b><div class="small muted mono">NIS ' + esc(d.siswa.nis) + '</div><div class="small muted">Kelas ' + esc(d.siswa.kelas) + '</div></div></div>' +
      '<div class="divider"></div><div class="row between small"><span class="muted">Perangkat terdaftar</span><span class="badge ok">' + ikon('hp', 12) + 'Aktif</span></div></div>' +
      '<div class="card"><div class="card-h"><h3>' + ikon('kalender') + 'Ujian Mendatang</h3><span class="badge">' + d.mendatang.length + ' agenda</span></div>' +
      (d.mendatang.length ? d.mendatang.map(m => '<div class="list-item"><div class="date-blk"><span>' + BULAN[new Date(m.buka).getMonth()] + '</span><b>' + new Date(m.buka).getDate() + '</b></div><div class="grow"><b class="small">' + esc(m.nama) + '</b><div class="tiny muted">' + esc(m.mapel) + ' · ' + F.jam(m.buka) + ' · ' + m.durasi + ' mnt</div></div>' + UI.status(m.live ? 'Live' : 'Terjadwal') + '</div>').join('') : '<p class="small muted">Tidak ada ujian lain yang terjadwal.</p>') + '</div>' +
      '<div class="card"><div class="card-h"><h3>' + ikon('bell') + 'Pengumuman</h3></div><div class="alert warn">' + ikon('perisai') + '<div class="grow"><b>Aturan anti-curang</b><p>Jangan pindah tab atau keluar layar penuh selama ujian. Setiap pelanggaran dicatat, dan batas pelanggaran akan mengunci sesi.</p></div></div>' +
      '<p class="small muted mt">Pastikan baterai cukup dan koneksi stabil. Jawaban tersimpan otomatis, termasuk saat koneksi terputus.</p></div></div></div>';
    if (u && st.jalan) {
      const batas = new Date(u.sesi.batas).getTime();
      const t = () => { const e = $('#hero-sisa'); if (e) e.textContent = F.durasi((batas - API.sekarang()) / 1000); };
      t(); App.interval(t, 1000);
    }
  });
} });

/* ---------------- DAFTAR UJIAN ---------------- */
App.daftar('s/ujian', { peran: 'siswa', judul: 'Daftar Ujian', render(el, q) {
  el.innerHTML = UI.sk(3, true);
  const tab = q.tab || 'aktif';
  Siswa.muat(el, d => {
    const u = d.ujian, st = Siswa.statusUjian(u, API.sekarang());
    const n = { aktif: u ? 1 : 0, mendatang: d.mendatang.length, selesai: d.riwayat.length };
    let isi = '';
    if (tab === 'aktif') {
      isi = u ? '<div class="card exam-card" style="max-width:640px"><div class="row between"><span class="over">' + esc(u.mapel) + '</span>' + UI.badge((st.label === 'LIVE' ? '● ' : '') + st.label, st.kelas) + '</div><h2>' + esc(u.nama) + '</h2>' +
        '<div class="small muted">' + ikon('kalender', 14) + ' ' + F.tglP(u.buka) + ', ' + F.jam(u.buka) + ' – ' + F.jam(u.akhir) + ' WIB</div>' +
        '<div class="meta"><span class="chip">' + ikon('pasir', 14) + u.durasi + ' menit</span><span class="chip">' + ikon('daftar', 14) + u.nPG + ' PG + ' + u.nEsai + ' Esai</span>' +
        (u.nEsai && u.nPG ? '<span class="chip" style="color:#7A5527">' + ikon('chart', 14) + 'Bobot ' + u.pPG + '% PG / ' + u.pEsai + '% Esai</span>' : '') +
        (u.aturan.kodeRuang ? '<span class="chip">' + ikon('pintu', 14) + 'Butuh Kode Ruang</span>' : '') + (u.aturan.layarPenuh ? '<span class="chip">' + ikon('layar', 14) + 'Layar penuh</span>' : '') + '</div>' +
        '<div class="row between mt"><span class="small muted">Token: ' + UI.status(u.tokenStatus) + '</span>' + Siswa.tombolUjian(u, st) + '</div></div>'
        : UI.kosong({ ikon: 'main', judul: 'Tidak ada ujian aktif' });
    } else if (tab === 'mendatang') {
      isi = d.mendatang.length ? '<div class="grid g3">' + d.mendatang.map(m => '<div class="card exam-card"><div class="row between"><span class="over">' + esc(m.mapel) + '</span>' + UI.status(m.live ? 'Live' : 'Terjadwal') + '</div><h3>' + esc(m.nama) + '</h3><div class="small muted">' + F.tglP(m.buka) + ' · ' + F.jam(m.buka) + ' WIB · ' + m.durasi + ' menit</div><div class="alert soft small">' + ikon('key', 14) + '<div class="grow">Masuk dengan Token PIN khusus ujian ini.</div></div></div>').join('') + '</div>'
        : UI.kosong({ ikon: 'kalender', judul: 'Tidak ada ujian mendatang' });
    } else {
      isi = d.riwayat.length ? '<div class="grid g3">' + d.riwayat.slice().reverse().map(r => '<div class="card exam-card"><div class="row between"><span class="over">' + esc(r.mapel) + '</span>' + UI.status(r.status) + '</div><h3>' + esc(r.paket) + '</h3><div class="small muted">' + F.tglJam(r.selesai) + '</div>' +
        '<div class="row between mt-s"><span class="small muted">' + (r.nilai === null ? (d.tampilNilai ? 'Menunggu koreksi guru' : 'Nilai disembunyikan') : 'Nilai akhir') + '</span>' + (r.nilai !== null ? '<span class="chip"><span class="mono" style="font-size:18px">' + F.n(r.nilai) + '</span>' + UI.status(r.lulus ? 'Lulus' : 'Remedial') + '</span>' : '') + '</div></div>').join('') + '</div>'
        : UI.kosong({ ikon: 'medali', judul: 'Belum ada ujian yang selesai' });
    }
    el.innerHTML = '<div class="page-h"><div><div class="over">Jadwal terdaftar</div><h1>Daftar Ujian</h1></div><div class="seg">' +
      [['aktif', 'Aktif'], ['mendatang', 'Mendatang'], ['selesai', 'Selesai']].map(t => '<button class="' + (t[0] === tab ? 'on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '<span class="n">' + n[t[0]] + '</span></button>').join('') + '</div></div>' + isi;
    $$('[data-tab]', el).forEach(b => b.onclick = () => App.pergi('s/ujian', { tab: b.dataset.tab }));
  });
} });

/* ---------------- CEK SEBELUM UJIAN (Aturan → Kode Ruang → Layar Penuh) ---------------- */
App.daftar('s/pra', { peran: 'siswa', judul: 'Persiapan Ujian', render(el) {
  el.innerHTML = UI.sk(4, true);
  Siswa.muat(el, d => {
    const u = d.ujian;
    if (!u) { el.innerHTML = UI.kosong({ ikon: 'main', judul: 'Tidak ada ujian aktif' }); return; }
    const st = Siswa.statusUjian(u, API.sekarang());
    if (st.jalan) { location.replace('#/s/kerjakan'); return; }
    if (!st.buka) { el.innerHTML = UI.kosong({ ikon: 'kunci', judul: st.selesai ? 'Ujian sudah selesai' : st.belum ? 'Ujian belum dibuka' : 'Ujian sudah ditutup', tombol: '<a class="btn" href="#/s/beranda">Kembali ke Dashboard</a>' }); return; }
    const at = u.aturan, bisaFS = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream, standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const langkah = [{ k: 'aturan', t: 'Aturan Ujian' }];
    if (at.kodeRuang) langkah.push({ k: 'kode', t: 'Kode Ruang' });
    if (at.layarPenuh) langkah.push({ k: 'fs', t: 'Layar Penuh' });
    el.innerHTML = '<div style="max-width:720px;margin:0 auto"><div class="page-h"><div><div class="over">' + esc(u.mapel) + '</div><h1>' + esc(u.nama) + '</h1><p>' + u.durasi + ' menit · ' + u.nPG + ' PG + ' + u.nEsai + ' esai</p></div></div>' +
      '<div class="steps" id="steps">' + langkah.map((l, i) => '<div data-st="' + l.k + '" class="' + (i ? '' : 'on') + '"><span class="n">' + (i + 1) + '</span><span class="t">' + l.t + '</span></div>').join('') + '</div>' +
      '<div class="card col gap-l"><section><div class="over">Bagian 1 · Ketentuan &amp; tata tertib</div><ul class="rules mt">' +
      ['<b>Waktu mengikuti server.</b> Pengerjaan otomatis dikirim saat hitung mundur mencapai nol.', '<b>Autosave.</b> Jawaban tersimpan di perangkat dan dikirim berkala, termasuk saat koneksi terputus.',
        '<b>Token sekali pakai.</b> Token hanya untuk satu perangkat dan satu kali ujian.', '<b>Soal acak.</b> Urutan soal dan pilihan jawaban berbeda untuk setiap siswa.']
        .map(x => '<li>' + ikon('cekb', 16) + '<span>' + x + '</span></li>').join('') + '</ul>' +
      '<div class="alert warn mt">' + ikon('perisai') + '<div class="grow"><b>Sensor anti-curang aktif</b><p>' + (at.pindahTab ? 'Pindah tab atau aplikasi' : '') + (at.pindahTab && at.layarPenuh ? ', ' : '') + (at.layarPenuh ? 'keluar layar penuh' : '') + ((at.pindahTab || at.layarPenuh) ? ', dan ' : '') + 'pola pengetikan jawaban esai dicatat. <b>' + at.maks + ' pelanggaran</b> akan mengunci sesi sampai dibuka guru.</p></div></div>' +
      '<label class="check mt"><input type="checkbox" class="cb" id="setuju"> Saya telah membaca dan menyetujui seluruh tata tertib ujian.</label></section>' +
      (at.kodeRuang ? '<section class="inset" id="sec-kode"><div class="row between"><div><div class="over">Bagian 2 · Otentikasi Kode Ruang</div><p class="small muted" style="margin:4px 0 0">Masukkan 6 digit Kode Ruang yang tampil di layar kelas.</p></div>' + ikon('pintu', 22) + '</div>' +
        '<div class="pin-boxes mt" id="kode" style="max-width:380px">' + Array.from({ length: 6 }, (_, i) => '<input inputmode="numeric" maxlength="1" aria-label="Digit ' + (i + 1) + '">').join('') + '</div><div id="kode-msg" class="mt-s"></div></section>' : '') +
      (at.layarPenuh ? '<section class="inset" id="sec-fs"><div class="row between wrap"><div class="grow"><div class="over">Bagian ' + (at.kodeRuang ? 3 : 2) + ' · Mode layar penuh</div>' +
        (bisaFS ? '<p class="small muted" style="margin:4px 0 0">Layar penuh diaktifkan otomatis saat Anda menekan "Mulai Mengerjakan". Keluar dari layar penuh dihitung sebagai pelanggaran.</p></div><span class="badge tl">' + ikon('layar', 12) + 'Didukung</span>'
          : '<p class="small muted" style="margin:4px 0 0">' + (ios ? (standalone ? 'Aplikasi sudah berjalan dalam mode layar utama.' : 'iPhone/iPad tidak mendukung layar penuh di browser. Untuk tampilan penuh: ketuk <b>Bagikan</b> lalu <b>Tambahkan ke Layar Utama</b>, buka dari ikon tersebut, lalu masuk lagi dengan token yang sama.') : 'Browser ini tidak mendukung layar penuh. Sensor pindah tab tetap aktif.') + '</p></div><span class="badge sand">' + ikon('hp', 12) + 'Mode alternatif</span>') + '</div></section>' : '') +
      '<div class="row between wrap"><a class="btn ghost" href="#/s/beranda">' + ikon('kiri', 16) + 'Kembali</a><button class="btn primary lg" id="b-mulai" disabled>' + ikon('main') + 'Mulai Mengerjakan Ujian</button></div></div></div>';
    const setuju = $('#setuju'), b = $('#b-mulai'), kotak = $$('#kode input');
    const kode = () => kotak.map(k => k.value).join('');
    const cek = () => {
      const okA = setuju.checked, okK = !at.kodeRuang || kode().length === 6;
      b.disabled = !(okA && okK);
      const s = $$('#steps > div');
      s.forEach(x => x.classList.remove('on', 'done'));
      const tanda = (k, done, on) => { const e = $('[data-st="' + k + '"]'); if (e) { if (done) e.classList.add('done'); else if (on) e.classList.add('on'); } };
      tanda('aturan', okA, !okA); tanda('kode', okA && okK, okA && !okK); tanda('fs', false, okA && okK);
    };
    setuju.onchange = cek;
    kotak.forEach((k, i) => {
      k.addEventListener('input', () => { k.value = k.value.replace(/\D/g, '').slice(-1); if (k.value && i < 5) kotak[i + 1].focus(); $('#kode-msg').innerHTML = ''; cek(); });
      k.addEventListener('keydown', e => { if (e.key === 'Backspace' && !k.value && i > 0) kotak[i - 1].focus(); });
      k.addEventListener('paste', e => { e.preventDefault(); const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); t.split('').forEach((c, j) => { if (kotak[j]) kotak[j].value = c; }); cek(); });
    });
    b.onclick = async () => {
      if (at.layarPenuh && bisaFS) Ujian.layarPenuh();          // harus di dalam gestur klik
      await UI.sibuk(b, async () => {
        const j = await API.call('s.mulai', { kode: kode(), perangkat: App.perangkat() });
        if (!j.success) {
          if (j.code === 'KODE') {
            $('#kode-msg').innerHTML = '<div class="alert bad">' + ikon('xb') + '<div class="grow"><b>Kode salah, lihat layar kelas</b><p>Kode berganti berkala. Ketik ulang kode yang tampil saat ini.</p></div></div>';
            kotak.forEach(k => k.value = ''); kotak[0].focus(); cek(); Ujian.keluarLayarPenuh(); return;
          }
          Ujian.keluarLayarPenuh();
          throw new Error(j.message);
        }
        Ujian.siapkan(j.data);
        App.pergi('s/kerjakan');
      });
    };
    cek();
  });
} });

/* ---------------- HASIL ---------------- */
App.daftar('s/hasil', { peran: 'siswa', judul: 'Hasil Ujian', render(el) {
  el.innerHTML = UI.sk(3, true);
  const gambar = (h, d) => {
    const ujian = d && d.ujian;
    let utama;
    if (!h) utama = UI.kosong({ ikon: 'medali', judul: 'Belum ada hasil', teks: 'Hasil tampil setelah Anda mengirim jawaban.', tombol: '<a class="btn primary" href="#/s/ujian">Ke Daftar Ujian</a>' });
    else if (h.tersembunyi) utama = '<div class="card tc"><div class="lock-screen" style="margin:auto"><div class="big teal">' + ikon('cekb', 38) + '</div><h2>Jawaban terkirim</h2><p class="muted">Nilai tidak ditampilkan oleh pengaturan sekolah. Hasil akan diumumkan oleh guru.</p></div></div>';
    else {
      const v = h.nilaiAkhir, pct = v === null ? 0 : Math.max(0, Math.min(100, v)), C = 2 * Math.PI * 64;
      utama = '<div class="card"><div class="row wrap gap-l top"><svg viewBox="0 0 160 160" width="170" height="170" style="flex:none"><circle cx="80" cy="80" r="64" fill="none" stroke="#E6DECF" stroke-width="14"/>' +
        '<circle cx="80" cy="80" r="64" fill="none" stroke="' + (h.lulus === false ? '#B93A32' : '#0F5561') + '" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + (pct / 100 * C) + ' ' + C + '" transform="rotate(-90 80 80)"/>' +
        '<text x="80" y="' + (v === null ? 86 : 88) + '" text-anchor="middle" style="font-family:JetBrains Mono,monospace;font-size:' + (v === null ? 16 : 34) + 'px;font-weight:700;fill:#23302F">' + (v === null ? 'Menunggu' : F.n(v)) + '</text>' +
        '<text x="80" y="110" text-anchor="middle" style="font-size:9px;letter-spacing:.1em;fill:#6F6A5F">' + (v === null ? 'KOREKSI ESAI' : 'NILAI AKHIR') + '</text></svg>' +
        '<div class="grow col"><div><div class="over">' + esc(h.paket) + '</div><h2 class="mt-s">' + (v === null ? 'Menunggu koreksi guru' : h.lulus ? 'Selamat, Anda lulus!' : 'Belum mencapai KKM') + '</h2>' +
        '<p class="muted">' + (v === null ? 'Nilai pilihan ganda sudah dihitung. Nilai akhir final setelah jawaban esai dikoreksi.' : 'KKM ' + h.kkm + ' · Diselesaikan ' + F.tglJam(h.selesai)) + '</p></div>' +
        '<div class="row wrap">' + (v !== null ? UI.status(h.lulus ? 'Lulus' : 'Tidak Lulus') : UI.status('Menunggu Koreksi')) + '<span class="chip">' + ikon('cekb', 14) + h.terjawab + '/' + h.jumlah + ' terjawab</span></div>' +
        '<div class="grid g3 stack-xs">' + [['Nilai PG', h.nilaiPG], ['Nilai Esai', h.nilaiEsai], ['Nilai Akhir', h.nilaiAkhir]].map(x => '<div class="metric"><div class="over">' + x[0] + '</div><div class="v">' + (x[1] === null ? '<span class="small muted">—</span>' : F.n(x[1])) + '</div></div>').join('') + '</div></div></div></div>';
    }
    const r = d ? d.riwayat : [];
    el.innerHTML = '<div class="page-h"><div><div class="over">Rapor CBT</div><h1>Hasil &amp; Nilai</h1></div></div><div class="col gap-l">' + utama +
      (r.length ? '<div class="grid g-split"><div class="card"><div class="card-h"><h3>' + ikon('naik') + 'Tren Nilai</h3></div>' + Grafik.garis({ nilai: r.filter(x => x.nilai !== null).map(x => x.nilai), label: r.filter(x => x.nilai !== null).map(x => x.mapel), kkm: d.kkm }) + '</div>' +
        '<div class="card"><div class="card-h"><h3>' + ikon('daftar') + 'Riwayat Ujian</h3></div>' + r.slice().reverse().map(x => '<div class="list-item"><div class="grow"><b class="small">' + esc(x.paket) + '</b><div class="tiny muted">' + esc(x.mapel) + ' · ' + F.tgl(x.selesai) + '</div></div>' + (x.nilai !== null ? '<b class="mono">' + F.n(x.nilai) + '</b>' + UI.status(x.lulus ? 'Lulus' : 'Remedial') : UI.status(x.status)) + '</div>').join('') + '</div></div>' : '') + '</div>';
    void ujian;
  };
  Promise.all([API.call('s.hasil', {}).then(j => j.success ? j.data : null).catch(() => null), Siswa.data ? Promise.resolve(Siswa.data) : API.call('s.dashboard', {}).then(j => j.success ? j.data : null)])
    .then(([h, d]) => gambar(h, d)).catch(e => { el.innerHTML = UI.galat(e, 'App.rute()'); });
} });
