/**
 * ui.js — komponen antarmuka: ikon, format, toast, modal, tabel, grafik SVG, berkas
 */
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const IKON = {
  grid: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6.5A2.5 2.5 0 0 0 4 21.5v-2Z"/><path d="M8 7h7M8 11h5"/>',
  paket: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>',
  hadir: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
  live: '<path d="M4.9 19.1a10 10 0 0 1 0-14.2M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M19.1 4.9a10 10 0 0 1 0 14.2"/><circle cx="12" cy="12" r="2"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V8M18 17v-9"/>',
  pintu: '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.6v16l-8-1.6V6.6a2 2 0 0 1 1.6-2L11 3.5a1.7 1.7 0 0 1 2 1.1Z"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  usercog: '<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/><circle cx="18" cy="17" r="2.5"/><path d="M18 13v1.5M18 19.5V21M21.5 17H20M16 17h-1.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  keluar: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  cari: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  unduh: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>',
  mata: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  kunci: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  buka: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  segitiga: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  cek: '<path d="M20 6 9 17l-5-5"/>',
  cekb: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m22 4-10 10-3-3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  xb: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  jam: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  pasir: '<path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>',
  wifi: '<path d="M5 12.6a10 10 0 0 1 14 0M8.5 16.1a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0M12 20h.01"/>',
  wifioff: '<path d="m2 2 20 20M8.5 16.1a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.8M10.7 5.1A15 15 0 0 1 22 8.8M5 12.6a10 10 0 0 1 5.2-2.8M16.9 10.5a10 10 0 0 1 2.1 2.1M12 20h.01"/>',
  perisai: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  bendera: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  kiri: '<path d="m15 18-6-6 6-6"/>', kanan: '<path d="m9 18 6-6-6-6"/>', panah: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M3 21v-5h5"/>',
  salin: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  layar: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  gambar: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3Z"/>',
  kalender: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  main: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4V8Z"/>',
  kirim: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
  daftar: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  bintang: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z"/>',
  medali: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
  naik: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  turun: '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
  sidik: '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4M14 13.12c0 2.38 0 6.38-1 8.88M17.29 21.02c.12-.6.43-2.3.5-3.02M2 12a10 10 0 0 1 18-6M2 16h.01M21.8 16c.2-2 .131-5.354 0-6M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2M8.65 22c.21-.66.45-1.32.57-2M9 6.8a6 6 0 0 1 9 5.2v2"/>',
  hp: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  ketik: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>',
  tempel: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  topi: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  kilat: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
  data: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>'
};
function ikon(n, s) { s = s || 18; return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IKON[n] || IKON.info) + '</svg>'; }

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN_P = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const F = {
  d(v) { const d = v instanceof Date ? v : new Date(v); return isNaN(d) ? null : d; },
  tgl(v) { const d = F.d(v); return d ? d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear() : '-'; },
  tglP(v) { const d = F.d(v); return d ? HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN_P[d.getMonth()] + ' ' + d.getFullYear() : '-'; },
  jam(v) { const d = F.d(v); return d ? String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : '-'; },
  tglJam(v) { const d = F.d(v); return d ? F.tgl(d) + ', ' + F.jam(d) : '-'; },
  durasi(det) { det = Math.max(0, Math.floor(det)); const h = Math.floor(det / 3600), m = Math.floor(det % 3600 / 60), s = det % 60; return (h ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); },
  relatif(ms) { if (!ms) return '-'; const d = Math.round((Date.now() - ms) / 1000); if (d < 5) return 'baru saja'; if (d < 60) return d + ' dtk lalu'; if (d < 3600) return Math.round(d / 60) + ' mnt lalu'; if (d < 86400) return Math.round(d / 3600) + ' jam lalu'; return Math.round(d / 86400) + ' hari lalu'; },
  n(v, d) { if (v === null || v === undefined || v === '') return '-'; const x = Number(v); return isNaN(x) ? String(v) : x.toLocaleString('id-ID', { maximumFractionDigits: d === undefined ? 1 : d }); },
  inisial(nm) { return String(nm || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || '?'; },
  /** Nilai <input type=datetime-local> dari ISO */
  dtl(v) { const d = F.d(v); if (!d) return ''; const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); },
  iso(dtl) { const d = F.d(dtl); return d ? d.toISOString() : ''; }
};

