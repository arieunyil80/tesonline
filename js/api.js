/**
 * api.js — lapisan komunikasi ke GAS REST API
 *  • POST text/plain (tanpa preflight CORS), token sesi di body
 *  • Dedupe permintaan baca yang identik (+ epoch tulis agar tidak basi)
 *  • Penggabung batch otomatis: beberapa baca dalam 1 tik → 1 eksekusi server
 *  • SWR: tampilkan cache lokal instan, segarkan di belakang layar
 *  • Pengukur kinerja: Perf.table() di console
 */
const Simpan = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } },
  keys(prefix) { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(prefix) === 0) out.push(k); } } catch (e) { } return out; }
};

const Perf = {
  log: [],
  add(x) { x.t = Date.now(); this.log.push(x); if (this.log.length > 300) this.log.shift(); },
  table() { console.table(this.log.slice(-40)); },
  summary() {
    const m = {};
    this.log.forEach(x => { m[x.action] = m[x.action] || { n: 0, total: 0, server: 0 }; m[x.action].n++; m[x.action].total += x.total; m[x.action].server += x.server || 0; });
    console.table(Object.keys(m).map(k => ({ aksi: k, panggilan: m[k].n, rata_total_ms: Math.round(m[k].total / m[k].n), rata_server_ms: Math.round(m[k].server / m[k].n) })));
  }
};

