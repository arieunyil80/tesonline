/**
 * ujian.js — mesin ujian siswa (mode fokus)
 *  • Satu soal per layar, navigasi nomor, ragu-ragu, timer dari waktu server
 *  • Simpan dulu ke perangkat (IndexedDB), lalu autosave berkala ke server
 *  • Mode offline: antrean tetap tersimpan & tersinkron saat online
 *  • Sensor anti-curang: pindah tab/aplikasi & keluar layar penuh (dengan toleransi)
 *  • Analitik pengetikan esai: karakter diketik vs ditempel, kecepatan rata-rata & puncak
 */
const Lokal = (() => {
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(res => {
      try {
        const r = indexedDB.open('tkj_ujian', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('sesi');
        r.onsuccess = () => res(r.result); r.onerror = () => res(null);
      } catch (e) { res(null); }
    });
    return dbp;
  }
  return {
    async set(k, v) { const d = await db(); if (!d) return Simpan.set('tkj_u_' + k, v); return new Promise(res => { try { const t = d.transaction('sesi', 'readwrite'); t.objectStore('sesi').put(v, k); t.oncomplete = () => res(true); t.onerror = () => res(Simpan.set('tkj_u_' + k, v)); } catch (e) { res(Simpan.set('tkj_u_' + k, v)); } }); },
    async get(k) { const d = await db(); if (!d) return Simpan.get('tkj_u_' + k, null); return new Promise(res => { try { const r = d.transaction('sesi').objectStore('sesi').get(k); r.onsuccess = () => res(r.result || Simpan.get('tkj_u_' + k, null)); r.onerror = () => res(Simpan.get('tkj_u_' + k, null)); } catch (e) { res(Simpan.get('tkj_u_' + k, null)); } }); },
    async del(k) { Simpan.del('tkj_u_' + k); const d = await db(); if (!d) return; try { d.transaction('sesi', 'readwrite').objectStore('sesi').delete(k); } catch (e) { } }
  };
})();