const UI = {
  toast(msg, jenis) {
    const box = $('#toasts'); if (!box) return;
    const ik = { ok: 'cekb', bad: 'xb', warn: 'segitiga' }[jenis] || 'info';
    const el = document.createElement('div');
    el.className = 'toast ' + (jenis || '');
    el.innerHTML = ikon(ik) + '<div class="grow">' + esc(msg) + '</div>';
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, jenis === 'bad' ? 6000 : 3800);
  },
  /** Modal umum. aksi: [{label, kelas, klik(tutup, el) → bila return false modal tetap terbuka}] */
  modal(o) {
    const ovl = document.createElement('div');
    ovl.className = 'ovl ' + (o.sheet === false ? '' : 'sheet-m') + (o.gelap ? ' dark' : '');
    ovl.innerHTML = '<div class="modal ' + (o.ukuran || '') + '" role="dialog" aria-modal="true">' +
      (o.judul ? '<div class="modal-h">' + (o.ikon ? '<div class="ik ' + (o.ikonKelas || '') + '">' + ikon(o.ikon, 20) + '</div>' : '') +
        '<div class="grow"><h3>' + esc(o.judul) + '</h3>' + (o.sub ? '<p>' + esc(o.sub) + '</p>' : '') + '</div>' +
        (o.tutupX === false ? '' : '<button class="x-btn" data-x aria-label="Tutup">' + ikon('x', 16) + '</button>') + '</div>' : '') +
      '<div class="modal-b">' + (o.isi || '') + '</div>' +
      ((o.aksi && o.aksi.length) ? '<div class="modal-f">' + o.aksi.map((a, i) => '<button class="btn ' + (a.kelas || '') + '" data-a="' + i + '">' + (a.ikon ? ikon(a.ikon, 16) : '') + esc(a.label) + '</button>').join('') + '</div>' : '') +
      '</div>';
    document.body.appendChild(ovl);
    const m = ovl.querySelector('.modal');
    let selesai = false;
    const tutup = (v) => { if (selesai) return; selesai = true; ovl.remove(); document.removeEventListener('keydown', esc_); if (o.onTutup) o.onTutup(v); };
    const esc_ = e => { if (e.key === 'Escape' && o.tutupX !== false) tutup(null); };
    document.addEventListener('keydown', esc_);
    ovl.addEventListener('click', e => { if (e.target === ovl && o.tutupLuar !== false && o.tutupX !== false) tutup(null); });
    $$('[data-x]', m).forEach(b => b.onclick = () => tutup(null));
    (o.aksi || []).forEach((a, i) => {
      const b = m.querySelector('[data-a="' + i + '"]');
      b.onclick = async () => {
        if (!a.klik) return tutup(a.nilai === undefined ? i : a.nilai);
        if (b.classList.contains('busy')) return;
        const asli = b.innerHTML;
        b.classList.add('busy'); b.innerHTML = '<span class="spin"></span>' + esc(a.label);
        try { const r = await a.klik(tutup, m); if (r !== false) tutup(r === undefined ? i : r); }
        catch (e) { UI.toast(e.message || String(e), 'bad'); }
        finally { if (!selesai) { b.classList.remove('busy'); b.innerHTML = asli; } }
      };
    });
    const f = m.querySelector('input:not([type=hidden]):not([type=checkbox]), textarea, select');
    if (f && o.fokus !== false) setTimeout(() => f.focus(), 50);
    return { el: m, ovl, tutup };
  },
  konfirmasi(pesan, o) {
    o = o || {};
    return new Promise(res => {
      UI.modal({ judul: o.judul || 'Konfirmasi', ikon: o.ikon || (o.bahaya ? 'segitiga' : 'info'), ikonKelas: o.bahaya ? 'bad' : '', ukuran: 'sm',
        isi: '<p class="muted">' + pesan + '</p>', onTutup: v => res(v === true),
        aksi: [{ label: o.batal || 'Batal', nilai: false }, { label: o.tombol || 'Ya, lanjutkan', kelas: o.bahaya ? 'danger' : 'primary', nilai: true }] });
    });
  },
  /** Minta isian teks (mis. alasan). Resolve string atau null. */
  tanya(o) {
    return new Promise(res => {
      const isi = (o.pesan ? '<p class="muted">' + o.pesan + '</p>' : '') + '<div class="field"><label>' + esc(o.label || 'Isian') + (o.wajib ? ' <span class="wajib">*</span>' : '') + '</label>' +
        (o.textarea ? '<textarea class="textarea" id="tanya-v" placeholder="' + esc(o.placeholder || '') + '"></textarea>' : '<input class="input" id="tanya-v" type="' + (o.tipe || 'text') + '" placeholder="' + esc(o.placeholder || '') + '" value="' + esc(o.nilai || '') + '">') +
        '<div class="help err hide" id="tanya-e"></div></div>' + (o.tambahan || '');
      UI.modal({ judul: o.judul, sub: o.sub, ikon: o.ikon || 'edit', ikonKelas: o.ikonKelas || '', ukuran: 'sm', isi, onTutup: v => res(v === undefined || v === null || typeof v === 'number' ? null : v),
        aksi: [{ label: 'Batal', nilai: null }, { label: o.tombol || 'Simpan', kelas: o.bahaya ? 'danger' : 'primary', klik: (t, m) => {
          const v = $('#tanya-v', m).value.trim();
          if (o.wajib && v.length < (o.min || 1)) { const e = $('#tanya-e', m); e.textContent = o.pesanWajib || 'Wajib diisi.'; e.classList.remove('hide'); return false; }
          return o.ambil ? o.ambil(m, v) : v;
        } }] });
    });
  },
  sk(n, tinggi) { return Array.from({ length: n || 3 }, () => '<div class="sk ' + (tinggi ? 'sk-card' : 'sk-line') + '"></div>').join(''); },
  skTabel(n) { return '<div class="card">' + UI.sk(1) + Array.from({ length: n || 6 }, () => '<div class="sk sk-line" style="height:30px"></div>').join('') + '</div>'; },
  kosong(o) {
    return '<div class="empty"><div class="ik">' + ikon(o.ikon || 'info', 28) + '</div><h3>' + esc(o.judul || 'Belum ada data') + '</h3>' +
      (o.teks ? '<p>' + esc(o.teks) + '</p>' : '') + (o.tombol ? '<div class="mt">' + o.tombol + '</div>' : '') + '</div>';
  },
  galat(e, ulang) { return '<div class="alert bad">' + ikon('segitiga') + '<div class="grow"><b>Gagal memuat</b><p>' + esc(e.message || e) + '</p>' + (ulang ? '<button class="btn sm mt-s" onclick="' + ulang + '">' + ikon('refresh', 14) + 'Coba lagi</button>' : '') + '</div></div>'; },
  badge(t, j) { return '<span class="badge ' + (j || '') + '">' + esc(t) + '</span>'; },
  status(s) {
    const m = {
      'Berjalan': 'ok dot-p', 'Mengerjakan': 'ok dot-p', 'Live': 'ok dot-p', 'Selesai': 'tl', 'Menunggu Koreksi': 'warn', 'Terkunci': 'solid-bad', 'Dihentikan': 'bad',
      'Belum Mulai': '', 'Tidak Hadir': 'bad', 'Terjadwal': 'sand', 'Draf': '', 'Aktif': 'ok', 'Terpakai': 'tl', 'Nonaktif': '', 'Hangus': '', 'Diblokir': 'bad',
      'Hadir': 'ok', 'Izin': 'sand', 'Sakit': 'warn', 'Belum Dicatat': '', 'Wajar': 'ok', 'Mencurigakan': 'warn', 'Dugaan Tempel': 'bad', 'Kosong': '',
      'Lulus': 'ok', 'Tuntas': 'ok', 'Remedial': 'bad', 'Tidak Lulus': 'bad', 'PG': 'teal', 'Esai': 'plum', 'Admin': 'teal', 'Guru': 'tl', 'Tidak Ikut': ''
    };
    const k = m[s] === undefined ? '' : m[s], pulse = k.indexOf('dot-p') >= 0;
    const ik = s === 'Terkunci' ? ikon('kunci', 12) : (s === 'Hangus' ? '' : '');
    return '<span class="badge ' + k.replace('dot-p', '') + '">' + (pulse ? '<i class="dot pulse"></i>' : '') + ik + (s === 'Hangus' ? '<s>' + esc(s) + '</s>' : esc(s || '-')) + '</span>';
  },
  avatar(nm, kecil) { return '<div class="av" style="' + (kecil ? 'width:32px;height:32px;font-size:11px' : '') + '">' + esc(F.inisial(nm)) + '</div>'; },
  async sibuk(btn, fn) {
    if (!btn || btn.classList.contains('busy')) return;
    const asli = btn.innerHTML; btn.classList.add('busy'); btn.innerHTML = '<span class="spin"></span>' + btn.textContent.trim();
    try { return await fn(); } catch (e) { UI.toast(e.message || String(e), 'bad'); } finally { btn.classList.remove('busy'); btn.innerHTML = asli; }
  },
  /** Panggil aksi tulis: lempar Error bila gagal, tampilkan toast sukses */
  async kirim(action, data, opsi) {
    const j = await API.call(action, data);
    if (!j.success) throw new Error(j.message || 'Gagal.');
    if (!(opsi && opsi.diam) && j.message) UI.toast(j.message, 'ok');
    return j.data;
  },
  salin(teks) {
    const ok = () => UI.toast('Disalin: ' + teks, 'ok');
    if (navigator.clipboard) navigator.clipboard.writeText(teks).then(ok, () => UI.toast('Gagal menyalin', 'bad'));
    else { const t = document.createElement('textarea'); t.value = teks; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (e) { } t.remove(); }
  },
  unduhBase64(b64, nama, mime) {
    const bin = atob(b64), arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    UI.unduhBlob(new Blob([arr], { type: mime || 'application/octet-stream' }), nama);
  },
  unduhBlob(blob, nama) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nama; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); },
  unduhCSV(baris, nama) {
    const s = baris.map(r => r.map(v => { v = v === null || v === undefined ? '' : String(v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';')).join('\r\n');
    UI.unduhBlob(new Blob(['﻿' + s], { type: 'text/csv;charset=utf-8' }), nama);
  },
  bacaBase64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); }); },
  /** Kecilkan gambar di browser (maks px), pertahankan transparansi PNG/WebP */
  async kecilkan(file, maks) {
    maks = maks || 1200;
    const url = await UI.bacaBase64(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Berkas bukan gambar yang valid.')); i.src = url; });
    const r = Math.min(1, maks / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const mime = /png|webp|gif/.test(file.type) ? 'image/png' : 'image/jpeg';
    const data = c.toDataURL(mime, .88);
    return { dataUrl: data, base64: data.split(',')[1], mime };
  },
  debounce(fn, ms) { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; },
  /** Muat pustaka SheetJS bila diperlukan (impor/ekspor Excel) */
  async xlsx() {
    if (window.XLSX) return window.XLSX;
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; s.onload = res; s.onerror = () => rej(new Error('Pustaka Excel gagal dimuat. Periksa koneksi atau tempel data dari Excel.')); document.head.appendChild(s); });
    return window.XLSX;
  },
  /** Berkas .xlsx/.xls/.csv → array objek berlabel header */
  async bacaTabel(file) {
    if (/\.csv$/i.test(file.name) || file.type === 'text/csv') return UI.parseTeksTabel(await file.text());
    const X = await UI.xlsx(), wb = X.read(await file.arrayBuffer(), { type: 'array' });
    return X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
  },
  /** Teks tempelan dari Excel (tab) atau CSV (; atau ,) → array objek */
  parseTeksTabel(teks) {
    const baris = String(teks).replace(/\r/g, '').split('\n').filter(x => x.trim());
    if (!baris.length) return [];
    const pemisah = baris[0].indexOf('\t') >= 0 ? '\t' : (baris[0].split(';').length > baris[0].split(',').length ? ';' : ',');
    const pecah = l => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (c === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (c === pemisah && !q) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map(x => x.trim()); };
    const h = pecah(baris[0]);
    return baris.slice(1).map(l => { const v = pecah(l), o = {}; h.forEach((k, i) => { if (k) o[k] = v[i] === undefined ? '' : v[i]; }); return o; });
  },
  /** Tahan klik ganda; aktifkan fokus pada elemen pertama yang salah */
  tandaiSalah(el, pesan) { if (!el) return; el.classList.add('err'); el.focus(); UI.toast(pesan, 'bad'); setTimeout(() => el.classList.remove('err'), 2500); }
};