const API = (() => {
  const URL_GAS = (window.APP_CONFIG && window.APP_CONFIG.GAS_URL) || '';
  const READ = /^(pub\.info|logo|s\.dashboard|s\.status|s\.hasil|g\.dashboard|ref\.data|soal\.list|paket\.list|token\.list|hadir\.list|monitor\.list|sesi\.pelanggaran|koderuang\.get|esai\.antrian|esai\.detail|rekap\.data|siswa\.list|dok\.list|pengguna\.list|mapel\.list|cfg\.get|log\.list|sistem\.status|auth\.saya)$/;
  const BATCHABLE = /^(g\.dashboard|ref\.data|soal\.list|paket\.list|token\.list|hadir\.list|esai\.antrian|rekap\.data|siswa\.list|dok\.list|pengguna\.list|mapel\.list|cfg\.get|log\.list|sistem\.status)$/;
  let token = null, peran = 'publik', epoch = 0, staleStamp = Simpan.get('tkj_stale', 0), selisihJam = 0;
  const inflight = {}, mem = {};
  const pendengar = { auth: [], net: [] };
  let online = navigator.onLine !== false;

  function siap() { return !!URL_GAS && !/GANTI|XXXX/.test(URL_GAS); }
  function setSesi(t, p) { token = t || null; peran = p || 'publik'; }
  function on(ev, fn) { pendengar[ev].push(fn); }
  function emit(ev, x) { pendengar[ev].forEach(f => { try { f(x); } catch (e) { console.error(e); } }); }
  function setOnline(v) { if (online !== v) { online = v; emit('net', v); } }
  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => setOnline(false));

  async function raw(action, data, opts) {
    if (!siap()) throw new Error('Konfigurasi belum lengkap: isi GAS_URL di js/config.js dengan URL /exec dari Apps Script.');
    const t0 = performance.now();
    let res;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), (opts && opts.timeout) || 45000) : null;
    try {
      res = await fetch(URL_GAS, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow',
        body: JSON.stringify({ action, token, data: data || {} }), signal: ctrl ? ctrl.signal : undefined });
    } catch (e) {
      setOnline(false);
      const err = new Error(e && e.name === 'AbortError' ? 'Server terlalu lama merespons. Periksa koneksi lalu coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet.');
      err.jaringan = true; throw err;
    } finally { if (timer) clearTimeout(timer); }
    setOnline(true);
    if (!res.ok) throw new Error('Server merespons ' + res.status + '. Coba lagi.');
    let j;
    try { j = await res.json(); } catch (e) { throw new Error('Respons server tidak valid. Pastikan deployment Web App diakses "Anyone".'); }
    if (j.now) selisihJam = j.now - Date.now();
    Perf.add({ action, total: Math.round(performance.now() - t0), server: j.ms || 0, ok: !!j.success });
    if (!j.success && j.code === 'AUTH' && !/^auth\./.test(action)) emit('auth', j);
    return j;
  }

  /* ---------- penggabung batch ---------- */
  const Batcher = {
    q: null,
    add(action, data) {
      return new Promise((resolve, reject) => {
        if (!this.q) { this.q = []; setTimeout(() => this.flush(), 0); }
        this.q.push({ action, data: data || {}, resolve, reject });
      });
    },
    async flush() {
      const q = this.q; this.q = null;
      for (let i = 0; i < q.length; i += 10) {
        const part = q.slice(i, i + 10);
        if (part.length === 1) { raw(part[0].action, part[0].data).then(part[0].resolve, part[0].reject); continue; }
        raw('batch', { calls: part.map(x => ({ action: x.action, data: x.data })) }).then(j => {
          if (!j.success) { part.forEach(x => x.resolve(j)); return; }
          part.forEach((x, k) => x.resolve(Object.assign({ ms: j.ms, now: j.now }, j.data[k])));
        }, e => part.forEach(x => x.reject(e)));
      }
    }
  };

  /** Panggil aksi. Baca: dedupe + batch. Tulis: menaikkan epoch & menandai cache basi. */
  function call(action, data, opts) {
    opts = opts || {};
    if (!READ.test(action)) {
      epoch++;
      return raw(action, data, opts).then(j => { if (j.success && !opts.noStale) tandaiBasi(); return j; });
    }
    const k = epoch + '|' + action + '|' + JSON.stringify(data || {});
    if (inflight[k]) return inflight[k];
    const p = (BATCHABLE.test(action) && opts.batch !== false && peran !== 'siswa') ? Batcher.add(action, data) : raw(action, data, opts);
    inflight[k] = p;
    p.then(() => delete inflight[k], () => delete inflight[k]);
    return p;
  }

  /* ---------- SWR (cache lokal) ---------- */
  function kunci(action, data) { return 'tkj_c:' + peran + ':' + action + ':' + JSON.stringify(data || {}); }
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function baca(k) { return mem[k] || Simpan.get(k, null); }
  function tulis(k, d) {
    const s = JSON.stringify(d), e = { t: Date.now(), h: hash(s), d };
    mem[k] = e;
    if (s.length < 400000) Simpan.set(k, e);
    return e;
  }
  function tandaiBasi() { staleStamp = Date.now(); Simpan.set('tkj_stale', staleStamp); }
  function hapusCache() { Object.keys(mem).forEach(k => delete mem[k]); Simpan.keys('tkj_c:').forEach(k => Simpan.del(k)); }

  /**
   * swr(action, data, onData, {maxAge, force})
   * onData(data, info) dipanggil segera bila ada cache, lalu lagi bila data server berbeda.
   */
  async function swr(action, data, onData, opts) {
    opts = opts || {};
    const k = kunci(action, data), c = baca(k);
    const maxAge = opts.maxAge === undefined ? 30000 : opts.maxAge;
    if (c) onData(c.d, { cached: true, umur: Date.now() - c.t });
    const segar = c && !opts.force && Date.now() - c.t < maxAge && c.t > staleStamp;
    if (segar) return c.d;
    let j;
    try { j = await call(action, Object.assign({}, data || {}, opts.force ? { _fresh: !!opts.fresh } : {})); }
    catch (e) { if (c) { if (!opts.diam) UI.toast(e.message, 'warn'); return c.d; } throw e; }
    if (!j.success) { if (c) { if (!opts.diam && j.code !== 'AUTH') UI.toast(j.message, 'bad'); return c.d; } const er = new Error(j.message); er.code = j.code; throw er; }
    const lama = c && c.h, baru = tulis(k, j.data);
    if (!c || lama !== baru.h) onData(j.data, { cached: false });
    return j.data;
  }
  function ambilCache(action, data) { const c = baca(kunci(action, data)); return c ? c.d : null; }
  function setCache(action, data, d) { tulis(kunci(action, data), d); }

  /** Info publik & logo via GET (bisa di-cache browser), disimpan lokal per versi */
  async function pubInfo() {
    if (!siap()) return null;
    try { const r = await fetch(URL_GAS + '?action=pub.info', { redirect: 'follow' }); const j = await r.json(); if (j.success) { Simpan.set('tkj_pub', j.data); setOnline(true); return j.data; } } catch (e) { }
    return null;
  }
  async function logo(versi) {
    const c = Simpan.get('tkj_logo', null);
    if (c && String(c.versi) === String(versi)) return c.dataUrl;
    if (!siap()) return '';
    try { const r = await fetch(URL_GAS + '?action=logo', { redirect: 'follow' }); const j = await r.json(); if (j.success) { Simpan.set('tkj_logo', j.data); return j.data.dataUrl; } } catch (e) { }
    return c ? c.dataUrl : '';
  }
  /** Panaskan server (cold start) — maks 1×/4 menit per lingkup */
  function panaskan(scope) {
    if (!siap()) return;
    try {
      const k = 'tkj_warm_' + scope, t = Number(sessionStorage.getItem(k) || 0);
      if (Date.now() - t < 240000) return;
      sessionStorage.setItem(k, String(Date.now()));
      fetch(URL_GAS + '?w=' + scope, { mode: 'no-cors' }).catch(() => { });
    } catch (e) { }
  }
  /** Kirim terakhir saat halaman ditutup (tanpa menunggu respons) */
  function beacon(action, data) {
    if (!siap() || !navigator.sendBeacon) return false;
    try { return navigator.sendBeacon(URL_GAS, new Blob([JSON.stringify({ action, token, data })], { type: 'text/plain;charset=utf-8' })); } catch (e) { return false; }
  }
  return { call, swr, ambilCache, setCache, setSesi, on, siap, pubInfo, logo, panaskan, beacon, hapusCache, tandaiBasi,
    get online() { return online; }, sekarang: () => Date.now() + selisihJam, get selisih() { return selisihJam; } };
})();
