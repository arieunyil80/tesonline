/**
 * guru.js — panel guru: dashboard, bank soal, paket, token, kehadiran, monitoring,
 * koreksi esai, rekap, kode ruang, dokumen, akun
 */
const Hal = {
  /** Muat data dengan SWR: kerangka → cache instan → data segar */
  async muat(el, action, data, gambar, opsi) {
    opsi = opsi || {};
    if (!API.ambilCache(action, data)) el.innerHTML = opsi.kerangka || UI.skTabel();
    try { await API.swr(action, data, d => { if (document.body.contains(el)) gambar(d); }, opsi); }
    catch (e) { el.innerHTML = UI.galat(e, 'App.rute()'); }
  },
  header(o) {
    return '<div class="page-h"><div>' + (o.over ? '<div class="over">' + o.over + '</div>' : '') + '<h1>' + o.judul + '</h1>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div><div class="row wrap">' + (o.aksi || '') + '</div></div>';
  },
  segarkan() { return '<button class="btn icon" title="Segarkan dari Google Sheets" aria-label="Segarkan" data-segar>' + ikon('refresh', 16) + '</button>'; },
  pasangSegar(el, fn) { const b = $('[data-segar]', el); if (b) b.onclick = () => UI.sibuk(b, fn); },
  bolehTulis() { return App.isGuru(); },
  mapelGuru() { return App.mapelRef().filter(m => App.isAdmin() || (App.me().mapel || []).indexOf(m.id) >= 0); },
  pilihMapel(id, sel) { return Hal.mapelGuru().map(m => '<option value="' + esc(m.id) + '"' + (m.id === sel ? ' selected' : '') + '>' + esc(m.nama) + '</option>').join(''); },
  async unduhDok(jenis, paket, format, kelas, catatan) {
    const d = await UI.kirim('dok.buat', { jenis, paket, format, kelas: kelas || '', catatan: catatan || '' }, { diam: true });
    UI.unduhBase64(d.base64, d.nama, d.mime);
    UI.toast('Dokumen siap: ' + d.nama + ' (salinan tersimpan di folder Arsip Drive).', 'ok');
  }
};

/* =====================================================================
 *  DASHBOARD
 * ===================================================================== */
App.daftar('g/beranda', { judul: 'Dashboard', crumb: 'Portal Guru & Admin', render(el) {
  const gambar = d => {
    const s = d.stat, me = App.me(), C = App.pub;
    const persen = d.lulus.lulus + d.lulus.remedial ? Math.round(d.lulus.lulus / (d.lulus.lulus + d.lulus.remedial) * 1000) / 10 : 0;
    el.innerHTML = Hal.header({ over: 'Panel Guru CBT · TA ' + esc(C.TAHUN_AJARAN || '') + ' (Semester ' + esc(C.SEMESTER || '') + ')', judul: 'Dashboard Pengampu &amp; Ringkasan Asesmen',
      aksi: Hal.segarkan() + (me.guru ? '<a class="btn primary" href="#/g/paket/form">' + ikon('plus', 16) + 'Buat Asesmen Baru</a>' : '') }) +
      (s.terkunci ? '<div class="card mb" style="background:var(--bad-l);box-shadow:none"><div class="row wrap"><div class="stat"><div class="ik" style="background:var(--bad);color:#fff">' + ikon('perisai', 20) + '</div></div><div class="grow"><b style="color:var(--bad);font-size:16px">Sesi Terkunci Otomatis: ' + s.terkunci + ' Siswa</b> <span class="badge solid-bad">PERHATIAN KHUSUS</span>' +
        '<p class="small" style="margin:4px 0 0;color:var(--bad)">Siswa melewati batas pelanggaran sensor anti-curang. Periksa riwayat lalu buka kunci bila perlu.</p></div><a class="btn primary" href="#/g/monitor">Buka Monitoring Sesi ' + ikon('panah', 16) + '</a></div></div>' : '') +
      '<div class="grid g4">' +
      [['Paket aktif', s.paketAktif, 'Paket', 'paket', '+' + s.terjadwal + ' terjadwal'], ['Ujian berjalan', s.ujianBerjalan, 'Sesi', 'live', '<span class="badge ok"><i class="dot pulse"></i>LIVE</span> ' + s.online + ' siswa online'],
        ['Esai menunggu koreksi', s.esaiMenunggu, 'Lembar', 'pen', s.esaiMenunggu ? '<span class="badge sand">Prioritas penilaian</span>' : 'Semua sudah dinilai'], ['Rata-rata nilai', s.rata === null ? '-' : F.n(s.rata), '/ 100', 'medali', 'KKM ' + d.lulus.kkm]]
        .map(x => '<div class="card stat"><div class="hd"><span class="over">' + x[0] + '</span><span class="ik">' + ikon(x[3], 20) + '</span></div><div class="val">' + x[1] + ' <small>' + x[2] + '</small></div><div class="small muted">' + x[4] + '</div></div>').join('') + '</div>' +
      (d.perMapel.length ? '<div class="row between mt" style="margin-top:22px"><span class="over">Mata pelajaran diampu (' + d.perMapel.length + ' mapel)</span></div><div class="grid g3 mt-s">' + d.perMapel.map(m => '<div class="card pad-s"><div class="row between"><b>' + esc(m.mapel) + '</b>' + UI.badge(m.paket + ' paket', 'tl') + '</div><div class="row between mt-s small"><span class="muted">Peserta <b class="mono">' + m.peserta + '</b></span><span class="muted">Rata-rata <b class="mono" style="color:var(--text)">' + F.n(m.rata) + '</b></span></div></div>').join('') + '</div>' : '') +
      '<div class="grid g-split mt" style="margin-top:22px"><div class="card"><div class="card-h"><div><div class="over">Analisis hasil ujian</div><h3>Rata-rata Nilai per Paket Ujian</h3></div><span class="small" style="color:var(--bad)">— Garis KKM (' + d.lulus.kkm + ')</span></div>' + Grafik.hbar({ data: d.perPaket.map(p => ({ l: p.nama, v: p.rata })), kkm: d.lulus.kkm }) + '</div>' +
      '<div class="card"><div class="card-h"><div><div class="over">Standar ketuntasan</div><h3>Distribusi Kelulusan Peserta</h3></div></div>' +
      Grafik.donat({ data: [{ l: 'Tuntas', v: d.lulus.lulus, w: '#0F5561' }, { l: 'Remedial', v: d.lulus.remedial, w: '#B93A32' }], tengah: persen + '%', sub: 'LULUS KKM' }) + '</div></div>' +
      '<div class="card mt" style="margin-top:22px"><div class="card-h"><h3>' + ikon('live') + 'Ujian Sedang Berjalan (Live Monitoring)</h3><span class="badge ok"><i class="dot pulse"></i>' + d.berjalan.length + ' sesi berlangsung</span></div>' +
      (d.berjalan.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Paket ujian</th><th>Mapel</th><th>Kelas</th><th>Progres</th><th>Tutup</th><th></th></tr></thead><tbody>' + d.berjalan.map(b => {
        const p = b.peserta ? Math.round((b.selesai + b.mengerjakan) / b.peserta * 100) : 0;
        return '<tr><td><b>' + esc(b.nama) + '</b></td><td>' + esc(b.mapel) + '</td><td class="small">' + esc(b.kelas) + '</td><td style="min-width:160px"><div class="row gap-s"><div class="bar grow"><i style="width:' + p + '%"></i></div><span class="small mono">' + (b.selesai + b.mengerjakan) + '/' + b.peserta + '</span></div></td><td class="mono small">' + F.jam(b.tutup) + '</td><td class="tr"><a class="btn primary sm" href="#/g/monitor?paket=' + esc(b.id) + '">Pantau ' + ikon('panah', 14) + '</a></td></tr>';
      }).join('') + '</tbody></table></div>' : UI.kosong({ ikon: 'live', judul: 'Tidak ada ujian yang sedang berjalan', teks: 'Ujian yang sedang dibuka akan tampil di sini.' })) + '</div>' +
      '<div class="card mt" style="margin-top:22px"><div class="card-h"><h3>' + ikon('pen') + 'Esai Menunggu Koreksi</h3><span class="badge sand">' + s.esaiMenunggu + ' lembar tertunda</span></div>' +
      (d.koreksi.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Siswa</th><th>Paket</th><th>Kelas</th><th>Selesai</th><th></th></tr></thead><tbody>' + d.koreksi.map(k => '<tr><td><div class="row gap-s">' + UI.avatar(k.nama, 1) + '<div><b>' + esc(k.nama) + '</b><div class="tiny muted mono">' + esc(k.nis) + '</div></div></div></td><td>' + esc(k.paket) + '</td><td>' + esc(k.kelas) + '</td><td class="small muted">' + F.relatif(new Date(k.selesai).getTime()) + '</td><td class="tr"><a class="btn sm" href="#/g/koreksi/' + esc(k.sesi) + '">Koreksi ' + ikon('pen', 14) + '</a></td></tr>').join('') + '</tbody></table></div><div class="tr mt-s"><a href="#/g/koreksi">Buka seluruh lembar esai →</a></div>'
        : UI.kosong({ ikon: 'cekb', judul: 'Tidak ada esai yang menunggu', teks: 'Lembar esai muncul setelah siswa mengirim jawaban.' })) + '</div>';
    Hal.pasangSegar(el, async () => { await API.swr('g.dashboard', {}, gambar, { force: true, fresh: true }); App.muatRef(true); });
  };
  Hal.muat(el, 'g.dashboard', {}, gambar, { kerangka: '<div class="grid g4">' + UI.sk(4, true) + '</div><div class="grid g-split mt">' + UI.sk(2, true) + '</div>', maxAge: 15000 });
  App.interval(() => { if (document.visibilityState === 'visible') API.swr('g.dashboard', {}, gambar, { maxAge: 0, diam: true }).catch(() => { }); }, 30000);
} });

/* =====================================================================
 *  BANK SOAL
 * ===================================================================== */
App.daftar('g/soal', { judul: 'Bank Soal', crumb: 'Modul evaluasi', filterMapel: true, render(el, q) {
  const tulis = Hal.bolehTulis();
  let tipe = q.tipe || '', tabel;
  el.innerHTML = Hal.header({ over: 'Repositori butir soal', judul: 'Bank Soal Ujian (PG &amp; Esai)', sub: 'Kelola butir soal, kunci jawaban, rubrik esai, dan bobot penilaian.',
    aksi: Hal.segarkan() + (tulis ? '<button class="btn" id="b-impor">' + ikon('upload', 16) + 'Impor dari Excel</button><a class="btn primary" href="#/g/soal/form">' + ikon('plus', 16) + 'Tambah Soal</a>' : '<span class="badge">Mode lihat saja</span>') }) +
    '<div class="grid g4 mb" id="stat-soal">' + UI.sk(4, true) + '</div><div class="card"><div class="row wrap mb"><div class="input-ikon grow" style="min-width:220px">' + ikon('cari', 16) + '<input class="input" id="cari" placeholder="Cari teks soal, topik, atau ID…"></div>' +
    '<div class="seg" id="seg-tipe">' + [['', 'Semua'], ['PG', 'Pilihan Ganda'], ['Esai', 'Esai']].map(t => '<button data-t="' + t[0] + '" class="' + (t[0] === tipe ? 'on' : '') + '">' + t[1] + '<span class="n" data-n="' + t[0] + '"></span></button>').join('') + '</div></div><div id="tbl"></div></div>';
  tabel = Tabel($('#tbl', el), {
    pilih: tulis, per: 12, satuan: 'butir', judulKosong: 'Belum ada soal', teksKosong: tulis ? 'Tambahkan soal atau impor dari Excel.' : '',
    bulk: '<button class="btn danger xs" id="b-hapus-banyak">' + ikon('trash', 13) + 'Hapus terpilih</button>',
    cari: r => r.teks + ' ' + r.topik + ' ' + r.id + ' ' + App.namaMapel(r.mapel),
    filter: r => (!App.mapel || r.mapel === App.mapel) && (!tipe || r.tipe === tipe),
    kolom: [
      { k: 'id', label: 'ID', render: r => '<span class="mono small">#' + esc(r.id.slice(-6)) + '</span>' },
      { k: 'teks', label: 'Teks soal', render: r => '<div style="max-width:440px">' + (r.topik ? '<span class="badge sand" style="margin-right:6px">' + esc(r.topik) + '</span>' : '') + (r.gambar ? ikon('gambar', 14) + ' ' : '') + '<span class="clamp2">' + esc(r.teks) + '</span>' +
        '<div class="tiny muted mt-s">' + (r.tipe === 'PG' ? 'Kunci benar: <b>' + esc(r.kunci) + '</b> · ' + esc(String(r[String(r.kunci).toLowerCase()] || '').slice(0, 60)) : 'Rubrik: ' + esc(String(r.rubrik || '—').slice(0, 70))) + '</div></div>' },
      { k: 'mapel', label: 'Mapel', render: r => '<span class="small">' + esc(App.namaMapel(r.mapel)) + '</span>', nilai: r => App.namaMapel(r.mapel) },
      { k: 'tipe', label: 'Tipe', render: r => UI.status(r.tipe) },
      { k: 'bobot', label: 'Bobot', kelas: 'tr', render: r => '<span class="mono">' + F.n(r.bobot) + '</span>' },
      { k: 'dipakai', label: 'Dipakai', render: r => r.dipakai ? '<span class="badge tl">' + r.dipakai + ' paket</span>' : '<span class="tiny muted">—</span>' },
      { k: '_a', label: '', urut: false, render: r => tulis && (App.isAdmin() || r.pembuat === App.me().id) ? '<div class="aksi"><a class="btn icon sm ghost" href="#/g/soal/form?id=' + esc(r.id) + '" title="Ubah" aria-label="Ubah">' + ikon('edit', 16) + '</a><button class="btn icon sm ghost bad" data-hapus="' + esc(r.id) + '" title="Hapus" aria-label="Hapus">' + ikon('trash', 16) + '</button></div>' : '' }
    ],
    setelah(t) {
      $$('[data-hapus]', t).forEach(b => b.onclick = () => hapus([b.dataset.hapus]));
      const bh = $('#b-hapus-banyak', t); if (bh) bh.onclick = () => hapus(tabel.dipilih());
    }
  });
  async function hapus(ids) {
    if (!ids.length || !(await UI.konfirmasi('Hapus ' + ids.length + ' soal? Soal yang dipakai paket tidak akan dihapus.', { bahaya: true, tombol: 'Hapus' }))) return;
    try { const d = await UI.kirim('soal.hapus', { ids }); if (d.ditolak.length) UI.toast('Dilewati: ' + d.ditolak.slice(0, 3).join('; '), 'warn'); tabel.bersihPilih(); muat(true); } catch (e) { UI.toast(e.message, 'bad'); }
  }
  const gambar = d => {
    const vis = d.filter(r => !App.mapel || r.mapel === App.mapel);
    const pg = vis.filter(r => r.tipe === 'PG').length, es = vis.length - pg;
    $('#stat-soal').innerHTML = [['Total butir soal', vis.length + ' soal', 'daftar'], ['Pilihan ganda', pg + ' butir', 'cekb'], ['Esai berrubrik', es + ' butir', 'pen'], ['Dipakai di paket', vis.filter(r => r.dipakai).length + ' butir', 'paket']]
      .map(x => '<div class="card pad-s row"><div class="grow"><div class="over">' + x[0] + '</div><div class="mono bold" style="font-size:18px">' + x[1] + '</div></div><span class="stat"><span class="ik">' + ikon(x[2], 18) + '</span></span></div>').join('');
    $$('[data-n]', el).forEach(n => { n.textContent = n.dataset.n === 'PG' ? pg : n.dataset.n === 'Esai' ? es : vis.length; });
    tabel.set(d);
  };
  const muat = paksa => API.swr('soal.list', {}, gambar, { maxAge: paksa ? 0 : 30000, force: paksa }).catch(e => { $('#tbl').innerHTML = UI.galat(e); });
  $('#cari', el).oninput = UI.debounce(e => tabel.cari(e.target.value), 150);
  $$('#seg-tipe button', el).forEach(b => b.onclick = () => { tipe = b.dataset.t; $$('#seg-tipe button', el).forEach(x => x.classList.toggle('on', x === b)); tabel.render(); });
  Hal.pasangSegar(el, () => API.swr('soal.list', {}, gambar, { force: true, fresh: true }));
  const bi = $('#b-impor', el); if (bi) bi.onclick = () => Impor.soal(() => muat(true));
  if (!API.ambilCache('soal.list', {})) $('#tbl').innerHTML = UI.sk(6);
  muat(false);
} });