const Ujian = {
  st: null, _h: [], _iv: [],
  aktif() { return !!(this.st && !this.st.selesai && ['Berjalan', 'Terkunci'].indexOf(this.st.status) >= 0); },
  bisaFS() { const e = document.documentElement; return !!(e.requestFullscreen || e.webkitRequestFullscreen) && document.fullscreenEnabled !== false; },
  diFS() { return !!(document.fullscreenElement || document.webkitFullscreenElement); },
  layarPenuh() { try { const e = document.documentElement, f = e.requestFullscreen || e.webkitRequestFullscreen; if (f) { const p = f.call(e, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => { }); } } catch (e) { } },
  keluarLayarPenuh() { try { if (this.diFS()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { } },

  siapkan(d) {
    this.st = {
      sesi: d.sesi.id, paket: d.paket, aturan: d.aturan || {}, soal: d.soal, jawaban: Object.assign({}, d.jawaban || {}), ragu: new Set(d.ragu || []),
      an: {}, idx: 0, batas: new Date(d.sesi.batas).getTime(), nPel: d.sesi.nPel || 0, nPelLokal: d.sesi.nPel || 0, maks: d.sesi.maks || 3,
      status: d.sesi.status, tunda: [], ubah: 0, ubahTerkirim: 0, ts: 0, terakhirKirim: Date.now(), sibuk: false, selesai: false, kirimFinal: false,
      pergiSejak: 0, fsKeluar: 0, fsDicatat: false, sudahFS: this.diFS()
    };
    Object.keys(d.analitik || {}).forEach(id => { const a = d.analitik[id]; this.st.an[id] = { k: a.k || 0, t: a.t || 0, n: a.n || 0, ms: a.ms || 0, p: a.p || 0, last: 0, win: [] }; });
  },
  /** Gabungkan cadangan lokal (lebih baru dari server bila ada) */
  async gabungLokal() {
    const L = await Lokal.get(this.st.sesi);
    if (!L) return;
    Object.assign(this.st.jawaban, L.jawaban || {});
    if (L.ragu) this.st.ragu = new Set(L.ragu);
    Object.keys(L.an || {}).forEach(id => { const a = L.an[id], b = this.st.an[id]; if (!b || (a.k + a.t) >= (b.k + b.t)) this.st.an[id] = Object.assign({ last: 0, win: [] }, a); });
    this.st.tunda = (L.tunda || []).filter(e => e && e.k);
    this.st.idx = Math.min(L.idx || 0, this.st.soal.length - 1);
    if (L.kirimFinal) this.st.kirimFinal = true;
    if (L.ubah > 0) this.st.ubah = 1;     // anggap ada yang belum terkirim
  },
  simpanLokal: UI.debounce(function () { Ujian.simpanLokalSekarang(); }, 250),
  simpanLokalSekarang() {
    const s = this.st; if (!s) return;
    const an = {}; Object.keys(s.an).forEach(id => { const a = s.an[id]; an[id] = { k: a.k, t: a.t, n: a.n, ms: a.ms, p: a.p }; });
    Lokal.set(s.sesi, { jawaban: s.jawaban, ragu: Array.from(s.ragu), an, tunda: s.tunda, idx: s.idx, ubah: s.ubah - s.ubahTerkirim, kirimFinal: s.kirimFinal, t: Date.now() });
  },

  /* ---------------- tampilan ---------------- */
  render(el) {
    const s = this.st, me = App.me();
    el.innerHTML = '<div class="exam"><header class="exam-top"><div class="brand" style="padding:0"><div class="lg" data-logo style="width:36px;height:36px">' + App.logoHtml() + '</div></div>' +
      '<div class="tt"><b>' + esc(s.paket.nama) + '</b><span>' + esc(s.paket.mapel) + ' · ' + esc(me.nama || '') + '</span></div>' +
      '<span class="timer" id="timer" role="timer" aria-live="off">' + ikon('pasir', 18) + '<span id="timer-t">--:--</span></span>' +
      '<span class="conn" id="conn"><i class="dot"></i><span id="conn-t">Online</span></span>' +
      '<span class="vchip" id="vchip">' + ikon('perisai', 14) + '<span id="vchip-t"></span></span></header>' +
      '<div class="offline-bar hide" id="offbar">' + ikon('wifioff', 16) + '<span id="offbar-t"></span></div>' +
      '<div class="exam-body"><main id="qwrap"></main><aside class="card nav-panel" id="navp"><div class="row between"><h3>' + ikon('daftar') + ' Navigasi Soal</h3><button class="btn icon sm ghost nav-toggle" onclick="Ujian.navToggle(false)" aria-label="Tutup">' + ikon('x', 16) + '</button></div>' +
      '<div class="row gap-s small mt-s mb" id="nav-n"></div><div class="qgrid" id="qgrid"></div>' +
      '<div class="legend"><span><i style="background:var(--teal)"></i>Terjawab</span><span><i style="background:var(--sand)"></i>Ragu-ragu</span><span><i style="background:var(--raised);border:1px solid var(--border)"></i>Kosong</span><span><i style="background:var(--plum)"></i>E = Esai</span></div>' +
      '<button class="btn primary block mt" onclick="Ujian.konfirmasiKirim()">' + ikon('kirim', 16) + 'Selesai &amp; Kirim</button>' +
      '<p class="tiny muted mt-s">Pintasan: <span class="mono">A–E</span> pilih jawaban · <span class="mono">← →</span> pindah soal</p></aside></div>' +
      '<footer class="exam-foot"><div class="in"><button class="btn" id="b-prev">' + ikon('kiri', 16) + '<span class="lbl-m">Sebelumnya</span></button>' +
      '<button class="btn nav-toggle" onclick="Ujian.navToggle(true)">' + ikon('daftar', 16) + 'Daftar Soal</button><span class="grow"></span>' +
      '<button class="btn sand" id="b-ragu">' + ikon('bendera', 16) + '<span class="lbl-m">Ragu-ragu</span></button>' +
      '<button class="btn primary" id="b-next"><span class="lbl-m">Berikutnya</span>' + ikon('kanan', 16) + '</button></div></footer></div>';
    $('#b-prev').onclick = () => this.ke(s.idx - 1);
    $('#b-next').onclick = () => (s.idx >= s.soal.length - 1 ? this.konfirmasiKirim() : this.ke(s.idx + 1));
    $('#b-ragu').onclick = () => this.toggleRagu();
    this.gambarGrid(); this.gambarSoal(); this.tickTimer(); this.perbaruiPel(); this.setConn();
  },
  navToggle(v) { $('#navp').classList.toggle('open', v); },
  gambarGrid() {
    const s = this.st, g = $('#qgrid'); if (!g) return;
    g.innerHTML = s.soal.map((q, i) => '<button class="qbtn" data-i="' + i + '" aria-label="Soal ' + (i + 1) + '">' + (i + 1) + (q.tipe === 'Esai' ? '<span class="e">E</span>' : '') + '</button>').join('');
    $$('.qbtn', g).forEach(b => b.onclick = () => { this.ke(Number(b.dataset.i)); this.navToggle(false); });
    this.tandaiGrid();
  },
  terisi(q) { const v = this.st.jawaban[q.id]; return v !== undefined && String(v).trim() !== ''; },
  tandaiGrid() {
    const s = this.st;
    $$('.qbtn').forEach((b, i) => { const q = s.soal[i]; b.className = 'qbtn' + (s.ragu.has(q.id) ? ' rg' : this.terisi(q) ? ' ans' : '') + (i === s.idx ? ' cur' : ''); });
    const n = s.soal.filter(q => this.terisi(q)).length, r = s.ragu.size;
    const nn = $('#nav-n'); if (nn) nn.innerHTML = '<span class="badge teal">' + n + ' terjawab</span><span class="badge sand">' + r + ' ragu</span><span class="badge">' + (s.soal.length - n) + ' kosong</span>';
  },
  gambarSoal() {
    const s = this.st, q = s.soal[s.idx], wrap = $('#qwrap'); if (!q || !wrap) return;
    const v = s.jawaban[q.id];
    let isi = '<div class="q-card"><div class="q-head"><div class="q-no">' + String(q.no).padStart(2, '0') + '</div><div class="grow"><b>Soal ' + q.no + ' dari ' + s.soal.length + '</b><div class="small muted">' + (q.tipe === 'Esai' ? 'Esai / uraian' : 'Pilihan ganda') + '</div></div>' +
      UI.status(q.tipe) + '<span class="chip">' + ikon('bintang', 13) + 'Bobot ' + F.n(q.bobot) + '</span></div><div class="q-text">' + esc(q.teks) + '</div>' +
      (q.gambar ? '<div class="q-img"><img src="' + esc(q.gambar) + '" alt="Gambar soal ' + q.no + '" loading="lazy" referrerpolicy="no-referrer" onclick="Ujian.perbesar(this.src)"><div class="tiny muted mt-s">Ketuk gambar untuk memperbesar</div></div>' : '');
    if (q.tipe === 'PG') {
      isi += '<div class="opts" role="radiogroup">' + q.opsi.map((o, i) => '<button class="opt' + (v === o.k ? ' on' : '') + '" data-k="' + o.k + '" role="radio" aria-checked="' + (v === o.k) + '"><span class="k">' + 'ABCDE'[i] + '</span><span class="t">' + esc(o.t) + '</span>' + (v === o.k ? ikon('cekb', 20) : '') + '</button>').join('') + '</div>';
    } else {
      isi += '<div class="field mt"><div class="row between"><label for="esai">Jawaban Anda</label><span class="small muted"><i class="dot pulse" style="color:var(--bad)"></i> Pengetikan direkam</span></div>' +
        '<textarea class="textarea essay" id="esai" placeholder="Ketik jawaban Anda di sini…" maxlength="10000" spellcheck="false" autocomplete="off">' + esc(v || '') + '</textarea>' +
        '<div class="row between small muted"><span>Jawaban tersimpan otomatis</span><span class="mono" id="esai-n">' + String(v || '').length + ' karakter</span></div></div>';
    }
    wrap.innerHTML = isi + '</div>';
    if (q.tipe === 'PG') $$('.opt', wrap).forEach(b => b.onclick = () => this.pilih(b.dataset.k));
    else this.pasangEsai($('#esai'), q.id);
    $('#b-prev').disabled = s.idx === 0;
    $('#b-next').innerHTML = s.idx >= s.soal.length - 1 ? ikon('kirim', 16) + '<span class="lbl-m">Selesai</span>' : '<span class="lbl-m">Berikutnya</span>' + ikon('kanan', 16);
    const r = $('#b-ragu'); r.classList.toggle('primary', s.ragu.has(q.id)); r.classList.toggle('sand', !s.ragu.has(q.id));
    this.tandaiGrid();
  },
  ke(i) { const s = this.st; if (i < 0 || i >= s.soal.length || this.terkunci()) return; s.idx = i; this.gambarSoal(); this.simpanLokal(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  terkunci() { return this.st && this.st.status === 'Terkunci'; },
  ubah() { const s = this.st; s.ubah++; s.ts = API.sekarang(); this.simpanLokal(); this.setConn(); },
  pilih(k) {
    const s = this.st, q = s.soal[s.idx]; if (this.terkunci() || q.tipe !== 'PG') return;
    s.jawaban[q.id] = k; this.ubah();
    $$('.opt').forEach(b => { const on = b.dataset.k === k; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); const c = b.querySelector('svg'); if (c && !on) c.remove(); if (on && !c) b.insertAdjacentHTML('beforeend', ikon('cekb', 20)); });
    this.tandaiGrid();
  },
  toggleRagu() { const s = this.st, q = s.soal[s.idx]; if (this.terkunci()) return; s.ragu.has(q.id) ? s.ragu.delete(q.id) : s.ragu.add(q.id); this.ubah(); this.gambarSoal(); },
  perbesar(src) { UI.modal({ isi: '<img src="' + esc(src) + '" style="width:100%;border-radius:12px" referrerpolicy="no-referrer">', ukuran: 'xl', aksi: [{ label: 'Tutup', kelas: 'primary' }] }); },

  /* ---------------- analitik pengetikan esai ---------------- */
  pasangEsai(ta, id) {
    const s = this.st;
    const a = s.an[id] = s.an[id] || { k: 0, t: 0, n: 0, ms: 0, p: 0, last: 0, win: [] };
    let panjang = ta.value.length, jenisTerakhir = '', tempelBaru = false;
    ta.addEventListener('beforeinput', e => { jenisTerakhir = e.inputType || ''; });
    ta.addEventListener('paste', () => { tempelBaru = true; a.n++; });
    ta.addEventListener('drop', () => { tempelBaru = true; a.n++; });
    ta.addEventListener('input', e => {
      if (this.terkunci()) { ta.value = s.jawaban[id] || ''; return; }
      const len = ta.value.length, delta = len - panjang, jenis = e.inputType || jenisTerakhir;
      panjang = len;
      if (delta > 0) {
        const tempel = tempelBaru || /paste|drop/i.test(jenis) || (delta >= 25 && !/composition/i.test(jenis));
        if (tempel) { a.t += delta; if (!tempelBaru) a.n++; }
        else {
          const now = Date.now();
          a.k += delta;
          if (a.last && now - a.last <= 5000) a.ms += now - a.last;     // jeda > 5 dtk tidak dihitung
          a.last = now;
          a.win.push([now, delta]);
          while (a.win.length && now - a.win[0][0] > 10000) a.win.shift();
          const jml = a.win.reduce((x, w) => x + w[1], 0);
          if (a.win.length > 2) a.p = Math.max(a.p, Math.round(jml * 6));   // karakter/menit dalam jendela 10 dtk
        }
      }
      tempelBaru = false; jenisTerakhir = '';
      s.jawaban[id] = ta.value;
      $('#esai-n').textContent = len + ' karakter';
      this.ubah(); this.tandaiGrid();
    });
  },
  ringkasAnalitik() { const out = {}; Object.keys(this.st.an).forEach(id => { const a = this.st.an[id]; out[id] = { k: a.k, t: a.t, n: a.n, ms: a.ms, p: a.p }; }); return out; },

  /* ---------------- timer ---------------- */
  tickTimer() {
    const s = this.st; if (!s || s.selesai) return;
    const sisa = Math.floor((s.batas - API.sekarang()) / 1000), el = $('#timer'), t = $('#timer-t');
    if (t) t.textContent = F.durasi(sisa);
    if (el) el.className = 'timer' + (sisa <= 120 ? ' bad' : sisa <= 600 ? ' warn' : '');
    const lk = $('#kunci-sisa'); if (lk) lk.textContent = F.durasi(sisa);
    if (sisa <= 0 && !s.kirimFinal) this.waktuHabis();
  },

  /* ---------------- koneksi & sinkronisasi ---------------- */
  menunggu() { return Math.max(0, this.st.ubah - this.st.ubahTerkirim) + this.st.tunda.length; },
  setConn(mode) {
    const s = this.st; if (!s) return;
    const c = $('#conn'), ct = $('#conn-t'), ob = $('#offbar'), ot = $('#offbar-t'); if (!c) return;
    const off = !API.online, n = this.menunggu();
    mode = mode || (off ? 'off' : (s.sibuk ? 'sync' : 'on'));
    c.className = 'conn' + (mode === 'off' ? ' off' : mode === 'sync' ? ' sync' : '');
    ct.textContent = mode === 'off' ? 'Offline — tersimpan' + (n ? ' (' + n + ' menunggu)' : '') : mode === 'sync' ? 'Sinkronisasi…' : 'Online · ' + (n ? n + ' belum terkirim' : 'tersimpan ' + F.jam(new Date(s.terakhirKirim)));
    ob.classList.toggle('hide', mode !== 'off');
    ot.textContent = 'Tidak ada koneksi — jawaban tersimpan di perangkat' + (n ? ' (' + n + ' perubahan menunggu sinkron)' : '') + '. Lanjutkan mengerjakan.';
  },
  async kirim(final) {
    const s = this.st; if (!s || s.sibuk || (s.selesai && !final)) return false;
    s.sibuk = true; this.setConn('sync');
    const ubahSaat = s.ubah, pel = s.tunda.slice();
    const data = { sesi: s.sesi, jawaban: s.jawaban, ragu: Array.from(s.ragu), analitik: this.ringkasAnalitik(), pel, ts: s.ts || API.sekarang(), n: s.soal.filter(q => this.terisi(q)).length };
    let j = null;
    try { j = await API.call(final ? 's.kirim' : 's.simpan', data, { noStale: !final, timeout: 30000 }); }
    catch (e) { s.sibuk = false; this.setConn('off'); return false; }
    s.sibuk = false;
    if (!j.success) {
      this.setConn();
      if (j.code === 'NOSESSION') { UI.toast('Sesi ujian tidak ditemukan. Hubungi guru.', 'bad'); }
      else if (j.code !== 'AUTH') UI.toast(j.message, 'bad');
      return false;
    }
    s.tunda = s.tunda.filter(e => pel.indexOf(e) < 0);
    s.ubahTerkirim = ubahSaat; s.terakhirKirim = Date.now();
    this.terapkanServer(j.data);
    this.simpanLokalSekarang(); this.setConn();
    return true;
  },
  terapkanServer(d) {
    const s = this.st;
    if (d.batas) s.batas = new Date(d.batas).getTime();
    if (d.maks) s.maks = d.maks;
    const nPelLama = s.nPel;
    if (typeof d.nPel === 'number') { s.nPel = d.nPel; s.nPelLokal = Math.max(d.nPel, s.nPelLokal > d.nPel && s.tunda.length ? s.nPelLokal : d.nPel); }
    const statusLama = s.status; s.status = d.status || s.status;
    this.perbaruiPel();
    if (d.selesai) { this.selesai(d); return; }
    if (s.status === 'Terkunci' && statusLama !== 'Terkunci') this.tampilKunci();
    else if (s.status === 'Berjalan' && statusLama === 'Terkunci') this.lepasKunci();
    else if (s.nPel > nPelLama && s.nPel > (s.nPelDiperingatkan || 0)) this.peringatan(s.nPel, null);
  },
  perbaruiPel() {
    const s = this.st, v = $('#vchip'), t = $('#vchip-t'); if (!v) return;
    const n = Math.max(s.nPel, s.nPelLokal);
    t.textContent = 'Pelanggaran ' + n + '/' + s.maks;
    v.className = 'vchip' + (s.status === 'Terkunci' || n >= s.maks ? ' bad' : n > 0 ? ' warn' : '');
  },

  /* ---------------- anti-curang ---------------- */
  pasangSensor() {
    const s = this.st, at = s.aturan;
    const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); this._h.push([t, ev, fn, opt]); };
    const pergi = () => { if (!s.pergiSejak && !s.selesai) s.pergiSejak = Date.now(); };
    const kembali = () => {
      if (!s.pergiSejak) return;
      const d = (Date.now() - s.pergiSejak) / 1000; s.pergiSejak = 0;
      if (at.pindahTab) this.catat('tab', d);
    };
    on(document, 'visibilitychange', () => { if (document.visibilityState === 'hidden') { pergi(); this.simpanLokalSekarang(); if (s.ubah > s.ubahTerkirim) API.beacon('s.simpan', { sesi: s.sesi, jawaban: s.jawaban, ragu: Array.from(s.ragu), analitik: this.ringkasAnalitik(), ts: s.ts }); } else kembali(); });
    on(window, 'blur', () => setTimeout(() => { if (!document.hasFocus()) pergi(); }, 0));
    on(window, 'focus', () => { if (document.visibilityState === 'visible') kembali(); });
    on(window, 'online', () => { this.setConn(); this.kirim(s.kirimFinal); });
    on(window, 'offline', () => this.setConn('off'));
    on(window, 'beforeunload', e => { if (this.aktif()) { this.simpanLokalSekarang(); e.preventDefault(); e.returnValue = ''; } });
    on(window, 'pagehide', () => { this.simpanLokalSekarang(); });
    on(document, 'keydown', e => {
      if (!this.aktif() || this.terkunci() || $('.ovl')) return;
      if (e.target && /TEXTAREA|INPUT/.test(e.target.tagName)) return;
      const q = s.soal[s.idx];
      if (q.tipe === 'PG' && /^[a-eA-E]$/.test(e.key)) { const o = q.opsi['abcde'.indexOf(e.key.toLowerCase())]; if (o) this.pilih(o.k); }
      if (e.key === 'ArrowRight') this.ke(s.idx + 1); if (e.key === 'ArrowLeft') this.ke(s.idx - 1);
    });
    on(document, 'contextmenu', e => { if (this.aktif() && !(e.target && e.target.tagName === 'TEXTAREA')) e.preventDefault(); });
    const fsEv = () => {
      if (!at.layarPenuh || !this.bisaFS() || s.selesai) return;
      if (this.diFS()) {
        $('#ovl-fs') && $('#ovl-fs').remove();
        if (s.fsKeluar && !s.fsDicatat) { const d = (Date.now() - s.fsKeluar) / 1000; this.catat('fs', d); }
        s.fsKeluar = 0; s.fsDicatat = false; s.sudahFS = true;
      } else if (s.sudahFS) {
        s.fsKeluar = Date.now(); s.fsDicatat = false;
        this.overlayFS(true);
        setTimeout(() => { if (s.fsKeluar && !this.diFS() && !s.fsDicatat) { s.fsDicatat = true; this.catat('fs', (Date.now() - s.fsKeluar) / 1000); } }, Math.max(1, at.toleransi || 3) * 1000 + 200);
      }
    };
    on(document, 'fullscreenchange', fsEv); on(document, 'webkitfullscreenchange', fsEv);
  },
  catat(jenis, durasi) {
    const s = this.st, at = s.aturan;
    if (!s || s.selesai || this.terkunci()) return;
    if (durasi < (at.toleransi || 3)) return;
    const e = { j: jenis, d: Math.round(durasi * 10) / 10, t: API.sekarang(), k: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()) };
    s.tunda.push(e); s.nPelLokal = Math.max(s.nPel, s.nPelLokal) + 1;
    this.simpanLokalSekarang(); this.perbaruiPel();
    this.peringatan(s.nPelLokal, jenis);
    this.kirim(false);
  },
  peringatan(n, jenis) {
    const s = this.st, maks = s.maks;
    s.nPelDiperingatkan = Math.max(s.nPelDiperingatkan || 0, n);
    if (n >= maks) return;      // penguncian ditangani respons server
    const akhir = n >= maks - 1;
    const old = $('#peringatan'); if (old) old.closest('.ovl').remove();
    const m = UI.modal({ judul: (akhir ? 'Peringatan terakhir · ' : 'Peringatan ') + n + ' dari ' + maks, ikon: 'segitiga', ikonKelas: akhir ? 'bad' : 'warn', tutupX: false, tutupLuar: false,
      isi: '<div id="peringatan"><p>' + (jenis === 'fs' ? 'Anda keluar dari mode layar penuh.' : 'Anda meninggalkan halaman ujian (pindah tab atau aplikasi).') + ' Kejadian ini dicatat dan dapat dilihat guru.</p>' +
        (akhir ? '<div class="alert bad">' + ikon('kunci') + '<div class="grow"><b>Pelanggaran berikutnya mengunci sesi.</b><p>Sesi terkunci hanya dapat dibuka oleh guru. Waktu tetap berjalan.</p></div></div>' : '') + '</div>',
      aksi: [{ label: 'Kembali ke Ujian', kelas: akhir ? 'danger' : 'primary', klik: () => { if (s.aturan.layarPenuh && this.bisaFS() && !this.diFS()) this.layarPenuh(); } }] });
    void m;
  },
  overlayFS(keluar) {
    if ($('#ovl-fs')) return;
    const d = document.createElement('div');
    d.className = 'ovl dark'; d.id = 'ovl-fs';
    d.innerHTML = '<div class="modal sm lock-screen"><div class="big warn">' + ikon('layar', 38) + '</div><h2>' + (keluar ? 'Kembali ke layar penuh' : 'Masuk mode layar penuh') + '</h2>' +
      '<p class="muted">' + (keluar ? 'Anda keluar dari layar penuh. Kembali sekarang untuk melanjutkan — jeda lebih dari ' + (this.st.aturan.toleransi || 3) + ' detik dihitung sebagai pelanggaran.' : 'Ujian ini mewajibkan layar penuh. Tekan tombol di bawah untuk melanjutkan.') + '</p>' +
      '<div class="timer" style="margin:8px auto 16px">' + ikon('pasir', 18) + '<span id="kunci-sisa">--:--</span></div><button class="btn primary lg block" id="b-fs">' + ikon('layar') + 'Lanjutkan dalam Layar Penuh</button></div>';
    document.body.appendChild(d);
    $('#b-fs').onclick = () => this.layarPenuh();
  },
  tampilKunci() {
    if ($('#ovl-kunci')) return;
    $$('.ovl').forEach(o => { if (o.id !== 'ovl-kunci') o.remove(); });
    const d = document.createElement('div');
    d.className = 'ovl dark'; d.id = 'ovl-kunci';
    d.innerHTML = '<div class="modal sm lock-screen"><div class="big">' + ikon('kunci', 38) + '</div><h2>Sesi dikunci</h2><p class="muted">Batas pelanggaran tercapai (' + this.st.nPel + '/' + this.st.maks + '). Hubungi guru untuk membuka kembali. Jawaban yang sudah ada tetap aman.</p>' +
      '<div class="timer bad" style="margin:8px auto 12px">' + ikon('pasir', 18) + '<span id="kunci-sisa">--:--</span></div><p class="small muted">Waktu tetap berjalan. Halaman ini memeriksa status secara otomatis.</p><div class="row" style="justify-content:center"><span class="spin" style="color:var(--teal)"></span><span class="small muted">Menunggu guru…</span></div></div>';
    document.body.appendChild(d);
    this.perbaruiPel();
    clearInterval(this._ivKunci);
    this._ivKunci = setInterval(async () => {
      try { const j = await API.call('s.status', { sesi: this.st.sesi }); if (j.success) this.terapkanServer(j.data); } catch (e) { }
    }, 6000);
  },
  lepasKunci() {
    clearInterval(this._ivKunci);
    const o = $('#ovl-kunci'); if (o) o.remove();
    this.st.nPelLokal = this.st.nPel; this.perbaruiPel();
    UI.toast('Sesi dibuka kembali oleh guru. Pelanggaran berikutnya akan mengunci ulang.', 'warn');
    if (this.st.aturan.layarPenuh && this.bisaFS() && !this.diFS()) this.overlayFS(false);
  },

  /* ---------------- kirim & selesai ---------------- */
  konfirmasiKirim() {
    const s = this.st; if (this.terkunci()) return;
    const n = s.soal.filter(q => this.terisi(q)).length, kosong = s.soal.length - n, esai = s.soal.filter(q => q.tipe === 'Esai'), esaiIsi = esai.filter(q => this.terisi(q)).length;
    UI.modal({ judul: 'Kirim semua jawaban?', ikon: 'kirim', ukuran: 'sm',
      isi: (kosong || s.ragu.size ? '<div class="alert warn mb">' + ikon('segitiga') + '<div class="grow"><b>Periksa kembali</b><p>' + (kosong ? 'Masih ada ' + kosong + ' soal kosong. ' : '') + (s.ragu.size ? s.ragu.size + ' soal ditandai ragu-ragu.' : '') + '</p></div></div>' : '') +
        '<div class="grid g2">' + [['Terjawab', n + ' / ' + s.soal.length, ''], ['Ragu-ragu', s.ragu.size, 'color:#8A5B22'], ['Kosong', kosong, kosong ? 'color:var(--bad)' : ''], ['Esai terisi', esaiIsi + ' / ' + esai.length, '']]
          .map(x => '<div class="metric"><div class="over" style="' + x[2] + '">' + x[0] + '</div><div class="v" style="' + x[2] + '">' + x[1] + '</div></div>').join('') + '</div>' +
        '<p class="small muted mt">Setelah dikirim, jawaban tidak dapat diubah.</p>',
      aksi: [{ label: 'Kembali Periksa' }, { label: 'Ya, Kirim Sekarang', kelas: 'primary', klik: async () => { await this.kirimFinal(false); } }] });
  },
  async kirimFinal(otomatis) {
    const s = this.st; s.kirimFinal = true; this.simpanLokalSekarang();
    for (let i = 0; i < 3; i++) {
      if (await this.kirim(true)) return true;
      if (!API.online) break;
      await new Promise(r => setTimeout(r, 1500));
    }
    if (!s.selesai) this.antreKirim(otomatis);
    return false;
  },
  antreKirim(otomatis) {
    if ($('#ovl-antre')) return;
    const d = document.createElement('div');
    d.className = 'ovl dark'; d.id = 'ovl-antre';
    d.innerHTML = '<div class="modal sm lock-screen"><div class="big warn">' + ikon('wifioff', 38) + '</div><h2>' + (otomatis ? 'Waktu habis' : 'Menunggu koneksi') + '</h2><p class="muted">Jawaban Anda aman di perangkat ini dan akan dikirim otomatis saat koneksi kembali. Jangan tutup halaman ini.</p>' +
      '<span class="badge warn">' + ikon('jam', 12) + 'Antrean kirim</span><div class="row mt" style="justify-content:center"><span class="spin" style="color:var(--teal)"></span><span class="small muted" id="antre-t">Mencoba mengirim…</span></div></div>';
    document.body.appendChild(d);
    clearInterval(this._ivAntre);
    this._ivAntre = setInterval(async () => { if (await this.kirim(true)) { clearInterval(this._ivAntre); const o = $('#ovl-antre'); if (o) o.remove(); } else { const t = $('#antre-t'); if (t) t.textContent = 'Belum berhasil · mencoba lagi ' + F.jam(new Date(Date.now() + 10000)); } }, 10000);
  },
  waktuHabis() {
    const s = this.st; if (s.kirimFinal) return;
    $$('.ovl').forEach(o => o.remove());
    const d = document.createElement('div');
    d.className = 'ovl dark'; d.id = 'ovl-habis';
    d.innerHTML = '<div class="modal sm lock-screen"><div class="big teal">' + ikon('pasir', 38) + '</div><h2>Waktu telah berakhir</h2><p class="muted">Jawaban Anda sedang dikirim otomatis ke server.</p><div class="row" style="justify-content:center"><span class="spin" style="color:var(--teal)"></span><span class="small muted">Mengirim jawaban…</span></div></div>';
    document.body.appendChild(d);
    this.kirimFinal(true).then(ok => { if (!ok) { const o = $('#ovl-habis'); if (o) o.remove(); } });
  },
  selesai(d) {
    const s = this.st; if (s.selesai) return;
    s.selesai = true; s.status = d.status || 'Selesai';
    this.lepas(); clearInterval(this._ivKunci); clearInterval(this._ivAntre);
    $$('.ovl').forEach(o => o.remove());
    Lokal.del(s.sesi); this.keluarLayarPenuh(); API.tandaiBasi();
    const h = d.hasil, el = $('#konten');
    const nilai = h && h.nilaiAkhir !== null && h.nilaiAkhir !== undefined;
    el.innerHTML = '<div class="auth"><div class="auth-card lock-screen" style="max-width:520px"><div class="big ' + (nilai ? (h.lulus ? 'teal' : 'warn') : 'teal') + '">' + ikon('cekb', 40) + '</div>' +
      '<h1 style="font-size:24px">Jawaban berhasil dikirim</h1><p class="muted">' + esc(s.paket.nama) + ' · ' + esc(s.paket.mapel) + '</p>' +
      (h ? '<div class="grid g3 mt mb">' + [['Nilai PG', h.nilaiPG], ['Nilai Esai', h.nilaiEsai], ['Nilai Akhir', h.nilaiAkhir]].map(x => '<div class="metric"><div class="over">' + x[0] + '</div><div class="v">' + (x[1] === null || x[1] === undefined ? '<span class="small muted">—</span>' : F.n(x[1])) + '</div></div>').join('') + '</div>' +
        (h.menunggu ? '<div class="alert warn">' + ikon('jam') + '<div class="grow"><b>Menunggu koreksi guru</b><p>Nilai akhir final setelah jawaban esai dikoreksi.</p></div></div>' : nilai ? '<div class="alert ' + (h.lulus ? 'ok' : 'bad') + '">' + ikon(h.lulus ? 'medali' : 'info') + '<div class="grow"><b>' + (h.lulus ? 'Lulus' : 'Belum mencapai KKM') + '</b><p>KKM ' + h.kkm + '</p></div></div>' : '')
        : '<div class="alert soft mt">' + ikon('info') + '<div class="grow">Nilai akan diumumkan oleh guru.</div></div>') +
      '<a class="btn primary lg block mt" href="#/s/hasil">' + ikon('medali') + 'Lihat Hasil &amp; Riwayat</a></div></div>';
  },
  lepas() { this._h.forEach(([t, ev, fn, opt]) => t.removeEventListener(ev, fn, opt)); this._h = []; this._iv.forEach(clearInterval); this._iv = []; },
  sesiHilang() { UI.toast('Sesi login berakhir. Jawaban aman di perangkat — masuk lagi dengan Token PIN yang sama untuk melanjutkan.', 'warn'); }
};