/* =====================================================================
 *  TABEL — cari, urut, halaman, pilih
 * ===================================================================== */
function Tabel(el, o) {
  const st = { data: [], q: '', sort: o.sort || null, dir: o.dir || 1, hal: 1, per: o.per || 15, pilih: new Set() };
  function saring() {
    let d = st.data;
    if (o.filter) d = d.filter(o.filter);
    if (st.q && o.cari) { const q = st.q.toLowerCase(); d = d.filter(r => o.cari(r).toLowerCase().indexOf(q) >= 0); }
    if (st.sort) { const k = o.kolom.find(c => c.k === st.sort), f = k && k.nilai ? k.nilai : (r => r[st.sort]); d = d.slice().sort((a, b) => { const x = f(a), y = f(b); return (x > y ? 1 : x < y ? -1 : 0) * st.dir; }); }
    return d;
  }
  function render() {
    const d = saring(), n = d.length, maksHal = Math.max(1, Math.ceil(n / st.per));
    if (st.hal > maksHal) st.hal = maksHal;
    const hal = d.slice((st.hal - 1) * st.per, st.hal * st.per);
    const id = r => String(o.id ? o.id(r) : r.id);
    const semua = hal.length && hal.every(r => st.pilih.has(id(r)));
    let h = '';
    if (o.pilih && st.pilih.size && o.bulk) h += '<div class="bulk"><b>' + st.pilih.size + ' dipilih</b>' + o.bulk + '<button class="btn ghost xs" data-batal>Batal pilih</button></div>';
    h += '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + (o.pilih ? '<th class="w-cb"><input type="checkbox" class="cb" data-semua ' + (semua ? 'checked' : '') + ' aria-label="Pilih semua"></th>' : '') +
      o.kolom.map(c => '<th class="' + (c.urut !== false ? 'sort ' : '') + (c.kelas || '') + '" data-k="' + c.k + '">' + esc(c.label) + (st.sort === c.k ? (st.dir > 0 ? ' ↑' : ' ↓') : '') + '</th>').join('') + '</tr></thead><tbody>';
    if (!hal.length) h += '<tr><td colspan="' + (o.kolom.length + (o.pilih ? 1 : 0)) + '">' + UI.kosong({ ikon: o.ikonKosong || 'cari', judul: st.q ? 'Tidak ada yang cocok' : (o.judulKosong || 'Belum ada data'), teks: st.q ? 'Ubah kata kunci atau filter.' : (o.teksKosong || '') }) + '</td></tr>';
    hal.forEach(r => {
      const rid = id(r);
      h += '<tr data-id="' + esc(rid) + '" class="' + (st.pilih.has(rid) ? 'sel ' : '') + (o.kelasBaris ? o.kelasBaris(r) : '') + '">' + (o.pilih ? '<td><input type="checkbox" class="cb" data-p="' + esc(rid) + '" ' + (st.pilih.has(rid) ? 'checked' : '') + '></td>' : '') +
        o.kolom.map(c => '<td class="' + (c.kelas || '') + '">' + (c.render ? c.render(r) : esc(r[c.k])) + '</td>').join('') + '</tr>';
    });
    h += '</tbody></table></div><div class="tbl-foot"><span class="small muted">Menampilkan ' + (n ? ((st.hal - 1) * st.per + 1) + '–' + Math.min(n, st.hal * st.per) : 0) + ' dari ' + n + (o.satuan ? ' ' + o.satuan : '') + '</span>';
    if (maksHal > 1) {
      const nomor = []; for (let i = Math.max(1, st.hal - 2); i <= Math.min(maksHal, st.hal + 2); i++) nomor.push(i);
      h += '<div class="pager"><button data-h="' + (st.hal - 1) + '" ' + (st.hal <= 1 ? 'disabled' : '') + ' aria-label="Sebelumnya">‹</button>' + nomor.map(i => '<button data-h="' + i + '" class="' + (i === st.hal ? 'on' : '') + '">' + i + '</button>').join('') + '<button data-h="' + (st.hal + 1) + '" ' + (st.hal >= maksHal ? 'disabled' : '') + ' aria-label="Berikutnya">›</button></div>';
    }
    h += '</div>';
    el.innerHTML = h;
    $$('th.sort', el).forEach(th => th.onclick = () => { const k = th.dataset.k; if (st.sort === k) st.dir *= -1; else { st.sort = k; st.dir = 1; } render(); });
    $$('[data-h]', el).forEach(b => b.onclick = () => { st.hal = Number(b.dataset.h); render(); });
    $$('[data-p]', el).forEach(c => c.onchange = () => { c.checked ? st.pilih.add(c.dataset.p) : st.pilih.delete(c.dataset.p); render(); if (o.onPilih) o.onPilih(api.dipilih()); });
    const sa = $('[data-semua]', el); if (sa) sa.onchange = () => { hal.forEach(r => sa.checked ? st.pilih.add(id(r)) : st.pilih.delete(id(r))); render(); if (o.onPilih) o.onPilih(api.dipilih()); };
    const bt = $('[data-batal]', el); if (bt) bt.onclick = () => { st.pilih.clear(); render(); };
    if (o.setelah) o.setelah(el, hal);
  }
  const api = {
    set(data) { st.data = data || []; const ada = new Set(st.data.map(r => String(o.id ? o.id(r) : r.id))); Array.from(st.pilih).forEach(p => { if (!ada.has(p)) st.pilih.delete(p); }); render(); return api; },
    cari(q) { st.q = q; st.hal = 1; render(); },
    render, dipilih() { return Array.from(st.pilih); }, bersihPilih() { st.pilih.clear(); render(); },
    get data() { return st.data; }, tersaring: saring
  };
  return api;
}

