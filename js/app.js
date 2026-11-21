/**
 * app.js — boot, router hash, sesi, kerangka (siswa & staf), halaman login
 */
const App = {
  sesi: Simpan.get('tkj_sesi', null),
  pub: Simpan.get('tkj_pub', {}) || {},
  logoUrl: ((Simpan.get('tkj_logo', null) || {}).dataUrl) || '',
  hal: {}, shell: null, ref: null, mapel: Simpan.get('tkj_mapel', ''),
  _timer: [], _pergi: [], _ruteAktif: '',

  /* ---------- boot ---------- */
  mulai() {
    if (this.sesi) API.setSesi(this.sesi.token, this.sesi.peran);
    API.on('auth', () => this.sesiBerakhir());
    API.on('net', on => { const s = $('#sync'); if (s) s.classList.toggle('off', !on); if (!on) UI.toast('Koneksi terputus. Data akan disinkronkan saat online.', 'warn'); });
    window.addEventListener('hashchange', () => this.rute());
    if (!API.siap()) { this.halamanKonfigurasi(); return; }
    API.panaskan(this.sesi && this.sesi.peran === 'staf' ? 'staf' : 'pub');
    this.muatPublik();
    this.rute();
    setInterval(() => this.perbaruiSync(), 5000);
  },
  async muatPublik() {
    const d = await API.pubInfo();
    if (!d) return;
    const beda = JSON.stringify(d) !== JSON.stringify(this.pub);
    this.pub = d;
    document.title = (d.NAMA_APP || 'Tes Online') + ' — ' + (d.TAGLINE || 'Portal Ujian Online');
    const url = await API.logo(d.LOGO_VERSI || '0');
    if (url !== this.logoUrl || beda) { this.logoUrl = url; this.terapkanMerek(); }
  },
  terapkanMerek() {
    $$('[data-logo]').forEach(el => { el.innerHTML = this.logoHtml(); });
    $$('[data-nama-app]').forEach(el => { el.textContent = this.pub.NAMA_APP || 'Tes Online TKJ'; });
    $$('[data-lembaga]').forEach(el => { el.textContent = this.pub.NAMA_LEMBAGA || ''; });
  },
  logoHtml() { return this.logoUrl ? '<img src="' + this.logoUrl + '" alt="Logo">' : esc(F.inisial(this.pub.NAMA_APP || 'Tes Online')); },
  perangkat() {
    let d = Simpan.get('tkj_dev', '');
    if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : 'd' + Date.now() + Math.random().toString(36).slice(2)); Simpan.set('tkj_dev', d); }
    return d;
  },
  halamanKonfigurasi() {
    $('#app').innerHTML = '<div class="auth"><div class="auth-card"><div class="logo">' + ikon('gear', 30) + '</div><h1 style="font-size:22px">Konfigurasi belum lengkap</h1>' +
      '<p class="sub">Isi <span class="mono">GAS_URL</span> di berkas <span class="mono">js/config.js</span> dengan URL Web App Apps Script (berakhiran <span class="mono">/exec</span>), lalu unggah ulang.</p>' +
      '<div class="alert soft">' + ikon('info') + '<div class="grow">Lihat PANDUAN-INSTALASI.md bagian "Deploy Web App".</div></div></div></div>';
  },

  /* ---------- sesi ---------- */
  simpanSesi(s) { this.sesi = s; Simpan.set('tkj_sesi', s); API.setSesi(s.token, s.peran); },
  hapusSesi() { this.sesi = null; Simpan.del('tkj_sesi'); API.setSesi(null, 'publik'); API.hapusCache(); this.ref = null; this.shell = null; },
  sesiBerakhir() {
    if (!this.sesi) return;
    const staf = this.sesi.peran === 'staf';
    if (!staf && Ujian.aktif()) { Ujian.sesiHilang(); return; }
    this.hapusSesi();
    UI.toast('Sesi berakhir. Silakan masuk kembali.', 'warn');
    location.hash = staf ? '#/staf' : '#/masuk';
  },
  async keluar() {
    const staf = this.sesi && this.sesi.peran === 'staf';
    if (!staf && Ujian.aktif() && !(await UI.konfirmasi('Ujian masih berjalan. Jawaban sudah tersimpan, tetapi Anda perlu Token PIN yang sama untuk masuk lagi. Tetap keluar?', { bahaya: true, tombol: 'Keluar' }))) return;
    API.call('auth.keluar', {}).catch(() => { });
    this.hapusSesi();
    location.hash = staf ? '#/staf' : '#/masuk';
  },
  me() { return this.sesi && this.sesi.me || {}; },
  isAdmin() { return !!this.me().admin; },
  isGuru() { return !!this.me().guru; },

  /* ---------- router ---------- */
  daftar(path, def) { this.hal[path] = def; },
  interval(fn, ms) { const id = setInterval(fn, ms); this._timer.push(id); return id; },
  saatPergi(fn) { this._pergi.push(fn); },
  bersih() { this._timer.forEach(clearInterval); this._timer = []; this._pergi.forEach(f => { try { f(); } catch (e) { } }); this._pergi = []; },
  parse() {
    const h = location.hash.replace(/^#\/?/, ''), [p, qs] = h.split('?'), q = {};
    (qs || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { path: p || '', q };
  },
  pergi(path, q) { const qs = q ? '?' + Object.keys(q).filter(k => q[k] !== undefined && q[k] !== '').map(k => encodeURIComponent(k) + '=' + encodeURIComponent(q[k])).join('&') : ''; location.hash = '#/' + path + (qs === '?' ? '' : qs); },
  rute() {
    const { path, q } = this.parse(), s = this.sesi;
    this.bersih();
    this.tutupMenu();
    if (!path) { location.replace('#/' + (s ? (s.peran === 'staf' ? 'g/beranda' : 's/beranda') : 'masuk')); return; }
    if (path === 'masuk') { if (s && s.peran === 'siswa') { location.replace('#/s/beranda'); return; } this.shell = null; return this.loginSiswa(); }
    if (path === 'staf') { if (s && s.peran === 'staf') { location.replace('#/g/beranda'); return; } this.shell = null; return this.loginStaf(); }
    let key = path, param = '';
    if (!this.hal[key]) { const i = path.lastIndexOf('/'); key = path.slice(0, i); param = path.slice(i + 1); }
    const def = this.hal[key];
    if (!def) { location.replace('#/'); return; }
    if (def.peran === 'siswa' && (!s || s.peran !== 'siswa')) { location.replace('#/masuk'); return; }
    if (def.peran !== 'siswa' && (!s || s.peran !== 'staf')) { location.replace('#/staf'); return; }
    if (def.admin && !this.isAdmin()) { UI.toast('Menu ini khusus Admin.', 'warn'); location.replace('#/g/beranda'); return; }
    this._ruteAktif = key;
    let el;
    if (def.fokus) { this.shell = 'fokus'; $('#app').innerHTML = '<div id="konten"></div>'; el = $('#konten'); }
    else el = def.peran === 'siswa' ? this.shellSiswa(key, def) : this.shellStaf(key, def);
    window.scrollTo(0, 0);
    try { def.render(el, q, param); } catch (e) { console.error(e); el.innerHTML = UI.galat(e); }
  },

  /* ---------- kerangka staf ---------- */
  menuStaf() {
    const a = this.isAdmin(), g = this.isGuru();
    return [
      { h: 'Menu Utama' },
      { p: 'g/beranda', l: 'Dashboard', i: 'grid' },
      { p: 'g/soal', l: 'Bank Soal', i: 'book' },
      { p: 'g/paket', l: 'Paket Ujian', i: 'paket' },
      { p: 'g/token', l: 'Token Siswa', i: 'key' },
      { p: 'g/kehadiran', l: 'Kehadiran', i: 'hadir' },
      { p: 'g/monitor', l: 'Monitoring', i: 'live', b: 'live' },
      { p: 'g/koreksi', l: 'Koreksi Esai', i: 'pen', b: 'esai' },
      { p: 'g/rekap', l: 'Rekap Nilai', i: 'chart' },
      { p: 'g/koderuang', l: 'Kode Ruang', i: 'pintu' },
      { p: 'g/dokumen', l: 'Dokumen', i: 'doc' },
      { h: 'Administrasi' },
      { p: 'a/siswa', l: 'Siswa & Kelas', i: 'users' },
      a && { p: 'a/mapel', l: 'Master Mapel', i: 'layers' },
      a && { p: 'a/pengguna', l: 'Pengguna', i: 'usercog' },
      a && { p: 'a/pengaturan', l: 'Pengaturan', i: 'gear' },
      { p: 'g/akun', l: 'Akun Saya', i: 'user' }
    ].filter(Boolean);
  },
  shellStaf(key, def) {
    const me = this.me();
    if (this.shell !== 'staf') {
      this.shell = 'staf';
      const menu = this.menuStaf().map(m => m.h ? '<div class="nav-h">' + esc(m.h) + '</div>' :
        '<a href="#/' + m.p + '" data-nav="' + m.p + '">' + ikon(m.i) + '<span>' + esc(m.l) + '</span>' + (m.b ? '<span class="badge hide" data-badge="' + m.b + '"></span>' : '') + '</a>').join('');
      $('#app').innerHTML = '<div class="shell" id="shell"><aside class="side" aria-label="Navigasi"><div class="brand"><div class="lg" data-logo>' + this.logoHtml() + '</div><div class="grow"><div class="nm" data-nama-app>' + esc(this.pub.NAMA_APP || 'Tes Online TKJ') + '</div><div class="sb">Portal Guru &amp; Admin</div></div></div>' +
        '<nav class="nav">' + menu + '<a href="javascript:void(0)" class="out" onclick="App.keluar()">' + ikon('keluar') + '<span>Keluar</span></a></nav>' +
        '<div class="foot"><div class="paper small"><div class="row gap-s"><i class="dot" style="color:var(--ok)"></i><b>v' + esc(this.pub.VERSI || '1.3') + '</b><span class="muted">UjianKu Pro</span></div><div class="tiny muted mt-s" data-lembaga>' + esc(this.pub.NAMA_LEMBAGA || '') + '</div></div></div></aside>' +
        '<div class="scrim" onclick="App.tutupMenu()"></div><div class="main"><header class="top"><button class="btn icon ghost ham" onclick="App.bukaMenu()" aria-label="Menu">' + ikon('menu') + '</button>' +
        '<div class="ttl grow"><div class="crumb" id="crumb">Portal Guru &amp; Admin</div><h1 id="judul"></h1></div>' +
        '<select class="select hide-m" id="pilih-mapel" style="width:auto;min-width:180px;max-width:260px" aria-label="Filter mapel"><option value="">Semua Mapel</option></select>' +
        '<span class="sync hide-m" id="sync"><i class="dot"></i><span id="sync-t">Tersinkron</span></span>' +
        '<button class="btn icon" id="bel" aria-label="Pemberitahuan" style="position:relative">' + ikon('bell') + '<span class="badge solid-bad hide" id="bel-n" style="position:absolute;top:-4px;right:-4px;padding:0 6px;font-size:10px"></span></button>' +
        '<div class="who"><b>' + esc(me.nama || '') + '</b><span>' + esc(me.admin ? (me.guru ? 'Admin · Guru Pengampu' : 'Administrator') : 'Guru Pengampu') + '</span></div>' + UI.avatar(me.nama) + '</header>' +
        '<main class="content" id="konten"></main><footer class="foot-bar"><span><b data-nama-app>' + esc(this.pub.NAMA_APP || '') + '</b> v' + esc(this.pub.VERSI || '1.3') + ' · <span data-lembaga>' + esc(this.pub.NAMA_LEMBAGA || '') + '</span></span><span>Data tersimpan di Google Sheets milik sekolah</span></footer></div></div>';
      $('#bel').onclick = () => { const n = this._lencana || {}; this.pergi(n.terkunci ? 'g/monitor' : 'g/koreksi'); };
      const sel = $('#pilih-mapel');
      sel.onchange = () => { this.mapel = sel.value; Simpan.set('tkj_mapel', this.mapel); this.rute(); };
      this.muatRef();
    }
    $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === key || (key.indexOf(a.dataset.nav + '/') === 0)));
    $('#judul').textContent = def.judul || '';
    $('#crumb').textContent = def.crumb || 'Portal Guru & Admin';
    $('#pilih-mapel').classList.toggle('hide', !def.filterMapel);
    const k = $('#konten'); k.style.animation = 'none'; void k.offsetWidth; k.style.animation = '';
    return k;
  },
  /** Data referensi staf (mapel, kelas, paket, profil) — SWR + lencana menu */
  async muatRef(paksa) {
    try {
      await API.swr('ref.data', {}, d => {
        this.ref = d;
        if (d.me) { this.sesi.me = Object.assign(this.sesi.me || {}, d.me); Simpan.set('tkj_sesi', this.sesi); }
        const sel = $('#pilih-mapel');
        if (sel) {
          const boleh = d.mapel.filter(m => this.isAdmin() || (this.me().mapel || []).indexOf(m.id) >= 0);
          sel.innerHTML = '<option value="">Semua Mapel</option>' + boleh.map(m => '<option value="' + esc(m.id) + '"' + (m.id === this.mapel ? ' selected' : '') + '>' + esc(m.nama) + '</option>').join('');
        }
      }, { maxAge: paksa ? 0 : 60000, diam: true });
    } catch (e) { }
    this.lencana();
  },
  async lencana() {
    try {
      await API.swr('g.dashboard', {}, d => {
        this._lencana = d.stat;
        const set = (k, n, kelas) => { const b = $('[data-badge="' + k + '"]'); if (!b) return; b.textContent = n; b.className = 'badge ' + kelas + (n ? '' : ' hide'); };
        set('live', d.stat.ujianBerjalan ? 'LIVE ' + d.stat.ujianBerjalan : '', 'teal');
        set('esai', d.stat.esaiMenunggu, 'sand');
        const n = (d.stat.terkunci || 0), b = $('#bel-n'); if (b) { b.textContent = n; b.classList.toggle('hide', !n); }
      }, { maxAge: 20000, diam: true });
    } catch (e) { }
  },
  bukaMenu() { const s = $('#shell'); if (s) s.classList.add('open'); },
  tutupMenu() { const s = $('#shell'); if (s) s.classList.remove('open'); },
  perbaruiSync() {
    const t = $('#sync-t'); if (!t) return;
    const last = Perf.log.length ? Perf.log[Perf.log.length - 1] : null;
    t.textContent = API.online ? (last ? 'Sinkron · ' + F.relatif(last.t) : 'Tersinkron') : 'Offline';
  },
  paketRef() { const r = this.ref || API.ambilCache('ref.data', {}); return (r && r.paket) || []; },
  mapelRef() { const r = this.ref || API.ambilCache('ref.data', {}); return (r && r.mapel) || []; },
  kelasRef() { const r = this.ref || API.ambilCache('ref.data', {}); return (r && r.kelas) || []; },
  namaMapel(id) { const m = this.mapelRef().find(x => x.id === id); return m ? m.nama : '-'; },
  /** <select> paket — nilai awal dari query, lalu paket berjalan/terbaru */
  opsiPaket(pilih, semua) {
    const ps = this.paketRef().filter(p => !this.mapel || p.mapel === this.mapel);
    return (semua ? '<option value="">' + esc(semua) + '</option>' : '') + ps.map(p => '<option value="' + esc(p.id) + '"' + (p.id === pilih ? ' selected' : '') + '>' + esc(p.nama) + ' · ' + esc(p.status) + '</option>').join('');
  },
  paketAwal(q) {
    if (q && q.paket) return q.paket;
    const ps = this.paketRef().filter(p => !this.mapel || p.mapel === this.mapel);
    const b = ps.find(p => p.status === 'Berjalan') || ps.find(p => p.status === 'Terjadwal') || ps[0];
    return b ? b.id : '';
  },

  /* ---------- kerangka siswa ---------- */
  shellSiswa(key, def) {
    const me = this.me();
    if (this.shell !== 'siswa') {
      this.shell = 'siswa';
      const menu = [['s/beranda', 'Dashboard', 'grid'], ['s/ujian', 'Mulai Ujian', 'main'], ['s/hasil', 'Hasil & Nilai', 'medali']];
      $('#app').innerHTML = '<div class="shell siswa" id="shell"><aside class="side"><div class="brand"><div class="lg" data-logo>' + this.logoHtml() + '</div><div class="grow"><div class="nm" data-nama-app>' + esc(this.pub.NAMA_APP || 'Tes Online TKJ') + '</div><div class="sb">CBT Platform</div></div></div>' +
        '<nav class="nav">' + menu.map(m => '<a href="#/' + m[0] + '" data-nav="' + m[0] + '">' + ikon(m[2]) + '<span>' + m[1] + '</span></a>').join('') +
        '<a href="javascript:void(0)" class="out" onclick="App.keluar()">' + ikon('keluar') + '<span>Keluar</span></a></nav>' +
        '<div class="foot"><div class="paper small"><div class="over" style="color:#7A5527">Motivasi hari ini</div><p class="mt-s" style="font-style:italic;margin-bottom:0">"Kerjakan dengan jujur dan teliti. Usaha terbaik tidak pernah mengkhianati hasil."</p></div></div></aside>' +
        '<div class="scrim" onclick="App.tutupMenu()"></div><div class="main"><header class="top"><button class="btn icon ghost ham" onclick="App.bukaMenu()" aria-label="Menu">' + ikon('menu') + '</button>' +
        '<div class="ttl grow"><h1>' + esc(this.pub.TAGLINE || 'Portal Ujian Online') + '</h1><div class="crumb" data-lembaga>' + esc(this.pub.NAMA_LEMBAGA || '') + '</div></div>' +
        '<span class="sync hide-m" id="sync"><i class="dot"></i><span id="sync-t">Tersinkron</span></span>' +
        '<div class="who"><b>Halo, ' + esc((me.nama || '').split(' ')[0]) + '</b><span class="mono">NIS ' + esc(me.nis || '') + '</span></div>' + UI.avatar(me.nama) + '</header>' +
        '<main class="content" id="konten"></main>' +
        '<footer class="foot-bar teal"><span><b data-lembaga>' + esc(this.pub.NAMA_LEMBAGA || '') + '</b>' + (this.pub.ALAMAT ? ' · ' + esc(this.pub.ALAMAT) : '') + (this.pub.KONTAK ? ' · ' + esc(this.pub.KONTAK) : '') + '</span><span>© ' + new Date().getFullYear() + ' ' + esc(this.pub.NAMA_APP || '') + ' · UjianKu Pro</span></footer></div>' +
        '<nav class="tabbar">' + menu.map(m => '<a href="#/' + m[0] + '" data-nav="' + m[0] + '">' + ikon(m[2], 20) + m[1].split(' ')[0] + '</a>').join('') + '<a href="javascript:void(0)" onclick="App.keluar()">' + ikon('keluar', 20) + 'Keluar</a></nav></div>';
    }
    $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === key));
    return $('#konten');
  },

  /* ---------- LOGIN SISWA (Token PIN) ---------- */
  loginSiswa() {
    API.panaskan('pub');
    $('#app').innerHTML = '<div class="auth"><div class="auth-card"><div class="logo" data-logo>' + this.logoHtml() + '</div>' +
      '<div class="inst" data-lembaga>' + esc(this.pub.NAMA_LEMBAGA || '') + '</div><h1>Masuk Ujian</h1><p class="sub">Masukkan Token PIN 6 karakter dari guru Anda</p>' +
      '<form id="f-pin" autocomplete="off"><div class="row between mb"><span class="lbl">Token PIN</span><span class="small nowrap" style="color:#7A5527">' + ikon('key', 14) + ' 6 karakter</span></div>' +
      '<div class="pin-boxes" id="pin">' + Array.from({ length: 6 }, (_, i) => '<input inputmode="text" maxlength="1" autocapitalize="characters" spellcheck="false" aria-label="Karakter ' + (i + 1) + '">').join('') + '</div>' +
      '<div id="pin-msg" class="mt"></div><button class="btn primary lg block mt" id="b-masuk" type="submit">Masuk Ujian ' + ikon('panah', 18) + '</button></form>' +
      '<p class="small muted tc mt">' + ikon('perisai', 13) + ' Token hanya berlaku satu kali untuk satu perangkat siswa.</p>' +
      '<p class="tc mt"><a href="#/staf">Login Guru / Administrator →</a></p></div></div>';
    const kotak = $$('#pin input');
    const nilai = () => kotak.map(k => k.value).join('').toUpperCase();
    kotak.forEach((k, i) => {
      k.addEventListener('input', () => {
        k.value = k.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
        if (k.value && i < 5) kotak[i + 1].focus();
        if (nilai().length === 6) $('#b-masuk').focus();
      });
      k.addEventListener('keydown', e => { if (e.key === 'Backspace' && !k.value && i > 0) { kotak[i - 1].focus(); kotak[i - 1].value = ''; } if (e.key === 'ArrowLeft' && i > 0) kotak[i - 1].focus(); if (e.key === 'ArrowRight' && i < 5) kotak[i + 1].focus(); });
      k.addEventListener('paste', e => { e.preventDefault(); const t = (e.clipboardData.getData('text') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); t.split('').forEach((c, j) => { if (kotak[j]) kotak[j].value = c; }); (kotak[Math.min(t.length, 5)]).focus(); });
    });
    setTimeout(() => kotak[0].focus(), 60);
    const pesan = (jenis, judul, teks) => { $('#pin-msg').innerHTML = '<div class="alert ' + jenis + '">' + ikon(jenis === 'bad' ? 'xb' : jenis === 'warn' ? 'segitiga' : 'info') + '<div class="grow"><b>' + esc(judul) + '</b>' + (teks ? '<p>' + esc(teks) + '</p>' : '') + '</div></div>'; };
    let kunciSampai = Number(sessionStorage.getItem('tkj_pinlock') || 0);
    const hitungMundur = () => {
      const sisa = Math.ceil((kunciSampai - Date.now()) / 1000);
      if (sisa <= 0) { kotak.forEach(k => k.disabled = false); $('#b-masuk').disabled = false; $('#pin-msg').innerHTML = ''; kotak[0].focus(); return; }
      kotak.forEach(k => k.disabled = true); $('#b-masuk').disabled = true;
      $('#pin-msg').innerHTML = '<div class="alert bad">' + ikon('kunci') + '<div class="grow"><b>Terlalu banyak percobaan</b><p>Coba lagi setelah hitung mundur selesai.</p><div class="countdown mt-s">' + F.durasi(sisa) + '</div></div></div>';
      setTimeout(hitungMundur, 1000);
    };
    if (kunciSampai > Date.now()) hitungMundur();
    $('#f-pin').onsubmit = async e => {
      e.preventDefault();
      const pin = nilai();
      if (pin.length !== 6) { $('#pin').classList.add('err'); setTimeout(() => { const x = $('#pin'); if (x) x.classList.remove('err'); }, 400); pesan('warn', 'Token belum lengkap', 'Isi keenam karakter Token PIN.'); return; }
      await UI.sibuk($('#b-masuk'), async () => {
        const j = await API.call('auth.siswa', { pin, perangkat: this.perangkat() });
        if (j.success) {
          this.simpanSesi({ token: j.data.token, me: j.data.me, peran: 'siswa' });
          Simpan.set('tkj_pin_terakhir', pin);
          location.hash = '#/s/beranda';
          return;
        }
        $('#pin').classList.add('err'); setTimeout(() => { const x = $('#pin'); if (x) x.classList.remove('err'); }, 400);
        const peta = {
          INVALID: ['bad', 'Token tidak sesuai'], LOCKED: ['bad', 'Terlalu banyak percobaan'], EXPIRED: ['warn', 'Token kedaluwarsa'],
          USED: ['soft', 'Token sudah dipakai'], BLOCKED: ['bad', 'Token diblokir'], NOT_OPEN: ['', 'Ujian belum dibuka'], DEVICE: ['warn', 'Token dipakai di perangkat lain']
        }, p = peta[j.code] || ['bad', 'Gagal masuk'];
        if (j.code === 'LOCKED') { kunciSampai = Date.now() + (j.sisa || 60) * 1000; sessionStorage.setItem('tkj_pinlock', String(kunciSampai)); hitungMundur(); return; }
        pesan(p[0], p[1], j.message + (j.code === 'NOT_OPEN' && j.buka ? ' Dibuka ' + F.tglP(j.buka) + ' pukul ' + F.jam(j.buka) + '.' : ''));
        kotak.forEach(k => k.value = ''); kotak[0].focus();
      });
    };
  },

  /* ---------- LOGIN STAF ---------- */
  loginStaf() {
    API.panaskan('staf');
    $('#app').innerHTML = '<div class="auth"><div class="auth-card"><div class="logo" data-logo>' + this.logoHtml() + '</div><div class="inst" data-lembaga>' + esc(this.pub.NAMA_LEMBAGA || '') + '</div>' +
      '<h1>Login Guru / Admin</h1><p class="sub">Masuk ke panel pengelolaan ujian</p>' +
      '<form id="f-staf" class="col"><div class="field"><label for="u">Username</label><div class="input-ikon">' + ikon('user', 16) + '<input class="input" id="u" autocomplete="username" autocapitalize="off" required></div></div>' +
      '<div class="field"><label for="p">Kata sandi</label><div class="input-ikon" style="position:relative">' + ikon('kunci', 16) + '<input class="input" id="p" type="password" autocomplete="current-password" required style="padding-right:44px">' +
      '<button type="button" class="btn icon ghost sm" id="lihat" style="position:absolute;right:4px;top:4px" aria-label="Tampilkan sandi">' + ikon('mata', 16) + '</button></div></div>' +
      '<div id="staf-msg"></div><button class="btn primary lg block" id="b-staf" type="submit">Masuk ' + ikon('panah', 18) + '</button></form>' +
      '<p class="tc mt"><a href="#/masuk">← Masuk sebagai Siswa (Token PIN)</a></p></div></div>';
    $('#lihat').onclick = () => { const p = $('#p'); p.type = p.type === 'password' ? 'text' : 'password'; };
    setTimeout(() => $('#u').focus(), 60);
    $('#f-staf').onsubmit = async e => {
      e.preventDefault();
      await UI.sibuk($('#b-staf'), async () => {
        const j = await API.call('auth.staf', { username: $('#u').value.trim(), password: $('#p').value });
        if (!j.success) { $('#staf-msg').innerHTML = '<div class="alert bad">' + ikon('xb') + '<div class="grow">' + esc(j.message) + '</div></div>'; $('#p').value = ''; $('#p').focus(); return; }
        this.simpanSesi({ token: j.data.token, me: j.data.me, peran: 'staf' });
        // prefetch menu inti dalam 1 eksekusi (batch)
        ['ref.data', 'g.dashboard', 'paket.list', 'soal.list'].forEach(a => API.swr(a, {}, () => { }, { diam: true }).catch(() => { }));
        location.hash = '#/g/beranda';
      });
    };
  }
};