/* ---------- Form soal ---------- */
App.daftar('g/soal/form', { judul: 'Form Soal', crumb: 'Bank Soal', render(el, q) {
  if (!Hal.bolehTulis()) { el.innerHTML = UI.kosong({ ikon: 'kunci', judul: 'Mode lihat saja', teks: 'Akun Anda belum mengampu mapel. Minta admin menambahkan mapel di menu Pengguna.' }); return; }
  const daftar = API.ambilCache('soal.list', {}) || [];
  const s = q.id ? daftar.find(x => x.id === q.id) : null;
  if (q.id && !s) { API.swr('soal.list', {}, () => App.rute(), { force: true }).catch(e => { el.innerHTML = UI.galat(e); }); el.innerHTML = UI.skTabel(); return; }
  const v = s || { tipe: q.tipe || 'PG', mapel: App.mapel || (Hal.mapelGuru()[0] || {}).id, bobot: '', kunci: '' };
  let tipe = v.tipe;
  el.innerHTML = '<div class="page-h"><div><a href="#/g/soal" class="small">' + ikon('kiri', 14) + ' Kembali ke Bank Soal</a><h1 class="mt-s">' + (s ? 'Ubah Soal' : 'Tambah Butir Soal') + '</h1>' + (s ? '<p class="mono small">#' + esc(s.id) + '</p>' : '') + '</div>' +
    '<div class="seg" id="seg">' + [['PG', 'Pilihan Ganda (Opsi A–E)'], ['Esai', 'Soal Esai &amp; Rubrik']].map(t => '<button data-t="' + t[0] + '" class="' + (t[0] === tipe ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div>' +
    '<div class="card col gap-l" style="max-width:980px"><div class="grid g3"><div class="field"><label>Mata pelajaran <span class="wajib">*</span></label><select class="select" id="f-mapel">' + Hal.pilihMapel('', v.mapel) + '</select></div>' +
    '<div class="field"><label>Topik / kompetensi</label><input class="input" id="f-topik" value="' + esc(v.topik || '') + '" placeholder="mis. Subnetting"></div>' +
    '<div class="field"><label>Bobot poin <span class="wajib">*</span></label><input class="input mono" id="f-bobot" type="number" min="0.5" step="0.5" value="' + esc(v.bobot || (tipe === 'Esai' ? 10 : 1)) + '"></div></div>' +
    '<div class="field"><div class="row between"><label>Teks pertanyaan &amp; stimulus <span class="wajib">*</span></label><span class="tiny muted mono" id="n-teks"></span></div><textarea class="textarea" id="f-teks" style="min-height:150px" placeholder="Tulis pertanyaan. Baris baru dipertahankan saat tampil ke siswa.">' + esc(v.teks || '') + '</textarea></div>' +
    '<div class="field"><label>Gambar stimulus (opsional)</label><div class="row wrap top"><div class="drop grow" id="drop" style="min-width:240px">' + ikon('gambar', 22) + '<div class="mt-s"><b>Seret &amp; lepas gambar</b> atau klik untuk memilih</div><div class="tiny">JPG, PNG, WebP · otomatis dikecilkan ke 1200 px</div><input type="file" id="f-file" accept="image/*" class="hide"></div>' +
    '<div id="prev-img" style="max-width:260px">' + (v.gambar ? '<img src="' + esc(v.gambar) + '" referrerpolicy="no-referrer" style="border-radius:12px;max-height:160px">' : '') + '</div></div><input class="input mt-s" id="f-gambar" placeholder="…atau tempel URL gambar (https://)" value="' + esc(v.gambar || '') + '"></div>' +
    '<div id="blok-pg"><div class="row between"><span class="lbl">Opsi jawaban &amp; kunci jawaban benar</span><span class="tiny muted">Klik bulatan untuk menentukan kunci</span></div><div class="col mt-s" id="opsi">' +
    ['A', 'B', 'C', 'D', 'E'].map(k => '<div class="row"><input type="radio" class="rd" name="kunci" value="' + k + '"' + (v.kunci === k ? ' checked' : '') + ' aria-label="Kunci ' + k + '"><b class="mono" style="width:18px">' + k + '.</b><input class="input grow" data-o="' + k.toLowerCase() + '" value="' + esc(v[k.toLowerCase()] || '') + '" placeholder="Opsi ' + k + (k > 'B' ? ' (opsional)' : '') + '"></div>').join('') + '</div></div>' +
    '<div id="blok-esai" class="field"><label>Rubrik / pedoman penskoran</label><textarea class="textarea" id="f-rubrik" placeholder="mis. 4: konsep benar · 4: langkah runtut · 2: kesimpulan">' + esc(v.rubrik || '') + '</textarea><div class="help">Rubrik hanya terlihat oleh guru saat koreksi — tidak pernah dikirim ke siswa.</div></div>' +
    '<div class="row wrap between" style="border-top:1px solid var(--border);padding-top:16px"><span class="small muted">' + ikon('perisai', 14) + ' Kunci jawaban &amp; rubrik hanya tersimpan di server.</span><div class="row wrap"><a class="btn ghost" href="#/g/soal">Batal</a>' +
    (s ? '' : '<button class="btn" id="b-lagi">' + ikon('refresh', 16) + 'Simpan &amp; Tambah Lagi</button>') + '<button class="btn primary" id="b-simpan">' + ikon('cek', 16) + 'Simpan Butir Soal</button></div></div></div>';
  const atur = () => { $('#blok-pg').classList.toggle('hide', tipe !== 'PG'); $('#blok-esai').classList.toggle('hide', tipe !== 'Esai'); };
  $$('#seg button').forEach(b => b.onclick = () => { tipe = b.dataset.t; $$('#seg button').forEach(x => x.classList.toggle('on', x === b)); if (!s) $('#f-bobot').value = tipe === 'Esai' ? 10 : 1; atur(); });
  atur();
  const nt = () => { $('#n-teks').textContent = $('#f-teks').value.length + ' karakter'; }; $('#f-teks').oninput = nt; nt();
  const drop = $('#drop'), file = $('#f-file');
  drop.onclick = () => file.click();
  ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('on'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('on')));
  drop.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files[0]) unggah(e.dataTransfer.files[0]); });
  file.onchange = () => { if (file.files[0]) unggah(file.files[0]); };
  $('#f-gambar').onchange = () => { const u = $('#f-gambar').value.trim(); $('#prev-img').innerHTML = u ? '<img src="' + esc(u) + '" referrerpolicy="no-referrer" style="border-radius:12px;max-height:160px">' : ''; };
  async function unggah(f) {
    if (f.size > 8e6) return UI.toast('Gambar terlalu besar (maks 8 MB sebelum dikecilkan).', 'bad');
    $('#prev-img').innerHTML = '<div class="sk sk-card" style="width:220px"></div>';
    try {
      const g = await UI.kecilkan(f, 1200);
      const d = await UI.kirim('soal.gambar', { base64: g.base64, mime: g.mime, nama: f.name }, { diam: true });
      $('#f-gambar').value = d.url;
      $('#prev-img').innerHTML = '<img src="' + g.dataUrl + '" style="border-radius:12px;max-height:160px"><div class="tiny muted mt-s">Tersimpan di Drive</div>';
    } catch (e) { UI.toast(e.message, 'bad'); $('#prev-img').innerHTML = ''; }
  }
  const data = () => {
    const o = { id: s ? s.id : '', tipe, mapel: $('#f-mapel').value, topik: $('#f-topik').value, bobot: $('#f-bobot').value, teks: $('#f-teks').value, gambar: $('#f-gambar').value.trim(), rubrik: $('#f-rubrik').value };
    $$('[data-o]').forEach(i => { o[i.dataset.o] = i.value; });
    const k = $('input[name=kunci]:checked'); o.kunci = k ? k.value : '';
    return o;
  };
  const simpan = async (lagi, btn) => {
    const o = data();
    if (!o.teks.trim()) return UI.tandaiSalah($('#f-teks'), 'Teks pertanyaan wajib diisi.');
    if (tipe === 'PG' && !o.kunci) return UI.toast('Pilih kunci jawaban (klik bulatan di samping opsi).', 'bad');
    await UI.sibuk(btn, async () => {
      await UI.kirim('soal.simpan', o);
      API.swr('soal.list', {}, () => { }, { force: true, diam: true }).catch(() => { });
      if (lagi) { $('#f-teks').value = ''; $$('[data-o]').forEach(i => i.value = ''); $$('input[name=kunci]').forEach(r => r.checked = false); $('#f-gambar').value = ''; $('#prev-img').innerHTML = ''; $('#f-rubrik').value = ''; nt(); $('#f-teks').focus(); }
      else App.pergi('g/soal');
    });
  };
  $('#b-simpan').onclick = e => simpan(false, e.currentTarget);
  const bl = $('#b-lagi'); if (bl) bl.onclick = e => simpan(true, e.currentTarget);
} });

/* =====================================================================
 *  IMPOR (soal & siswa) — pindai (dry-run) → jalankan
 * ===================================================================== */