/* =====================================================================
 *  GRAFIK SVG (ringan, tanpa pustaka)
 * ===================================================================== */
const Grafik = {
  warna: ['#0F5561', '#C9A27A', '#2F7D5B', '#6B5B95', '#B07620', '#B93A32', '#4F8A93'],
  garis(o) {
    const W = o.w || 560, H = o.h || 220, P = { l: 34, r: 14, t: 24, b: 30 }, v = o.nilai || [], lab = o.label || [];
    if (!v.length) return '<div class="empty small" style="padding:30px">' + esc(o.kosong || 'Belum ada data nilai.') + '</div>';
    const min = 0, max = 100, x = i => P.l + (v.length === 1 ? (W - P.l - P.r) / 2 : i * (W - P.l - P.r) / (v.length - 1)), y = n => P.t + (1 - (n - min) / (max - min)) * (H - P.t - P.b);
    const pts = v.map((n, i) => [x(i), y(n)]), garis = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = garis + ' L' + pts[pts.length - 1][0] + ' ' + (H - P.b) + ' L' + pts[0][0] + ' ' + (H - P.b) + ' Z';
    const iMax = v.indexOf(Math.max.apply(null, v)), gid = 'g' + Math.random().toString(36).slice(2, 7);
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || 'Grafik tren nilai') + '"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F5561" stop-opacity=".28"/><stop offset="1" stop-color="#0F5561" stop-opacity="0"/></linearGradient></defs>';
    [0, 25, 50, 75, 100].forEach(g => { s += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="#D8CFBE" stroke-dasharray="3 4"/><text x="' + (P.l - 6) + '" y="' + (y(g) + 3) + '" text-anchor="end">' + g + '</text>'; });
    if (o.kkm) s += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(o.kkm) + '" y2="' + y(o.kkm) + '" stroke="#B93A32" stroke-dasharray="6 4" opacity=".7"/><text x="' + (W - P.r) + '" y="' + (y(o.kkm) - 5) + '" text-anchor="end" style="fill:#B93A32">KKM ' + o.kkm + '</text>';
    s += '<path d="' + area + '" fill="url(#' + gid + ')"/><path d="' + garis + '" fill="none" stroke="#0F5561" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    pts.forEach((p, i) => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === iMax ? 5.5 : 4) + '" fill="#F4EEE3" stroke="#0F5561" stroke-width="2.2"><title>' + esc(lab[i] || '') + ': ' + v[i] + '</title></circle>'; });
    lab.forEach((l, i) => { if (v.length <= 8 || i % Math.ceil(v.length / 8) === 0) s += '<text x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(String(l).slice(0, 10)) + '</text>'; });
    const pk = pts[iMax], tw = 70;
    s += '<g transform="translate(' + Math.min(W - P.r - tw, Math.max(P.l, pk[0] - tw / 2)) + ' ' + Math.max(0, pk[1] - 30) + ')"><rect width="' + tw + '" height="20" rx="10" fill="#0A434D"/><text x="' + tw / 2 + '" y="13.5" text-anchor="middle" style="fill:#fff;font-weight:700">Puncak ' + v[iMax] + '</text></g>';
    return s + '</svg>';
  },
  donat(o) {
    const seg = (o.data || []).filter(d => d.v > 0), tot = seg.reduce((a, d) => a + d.v, 0), R = 52, C = 2 * Math.PI * R;
    let off = 0, s = '<svg class="chart" viewBox="0 0 140 140" style="max-width:' + (o.ukuran || 170) + 'px;margin:auto" role="img" aria-label="' + esc(o.aria || 'Grafik donat') + '"><circle cx="70" cy="70" r="' + R + '" fill="none" stroke="#E6DECF" stroke-width="16"/>';
    seg.forEach((d, i) => { const len = d.v / tot * C; s += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + (d.w || Grafik.warna[i % 7]) + '" stroke-width="16" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 70 70)"><title>' + esc(d.l) + ': ' + d.v + '</title></circle>'; off += len; });
    s += '<text x="70" y="' + (o.sub ? 68 : 75) + '" text-anchor="middle" style="font-size:20px;font-weight:700;fill:#23302F">' + esc(o.tengah !== undefined ? o.tengah : tot) + '</text>' + (o.sub ? '<text x="70" y="84" text-anchor="middle" style="font-size:8.5px;letter-spacing:.08em">' + esc(o.sub) + '</text>' : '') + '</svg>';
    if (o.legenda === false) return s;
    return '<div class="row wrap" style="gap:18px"><div style="flex:0 0 ' + (o.ukuran || 170) + 'px">' + s + '</div><div class="legend-l grow">' +
      (o.data || []).map((d, i) => '<div class="it"><i style="background:' + (d.w || Grafik.warna[i % 7]) + '"></i>' + esc(d.l) + '<b>' + esc(o.persen && tot ? Math.round(d.v / tot * 100) + '%' : d.v) + '</b></div>').join('') + '</div></div>';
  },
  batang(o) {
    const d = o.data || []; if (!d.length) return '<div class="empty small" style="padding:30px">' + esc(o.kosong || 'Belum ada data.') + '</div>';
    const W = o.w || 360, H = o.h || 180, P = { l: 26, r: 8, t: 14, b: 26 }, max = o.max || Math.max.apply(null, d.map(x => x.v).concat([1])), bw = (W - P.l - P.r) / d.length;
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || 'Grafik batang') + '">';
    [0, .5, 1].forEach(g => { const yy = P.t + (1 - g) * (H - P.t - P.b); s += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + yy + '" y2="' + yy + '" stroke="#D8CFBE" stroke-dasharray="3 4"/><text x="' + (P.l - 4) + '" y="' + (yy + 3) + '" text-anchor="end">' + Math.round(max * g) + '</text>'; });
    d.forEach((x, i) => { const h = (x.v / max) * (H - P.t - P.b), xx = P.l + i * bw + bw * .18, w = bw * .64, yy = H - P.b - h;
      s += '<rect x="' + xx + '" y="' + yy + '" width="' + w + '" height="' + Math.max(0, h) + '" rx="5" fill="' + (x.w || Grafik.warna[i % 7]) + '"><title>' + esc(x.l) + ': ' + x.v + '</title></rect>' +
        '<text x="' + (xx + w / 2) + '" y="' + (yy - 4) + '" text-anchor="middle" style="font-weight:700;fill:#23302F">' + x.v + '</text><text x="' + (xx + w / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(String(x.l).slice(0, 8)) + '</text>'; });
    if (o.garis) { const yy = P.t + (1 - o.garis / max) * (H - P.t - P.b); s += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + yy + '" y2="' + yy + '" stroke="#B93A32" stroke-dasharray="6 4"/>'; }
    return s + '</svg>';
  },
  /** Batang horizontal dengan garis KKM (dashboard) */
  hbar(o) {
    const d = o.data || []; if (!d.length) return UI.kosong({ ikon: 'chart', judul: 'Belum ada nilai', teks: 'Grafik muncul setelah siswa menyelesaikan ujian.' });
    return '<div class="hbar">' + d.map((x, i) => '<div class="it"><div class="row"><span class="grow clamp2">' + esc(x.l) + '</span><b class="mono">' + F.n(x.v) + '</b></div><div class="bar ' + (x.v < (o.kkm || 0) ? 'bad' : '') + '"><i style="width:' + Math.min(100, x.v) + '%;' + (x.v >= (o.kkm || 0) ? 'background:' + (i % 2 ? '#2F7D5B' : '#0F5561') : '') + '"></i>' + (o.kkm ? '<span class="kkm" style="left:' + o.kkm + '%"></span>' : '') + '</div></div>').join('') + '</div>';
  }
};