/* ---------------- HALAMAN KERJAKAN ---------------- */
App.daftar('s/kerjakan', { peran: 'siswa', fokus: true, render(el) {
  el.innerHTML = '<div class="auth"><div class="auth-card tc"><span class="spin" style="color:var(--teal);width:28px;height:28px"></span><p class="muted mt">Menyiapkan lembar soal…</p></div></div>';
  const mulai = async () => {
    if (!Ujian.st || Ujian.st.selesai) {
      const j = await API.call('s.mulai', { perangkat: App.perangkat() }).catch(e => ({ success: false, message: e.message }));
      if (!j.success) {
        if (j.code === 'DONE') { location.replace('#/s/hasil'); return; }
        if (j.code === 'KODE' || !j.code) { if (j.code === 'KODE') { location.replace('#/s/pra'); return; } }
        el.innerHTML = '<div class="auth"><div class="auth-card">' + UI.galat(new Error(j.message), 'App.rute()') + '<a class="btn block mt" href="#/s/beranda">Kembali ke Dashboard</a></div></div>';
        return;
      }
      Ujian.siapkan(j.data);
    }
    await Ujian.gabungLokal();
    Ujian.render(el);
    Ujian.pasangSensor();
    App.saatPergi(() => Ujian.lepas());
    Ujian._iv.push(setInterval(() => Ujian.tickTimer(), 500));
    const s = Ujian.st, ms = Math.max(10, s.aturan.autosave || 30) * 1000;
    Ujian._iv.push(setInterval(() => { if (!s.selesai && (s.tunda.length || (s.ubah > s.ubahTerkirim && Date.now() - s.terakhirKirim >= ms))) Ujian.kirim(s.kirimFinal); Ujian.setConn(); }, 2000));
    if (s.status === 'Terkunci') Ujian.tampilKunci();
    else if (s.aturan.layarPenuh && Ujian.bisaFS() && !Ujian.diFS()) Ujian.overlayFS(false);
    if (s.kirimFinal) Ujian.kirimFinal(true);
    else if (s.tunda.length || s.ubah) Ujian.kirim(false);
  };
  mulai();
} });