const Impor = {
  buka(o) {
    let rows = [];
    const m = UI.modal({ judul: o.judul, sub: o.sub, ikon: 'upload', ukuran: 'lg',
      isi: '<div class="col"><div class="row wrap"><button class="btn sm" id="i-tpl">' + ikon('unduh', 14) + 'Unduh template</button><span class="small muted">Kolom: ' + o.kolom.map(k => '<span class="mono">' + esc(k) + '</span>').join(', ') + '</span></div>' +
        (o.ekstra || '') + '<div class="drop" id="i-drop">' + ikon('upload', 22) + '<div class="mt-s"><b>Pilih berkas Excel/CSV</b> atau seret ke sini</div><div class="tiny">.xlsx · .xls · .csv — baris pertama berisi judul kolom</div><input type="file" id="i-file" class="hide" accept=".xlsx,.xls,.csv"></div>' +
        '<details><summary class="small" style="cursor:pointer">…atau tempel langsung dari Excel</summary><textarea class="textarea mt-s" id="i-paste" placeholder="Salin sel dari Excel (termasuk baris judul) lalu tempel di sini"></textarea><button class="btn sm mt-s" id="i-baca">Baca tempelan</button></details>' +
        '<div id="i-prev"></div><div id="i-hasil"></div></div>',
      aksi: [{ label: 'Tutup' }, { label: 'Pindai (tanpa menyimpan)', kelas: '', klik: async (t, el) => { await jalan(true, el); return false; } }, { label: 'Jalankan Impor', kelas: 'primary', klik: async (t, el) => { await jalan(false, el); return false; } }] });
    const el = m.el;
    const tampil = () => {
      $('#i-prev', el).innerHTML = rows.length ? '<div class="alert ok">' + ikon('cekb') + '<div class="grow"><b>' + rows.length + ' baris terbaca</b><p>Pratinjau 5 baris pertama:</p></div></div><div class="tbl-wrap mt-s"><table class="tbl"><thead><tr>' +
        Object.keys(rows[0]).slice(0, 8).map(k => '<th>' + esc(k) + '</th>').join('') + '</tr></thead><tbody>' + rows.slice(0, 5).map(r => '<tr>' + Object.keys(rows[0]).slice(0, 8).map(k => '<td class="small">' + esc(String(r[k]).slice(0, 40)) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' : '';
      $('#i-hasil', el).innerHTML = '';
    };
    const baca = async f => { try { rows = (await UI.bacaTabel(f)).filter(r => Object.values(r).some(v => String(v).trim())); tampil(); } catch (e) { UI.toast(e.message, 'bad'); } };
    $('#i-drop', el).onclick = () => $('#i-file', el).click();
    $('#i-file', el).onchange = e => e.target.files[0] && baca(e.target.files[0]);
    $('#i-drop', el).addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('on'); });
    $('#i-drop', el).addEventListener('drop', e => { e.preventDefault(); e.currentTarget.classList.remove('on'); if (e.dataTransfer.files[0]) baca(e.dataTransfer.files[0]); });
    $('#i-baca', el).onclick = () => { rows = UI.parseTeksTabel($('#i-paste', el).value); tampil(); };
    $('#i-tpl', el).onclick = async () => {
      try { const X = await UI.xlsx(), ws = X.utils.aoa_to_sheet([o.kolom].concat(o.contoh)), wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Data'); X.writeFile(wb, o.namaTemplate + '.xlsx'); }
      catch (e) { UI.unduhCSV([o.kolom].concat(o.contoh), o.namaTemplate + '.csv'); }
    };
    async function jalan(dry, el2) {
      if (!rows.length) { UI.toast('Pilih berkas atau tempel data lebih dulu.', 'warn'); return; }
      if (!dry && !(await UI.konfirmasi('Simpan ' + rows.length + ' baris ke database? Data yang sudah ada tidak digandakan.', { tombol: 'Impor sekarang' }))) return;
      const data = Object.assign({ rows, dryRun: dry }, o.data ? o.data(el2) : {});
      const d = await UI.kirim(o.aksi, data, { diam: dry });
      $('#i-hasil', el2).innerHTML = '<div class="grid g3 mt-s">' + [['Ditambah', d.ditambah, 'ok'], ['Diperbarui', d.diperbarui, 'tl'], ['Dilewati', d.dilewati, '']].map(x => '<div class="metric"><div class="over">' + x[0] + '</div><div class="v">' + x[1] + '</div></div>').join('') + '</div>' +
        (d.galat && d.galat.length ? '<div class="alert warn mt-s">' + ikon('segitiga') + '<div class="grow"><b>' + d.galat.length + ' baris bermasalah (tidak diimpor)</b><p>' + d.galat.slice(0, 8).map(g => 'Baris ' + g.baris + ': ' + esc(g.pesan)).join('<br>') + '</p></div></div>' : '') +
        '<p class="small muted mt-s">' + (dry ? 'Ini hasil pindai — belum ada yang disimpan.' : 'Impor selesai. Menjalankan ulang tidak akan membuat data dobel.') + '</p>';
      if (!dry && o.selesai) o.selesai();
    }
  },
  soal(selesai) {
    const opsiMapel = '<option value="">Ambil dari kolom "Mapel" di berkas</option>' + Hal.pilihMapel('', '');
    Impor.buka({ judul: 'Impor Soal dari Excel', sub: 'Pilihan ganda & esai dalam satu berkas', aksi: 'soal.impor', namaTemplate: 'template-soal',
      kolom: ['Mapel', 'Tipe Soal', 'Topik', 'Pertanyaan', 'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Pilihan E', 'Kunci Jawaban', 'Rubrik', 'Bobot', 'URL Gambar'],
      contoh: [[(Hal.mapelGuru()[0] || {}).nama || 'Nama Mapel', 'PG', 'Jaringan', 'Perangkat yang menghubungkan dua jaringan berbeda adalah …', 'Switch', 'Hub', 'Router', 'Repeater', 'Bridge', 'C', '', 2, ''],
        [(Hal.mapelGuru()[0] || {}).nama || 'Nama Mapel', 'Esai', 'Analisis', 'Jelaskan perbedaan switch dan router!', '', '', '', '', '', '', '5: fungsi switch · 5: fungsi router', 10, '']],
      ekstra: '<div class="grid g2"><div class="field"><label>Mapel tujuan</label><select class="select" id="i-mapel">' + opsiMapel + '</select></div><label class="check" style="align-self:end;padding-bottom:10px"><input type="checkbox" class="cb" id="i-timpa"> Timpa soal yang sama (teks identik)</label></div>',
      data: el => ({ mapel: $('#i-mapel', el).value, timpa: $('#i-timpa', el).checked }), selesai });
  },
  siswa(selesai) {
    Impor.buka({ judul: 'Impor Data Siswa', sub: 'Upsert berdasarkan NIS — aman diulang', aksi: 'siswa.impor', namaTemplate: 'template-siswa',
      kolom: ['NIS', 'Nama', 'Kelas'], contoh: [['2122101', 'Contoh Siswa Satu', 'XI TKJ 1'], ['0122102', 'Contoh Siswa Dua', 'XI TKJ 2']],
      data: () => ({}), selesai: () => selesai && selesai() });
  }
};

/* =====================================================================
 *  PAKET UJIAN
 * ===================================================================== */
App.daftar('g/paket', { judul: 'Paket Ujian', crumb: 'Modul kurikulum & evaluasi', filterMapel: true, render(el, q) {
  const tulis = Hal.bolehTulis();
  let fs = q.status || '', tabel;
  el.innerHTML = Hal.header({ over: 'Paket ujian', judul: 'Daftar Paket Ujian &amp; Konfigurasi Sesi', sub: 'Racik paket dari bank soal, jadwalkan, dan atur pengamanan ujian.',
    aksi: Hal.segarkan() + (tulis ? '<a class="btn primary" href="#/g/paket/form">' + ikon('plus', 16) + 'Buat Paket Ujian Baru</a>' : '') }) +
    '<div class="card"><div class="row wrap mb"><div class="input-ikon grow" style="min-width:220px">' + ikon('cari', 16) + '<input class="input" id="cari" placeholder="Cari nama paket…"></div><div class="seg" id="seg">' +
    [['', 'Semua'], ['Berjalan', 'Aktif/Live'], ['Terjadwal', 'Terjadwal'], ['Draf', 'Draf'], ['Selesai', 'Selesai']].map(t => '<button data-s="' + t[0] + '" class="' + (t[0] === fs ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div><div id="tbl"></div></div>';
  tabel = Tabel($('#tbl', el), {
    per: 10, satuan: 'paket', judulKosong: 'Belum ada paket ujian', teksKosong: tulis ? 'Klik "Buat Paket Ujian Baru".' : '', sort: 'buka', dir: -1,
    cari: r => r.nama + ' ' + r.mapelNama + ' ' + r.kelas.join(' '), filter: r => (!App.mapel || r.mapel === App.mapel) && (!fs || r.statusWaktu === fs),
    kolom: [
      { k: 'nama', label: 'Identitas & nama paket', render: r => '<b>' + esc(r.nama) + '</b><div class="tiny muted mono">' + esc(r.id) + '</div>' },
      { k: 'mapelNama', label: 'Mapel & kelas', render: r => '<div class="small">' + esc(r.mapelNama) + '</div><div class="tiny muted">' + esc(r.kelas.join(', ') || '—') + '</div>' },
      { k: 'nPG', label: 'Komposisi', render: r => '<div class="small"><b>' + r.nPG + ' PG + ' + r.nEsai + ' Esai</b></div><div class="tiny muted">diundi dari ' + (r.poolPG + r.poolEsai) + ' soal</div>' },
      { k: 'buka', label: 'Durasi & jadwal', render: r => '<div class="small mono">' + r.durasi + ' menit</div><div class="tiny muted">' + F.tgl(r.buka) + ' ' + F.jam(r.buka) + ' – ' + F.jam(r.tutup) + '</div>' },
      { k: 'statusWaktu', label: 'Status', render: r => UI.status(r.statusWaktu === 'Berjalan' ? 'Live' : r.statusWaktu) + (r.berjalan ? '<div class="tiny muted mt-s">' + r.berjalan + ' mengerjakan</div>' : '') },
      { k: 'token', label: 'Token', kelas: 'tr', render: r => '<span class="mono">' + r.token + '</span>' },
      { k: '_a', label: '', urut: false, render: r => '<div class="aksi">' + (r.statusWaktu === 'Berjalan' ? '<a class="btn primary xs" href="#/g/monitor?paket=' + esc(r.id) + '">' + ikon('live', 13) + 'Monitor</a>' : '') +
        '<a class="btn xs" href="#/g/token?paket=' + esc(r.id) + '">' + ikon('key', 13) + 'Token</a>' + (r.sesi ? '<a class="btn xs" href="#/g/rekap?paket=' + esc(r.id) + '">' + ikon('chart', 13) + 'Rekap</a>' : '') +
        (tulis ? '<a class="btn icon sm ghost" href="#/g/paket/form?id=' + esc(r.id) + '" title="Ubah" aria-label="Ubah">' + ikon('edit', 16) + '</a><button class="btn icon sm ghost" data-salin="' + esc(r.id) + '" title="Salin" aria-label="Salin">' + ikon('salin', 16) + '</button>' +
          (r.sesi ? '' : '<button class="btn icon sm ghost bad" data-hapus="' + esc(r.id) + '" title="Hapus" aria-label="Hapus">' + ikon('trash', 16) + '</button>') : '') + '</div>' }
    ],
    setelah(t) {
      $$('[data-salin]', t).forEach(b => b.onclick = () => UI.sibuk(b, async () => { await UI.kirim('paket.salin', { id: b.dataset.salin }); muat(true); }));
      $$('[data-hapus]', t).forEach(b => b.onclick = async () => { const p = tabel.data.find(x => x.id === b.dataset.hapus); if (await UI.konfirmasi('Hapus paket "' + esc(p.nama) + '" beserta ' + p.token + ' token?', { bahaya: true, tombol: 'Hapus paket' })) { try { await UI.kirim('paket.hapus', { id: p.id }); muat(true); } catch (e) { UI.toast(e.message, 'bad'); } } });
    }
  });
  const muat = paksa => API.swr('paket.list', {}, d => tabel.set(d), { maxAge: paksa ? 0 : 30000, force: paksa }).then(() => paksa && App.muatRef(true)).catch(e => { $('#tbl').innerHTML = UI.galat(e); });
  $('#cari', el).oninput = UI.debounce(e => tabel.cari(e.target.value), 150);
  $$('#seg button', el).forEach(b => b.onclick = () => { fs = b.dataset.s; $$('#seg button', el).forEach(x => x.classList.toggle('on', x === b)); tabel.render(); });
  Hal.pasangSegar(el, () => API.swr('paket.list', {}, d => tabel.set(d), { force: true, fresh: true }));
  if (!API.ambilCache('paket.list', {})) $('#tbl').innerHTML = UI.sk(6);
  muat(false);
} });

/* ---------- Form paket (konfigurator) ---------- */
App.daftar('g/paket/form', { judul: 'Konfigurator Paket', crumb: 'Paket Ujian', render(el, q) {
  if (!Hal.bolehTulis()) { el.innerHTML = UI.kosong({ ikon: 'kunci', judul: 'Mode lihat saja' }); return; }
  el.innerHTML = UI.skTabel(8);
  Promise.all([API.swr('soal.list', {}, () => { }, { maxAge: 60000 }), API.swr('paket.list', {}, () => { }, { maxAge: q.id ? 0 : 60000 })]).then(([soal, paket]) => {
    const p = q.id ? paket.find(x => x.id === q.id) : null;
    if (q.id && !p) { el.innerHTML = UI.kosong({ ikon: 'paket', judul: 'Paket tidak ditemukan' }); return; }
    const cfg = (App.ref && App.ref.cfg) || {}, now = Date.now();
    const v = p || { nama: '', mapel: App.mapel || (Hal.mapelGuru()[0] || {}).id, soal: [], nPG: 0, nEsai: 0, pPG: 70, pEsai: 30, acakSoal: true, acakOpsi: true, kodeRuang: 'Ikuti Sistem', layarPenuh: 'Ikuti Sistem', pindahTab: 'Ikuti Sistem', maksPel: '', durasi: 90,
      buka: new Date(Math.ceil(now / 3600e3) * 3600e3).toISOString(), tutup: new Date(Math.ceil(now / 3600e3) * 3600e3 + 3 * 3600e3).toISOString(), status: 'Draf' };
    const terkunci = p && p.sesi > 0;
    const pilih = new Set(v.soal);
    let fTipe = '', fCari = '';
    const sisCap = (k, ya) => '<span class="tiny muted">Sistem: <b>' + (ya ? (cfg[k] === 'Ya' ? 'Wajib' : 'Nonaktif') : '') + '</b></span>';
    const seg = (id, opsi, val) => '<div class="seg soft" data-seg="' + id + '">' + opsi.map(o => '<button type="button" data-v="' + o + '" class="' + (o === val ? 'on' : '') + '">' + o + '</button>').join('') + '</div>';
    el.innerHTML = '<div class="page-h"><div><a href="#/g/paket" class="small">' + ikon('kiri', 14) + ' Kembali ke Paket Ujian</a><h1 class="mt-s">Konfigurator Paket Ujian &amp; Standar Sekuriti</h1><p>Atur spesifikasi paket, pengundian acak, bobot nilai, dan sensor anti-curang.</p></div>' + (p ? UI.status(p.statusWaktu) : '') + '</div>' +
      (terkunci ? '<div class="alert warn mb">' + ikon('kunci') + '<div class="grow"><b>Paket sudah dikerjakan ' + p.sesi + ' siswa</b><p>Komposisi soal terkunci. Yang masih bisa diubah: nama, jadwal, dan pengamanan.</p></div></div>' : '') +
      '<div class="col gap-l" style="max-width:1080px">' +
      '<div class="card"><h3 class="mb">' + '<span class="badge teal">1</span> Informasi umum &amp; jadwal</h3><div class="grid g2"><div class="field"><label>Nama ujian <span class="wajib">*</span></label><input class="input" id="p-nama" value="' + esc(v.nama) + '" placeholder="mis. Penilaian Tengah Semester KJD"></div>' +
      '<div class="field"><label>Mata pelajaran <span class="wajib">*</span></label><select class="select" id="p-mapel" ' + (terkunci ? 'disabled' : '') + '>' + Hal.pilihMapel('', v.mapel) + '</select></div></div>' +
      '<div class="grid g3 mt"><div class="field"><label>Durasi (menit) <span class="wajib">*</span></label><input class="input mono" type="number" min="1" id="p-durasi" value="' + esc(v.durasi) + '"></div>' +
      '<div class="field"><label>Waktu buka <span class="wajib">*</span></label><input class="input mono" type="datetime-local" id="p-buka" value="' + F.dtl(v.buka) + '"></div>' +
      '<div class="field"><label>Waktu tutup <span class="wajib">*</span></label><input class="input mono" type="datetime-local" id="p-tutup" value="' + F.dtl(v.tutup) + '"><div class="help">Server menolak login baru setelah jam ini.</div></div></div></div>' +
      '<div class="card"><div class="card-h"><h3><span class="badge teal">2</span> Kumpulan soal &amp; pengundian acak</h3><span class="badge ok" id="p-terpilih"></span></div><div class="grid g-split">' +
      '<div class="inset" style="padding:12px"><div class="row wrap mb"><div class="input-ikon grow">' + ikon('cari', 16) + '<input class="input" id="p-cari" placeholder="Cari soal…"></div><div class="seg" id="p-ftipe">' + [['', 'Semua'], ['PG', 'PG'], ['Esai', 'Esai']].map(t => '<button data-t="' + t[0] + '" class="' + (t[0] === '' ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div>' +
      '<div class="row gap-s mb"><button class="btn xs" id="p-semua" ' + (terkunci ? 'disabled' : '') + '>Pilih semua yang tampil</button><button class="btn xs ghost" id="p-kosong" ' + (terkunci ? 'disabled' : '') + '>Kosongkan</button><a class="btn xs ghost" href="#/g/soal/form" target="_blank">' + ikon('plus', 12) + 'Soal baru</a></div><div id="p-list" style="max-height:420px;overflow:auto"></div></div>' +
      '<div class="col"><div class="card flat"><div class="over">Kuantitas tampil per siswa (diundi acak)</div><div class="grid g2 mt-s">' +
      [['PG', 'nPG'], ['Esai', 'nEsai']].map(t => '<div><div class="small muted">Tampil soal ' + t[0] + ' · bank: <b id="ada-' + t[1] + '">0</b></div><div class="stepper mt-s"><button class="btn icon sm" data-step="' + t[1] + '" data-d="-1" ' + (terkunci ? 'disabled' : '') + '>−</button><input class="input" id="p-' + t[1] + '" type="number" min="0" value="' + v[t[1]] + '" ' + (terkunci ? 'disabled' : '') + '><button class="btn icon sm" data-step="' + t[1] + '" data-d="1" ' + (terkunci ? 'disabled' : '') + '>+</button></div></div>').join('') +
      '</div><div id="p-valid" class="mt"></div></div>' +
      '<div class="card flat"><div class="over">Komposisi nilai akhir</div><div class="row between mt-s"><span class="badge teal" id="lbl-pg"></span><span class="badge sand" id="lbl-es"></span><span class="badge ok">Total 100%</span></div><input type="range" class="range mt-s" id="p-ppg" min="0" max="100" step="5" value="' + v.pPG + '">' +
      '<div class="tiny muted mono mt-s">Nilai Akhir = (Nilai PG × %PG) + (Nilai Esai × %Esai) · skala maks selalu 100</div></div>' +
      '<div class="card flat"><div class="sw-row"><div><b>Acak urutan soal</b><div class="tiny muted">Nomor 1 siswa A ≠ nomor 1 siswa B</div></div><label class="switch"><input type="checkbox" id="p-acak" ' + (v.acakSoal ? 'checked' : '') + '><span></span></label></div>' +
      '<div class="sw-row"><div><b>Acak opsi pilihan (A–E)</b><div class="tiny muted">Kunci tetap benar, posisinya berbeda</div></div><label class="switch"><input type="checkbox" id="p-acakopsi" ' + (v.acakOpsi ? 'checked' : '') + '><span></span></label></div></div></div></div></div>' +
      '<div class="card"><div class="card-h"><h3><span class="badge teal">3</span> Pengamanan ujian &amp; sensor anti-curang</h3><span class="tiny muted">"Ikuti Sistem" memakai Pengaturan → Anti-Curang</span></div><div class="grid g2">' +
      '<div class="inset"><b>' + ikon('pintu', 16) + ' Kode Ruang (TOTP)</b><p class="tiny muted">Siswa memasukkan kode 6 digit dari layar kelas sekali sebelum mulai.</p>' + seg('kodeRuang', ['Ikuti Sistem', 'Wajib', 'Nonaktif'], v.kodeRuang) + '<div class="mt-s">' + sisCap('KODE_RUANG_WAJIB', 1) + '</div></div>' +
      '<div class="inset"><b>' + ikon('layar', 16) + ' Wajib layar penuh</b><p class="tiny muted">Keluar layar penuh dihitung pelanggaran (Android/PC).</p>' + seg('layarPenuh', ['Ikuti Sistem', 'Wajib', 'Nonaktif'], v.layarPenuh) + '<div class="mt-s">' + sisCap('WAJIB_LAYAR_PENUH', 1) + '</div></div>' +
      '<div class="inset"><b>' + ikon('perisai', 16) + ' Deteksi pindah tab &amp; aplikasi</b><p class="tiny muted">Jeda di bawah toleransi tidak dihitung.</p>' + seg('pindahTab', ['Ikuti Sistem', 'Aktif', 'Nonaktif'], v.pindahTab) + '<div class="mt-s"><span class="tiny muted">Sistem: <b>' + (cfg.DETEKSI_PINDAH_TAB === 'Ya' ? 'Aktif' : 'Nonaktif') + '</b></span></div></div>' +
      '<div class="inset"><b>' + ikon('kunci', 16) + ' Batas pelanggaran</b><p class="tiny muted">Pelanggaran ke-N mengunci sesi sampai dibuka guru.</p><div class="row"><label class="check"><input type="checkbox" class="cb" id="p-maks-sis" ' + (v.maksPel === '' ? 'checked' : '') + '> Ikuti sistem (' + (cfg.MAKS_PELANGGARAN || 3) + ')</label><input class="input mono" style="width:90px" type="number" min="1" max="20" id="p-maks" value="' + esc(v.maksPel === '' ? (cfg.MAKS_PELANGGARAN || 3) : v.maksPel) + '"></div></div></div></div>' +
      '<div class="card row wrap between" style="position:sticky;bottom:12px;z-index:5"><span class="small muted" id="p-ringkas"></span><div class="row wrap"><a class="btn ghost" href="#/g/paket">Batal</a><button class="btn sand" id="b-draf">' + ikon('doc', 16) + 'Simpan Draf</button><button class="btn primary" id="b-terbit">' + ikon('kirim', 16) + 'Terbitkan Paket</button></div></div></div>';
    const bySoal = {}; soal.forEach(s => bySoal[s.id] = s);
    const mapelNow = () => $('#p-mapel').value;
    const listSoal = () => soal.filter(s => s.mapel === mapelNow() && (App.isAdmin() || s.pembuat === App.me().id));
    const gambarList = () => {
      const l = listSoal().filter(s => (!fTipe || s.tipe === fTipe) && (!fCari || (s.teks + s.topik).toLowerCase().indexOf(fCari) >= 0));
      $('#p-list').innerHTML = l.length ? '<table class="tbl"><tbody>' + l.map(s => '<tr><td class="w-cb"><input type="checkbox" class="cb" data-s="' + esc(s.id) + '" ' + (pilih.has(s.id) ? 'checked' : '') + ' ' + (terkunci ? 'disabled' : '') + '></td><td><span class="clamp2 small">' + esc(s.teks) + '</span><div class="tiny muted">' + (s.topik ? esc(s.topik) + ' · ' : '') + 'bobot ' + s.bobot + '</div></td><td>' + UI.status(s.tipe) + '</td></tr>').join('') + '</tbody></table>'
        : UI.kosong({ ikon: 'book', judul: 'Tidak ada soal', teks: 'Soal milik Anda untuk mapel ini akan tampil di sini.' });
      $$('[data-s]').forEach(c => c.onchange = () => { c.checked ? pilih.add(c.dataset.s) : pilih.delete(c.dataset.s); hitung(); });
      return l;
    };
    const hitung = () => {
      Array.from(pilih).forEach(id => { if (!bySoal[id] || bySoal[id].mapel !== mapelNow()) pilih.delete(id); });
      const pg = Array.from(pilih).filter(id => bySoal[id].tipe === 'PG').length, es = pilih.size - pg;
      $('#ada-nPG').textContent = pg; $('#ada-nEsai').textContent = es;
      $('#p-terpilih').textContent = 'Terpilih di kumpulan: ' + pilih.size + ' soal (' + pg + ' PG, ' + es + ' Esai)';
      const nPG = Number($('#p-nPG').value) || 0, nEs = Number($('#p-nEsai').value) || 0;
      const salahPG = nPG > pg, salahEs = nEs > es, kosong = nPG + nEs === 0;
      $('#p-nPG').classList.toggle('err', salahPG); $('#p-nEsai').classList.toggle('err', salahEs);
      $('#p-valid').innerHTML = salahPG || salahEs ? '<div class="alert bad">' + ikon('xb') + '<div class="grow"><b>Jumlah tampil melebihi soal tersedia</b><p>Tersedia ' + pg + ' PG, ' + es + ' esai. Tampil ' + nPG + ' PG, ' + nEs + ' esai. Tombol simpan dikunci.</p></div></div>'
        : kosong ? '<div class="alert warn">' + ikon('info') + '<div class="grow">Isi jumlah soal yang tampil per siswa.</div></div>'
          : '<div class="alert ok">' + ikon('cekb') + '<div class="grow"><b>Valid</b><p>Tersedia ' + pg + ' PG, ' + es + ' esai. Tampil ' + nPG + ' PG, ' + nEs + ' esai per siswa (diundi acak).</p></div></div>';
      const ppg = !nEs ? 100 : !nPG ? 0 : Number($('#p-ppg').value);
      $('#p-ppg').disabled = !nEs || !nPG; $('#p-ppg').value = ppg;
      $('#lbl-pg').textContent = 'Bobot PG: ' + ppg + '%'; $('#lbl-es').textContent = 'Bobot Esai: ' + (100 - ppg) + '%';
      $('#b-draf').disabled = $('#b-terbit').disabled = salahPG || salahEs;
      $('#p-ringkas').innerHTML = ikon('cekb', 14) + ' ' + nPG + ' PG + ' + nEs + ' esai · ' + ($('#p-durasi').value || 0) + ' menit';
    };
    $('#p-mapel').onchange = () => { gambarList(); hitung(); };
    $('#p-cari').oninput = UI.debounce(e => { fCari = e.target.value.toLowerCase(); gambarList(); }, 150);
    $$('#p-ftipe button').forEach(b => b.onclick = () => { fTipe = b.dataset.t; $$('#p-ftipe button').forEach(x => x.classList.toggle('on', x === b)); gambarList(); });
    $('#p-semua').onclick = () => { gambarList().forEach(s => pilih.add(s.id)); gambarList(); hitung(); };
    $('#p-kosong').onclick = () => { pilih.clear(); gambarList(); hitung(); };
    $$('[data-step]').forEach(b => b.onclick = () => { const i = $('#p-' + b.dataset.step); i.value = Math.max(0, (Number(i.value) || 0) + Number(b.dataset.d)); hitung(); });
    ['#p-nPG', '#p-nEsai', '#p-ppg', '#p-durasi'].forEach(s => $(s).oninput = hitung);
    $$('[data-seg]').forEach(sg => $$('button', sg).forEach(b => b.onclick = () => { $$('button', sg).forEach(x => x.classList.toggle('on', x === b)); }));
    const maksSis = () => { $('#p-maks').disabled = $('#p-maks-sis').checked; }; $('#p-maks-sis').onchange = maksSis; maksSis();
    gambarList(); hitung();
    const simpan = async (status, btn) => {
      const nama = $('#p-nama').value.trim(); if (!nama) return UI.tandaiSalah($('#p-nama'), 'Nama ujian wajib diisi.');
      const segV = k => { const b = $('[data-seg="' + k + '"] button.on'); return b ? b.dataset.v : 'Ikuti Sistem'; };
      const nPG = Number($('#p-nPG').value) || 0, nEs = Number($('#p-nEsai').value) || 0, ppg = Number($('#p-ppg').value);
      const o = { id: p ? p.id : '', nama, mapel: mapelNow(), soal: Array.from(pilih), nPG, nEsai: nEs, pPG: ppg, pEsai: 100 - ppg, acakSoal: $('#p-acak').checked, acakOpsi: $('#p-acakopsi').checked,
        kodeRuang: segV('kodeRuang'), layarPenuh: segV('layarPenuh'), pindahTab: segV('pindahTab'), maksPel: $('#p-maks-sis').checked ? '' : $('#p-maks').value,
        durasi: $('#p-durasi').value, buka: F.iso($('#p-buka').value), tutup: F.iso($('#p-tutup').value), status, kelas: p ? p.kelas : [] };
      if (terkunci) { o.soal = p.soal; o.nPG = p.nPG; o.nEsai = p.nEsai; o.mapel = p.mapel; }
      await UI.sibuk(btn, async () => {
        const d = await UI.kirim('paket.simpan', o);
        API.swr('paket.list', {}, () => { }, { force: true, diam: true }).catch(() => { }); App.muatRef(true);
        if (status === 'Terbit' && !p) { if (await UI.konfirmasi('Paket diterbitkan. Buat token untuk kelas sekarang?', { tombol: 'Buat token', ikon: 'key' })) return App.pergi('g/token', { paket: d.id, buat: 1 }); }
        App.pergi('g/paket');
      });
    };
    $('#b-draf').onclick = e => simpan('Draf', e.currentTarget);
    $('#b-terbit').onclick = e => simpan('Terbit', e.currentTarget);
  }).catch(e => { el.innerHTML = UI.galat(e, 'App.rute()'); });
} });

/* =====================================================================
 *  TOKEN SISWA (+ cetak kartu A4 2×3)
 * ===================================================================== */
App.daftar('g/token', { judul: 'Token Siswa', crumb: 'Penerbitan token & presensi', filterMapel: true, render(el, q) {
  let paket = App.paketAwal(q), kelas = q.kelas || '', status = '', tabel;
  el.innerHTML = Hal.header({ over: 'Modul operasional CBT', judul: 'Manajemen Token Siswa', sub: 'Terbitkan token sekali pakai per paket, cetak kartu login, dan kelola status token.',
    aksi: Hal.segarkan() + '<button class="btn primary" id="b-buat">' + ikon('plus', 16) + 'Buat Token Massal</button><button class="btn" id="b-cetak">' + ikon('print', 16) + 'Cetak Kartu (A4)</button><button class="btn" id="b-pdf">' + ikon('doc', 16) + 'Daftar Token (PDF)</button>' }) +
    '<div class="card"><div class="row wrap mb"><select class="select" id="f-paket" style="max-width:340px">' + App.opsiPaket(paket, 'Semua paket') + '</select><select class="select" id="f-kelas" style="max-width:180px"><option value="">Semua kelas</option>' + App.kelasRef().map(k => '<option' + (k === kelas ? ' selected' : '') + '>' + esc(k) + '</option>').join('') + '</select>' +
    '<select class="select" id="f-status" style="max-width:180px"><option value="">Semua status</option>' + ['Aktif', 'Terpakai', 'Nonaktif', 'Diblokir', 'Hangus'].map(s => '<option>' + s + '</option>').join('') + '</select>' +
    '<div class="input-ikon grow" style="min-width:200px">' + ikon('cari', 16) + '<input class="input" id="cari" placeholder="Cari nama / NIS / PIN…"></div></div><div id="tbl"></div></div>';
  tabel = Tabel($('#tbl', el), {
    pilih: true, per: 20, satuan: 'token', judulKosong: 'Belum ada token', teksKosong: 'Klik "Buat Token Massal" untuk menerbitkan token per kelas.',
    bulk: '<button class="btn xs" data-b="aktifkan">' + ikon('buka', 13) + 'Aktifkan (susulan)</button><button class="btn xs" data-b="nonaktifkan">Nonaktifkan</button><button class="btn xs" data-b="reset">' + ikon('hp', 13) + 'Reset perangkat</button><button class="btn xs" data-b="cetak">' + ikon('print', 13) + 'Cetak</button><button class="btn xs danger" data-b="hapus">' + ikon('trash', 13) + 'Hapus</button>',
    cari: r => r.nama + ' ' + r.nis + ' ' + r.pin, filter: r => (!kelas || r.kelas === kelas) && (!status || r.status === status) && (!App.mapel || (App.paketRef().find(p => p.id === r.paket) || {}).mapel === App.mapel),
    kolom: [
      { k: 'nama', label: 'Nama siswa', render: r => '<b>' + esc(r.nama) + '</b><div class="tiny muted mono">' + esc(r.nis) + '</div>' },
      { k: 'kelas', label: 'Kelas' },
      { k: 'pin', label: 'Token PIN', render: r => '<button class="badge mono tl" style="font-size:14px;letter-spacing:.12em;border:0;cursor:pointer" data-salin="' + esc(r.pin) + '" title="Salin">' + esc(r.pin) + '</button>' },
      { k: 'paketNama', label: 'Paket', render: r => '<span class="small">' + esc(r.paketNama) + '</span>' },
      { k: 'berlaku', label: 'Masa berlaku', render: r => '<span class="small mono ' + (new Date(r.berlaku) < Date.now() && r.status === 'Aktif' ? '" style="color:var(--bad)' : '') + '">' + F.tgl(r.berlaku) + ' ' + F.jam(r.berlaku) + '</span>' },
      { k: 'status', label: 'Status', render: r => UI.status(r.status) + (r.alasan ? '<div class="tiny muted" title="' + esc(r.alasan) + '">' + esc(r.alasan.slice(0, 28)) + '</div>' : '') },
      { k: 'hadir', label: 'Kehadiran', render: r => UI.status(r.hadir) },
      { k: 'perangkat', label: 'Perangkat', render: r => r.perangkat ? '<span class="badge ok">' + ikon('hp', 12) + 'Terikat</span>' : '<span class="tiny muted">—</span>' }
    ],
    setelah(t) {
      $$('[data-salin]', t).forEach(b => b.onclick = () => UI.salin(b.dataset.salin));
      $$('[data-b]', t).forEach(b => b.onclick = () => aksiBanyak(b.dataset.b, tabel.dipilih()));
    }
  });
  async function aksiBanyak(aksi, ids) {
    if (!ids.length) return;
    if (aksi === 'cetak') return Cetak.kartu(tabel.data.filter(r => ids.indexOf(r.id) >= 0));
    let alasan = '', berlaku = '';
    if (aksi === 'aktifkan') {
      const r = await UI.tanya({ judul: 'Aktifkan ulang token (susulan)', sub: ids.length + ' token', label: 'Alasan', wajib: true, min: 3, textarea: true, placeholder: 'mis. Ujian susulan karena sakit',
        tambahan: '<div class="field mt"><label>Masa berlaku baru (opsional)</label><input class="input mono" type="datetime-local" id="tanya-b"></div><p class="tiny muted mt-s">Kosongkan untuk mengikuti waktu tutup paket. Isi bila susulan dilakukan setelah paket ditutup.</p>',
        ambil: (m, v) => JSON.stringify({ v, b: $('#tanya-b', m).value }) });
      if (!r) return; const o = JSON.parse(r); alasan = o.v; berlaku = F.iso(o.b);
    } else if (!(await UI.konfirmasi({ nonaktifkan: 'Nonaktifkan ', reset: 'Reset perangkat untuk ', hapus: 'Hapus ' }[aksi] + ids.length + ' token?', { bahaya: aksi === 'hapus', tombol: 'Lanjutkan' }))) return;
    try { await UI.kirim('token.aksi', { ids, aksi, alasan, berlaku }); tabel.bersihPilih(); muat(true); } catch (e) { UI.toast(e.message, 'bad'); }
  }
  const muat = paksa => API.swr('token.list', { paket }, d => tabel.set(d), { maxAge: paksa ? 0 : 20000, force: paksa }).catch(e => { $('#tbl').innerHTML = UI.galat(e); });
  $('#f-paket').onchange = e => { paket = e.target.value; App.pergi('g/token', { paket }); };
  $('#f-kelas').onchange = e => { kelas = e.target.value; tabel.render(); };
  $('#f-status').onchange = e => { status = e.target.value; tabel.render(); };
  $('#cari').oninput = UI.debounce(e => tabel.cari(e.target.value), 150);
  Hal.pasangSegar(el, () => API.swr('token.list', { paket }, d => tabel.set(d), { force: true, fresh: true }));
  $('#b-cetak').onclick = () => { const d = tabel.tersaring(); if (!d.length) return UI.toast('Tidak ada token untuk dicetak.', 'warn'); Cetak.kartu(d); };
  $('#b-pdf').onclick = e => { if (!paket) return UI.toast('Pilih satu paket lebih dulu.', 'warn'); UI.sibuk(e.currentTarget, () => Hal.unduhDok('DAFTAR_TOKEN', paket, 'pdf', kelas)); };
  const buat = () => {
    const ps = App.paketRef().filter(p => p.status !== 'Selesai');
    UI.modal({ judul: 'Buat token massal', sub: 'Satu token unik per siswa per paket', ikon: 'key', ukuran: 'lg',
      isi: '<div class="col"><div class="field"><label>Paket ujian</label><select class="select" id="m-paket">' + ps.map(p => '<option value="' + esc(p.id) + '"' + (p.id === paket ? ' selected' : '') + '>' + esc(p.nama) + ' · ' + esc(p.status) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Kelas</label><div class="row wrap" id="m-kelas">' + App.kelasRef().map(k => '<label class="chip check"><input type="checkbox" class="cb" value="' + esc(k) + '"> ' + esc(k) + '</label>').join('') + '</div>' + (App.kelasRef().length ? '' : '<p class="small muted">Belum ada data siswa. Tambahkan di menu Siswa &amp; Kelas.</p>') + '</div>' +
        '<div class="field"><label>Masa berlaku (opsional)</label><input class="input mono" type="datetime-local" id="m-berlaku"><div class="help">Kosongkan agar mengikuti waktu tutup paket.</div></div>' +
        '<div class="alert soft">' + ikon('info') + '<div class="grow">Siswa yang sudah memiliki token untuk paket ini dilewati, jadi aman dijalankan ulang.</div></div></div>',
      aksi: [{ label: 'Batal' }, { label: 'Buat Token', kelas: 'primary', klik: async (t, m) => {
        const kel = $$('#m-kelas input:checked', m).map(i => i.value);
        if (!kel.length) { UI.toast('Pilih minimal satu kelas.', 'warn'); return false; }
        const pk = $('#m-paket', m).value;
        await UI.kirim('token.buat', { paket: pk, kelas: kel, berlaku: F.iso($('#m-berlaku', m).value) });
        paket = pk; App.muatRef(true);
        if (pk !== App.parse().q.paket) App.pergi('g/token', { paket: pk }); else muat(true);
      } }] });
  };
  $('#b-buat').onclick = buat;
  if (!API.ambilCache('token.list', { paket })) $('#tbl').innerHTML = UI.sk(8);
  muat(false);
  if (q.buat) setTimeout(buat, 300);
} });

const Cetak = {
  kartu(list) {
    const P = App.pub, logo = App.logoUrl ? '<img src="' + App.logoUrl + '">' : '<div class="lg">' + esc(F.inisial(P.NAMA_APP)) + '</div>';
    const ps = {}; App.paketRef().forEach(p => ps[p.id] = p);
    let h = '';
    for (let i = 0; i < list.length; i += 6) {
      h += '<div class="print-page">' + list.slice(i, i + 6).map((t, j) => {
        const p = ps[t.paket] || { buka: t.buka, tutup: t.tutup, durasi: t.durasi };
        return '<div class="kartu"><div class="kp">' + logo + '<div><b>KARTU LOGIN UJIAN CBT</b><span>' + esc(P.NAMA_LEMBAGA || '') + ' · TA ' + esc(P.TAHUN_AJARAN || '') + '</span></div><span style="margin-left:auto;font-size:7pt">Siswa #' + String(i + j + 1).padStart(2, '0') + '</span></div>' +
          '<div class="nm">' + esc(t.nama) + '</div><div class="dt">NIS: ' + esc(t.nis) + ' · Kelas: ' + esc(t.kelas) + '<br>' + esc(t.mapel) + ' — ' + esc(t.paketNama) + '<br>Jadwal: ' + esc(F.tglP(p.buka)) + ', ' + F.jam(p.buka) + ' – ' + F.jam(p.tutup) + ' WIB</div>' +
          '<div class="pin"><span>Token PIN</span><b>' + esc(t.pin) + '</b></div><div class="ft">Masuk di ' + esc(location.origin + location.pathname) + ' · Token hanya untuk 1 sesi & 1 perangkat.</div></div>';
      }).join('') + '</div>';
    }
    $('#cetak').innerHTML = h;
    setTimeout(() => window.print(), 150);
  }
};

/* =====================================================================
 *  KEHADIRAN & PEMBLOKIRAN
 * ===================================================================== */
App.daftar('g/kehadiran', { judul: 'Kehadiran', crumb: 'Presensi & pemblokiran token', filterMapel: true, render(el, q) {
  let paket = App.paketAwal(q), kelas = q.kelas || '', tabel;
  el.innerHTML = Hal.header({ over: 'Kebijakan presensi', judul: 'Kehadiran Siswa &amp; Pemblokiran Token Otomatis',
    aksi: Hal.segarkan() + '<button class="btn" id="b-pdf">' + ikon('doc', 16) + 'Daftar Hadir (PDF)</button><button class="btn" id="b-csv">' + ikon('unduh', 16) + 'Daftar Tidak Hadir</button>' }) +
    '<div class="row wrap mb"><select class="select" id="f-paket" style="max-width:340px">' + App.opsiPaket(paket) + '</select><select class="select" id="f-kelas" style="max-width:180px"><option value="">Semua kelas</option>' + App.kelasRef().map(k => '<option' + (k === kelas ? ' selected' : '') + '>' + esc(k) + '</option>').join('') + '</select></div>' +
    '<div class="grid g6 mb" id="ringkas"></div><div class="alert mb">' + ikon('info') + '<div class="grow"><b>Sistem pemblokiran token terintegrasi</b><p>Siswa yang ditandai Tidak Hadir, Izin, atau Sakit otomatis diblokir. Token yang belum terpakai otomatis hangus setelah waktu tutup. Gunakan "Aktifkan Ulang" untuk ujian susulan.</p></div></div>' +
    '<div class="card"><div class="input-ikon mb">' + ikon('cari', 16) + '<input class="input" id="cari" placeholder="Cari nama / NIS…"></div><div id="tbl"></div></div>';
  if (!paket) { $('#tbl').innerHTML = UI.kosong({ ikon: 'paket', judul: 'Belum ada paket', teks: 'Buat paket ujian dan token lebih dulu.' }); return; }
  const set = async (ids, st) => {
    try { await UI.kirim('hadir.set', { ids, status: st }); muat(true); } catch (e) { UI.toast(e.message, 'bad'); }
  };
  tabel = Tabel($('#tbl', el), {
    pilih: true, per: 25, satuan: 'siswa', judulKosong: 'Belum ada token untuk paket ini',
    bulk: ['Hadir', 'Tidak Hadir', 'Izin', 'Sakit'].map(s => '<button class="btn xs" data-st="' + s + '">' + s + '</button>').join(''),
    cari: r => r.nama + ' ' + r.nis, filter: r => !kelas || r.kelas === kelas,
    kolom: [
      { k: 'nama', label: 'Nama siswa', render: r => '<b>' + esc(r.nama) + '</b><div class="tiny muted mono">NIS ' + esc(r.nis) + '</div>' },
      { k: 'kelas', label: 'Kelas' },
      { k: 'hadir', label: 'Status presensi', render: r => r.sesi ? UI.status('Hadir') : '<select class="select" data-hadir="' + esc(r.id) + '" style="min-height:32px;padding:4px 30px 4px 10px;width:auto">' + ['Belum Dicatat', 'Hadir', 'Tidak Hadir', 'Izin', 'Sakit'].map(s => '<option' + (s === r.hadir ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>' },
      { k: 'status', label: 'Status token', render: r => UI.status(r.status) + (r.status === 'Diblokir' ? '<div class="tiny muted">' + esc(r.alasan || '') + '</div>' : '') },
      { k: 'sesiStatus', label: 'Sesi ujian', render: r => r.sesiStatus ? UI.status(r.sesiStatus) : '<span class="tiny muted">—</span>' },
      { k: 'login', label: 'Waktu login', render: r => r.login ? '<span class="mono small">' + F.jam(r.login) + '</span>' : '<span class="tiny muted">(belum)</span>' },
      { k: '_a', label: '', urut: false, render: r => '<div class="aksi">' + (r.status === 'Aktif' && !r.sesi ? '<button class="btn xs ghost bad" data-tth="' + esc(r.id) + '">Tandai Tidak Hadir</button>' : '') +
        ((r.status === 'Diblokir' || r.status === 'Hangus' || r.status === 'Nonaktif') && !r.sesi ? '<button class="btn xs primary" data-aktif="' + esc(r.id) + '">' + ikon('buka', 13) + 'Aktifkan Ulang (Susulan)</button>' : '') + '</div>' }
    ],
    setelah(t) {
      $$('[data-hadir]', t).forEach(s => s.onchange = () => set([s.dataset.hadir], s.value));
      $$('[data-tth]', t).forEach(b => b.onclick = () => UI.sibuk(b, () => set([b.dataset.tth], 'Tidak Hadir')));
      $$('[data-st]', t).forEach(b => b.onclick = () => set(tabel.dipilih(), b.dataset.st).then(() => tabel.bersihPilih()));
      $$('[data-aktif]', t).forEach(b => b.onclick = async () => {
        const r = await UI.tanya({ judul: 'Aktifkan ulang token (susulan)', label: 'Alasan', wajib: true, min: 3, textarea: true, placeholder: 'mis. Susulan — surat dokter terlampir',
          tambahan: '<div class="field mt"><label>Masa berlaku baru (opsional)</label><input class="input mono" type="datetime-local" id="tanya-b"></div>', ambil: (m, v) => JSON.stringify({ v, b: $('#tanya-b', m).value }) });
        if (!r) return; const o = JSON.parse(r);
        try { await UI.kirim('token.aksi', { ids: [b.dataset.aktif], aksi: 'aktifkan', alasan: o.v, berlaku: F.iso(o.b) }); muat(true); } catch (e) { UI.toast(e.message, 'bad'); }
      });
    }
  });
  const gambar = d => {
    const vis = d.filter(r => !kelas || r.kelas === kelas), n = s => vis.filter(r => (r.sesi ? 'Hadir' : r.hadir) === s).length;
    $('#ringkas').innerHTML = [['Hadir', n('Hadir'), 'ok', 'hadir'], ['Tidak Hadir', n('Tidak Hadir'), 'bad', 'xb'], ['Izin', n('Izin'), 'sand', 'doc'], ['Sakit', n('Sakit'), 'warn', 'info'], ['Belum Dicatat', n('Belum Dicatat'), '', 'jam'], ['Total', vis.length, 'tl', 'users']]
      .map(x => '<div class="card pad-s"><div class="row between"><span class="over">' + x[0] + '</span><span class="badge ' + x[2] + '">' + ikon(x[3], 12) + '</span></div><div class="mono bold" style="font-size:22px">' + x[1] + '</div></div>').join('');
    tabel.set(d);
  };
  const muat = paksa => API.swr('hadir.list', { paket }, gambar, { maxAge: paksa ? 0 : 15000, force: paksa }).catch(e => { $('#tbl').innerHTML = UI.galat(e); });
  $('#f-paket').onchange = e => App.pergi('g/kehadiran', { paket: e.target.value });
  $('#f-kelas').onchange = e => { kelas = e.target.value; const d = API.ambilCache('hadir.list', { paket }); if (d) gambar(d); };
  $('#cari').oninput = UI.debounce(e => tabel.cari(e.target.value), 150);
  Hal.pasangSegar(el, () => API.swr('hadir.list', { paket }, gambar, { force: true, fresh: true }));
  $('#b-pdf').onclick = e => UI.sibuk(e.currentTarget, () => Hal.unduhDok('DAFTAR_HADIR', paket, 'pdf', kelas));
  $('#b-csv').onclick = () => { const d = (API.ambilCache('hadir.list', { paket }) || []).filter(r => ['Tidak Hadir', 'Izin', 'Sakit'].indexOf(r.hadir) >= 0 && (!kelas || r.kelas === kelas)); UI.unduhCSV([['NIS', 'Nama', 'Kelas', 'Kehadiran', 'Status Token', 'Keterangan']].concat(d.map(r => [r.nis, r.nama, r.kelas, r.hadir, r.status, r.alasan])), 'tidak-hadir.csv'); };
  if (!API.ambilCache('hadir.list', { paket })) $('#tbl').innerHTML = UI.sk(8);
  muat(false);
} });

/* =====================================================================
 *  MONITORING LIVE (polling adaptif 5–20 dtk)
 * ===================================================================== */
App.daftar('g/monitor', { judul: 'Monitoring', crumb: 'Integritas pengerjaan & deteksi pelanggaran', filterMapel: true, render(el, q) {
  const paket = App.paketAwal(q);
  let data = null, terakhir = 0, aktivitas = Date.now(), sibuk = false, tabel, fStatus = '';
  el.innerHTML = Hal.header({ over: '<span class="badge solid-bad"><i class="dot pulse"></i>LIVE MONITORING</span> <span id="live-t" class="mono small muted"></span>', judul: 'Integritas Pengerjaan &amp; Deteksi Pelanggaran',
    aksi: '<select class="select" id="f-paket" style="max-width:320px">' + App.opsiPaket(paket) + '</select><a class="btn" href="#/g/koderuang?paket=' + esc(paket) + '">' + ikon('pintu', 16) + 'Kode Ruang</a>' }) +
    '<div class="row wrap mb" id="ringkas"></div><div class="card"><div class="row wrap mb"><div class="input-ikon grow" style="min-width:200px">' + ikon('cari', 16) + '<input class="input" id="cari" placeholder="Cari siswa…"></div><div class="seg" id="seg"></div></div><div id="tbl"></div></div>';
  if (!paket) { $('#tbl').innerHTML = UI.kosong({ ikon: 'live', judul: 'Belum ada paket ujian' }); return; }
  tabel = Tabel($('#tbl', el), {
    per: 50, satuan: 'siswa', id: r => r.token, cari: r => r.nama + ' ' + r.nis + ' ' + r.kelas, filter: r => !fStatus || r.status === fStatus || (fStatus === 'Selesai' && ['Selesai', 'Menunggu Koreksi', 'Dihentikan'].indexOf(r.status) >= 0),
    kelasBaris: r => r.status === 'Terkunci' ? 'alert' : '', sort: '_urut',
    kolom: [
      { k: '_urut', label: 'Nama siswa', nilai: r => (r.status === 'Terkunci' ? 0 : r.status === 'Berjalan' ? 1 : 2) + r.nama, render: r => '<b' + (r.status === 'Terkunci' ? ' style="color:var(--bad)"' : '') + '>' + esc(r.nama) + '</b><div class="tiny muted mono">' + esc(r.nis) + ' · ' + esc(r.kelas) + '</div>' },
      { k: 'status', label: 'Status sesi', render: r => UI.status(r.status === 'Berjalan' ? 'Mengerjakan' : r.status) },
      { k: 'terjawab', label: 'Progres', render: r => { const p = r.jumlah ? Math.round(r.terjawab / r.jumlah * 100) : 0; return '<div style="min-width:130px"><div class="row between tiny"><span class="mono">' + r.terjawab + '/' + r.jumlah + ' soal</span><span class="mono">' + p + '%</span></div><div class="bar ' + (r.status === 'Terkunci' ? 'bad' : '') + '"><i style="width:' + p + '%"></i></div></div>'; } },
      { k: 'sisa', label: 'Sisa waktu', render: r => r.sisa === null ? (r.nilai !== null ? '<span class="small">Nilai <b class="mono">' + F.n(r.nilai) + '</b></span>' : '<span class="tiny muted">—</span>') : '<span class="mono bold" data-sisa="' + (Date.now() + r.sisa * 1000) + '" style="font-size:15px;color:' + (r.sisa < 300 ? 'var(--bad)' : 'var(--text)') + '">' + F.durasi(r.sisa) + '</span>' + (r.status === 'Terkunci' ? '<div class="tiny muted">Timer tetap berjalan</div>' : '') },
      { k: 'online', label: 'Koneksi', render: r => r.sisa === null ? '<span class="tiny muted">—</span>' : (r.online ? '<span class="badge ok"><i class="dot"></i>Online</span>' : '<span class="badge warn">' + ikon('wifioff', 12) + 'Offline</span>') + '<div class="tiny muted">' + (r.terakhir ? F.relatif(r.terakhir) : '') + '</div>' },
      { k: 'nPel', label: 'Log pelanggaran', render: r => r.nPel ? '<span class="badge ' + (r.status === 'Terkunci' ? 'solid-bad' : 'warn') + '">' + ikon('segitiga', 12) + r.nPel + '/' + r.maks + '</span>' : (r.sesi ? '<span class="badge ok">' + ikon('perisai', 12) + '0 · Tertib</span>' : '<span class="tiny muted">—</span>') },
      { k: '_a', label: 'Aksi pengawas', urut: false, render: r => r.sesi ? '<div class="aksi">' + (r.status === 'Terkunci' ? '<button class="btn primary xs" data-buka="' + esc(r.sesi) + '">' + ikon('buka', 13) + 'Buka Kunci</button>' : '') +
        '<button class="btn xs" data-detail="' + esc(r.sesi) + '">Detail</button>' + (['Berjalan', 'Terkunci'].indexOf(r.status) >= 0 ? '<button class="btn icon sm ghost" data-lain="' + esc(r.sesi) + '" aria-label="Aksi lain" title="Aksi lain">' + ikon('gear', 15) + '</button>' : '') + '</div>'
        : (r.status === 'Belum Mulai' ? '<span class="tiny muted">Belum login</span>' : '') }
    ],
    setelah(t) {
      $$('[data-detail]', t).forEach(b => b.onclick = () => Monitor.detail(b.dataset.detail, tarik));
      $$('[data-buka]', t).forEach(b => b.onclick = () => Monitor.buka(b.dataset.buka, tarik));
      $$('[data-lain]', t).forEach(b => b.onclick = () => Monitor.lain(b.dataset.lain, tarik));
    }
  });
  const gambar = d => {
    data = d; terakhir = Date.now();
    const r = d.ringkas;
    $('#ringkas').innerHTML = [['Belum Mulai', r.belum, ''], ['Mengerjakan', r.mengerjakan, 'ok'], ['Selesai', r.selesai, 'tl'], ['Tidak Hadir', r.tidakHadir, 'bad'], ['Terkunci', r.terkunci, 'solid-bad'], ['Online', r.online + '/' + r.mengerjakan, 'ok']]
      .map(x => '<span class="chip">' + x[0] + ': <span class="mono ' + '">' + x[1] + '</span></span>').join('') + (d.paket.statusWaktu !== 'Berjalan' ? '<span class="badge sand">Paket ' + esc(d.paket.statusWaktu) + '</span>' : '');
    $('#seg').innerHTML = [['', 'Semua'], ['Berjalan', 'Mengerjakan'], ['Terkunci', 'Terkunci'], ['Belum Mulai', 'Belum'], ['Selesai', 'Selesai']].map(t => '<button data-f="' + t[0] + '" class="' + (t[0] === fStatus ? 'on' : '') + '">' + t[1] + '</button>').join('');
    $$('#seg button').forEach(b => b.onclick = () => { fStatus = b.dataset.f; gambar(data); });
    tabel.set(d.rows);
  };
  async function tarik() {
    if (sibuk) return; sibuk = true;
    try { const j = await API.call('monitor.list', { paket }); if (j.success) { API.setCache('monitor.list', { paket }, j.data); gambar(j.data); } } catch (e) { } finally { sibuk = false; }
  }
  const c = API.ambilCache('monitor.list', { paket }); if (c) gambar(c); else $('#tbl').innerHTML = UI.sk(8);
  tarik();
  const poll = ((App.ref && App.ref.cfg && App.ref.cfg.POLLING_DETIK) || 5) * 1000;
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => { const f = () => aktivitas = Date.now(); window.addEventListener(ev, f, { passive: true }); App.saatPergi(() => window.removeEventListener(ev, f)); });
  App.interval(() => {
    const lt = $('#live-t'); if (lt) lt.textContent = terakhir ? '· diperbarui ' + Math.round((Date.now() - terakhir) / 1000) + ' dtk lalu' : '';
    $$('[data-sisa]').forEach(s => { const sisa = (Number(s.dataset.sisa) - Date.now()) / 1000; s.textContent = F.durasi(sisa); });
    if (document.visibilityState !== 'visible' || $('.ovl')) return;
    const jeda = Date.now() - aktivitas > 120000 ? 20000 : poll;
    if (Date.now() - terakhir >= jeda - 400) tarik();
  }, 1000);
  $('#f-paket').onchange = e => App.pergi('g/monitor', { paket: e.target.value });
  $('#cari').oninput = UI.debounce(e => tabel.cari(e.target.value), 150);
} });

const Monitor = {
  async buka(sesi, ulang) {
    const a = await UI.tanya({ judul: 'Buka kunci sesi', sub: 'Alasan wajib dicatat di log audit', ikon: 'buka', label: 'Alasan pembukaan kunci', wajib: true, min: 5, textarea: true,
      placeholder: 'mis. Siswa terkena pop-up update antivirus, layar sudah diverifikasi.', pesanWajib: 'Alasan minimal 5 karakter.', tombol: 'Konfirmasi & Buka Kunci' });
    if (!a) return;
    try { await UI.kirim('sesi.aksi', { sesi, aksi: 'buka', alasan: a }); ulang && ulang(); } catch (e) { UI.toast(e.message, 'bad'); }
  },
  async lain(sesi, ulang) {
    UI.modal({ judul: 'Aksi sesi', ikon: 'gear', ukuran: 'sm', isi: '<div class="col"><button class="btn block" data-x2="waktu">' + ikon('jam', 16) + 'Tambah waktu</button><button class="btn block" data-x2="reset">' + ikon('hp', 16) + 'Reset perangkat (izinkan pindah perangkat)</button><button class="btn block danger" data-x2="hentikan">' + ikon('xb', 16) + 'Hentikan sesi &amp; nilai sekarang</button></div>',
      aksi: [{ label: 'Tutup' }] });
    $$('[data-x2]').forEach(b => b.onclick = async () => {
      const aksi = b.dataset.x2; b.closest('.ovl').remove();
      let data = { sesi, aksi };
      if (aksi === 'waktu') { const m = await UI.tanya({ judul: 'Tambah waktu', label: 'Menit tambahan', tipe: 'number', nilai: '10', wajib: true }); if (!m) return; data.menit = Number(m); }
      if (aksi === 'hentikan') { const a = await UI.tanya({ judul: 'Hentikan sesi', sub: 'Jawaban saat ini langsung dinilai', ikon: 'segitiga', ikonKelas: 'bad', label: 'Alasan', wajib: true, min: 5, textarea: true, bahaya: true, tombol: 'Hentikan' }); if (!a) return; data.alasan = a; }
      if (aksi === 'reset' && !(await UI.konfirmasi('Izinkan siswa masuk dari perangkat lain? Perangkat lama tetap dapat dipakai.', { tombol: 'Reset' }))) return;
      try { await UI.kirim('sesi.aksi', data); ulang && ulang(); } catch (e) { UI.toast(e.message, 'bad'); }
    });
  },
  async detail(sesi, ulang) {
    const m = UI.modal({ judul: 'Detail telemetri & pelanggaran', ikon: 'perisai', ukuran: 'lg', isi: UI.sk(5), aksi: [{ label: 'Tutup' }] });
    try {
      const j = await API.call('sesi.pelanggaran', { sesi }); if (!j.success) throw new Error(j.message);
      const d = j.data, s = d.sesi;
      $('.modal-b', m.el).innerHTML = '<div class="row wrap between mb"><div class="row">' + UI.avatar(d.siswa.nama) + '<div><b style="font-size:16px">' + esc(d.siswa.nama) + '</b><div class="small muted mono">NIS ' + esc(d.siswa.nis) + ' · ' + esc(d.siswa.kelas) + ' · ' + esc(s.paket) + '</div></div></div>' +
        '<div class="row">' + UI.status(s.status) + '<span class="badge ' + (s.status === 'Terkunci' ? 'solid-bad' : 'warn') + '">' + s.nPel + ' dari ' + s.maks + '</span></div></div>' +
        '<div class="over mb">Kronologi deteksi sensor</div>' + (d.log.length ? '<div class="timeline">' + d.log.map((l, i) => '<div class="tl-it ' + (l.aksi === 'Terkunci' ? 'bad' : l.aksi === 'Dibuka' ? 'ok' : '') + '"><span class="n">' + (i + 1) + '</span><div class="card flat"><div class="row wrap between"><div class="row gap-s"><b class="mono small">' + F.jam(l.waktu) + ':' + String(new Date(l.waktu).getSeconds()).padStart(2, '0') + '</b>' + UI.badge(l.jenis, l.aksi === 'Terkunci' ? 'solid-bad' : l.aksi === 'Dibuka' ? 'ok' : 'sand') +
          (l.durasi ? UI.badge('Durasi ' + F.n(l.durasi) + ' dtk', 'warn') : '') + '</div><span class="small muted">' + esc(l.aksi) + (l.nomor ? ' · ' + l.nomor + '/' + s.maks : '') + '</span></div>' + (l.oleh ? '<p class="small mt-s" style="margin-bottom:0">Oleh <b>' + esc(l.oleh) + '</b>: ' + esc(l.alasan) + '</p>' : '') + '</div></div>').join('') + '</div>'
          : '<div class="alert ok">' + ikon('perisai') + '<div class="grow">Tidak ada pelanggaran tercatat.</div></div>');
      const f = $('.modal-f', m.el);
      if (s.status === 'Terkunci') f.insertAdjacentHTML('afterbegin', '<button class="btn primary" id="d-buka">' + ikon('buka', 16) + 'Buka Kunci Sesi</button>');
      const b = $('#d-buka', m.el); if (b) b.onclick = () => { m.tutup(); Monitor.buka(sesi, ulang); };
    } catch (e) { $('.modal-b', m.el).innerHTML = UI.galat(e); }
  }
};

/* =====================================================================
 *  KOREKSI ESAI
 * ===================================================================== */
App.daftar('g/koreksi', { judul: 'Koreksi Esai', crumb: 'Penilaian esai & forensik ketikan', filterMapel: true, render(el, q, sesi) {
  if (sesi) return Koreksi.detail(el, sesi, q);
  let paket = q.paket || '', fAn = '', fNilai = q.belum ? 'belum' : '', tabel;
  el.innerHTML = Hal.header({ over: 'Didukung analitik pola ketik', judul: 'Esai Menunggu Koreksi Guru', aksi: Hal.segarkan() + '<select class="select" id="f-paket" style="max-width:320px">' + App.opsiPaket(paket, 'Semua paket') + '</select>' }) +
    '<div class="card"><div class="row wrap mb"><div class="input-ikon grow" style="min-width:200px">' + ikon('cari', 16) + '<input class="input" id="cari" placeholder="Cari siswa…"></div>' +
    '<div class="seg" id="seg-n">' + [['', 'Semua'], ['belum', 'Belum dinilai'], ['sudah', 'Sudah dinilai']].map(t => '<button data-v="' + t[0] + '" class="' + (t[0] === fNilai ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div>' +
    '<div class="seg" id="seg-a">' + [['', 'Semua analitik'], ['Wajar', 'Wajar'], ['Mencurigakan', 'Mencurigakan'], ['Dugaan Tempel', 'Dugaan Tempel']].map(t => '<button data-v="' + t[0] + '" class="' + (t[0] === fAn ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div><div id="tbl"></div></div>';
  tabel = Tabel($('#tbl', el), {
    per: 15, satuan: 'lembar', id: r => r.sesi, judulKosong: 'Tidak ada lembar esai', teksKosong: 'Lembar muncul setelah siswa mengirim ujian yang berisi soal esai.',
    cari: r => r.nama + ' ' + r.nis + ' ' + r.paket, filter: r => (!fAn || r.analitik === fAn) && (!fNilai || (fNilai === 'belum' ? r.dinilai < r.esai : r.dinilai === r.esai)) && (!App.mapel || (App.paketRef().find(p => p.id === r.paketId) || {}).mapel === App.mapel),
    kolom: [
      { k: 'nama', label: 'Siswa peserta', render: r => '<div class="row gap-s">' + UI.avatar(r.nama, 1) + '<div><b>' + esc(r.nama) + '</b><div class="tiny muted mono">NIS ' + esc(r.nis) + '</div></div></div>' },
      { k: 'paket', label: 'Paket ujian', render: r => '<span class="small">' + esc(r.paket) + '</span>' },
      { k: 'kelas', label: 'Kelas' },
      { k: 'analitik', label: 'Analitik pola ketik', render: r => UI.status(r.analitik) + (r.persen !== null && r.persen !== undefined && r.analitik !== '-' ? ' <span class="tiny muted mono">' + F.n(r.persen) + '% ketik</span>' : '') + (r.nPel ? ' <span class="badge warn">' + ikon('segitiga', 11) + r.nPel + '</span>' : '') },
      { k: 'dinilai', label: 'Dinilai', render: r => '<span class="mono">' + r.dinilai + '/' + r.esai + '</span>' + (r.nilaiAkhir !== null ? ' <span class="tiny muted">→ ' + F.n(r.nilaiAkhir) + '</span>' : '') },
      { k: 'selesai', label: 'Waktu selesai', render: r => '<span class="small muted">' + F.relatif(new Date(r.selesai).getTime()) + '</span>' },
      { k: '_a', label: '', urut: false, render: r => '<a class="btn xs ' + (r.analitik === 'Dugaan Tempel' ? 'danger' : r.analitik === 'Mencurigakan' ? 'sand' : r.dinilai < r.esai ? 'primary' : '') + '" href="#/g/koreksi/' + esc(r.sesi) + (paket ? '?paket=' + esc(paket) : '') + '">' + (r.dinilai < r.esai ? 'Koreksi' : 'Tinjau') + ' ' + ikon('pen', 13) + '</a>' }
    ]
  });
  const muat = paksa => API.swr('esai.antrian', { paket }, d => tabel.set(d), { maxAge: paksa ? 0 : 20000, force: paksa }).catch(e => { $('#tbl').innerHTML = UI.galat(e); });
  $('#f-paket').onchange = e => App.pergi('g/koreksi', { paket: e.target.value });
  $('#cari').oninput = UI.debounce(e => tabel.cari(e.target.value), 150);
  $$('#seg-n button').forEach(b => b.onclick = () => { fNilai = b.dataset.v; $$('#seg-n button').forEach(x => x.classList.toggle('on', x === b)); tabel.render(); });
  $$('#seg-a button').forEach(b => b.onclick = () => { fAn = b.dataset.v; $$('#seg-a button').forEach(x => x.classList.toggle('on', x === b)); tabel.render(); });
  Hal.pasangSegar(el, () => API.swr('esai.antrian', { paket }, d => tabel.set(d), { force: true, fresh: true }));
  if (!API.ambilCache('esai.antrian', { paket })) $('#tbl').innerHTML = UI.sk(8);
  muat(false);
} });

const Koreksi = {
  async detail(el, sesi, q) {
    el.innerHTML = UI.skTabel(6);
    const paket = q.paket || '';
    const antri = API.ambilCache('esai.antrian', { paket }) || API.ambilCache('esai.antrian', {}) || [];
    const j = await API.call('esai.detail', { sesi }).catch(e => ({ success: false, message: e.message }));
    if (!j.success) { el.innerHTML = UI.galat(new Error(j.message), 'App.rute()'); return; }
    const d = j.data, idx = antri.findIndex(x => x.sesi === sesi), tulis = Hal.bolehTulis();
    const nav = k => { const t = antri[idx + k]; return t ? '#/g/koreksi/' + t.sesi + (paket ? '?paket=' + paket : '') : ''; };
    let aktif = 0;
    const skor = {}; d.esai.forEach(e => skor[e.id] = { s: e.skor === '' ? '' : e.skor, c: e.catatan || '' });
    el.innerHTML = '<div class="card mb"><div class="row wrap between"><div><a href="#/g/koreksi' + (paket ? '?paket=' + esc(paket) : '') + '" class="small">' + ikon('kiri', 14) + ' Kembali ke antrean</a><h2 class="mt-s">' + esc(d.paket.nama) + '</h2><div class="small muted">Bobot nilai akhir: PG ' + d.paket.pPG + '% · Esai ' + d.paket.pEsai + '%</div></div>' +
      '<div class="row"><a class="btn icon" ' + (nav(-1) ? 'href="' + nav(-1) + '"' : 'disabled') + ' aria-label="Siswa sebelumnya">' + ikon('kiri') + '</a><div class="tc"><b style="font-size:16px">' + esc(d.siswa.nama) + '</b> <span class="badge">' + (idx >= 0 ? 'Siswa ' + (idx + 1) + ' / ' + antri.length : '') + '</span><div class="tiny muted mono">NIS ' + esc(d.siswa.nis) + ' · ' + esc(d.siswa.kelas) + '</div></div><a class="btn icon" ' + (nav(1) ? 'href="' + nav(1) + '"' : 'disabled') + ' aria-label="Siswa berikutnya">' + ikon('kanan') + '</a></div></div></div>' +
      (d.pelanggaran.filter(l => l.jenis !== 'Buka Kunci').length ? '<div class="alert warn mb">' + ikon('segitiga') + '<div class="grow"><b>Perhatian:</b> siswa memiliki ' + d.sesi.nPel + ' pelanggaran sensor integritas (' + d.pelanggaran.filter(l => l.durasi).map(l => l.jenis + ' ' + F.n(l.durasi) + ' dtk').slice(0, 3).join(', ') + ').</div></div>' : '') +
      '<div class="seg mb" id="tab-esai">' + d.esai.map((e, i) => '<button data-i="' + i + '" class="' + (i ? '' : 'on') + '">Esai ' + (i + 1) + ' · No ' + e.no + ' <span class="n" data-st="' + i + '"></span></button>').join('') + '</div>' +
      '<div class="grid g-split"><div id="kiri"></div><div id="kanan"></div></div>' +
      '<div class="card row wrap between mt" style="position:sticky;bottom:12px;z-index:5"><span class="small muted" id="k-info"></span><div class="row wrap"><a class="btn ghost" href="' + (nav(1) || '#/g/koreksi') + '">' + ikon('kanan', 14) + 'Lewati</a>' +
      (tulis ? '<button class="btn primary" id="b-simpan">' + ikon('cek', 16) + 'Simpan Nilai &amp; Lanjut <span class="badge" style="background:rgba(255,255,255,.2);color:#fff">Ctrl+Enter</span></button>' : '') + '</div></div>';
    const tandai = () => d.esai.forEach((e, i) => { const t = $('[data-st="' + i + '"]'); if (t) t.textContent = skor[e.id].s === '' ? '○' : '✓'; });
    const gambar = () => {
      const e = d.esai[aktif], a = e.analitik, tot = a.ketik + a.tempel || 1;
      $('#kiri').innerHTML = '<div class="card col"><div class="row between"><span class="over" style="color:var(--teal)">Butir soal nomor ' + e.no + ' · esai</span><span class="badge">Bobot maks ' + e.bobot + ' poin</span></div>' +
        '<div class="paper pre" style="font-size:15.5px;font-weight:500">' + esc(e.teks) + '</div>' + (e.gambar ? '<img src="' + esc(e.gambar) + '" referrerpolicy="no-referrer" style="max-height:220px;border-radius:12px">' : '') +
        '<div class="inset"><div class="over">' + ikon('daftar', 13) + ' Pedoman penskoran (rubrik)</div><div class="pre small mt-s">' + esc(e.rubrik || '— (tidak ada rubrik)') + '</div></div>' +
        '<div><div class="row between"><span class="over">' + ikon('pen', 13) + ' Transkrip jawaban siswa</span><span class="tiny muted mono">' + String(e.jawaban).length + ' karakter</span></div><div class="paper pre mt-s" style="max-height:360px;overflow:auto;font-size:15px;line-height:1.65;user-select:text">' + (e.jawaban ? esc(e.jawaban) : '<span class="muted">(tidak dijawab)</span>') + '</div></div>' +
        '<div class="grid g2"><div class="field"><label>Input nilai siswa</label><div class="row"><input class="input mono" id="k-skor" type="number" min="0" max="' + e.bobot + '" step="0.5" style="font-size:22px;font-weight:700;width:110px" value="' + esc(skor[e.id].s) + '" ' + (tulis ? '' : 'disabled') + '><span class="muted">/ ' + e.bobot + '</span></div>' +
        '<div class="row wrap gap-s mt-s">' + [0, .25, .5, .75, 1].map(p => '<button class="btn xs" data-pre="' + (Math.round(e.bobot * p * 2) / 2) + '" ' + (tulis ? '' : 'disabled') + '>' + (Math.round(e.bobot * p * 2) / 2) + '</button>').join('') + '</div></div>' +
        '<div class="field"><label>Catatan evaluasi guru</label><textarea class="textarea" id="k-cat" style="min-height:90px" ' + (tulis ? '' : 'disabled') + '>' + esc(skor[e.id].c) + '</textarea></div></div></div>';
      const warna = { 'Wajar': 'ok', 'Mencurigakan': 'warn', 'Dugaan Tempel': 'bad', 'Kosong': '' }[a.status];
      $('#kanan').innerHTML = '<div class="card col"><div class="row between"><h3>' + ikon('sidik') + ' Forensik Ketikan Siswa</h3><span class="badge">server v1.3</span></div>' +
        '<div class="alert ' + (warna || 'soft') + '">' + ikon(a.status === 'Wajar' ? 'perisai' : 'segitiga') + '<div class="grow"><div class="over" style="color:inherit">Status validasi</div><b style="font-size:17px">' + esc(a.status.toUpperCase()) + '</b></div></div>' +
        '<div><div class="row between small"><span><i class="dot" style="color:var(--teal)"></i> ' + F.n(a.persen) + '% diketik langsung (' + a.ketik + ')</span><span><i class="dot" style="color:var(--sand)"></i> ' + F.n(100 - a.persen) + '% ditempel (' + a.tempel + ')</span></div>' +
        '<div class="stack-bar mt-s"><i class="a" style="width:' + (a.ketik / tot * 100) + '%"></i><i class="b" style="width:' + (a.tempel / tot * 100) + '%"></i></div></div>' +
        '<div class="grid g2">' + [['Karakter diketik', a.ketik, 'huruf', 'ketik'], ['Karakter ditempel', a.tempel, 'huruf', 'tempel'], ['Persentase ketik', F.n(a.persen) + '%', '', 'perisai'], ['Kecepatan rata-rata', a.rata, 'kpm', 'jam'], ['Kecepatan puncak', a.puncak, 'kpm', 'kilat'], ['Kejadian tempel', a.nTempel, 'kali', 'tempel']]
          .map(x => '<div class="metric"><div class="small muted">' + ikon(x[3], 13) + ' ' + x[0] + '</div><div class="v">' + x[1] + '<small>' + x[2] + '</small></div></div>').join('') + '</div>' +
        '<div class="alert soft small">' + ikon('info') + '<div class="grow">Indikator dihitung di browser siswa dan diklasifikasi ulang oleh server. Ini indikator pendukung — keputusan akhir ada pada guru.</div></div>' +
        (d.pelanggaran.length ? '<div><div class="over mb">' + ikon('jam', 13) + ' Log sensor ujian (' + d.pelanggaran.length + ')</div>' + d.pelanggaran.map(l => '<div class="list-item small"><b class="mono">' + F.jam(l.waktu) + '</b><span class="grow">' + esc(l.jenis) + (l.durasi ? ' · ' + F.n(l.durasi) + ' dtk' : '') + '</span>' + UI.badge(l.aksi, l.aksi === 'Terkunci' ? 'bad' : l.aksi === 'Dibuka' ? 'ok' : 'sand') + '</div>').join('') + '</div>' : '') + '</div>';
      const sk = $('#k-skor'), ct = $('#k-cat');
      if (sk) sk.oninput = () => { skor[e.id].s = sk.value === '' ? '' : Number(sk.value); tandai(); info(); };
      if (ct) ct.oninput = () => { skor[e.id].c = ct.value; };
      $$('[data-pre]').forEach(b => b.onclick = () => { sk.value = b.dataset.pre; sk.oninput(); });
      info();
    };
    const info = () => { const n = d.esai.filter(e => skor[e.id].s !== '').length; $('#k-info').innerHTML = ikon('pen', 14) + ' ' + n + '/' + d.esai.length + ' esai bernilai · Nilai PG <b class="mono">' + F.n(d.sesi.nilaiPG) + '</b>' + (d.sesi.nilaiAkhir !== '' ? ' · Nilai akhir saat ini <b class="mono">' + F.n(d.sesi.nilaiAkhir) + '</b>' : ''); };
    $$('#tab-esai button').forEach(b => b.onclick = () => { aktif = Number(b.dataset.i); $$('#tab-esai button').forEach(x => x.classList.toggle('on', x === b)); gambar(); });
    gambar(); tandai();
    const simpan = async btn => {
      for (const e of d.esai) { const v = skor[e.id].s; if (v !== '' && (v < 0 || v > e.bobot)) return UI.toast('Skor esai No ' + e.no + ' harus 0–' + e.bobot + '.', 'bad'); }
      await UI.sibuk(btn, async () => {
        const r = await UI.kirim('esai.nilai', { sesi, skor }, { diam: true });
        UI.toast(r.dinilai === r.total ? 'Tersimpan. Nilai akhir: ' + F.n(r.nilaiAkhir) : 'Tersimpan (' + r.dinilai + '/' + r.total + ' esai bernilai).', 'ok');
        const t = antri[idx]; if (t) { t.dinilai = r.dinilai; t.nilaiAkhir = r.nilaiAkhir === '' ? null : r.nilaiAkhir; }
        const berikut = antri.slice(idx + 1).find(x => x.dinilai < x.esai) || antri.find(x => x.dinilai < x.esai && x.sesi !== sesi);
        location.hash = berikut ? '#/g/koreksi/' + berikut.sesi + (paket ? '?paket=' + paket : '') : '#/g/koreksi';
      });
    };
    const bs = $('#b-simpan'); if (bs) bs.onclick = () => simpan(bs);
    const kd = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && bs) { e.preventDefault(); simpan(bs); } };
    document.addEventListener('keydown', kd); App.saatPergi(() => document.removeEventListener('keydown', kd));
  }
};

/* =====================================================================
 *  REKAP NILAI
 * ===================================================================== */
App.daftar('g/rekap', { judul: 'Rekap Nilai', crumb: 'Modul evaluasi sumatif', filterMapel: true, render(el, q) {
  let paket = q.paket || '', f = { kelas: '', lulus: '', an: '', hadir: '' }, tabel, data = null;
  el.innerHTML = Hal.header({ over: 'Modul evaluasi sumatif', judul: 'Rekapitulasi Nilai &amp; Evaluasi Hasil Asesmen', sub: 'Nilai ternormalisasi PG &amp; esai, kelulusan KKM, kehadiran, dan integritas ketikan.',
    aksi: Hal.segarkan() + '<button class="btn" id="b-csv">' + ikon('unduh', 16) + 'CSV</button><button class="btn" id="b-pdf">' + ikon('doc', 16) + 'Unduh PDF</button><button class="btn primary" id="b-xlsx">' + ikon('unduh', 16) + 'Unduh Excel (.xlsx)</button>' }) +
    '<div class="card mb"><div class="row between mb"><b>' + ikon('filter', 16) + ' Parameter filter</b><button class="btn ghost xs" id="b-reset">' + ikon('refresh', 12) + 'Reset</button></div><div class="grid g6">' +
    '<div class="field"><label>Paket ujian</label><select class="select" id="f-paket">' + App.opsiPaket(paket, 'Semua paket') + '</select></div>' +
    '<div class="field"><label>Kelas</label><select class="select" id="f-kelas"><option value="">Semua kelas</option>' + App.kelasRef().map(k => '<option>' + esc(k) + '</option>').join('') + '</select></div>' +
    '<div class="field"><label>Kelulusan KKM</label><select class="select" id="f-lulus"><option value="">Semua</option><option value="1">Lulus</option><option value="0">Remedial</option><option value="-">Belum dinilai</option></select></div>' +
    '<div class="field"><label>Integritas esai</label><select class="select" id="f-an"><option value="">Semua</option><option>Wajar</option><option>Mencurigakan</option><option>Dugaan Tempel</option></select></div>' +
    '<div class="field"><label>Presensi</label><select class="select" id="f-hadir"><option value="">Semua</option><option>Hadir</option><option>Tidak Hadir</option><option>Izin</option><option>Sakit</option><option>Belum Dicatat</option></select></div>' +
    '<div class="field"><label>Cari</label><input class="input" id="cari" placeholder="Nama / NIS…"></div></div></div>' +
    '<div class="grid g6 mb" id="grafik">' + UI.sk(6, true) + '</div><div class="card"><div class="card-h"><h3>' + ikon('daftar') + ' Lembar Nilai Terintegrasi Siswa</h3><span class="small muted" id="komposisi"></span></div><div id="tbl"></div></div>';
  tabel = Tabel($('#tbl', el), {
    per: 25, satuan: 'baris', id: r => r.paketId + r.nis, cari: r => r.nama + ' ' + r.nis,
    filter: r => (!App.mapel || r.mapelId === App.mapel) && (!f.kelas || r.kelas === f.kelas) && (!f.lulus || (f.lulus === '-' ? r.lulus === null : String(+r.lulus) === f.lulus && r.lulus !== null)) && (!f.an || r.analitik === f.an) && (!f.hadir || r.hadir === f.hadir),
    kelasBaris: r => r.lulus === false ? 'alert' : '',
    kolom: [
      { k: 'nama', label: 'Siswa & NIS', render: r => '<div class="row gap-s">' + UI.avatar(r.nama, 1) + '<div><b>' + esc(r.nama) + '</b><div class="tiny muted mono">' + esc(r.nis) + '</div></div></div>' },
      { k: 'kelas', label: 'Kelas' }, { k: 'paket', label: 'Paket', render: r => '<span class="small">' + esc(r.paket) + '</span>' },
      { k: 'nilaiPG', label: 'Nilai PG', kelas: 'tr', render: r => '<span class="mono">' + F.n(r.nilaiPG) + '</span>' },
      { k: 'nilaiEsai', label: 'Nilai Esai', kelas: 'tr', render: r => '<span class="mono">' + F.n(r.nilaiEsai) + '</span>' },
      { k: 'nilaiAkhir', label: 'Nilai Akhir', kelas: 'tr', render: r => '<b class="mono" style="font-size:15px;color:' + (r.lulus === false ? 'var(--bad)' : 'var(--text)') + '">' + F.n(r.nilaiAkhir) + '</b>' },
      { k: 'lulus', label: 'Kelulusan', render: r => r.lulus === null ? UI.status(r.status) : UI.status(r.lulus ? 'Lulus' : 'Remedial') },
      { k: 'analitik', label: 'Analitik esai', render: r => r.analitik ? UI.status(r.analitik) : '<span class="tiny muted">—</span>' },
      { k: 'nPel', label: 'Pelanggaran', render: r => r.nPel ? '<span class="badge warn">' + ikon('segitiga', 11) + r.nPel + '</span>' : (r.sesi ? '<span class="badge ok">0 · Bersih</span>' : '<span class="tiny muted">—</span>') },
      { k: 'hadir', label: 'Kehadiran', render: r => UI.status(r.hadir) }
    ]
  });
  const grafik = () => {
    const rs = tabel.tersaring(), n = rs.filter(r => r.nilaiAkhir !== null), kkm = data.kkm;
    const perPaket = {}; n.forEach(r => { (perPaket[r.paket] = perPaket[r.paket] || []).push(r.nilaiAkhir); });
    const rata = a => Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10) / 10;
    const ember = [['<60', 0, 60], ['60–69', 60, 70], ['70–79', 70, 80], ['80–89', 80, 90], ['90+', 90, 101]].map(b => ({ l: b[0], v: n.filter(r => r.nilaiAkhir >= b[1] && r.nilaiAkhir < b[2]).length, w: b[1] < kkm ? '#B93A32' : '#0F5561' }));
    const urutP = data.paket.slice().sort((a, b) => new Date(a.buka) - new Date(b.buka)).filter(p => perPaket[p.nama]);
    const lulus = n.filter(r => r.lulus).length, an = s => rs.filter(r => r.analitik === s).length, hadir = rs.filter(r => r.hadir === 'Hadir' || r.sesi).length;
    const kartu = (over, judul, sub, isi) => '<div class="card pad-s"><div class="over">' + over + '</div><b>' + judul + '</b><div class="tiny muted mb">' + sub + '</div>' + isi + '</div>';
    $('#grafik').innerHTML = kartu('Per paket ujian', 'Rata-rata Nilai', 'Target KKM ' + kkm, Grafik.batang({ data: Object.keys(perPaket).slice(0, 5).map(k => ({ l: k, v: rata(perPaket[k]) })), max: 100, garis: kkm, w: 260, h: 150 })) +
      kartu('Sebaran skor', 'Distribusi Nilai', n.length + ' siswa terdata', Grafik.batang({ data: ember, w: 260, h: 150 })) +
      kartu('Performa siswa', 'Tren Skor', 'Rata-rata per paket', Grafik.garis({ nilai: urutP.map(p => rata(perPaket[p.nama])), label: urutP.map(p => p.nama), kkm, w: 280, h: 150 })) +
      kartu('KKM ambang', 'Rasio Kelulusan', (n.length ? Math.round(lulus / n.length * 1000) / 10 : 0) + '% lulus', Grafik.donat({ data: [{ l: 'Lulus', v: lulus, w: '#2F7D5B' }, { l: 'Remedial', v: n.length - lulus, w: '#B93A32' }], legenda: false, ukuran: 120, tengah: lulus, sub: 'LULUS' })) +
      kartu('Forensik ketikan', 'Integritas Esai', 'Analisis tempel & kecepatan', Grafik.donat({ data: [{ l: 'Wajar', v: an('Wajar'), w: '#2F7D5B' }, { l: 'Mencurigakan', v: an('Mencurigakan'), w: '#C98A2B' }, { l: 'Dugaan Tempel', v: an('Dugaan Tempel'), w: '#B93A32' }], legenda: false, ukuran: 120, tengah: an('Wajar'), sub: 'WAJAR' })) +
      kartu('Status ruang', 'Presensi Siswa', hadir + ' / ' + rs.length + ' hadir', '<div class="bar ok mt-s" style="height:12px"><i style="width:' + (rs.length ? hadir / rs.length * 100 : 0) + '%"></i></div><div class="grid g3 mt tc small">' + ['Izin', 'Sakit', 'Tidak Hadir'].map(s => '<div class="paper" style="padding:6px"><div class="tiny muted">' + s + '</div><b class="mono">' + rs.filter(r => r.hadir === s).length + '</b></div>').join('') + '</div>');
    const pk = data.paket.find(p => p.id === paket);
    $('#komposisi').textContent = pk ? 'Komposisi: ' + pk.pPG + '% Pilihan Ganda + ' + pk.pEsai + '% Esai · KKM ' + kkm : 'KKM ' + kkm;
  };
  const gambar = d => { data = d; tabel.set(d.rows); grafik(); };
  ['kelas', 'lulus', 'an', 'hadir'].forEach(k => $('#f-' + k).onchange = e => { f[k] = e.target.value; tabel.render(); grafik(); });
  $('#cari').oninput = UI.debounce(e => { tabel.cari(e.target.value); grafik(); }, 150);
  $('#f-paket').onchange = e => App.pergi('g/rekap', { paket: e.target.value });
  $('#b-reset').onclick = () => App.pergi('g/rekap', {});
  Hal.pasangSegar(el, () => API.swr('rekap.data', { paket }, gambar, { force: true, fresh: true }));
  $('#b-csv').onclick = () => { const rs = tabel.tersaring(); UI.unduhCSV([['NIS', 'Nama', 'Kelas', 'Paket', 'Mapel', 'Nilai PG', 'Nilai Esai', 'Nilai Akhir', 'Keterangan', 'Analitik Esai', 'Pelanggaran', 'Kehadiran']].concat(rs.map(r => [r.nis, r.nama, r.kelas, r.paket, r.mapel, r.nilaiPG, r.nilaiEsai, r.nilaiAkhir, r.lulus === null ? r.status : r.lulus ? 'Tuntas' : 'Remedial', r.analitik, r.nPel, r.hadir])), 'rekap-nilai.csv'); };
  const dok = (fmt, b) => { if (!paket) return UI.toast('Pilih satu paket untuk ekspor resmi Excel/PDF (CSV tersedia untuk semua paket).', 'warn'); UI.sibuk(b, () => Hal.unduhDok('REKAP_NILAI', paket, fmt, f.kelas)); };
  $('#b-xlsx').onclick = e => dok('xlsx', e.currentTarget); $('#b-pdf').onclick = e => dok('pdf', e.currentTarget);
  Hal.muat($('#tbl'), 'rekap.data', { paket }, gambar, { maxAge: 20000 });
} });

/* =====================================================================
 *  KODE RUANG (TOTP) — layar proyektor
 * ===================================================================== */
App.daftar('g/koderuang', { judul: 'Kode Ruang', crumb: 'Otentikasi ruang ujian', filterMapel: true, render(el, q) {
  const paket = App.paketAwal(q);
  let info = null, diambil = 0;
  el.innerHTML = Hal.header({ over: 'Siaran proyektor kelas', judul: 'Layar Proyektor · Otentikasi Kode Ruang', aksi: '<select class="select" id="f-paket" style="max-width:320px">' + App.opsiPaket(paket) + '</select>' }) + '<div id="kr"></div>';
  if (!paket) { $('#kr').innerHTML = UI.kosong({ ikon: 'pintu', judul: 'Belum ada paket ujian' }); return; }
  $('#f-paket').onchange = e => App.pergi('g/koderuang', { paket: e.target.value });
  const digit = k => '<div class="kode-digits">' + k.split('').map((c, i) => (i === 3 ? '<span class="sep">–</span>' : '') + '<span>' + c + '</span>').join('') + '</div>';
  const ring = () => '<svg class="ring" viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="42"/><circle class="fg" id="ring-fg" cx="50" cy="50" r="42" stroke-dasharray="264" transform="rotate(-90 50 50)"/><text x="50" y="57" text-anchor="middle" id="ring-t" style="font-family:JetBrains Mono,monospace;font-size:20px;font-weight:700;fill:#0F5561"></text></svg>';
  const gambar = () => {
    if (!info.aktif) { $('#kr').innerHTML = '<div class="card tc"><div class="lock-screen" style="margin:auto"><div class="big teal">' + ikon('pintu', 38) + '</div><h2>Kode Ruang tidak diwajibkan untuk paket ini</h2><p class="muted">Aktifkan di Konfigurator Paket (Pengamanan) atau Pengaturan → Anti-Curang.</p><a class="btn" href="#/g/paket/form?id=' + esc(paket) + '">Buka konfigurator paket</a></div></div>'; return; }
    $('#kr').innerHTML = '<div class="card tc" style="padding:36px 20px"><p class="muted">Siswa memasukkan 6 digit kode di bawah ini pada layar konfirmasi <b>satu kali</b> sebelum lembar soal dibuka.</p><div class="mt" id="kr-d">' + digit(info.kode) + '</div>' +
      '<div class="row mt" style="justify-content:center;gap:16px">' + ring() + '<div class="tl"><b>Sisa <span id="kr-s"></span> detik menuju rotasi</b><div class="small muted">Interval ' + info.interval + ' detik · ' + (info.sebelumnya ? 'kode satu putaran sebelumnya tetap diterima' : 'hanya kode saat ini yang diterima') + '</div></div></div>' +
      '<div class="row wrap mt" style="justify-content:center"><button class="btn" id="b-seg">' + ikon('refresh', 16) + 'Segarkan Kode</button><button class="btn primary" id="b-pro">' + ikon('layar', 16) + 'Mode Layar Penuh Proyektor</button></div></div>';
    $('#b-seg').onclick = e => UI.sibuk(e.currentTarget, tarik);
    $('#b-pro').onclick = proyektor;
    tick();
  };
  const tick = () => {
    if (!info || !info.aktif) return;
    const sisa = Math.max(0, Math.ceil(info.sisa - (Date.now() - diambil) / 1000));
    const s = $('#kr-s'), t = $('#ring-t'), fg = $('#ring-fg'), ps = $('#pro-s');
    if (s) s.textContent = sisa; if (t) t.textContent = sisa + 's'; if (fg) fg.style.strokeDashoffset = 264 * (1 - sisa / info.interval);
    if (ps) ps.textContent = sisa + ' detik';
    if (sisa <= 0) tarik();
  };
  let menarik = false;
  async function tarik() {
    if (menarik) return; menarik = true;
    try { const j = await API.call('koderuang.get', { paket }); if (!j.success) throw new Error(j.message); info = j.data; diambil = Date.now(); if ($('#pro-d')) { $('#pro-d').innerHTML = digit(info.kode); } else gambar(); }
    catch (e) { $('#kr').innerHTML = UI.galat(e, 'App.rute()'); } finally { menarik = false; }
  }
  function proyektor() {
    const d = document.createElement('div'); d.className = 'proyektor'; d.id = 'proyektor';
    d.innerHTML = '<div class="brand" style="padding:0;justify-content:center"><div class="lg" style="width:64px;height:64px">' + App.logoHtml() + '</div><div style="text-align:left"><div class="nm" style="font-size:22px">' + esc(App.pub.NAMA_LEMBAGA || '') + '</div><div class="muted">' + esc(info.paket) + '</div></div></div>' +
      '<div class="over" style="font-size:16px">Kode Ruang Ujian</div><div id="pro-d">' + digit(info.kode) + '</div><div class="muted" style="font-size:18px">Berganti dalam <b id="pro-s" class="mono"></b> · masukkan sekali sebelum mulai</div><button class="btn" id="pro-x">' + ikon('x', 16) + 'Tutup (Esc)</button>';
    document.body.appendChild(d);
    try { (d.requestFullscreen || d.webkitRequestFullscreen).call(d); } catch (e) { }
    const tutup = () => { d.remove(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { } document.removeEventListener('keydown', esc_); gambar(); };
    const esc_ = e => { if (e.key === 'Escape') tutup(); };
    $('#pro-x').onclick = tutup; document.addEventListener('keydown', esc_);
    App.saatPergi(tutup);
  }
  $('#kr').innerHTML = '<div class="card">' + UI.sk(3, true) + '</div>';
  tarik();
  App.interval(tick, 1000);
} });

/* =====================================================================
 *  DOKUMEN (Doc Engine)
 * ===================================================================== */
App.daftar('g/dokumen', { judul: 'Dokumen', crumb: 'Doc Engine · template {{…}}', render(el) {
  Hal.muat(el, 'dok.list', {}, d => {
    const adm = App.isAdmin();
    el.innerHTML = Hal.header({ over: 'Doc Engine', judul: 'Dokumen Ujian Otomatis', sub: 'Berita acara, daftar hadir, daftar token, dan rekap nilai dari template Google Docs/Sheets milik sekolah. Salinan setiap dokumen tersimpan di folder Arsip Drive.' }) +
      '<div class="grid g2">' + d.map(t => '<div class="card col"><div class="row between"><div class="row"><span class="stat"><span class="ik">' + ikon(t.engine === 'sheets' ? 'chart' : 'doc', 20) + '</span></span><div><h3>' + esc(t.nama) + '</h3><div class="tiny muted">Google ' + (t.engine === 'sheets' ? 'Sheets' : 'Docs') + ' → ' + t.keluaran.map(x => x.toUpperCase()).join(' / ') + '</div></div></div>' + (t.siap ? UI.badge('Siap · v' + t.versi, 'ok') : UI.badge('Belum ada template', 'bad')) + '</div>' +
        '<div class="row wrap"><button class="btn primary sm" data-buat="' + t.kode + '" ' + (t.siap ? '' : 'disabled') + '>' + ikon('unduh', 14) + 'Buat dokumen</button>' +
        (adm ? (t.url ? '<a class="btn sm" href="' + esc(t.url) + '" target="_blank" rel="noopener">' + ikon('edit', 14) + 'Edit template</a>' : '') + '<button class="btn sm" data-pindai="' + t.kode + '">' + ikon('cari', 14) + 'Pindai ulang</button><button class="btn sm ghost bad" data-reset="' + t.kode + '">' + ikon('refresh', 14) + 'Kembalikan bawaan</button>' : '') + '</div>' +
        '<details><summary class="small" style="cursor:pointer">Placeholder tersedia (' + (t.placeholder.length + t.kolom.length) + ')</summary><div class="row wrap gap-s mt-s">' + t.placeholder.map(p => '<span class="badge mono">{{' + esc(p) + '}}</span>').join('') +
        (t.blok ? '<div class="small mt-s" style="width:100%">Baris berulang: <span class="badge mono teal">{{#' + esc(t.blok) + '}}</span> + ' + t.kolom.map(k => '<span class="badge mono">{{' + (k === 'NO' ? 'NO' : esc(t.blok) + '.' + esc(k)) + '}}</span>').join(' ') + '</div>' : '') +
        '<p class="tiny muted mt-s" style="width:100%">Pengubah: <span class="mono">|kapital</span> · <span class="mono">|judul</span> · <span class="mono">|tanggal</span> · <span class="mono">|terbilang</span> · <span class="mono">|bawaan:teks</span></p></div></details></div>').join('') + '</div>' +
      (adm ? '<div class="alert soft mt">' + ikon('info') + '<div class="grow"><b>Cara mengubah desain</b><p>Klik "Edit template", ubah tata letak/kop di Google Docs atau Sheets (jangan hapus penanda {{…}} yang dibutuhkan), lalu klik "Pindai ulang". Teks pengganti mengikuti huruf, ukuran, dan tebal penanda.</p></div></div>' : '');
    $$('[data-buat]', el).forEach(b => b.onclick = () => {
      const t = d.find(x => x.kode === b.dataset.buat);
      UI.modal({ judul: 'Buat ' + t.nama, ikon: 'doc', isi: '<div class="col"><div class="field"><label>Paket ujian</label><select class="select" id="m-p">' + App.opsiPaket(App.paketAwal({})) + '</select></div>' +
        '<div class="field"><label>Kelas (opsional)</label><select class="select" id="m-k"><option value="">Semua kelas di paket</option>' + App.kelasRef().map(k => '<option>' + esc(k) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Format</label><div class="seg" id="m-f">' + t.keluaran.map((f, i) => '<button data-f="' + f + '" class="' + (i ? '' : 'on') + '">' + f.toUpperCase() + '</button>').join('') + '</div></div>' +
        (t.kode === 'BERITA_ACARA' ? '<div class="field"><label>Catatan pelaksanaan</label><textarea class="textarea" id="m-c" placeholder="Kosongkan → \'Ujian berjalan dengan tertib dan lancar.\'"></textarea></div>' : '') + '</div>',
        aksi: [{ label: 'Batal' }, { label: 'Buat & Unduh', kelas: 'primary', klik: async (x, m) => { const fm = $('#m-f .on', m).dataset.f; await Hal.unduhDok(t.kode, $('#m-p', m).value, fm, $('#m-k', m).value, ($('#m-c', m) || {}).value); } }] });
      $$('#m-f button').forEach(x => x.onclick = () => $$('#m-f button').forEach(y => y.classList.toggle('on', y === x)));
    });
    $$('[data-pindai]', el).forEach(b => b.onclick = () => UI.sibuk(b, async () => { await UI.kirim('dok.template', { aksi: 'pindai', kode: b.dataset.pindai }); API.swr('dok.list', {}, () => App.rute(), { force: true }); }));
    $$('[data-reset]', el).forEach(b => b.onclick = async () => { if (await UI.konfirmasi('Buat ulang template bawaan? Desain yang sudah Anda ubah akan dibuang (dipindah ke sampah Drive).', { bahaya: true, tombol: 'Kembalikan bawaan' })) UI.sibuk(b, async () => { await UI.kirim('dok.template', { aksi: 'reset', kode: b.dataset.reset }); API.swr('dok.list', {}, () => App.rute(), { force: true }); }); });
  }, { maxAge: 60000 });
} });

/* =====================================================================
 *  AKUN SAYA
 * ===================================================================== */
App.daftar('g/akun', { judul: 'Akun Saya', crumb: 'Profil & keamanan', render(el) {
  const me = App.me();
  el.innerHTML = Hal.header({ over: 'Profil', judul: 'Akun Saya' }) + '<div class="grid g2" style="max-width:900px"><div class="card col"><div class="row">' + UI.avatar(me.nama) + '<div><h3>' + esc(me.nama) + '</h3><div class="small muted mono">@' + esc(me.username) + '</div></div></div>' +
    '<div class="divider"></div><div class="row between"><span class="muted">Peran</span>' + UI.status(me.peran) + '</div><div class="row between"><span class="muted">Mapel diampu</span><span class="small tr">' + ((me.mapel || []).map(id => esc(App.namaMapel(id))).join(', ') || '—') + '</span></div>' +
    '<div class="row between"><span class="muted">Kelas</span><span class="small">' + (me.kelas && me.kelas.length ? esc(me.kelas.join(', ')) : 'Semua kelas') + '</span></div></div>' +
    '<div class="card col"><h3>' + ikon('kunci') + ' Ganti kata sandi</h3><div class="field"><label>Sandi lama</label><input class="input" type="password" id="s-lama" autocomplete="current-password"></div><div class="field"><label>Sandi baru</label><input class="input" type="password" id="s-baru" autocomplete="new-password"><div class="help">Minimal 8 karakter, berisi huruf dan angka.</div></div>' +
    '<div class="field"><label>Ulangi sandi baru</label><input class="input" type="password" id="s-ulang" autocomplete="new-password"></div><button class="btn primary" id="b-sandi">Simpan sandi baru</button><p class="tiny muted">Mengganti sandi mengeluarkan akun Anda dari perangkat lain.</p></div></div>';
  $('#b-sandi').onclick = e => {
    const b = $('#s-baru').value;
    if (b !== $('#s-ulang').value) return UI.tandaiSalah($('#s-ulang'), 'Ulangi sandi tidak sama.');
    UI.sibuk(e.currentTarget, async () => { const d = await UI.kirim('akun.sandi', { lama: $('#s-lama').value, baru: b }); App.simpanSesi(Object.assign({}, App.sesi, { token: d.token })); ['#s-lama', '#s-baru', '#s-ulang'].forEach(s => $(s).value = ''); });
  };
} });
