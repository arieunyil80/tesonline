/**
 * admin.js — siswa & kelas, master mapel, pengguna, pengaturan sistem
 * (identitas + logo, anti-curang + Kode Ruang, analitik esai, impor/migrasi, sistem & log)
 */

/* =====================================================================
 *  SISWA & KELAS
 * ===================================================================== */
App.daftar('a/siswa', { judul: 'Siswa & Kelas', crumb: 'Master data sekolah', render(el) {
  let kelas = '', tabel;
  el.innerHTML = Hal.header({ over: 'Master data', judul: 'Siswa &amp; Rombongan Belajar', sub: 'Data siswa dipakai untuk membuat token per kelas.',
    aksi: Hal.segarkan() + '<button class="btn" id="b-impor">' + ikon('upload', 16) + 'Impor Excel</button><button class="btn primary" id="b-tambah">' + ikon('plus', 16) + 'Tambah Siswa</button>' }) +
    '<div class="grid" style="grid-template-columns:240px minmax(0,1fr)" id="lay"><div class="card pad-s" style="align-self:start"><div class="over mb">Daftar rombel</div><div id="kls" class="col gap-s"></div></div>' +
    '<div class="card"><div class="input-ikon mb">' + ikon('cari', 16) + '<input class="input" id="cari" placeholder="Cari NIS / nama…"></div><div id="tbl"></div></div></div>';
  if (window.innerWidth < 900) $('#lay').style.gridTemplateColumns = '1fr';
  const form = r => {
    r = r || { aktif: true, kelas };
    UI.modal({ judul: r.id ? 'Ubah data siswa' : 'Tambah siswa', ikon: 'user', isi: '<div class="col"><div class="field"><label>NIS <span class="wajib">*</span></label><input class="input mono" id="m-nis" value="' + esc(r.nis || '') + '"></div>' +
      '<div class="field"><label>Nama lengkap <span class="wajib">*</span></label><input class="input" id="m-nama" value="' + esc(r.nama || '') + '"></div><div class="field"><label>Kelas <span class="wajib">*</span></label><input class="input" id="m-kelas" list="dl-kelas" value="' + esc(r.kelas || '') + '" placeholder="mis. XI TKJ 1"><datalist id="dl-kelas">' + App.kelasRef().map(k => '<option value="' + esc(k) + '">').join('') + '</datalist></div>' +
      '<label class="check"><input type="checkbox" class="cb" id="m-aktif" ' + (r.aktif ? 'checked' : '') + '> Status aktif</label></div>',
      aksi: [{ label: 'Batal' }, { label: 'Simpan', kelas: 'primary', klik: async (t, m) => { await UI.kirim('siswa.simpan', { id: r.id || '', nis: $('#m-nis', m).value, nama: $('#m-nama', m).value, kelas: $('#m-kelas', m).value, aktif: $('#m-aktif', m).checked }); muat(true); App.muatRef(true); } }] });
  };
  tabel = Tabel($('#tbl', el), {
    pilih: true, per: 25, satuan: 'siswa', judulKosong: 'Belum ada siswa', teksKosong: 'Tambah manual atau impor dari Excel.',
    bulk: '<button class="btn xs danger" id="b-hps">' + ikon('trash', 13) + 'Hapus / nonaktifkan</button>',
    cari: r => r.nis + ' ' + r.nama, filter: r => !kelas || r.kelas === kelas,
    kolom: [
      { k: 'nis', label: 'NIS', render: r => '<span class="mono">' + esc(r.nis) + '</span>' },
      { k: 'nama', label: 'Nama lengkap', render: r => '<div class="row gap-s">' + UI.avatar(r.nama, 1) + '<b>' + esc(r.nama) + '</b></div>' },
      { k: 'kelas', label: 'Kelas' },
      { k: 'ujian', label: 'Riwayat ujian', kelas: 'tr', render: r => '<span class="mono">' + r.ujian + '</span>' },
      { k: 'aktif', label: 'Status', render: r => UI.status(r.aktif ? 'Aktif' : 'Nonaktif') },
      { k: '_a', label: '', urut: false, render: r => '<div class="aksi"><button class="btn icon sm ghost" data-ubah="' + esc(r.id) + '" aria-label="Ubah">' + ikon('edit', 16) + '</button></div>' }
    ],
    setelah(t) {
      $$('[data-ubah]', t).forEach(b => b.onclick = () => form(tabel.data.find(x => x.id === b.dataset.ubah)));
      const h = $('#b-hps', t); if (h) h.onclick = async () => { const ids = tabel.dipilih(); if (await UI.konfirmasi('Proses ' + ids.length + ' siswa? Siswa yang sudah punya token/riwayat akan dinonaktifkan, bukan dihapus.', { bahaya: true })) { try { await UI.kirim('siswa.hapus', { ids }); tabel.bersihPilih(); muat(true); } catch (e) { UI.toast(e.message, 'bad'); } } };
    }
  });
  const gambar = d => {
    const per = {}; d.forEach(s => { per[s.kelas] = (per[s.kelas] || 0) + 1; });
    $('#kls').innerHTML = '<button class="btn sm ' + (kelas ? '' : 'primary') + '" data-k="" style="justify-content:space-between">Semua kelas <span class="mono">' + d.length + '</span></button>' + Object.keys(per).sort().map(k => '<button class="btn sm ' + (k === kelas ? 'primary' : '') + '" data-k="' + esc(k) + '" style="justify-content:space-between">' + esc(k) + ' <span class="mono">' + per[k] + '</span></button>').join('');
    $$('#kls [data-k]').forEach(b => b.onclick = () => { kelas = b.dataset.k; gambar(d); });
    tabel.set(d);
  };
  const muat = paksa => API.swr('siswa.list', {}, gambar, { maxAge: paksa ? 0 : 30000, force: paksa }).catch(e => { $('#tbl').innerHTML = UI.galat(e); });
  $('#cari').oninput = UI.debounce(e => tabel.cari(e.target.value), 150);
  $('#b-tambah').onclick = () => form();
  $('#b-impor').onclick = () => Impor.siswa(() => { muat(true); App.muatRef(true); });
  Hal.pasangSegar(el, () => API.swr('siswa.list', {}, gambar, { force: true, fresh: true }));
  if (!API.ambilCache('siswa.list', {})) $('#tbl').innerHTML = UI.sk(8);
  muat(false);
} });

/* =====================================================================
 *  MASTER MAPEL
 * ===================================================================== */
App.daftar('a/mapel', { judul: 'Master Mapel', crumb: 'Administrasi', admin: true, render(el) {
  let tabel;
  el.innerHTML = Hal.header({ over: 'Kurikulum', judul: 'Master Mata Pelajaran', aksi: '<button class="btn primary" id="b-tambah">' + ikon('plus', 16) + 'Tambah Mapel</button>' }) + '<div class="card"><div id="tbl"></div></div>';
  const form = r => {
    r = r || { aktif: true };
    UI.modal({ judul: r.id ? 'Ubah mapel' : 'Tambah mapel', ikon: 'layers', ukuran: 'sm', isi: '<div class="col"><div class="field"><label>Nama mapel <span class="wajib">*</span></label><input class="input" id="m-nama" value="' + esc(r.nama || '') + '" placeholder="mis. Administrasi Sistem Jaringan"></div>' + (r.id ? '<label class="check"><input type="checkbox" class="cb" id="m-aktif" ' + (r.aktif ? 'checked' : '') + '> Aktif</label>' : '') + '</div>',
      aksi: [{ label: 'Batal' }, { label: 'Simpan', kelas: 'primary', klik: async (t, m) => { await UI.kirim('mapel.simpan', { id: r.id || '', nama: $('#m-nama', m).value, aktif: $('#m-aktif', m) ? $('#m-aktif', m).checked : true }); muat(true); App.muatRef(true); } }] });
  };
  tabel = Tabel($('#tbl', el), { per: 20, satuan: 'mapel', judulKosong: 'Belum ada mapel', kolom: [
    { k: 'nama', label: 'Nama mapel', render: r => '<b>' + esc(r.nama) + '</b><div class="tiny muted mono">' + esc(r.id) + '</div>' },
    { k: 'guru', label: 'Guru pengampu', render: r => r.guru.length ? r.guru.map(g => '<span class="badge tl" style="margin:2px">' + esc(g) + '</span>').join('') : '<span class="tiny muted">Belum ada</span>' },
    { k: 'soal', label: 'Jumlah soal', kelas: 'tr', render: r => '<span class="mono">' + r.soal + '</span>' },
    { k: 'aktif', label: 'Status', render: r => UI.status(r.aktif ? 'Aktif' : 'Nonaktif') },
    { k: '_a', label: '', urut: false, render: r => '<div class="aksi"><button class="btn icon sm ghost" data-ubah="' + esc(r.id) + '" aria-label="Ubah">' + ikon('edit', 16) + '</button>' + (r.soal ? '' : '<button class="btn icon sm ghost bad" data-hapus="' + esc(r.id) + '" aria-label="Hapus">' + ikon('trash', 16) + '</button>') + '</div>' }
  ], setelah(t) {
    $$('[data-ubah]', t).forEach(b => b.onclick = () => form(tabel.data.find(x => x.id === b.dataset.ubah)));
    $$('[data-hapus]', t).forEach(b => b.onclick = async () => { if (await UI.konfirmasi('Hapus mapel ini?', { bahaya: true })) { try { await UI.kirim('mapel.hapus', { id: b.dataset.hapus }); muat(true); } catch (e) { UI.toast(e.message, 'bad'); } } });
  } });
  const muat = paksa => API.swr('mapel.list', {}, d => tabel.set(d), { maxAge: paksa ? 0 : 30000, force: paksa }).catch(e => { $('#tbl').innerHTML = UI.galat(e); });
  $('#b-tambah').onclick = () => form();
  muat(false);
} });

/* =====================================================================
 *  PENGGUNA (guru & admin)
 * ===================================================================== */
App.daftar('a/pengguna', { judul: 'Pengguna', crumb: 'Administrasi', admin: true, render(el) {
  let tabel;
  el.innerHTML = Hal.header({ over: 'Hak akses', judul: 'Akun Guru &amp; Hak Akses Multi-Mapel', sub: 'Satu guru dapat mengampu beberapa mapel. Admin yang diberi mapel juga dapat bertindak sebagai guru.',
    aksi: '<button class="btn primary" id="b-tambah">' + ikon('plus', 16) + 'Tambah Pengguna</button>' }) + '<div class="card"><div id="tbl"></div></div>';
  const tampilSandi = (judul, s, user) => UI.modal({ judul, ikon: 'key', ukuran: 'sm', isi: '<p class="muted">Catat dan berikan ke <b>' + esc(user) + '</b>. Sandi ini hanya tampil sekali.</p><div class="paper tc mono" style="font-size:22px;font-weight:700;letter-spacing:.06em">' + esc(s) + '</div>',
    aksi: [{ label: 'Salin', klik: () => { UI.salin(s); return false; } }, { label: 'Selesai', kelas: 'primary' }] });
  const form = r => {
    const baru = !r; r = r || { peran: 'Guru', mapel: [], kelas: [], aktif: true };
    UI.modal({ judul: baru ? 'Tambah pengguna' : 'Ubah pengguna', sub: 'Penugasan multi-mapel & rombel', ikon: 'usercog', ukuran: 'lg',
      isi: '<div class="col"><div class="grid g2"><div class="field"><label>Nama lengkap &amp; gelar <span class="wajib">*</span></label><input class="input" id="m-nama" value="' + esc(r.nama || '') + '"></div><div class="field"><label>Peran</label><select class="select" id="m-peran">' + ['Guru', 'Admin'].map(p => '<option' + (p === r.peran ? ' selected' : '') + '>' + p + '</option>').join('') + '</select></div></div>' +
        '<div class="grid g2"><div class="field"><label>Username <span class="wajib">*</span></label><input class="input mono" id="m-user" value="' + esc(r.username || '') + '" autocapitalize="off"></div><div class="field"><label>Kata sandi ' + (baru ? '(kosongkan = dibuat otomatis)' : '(kosongkan = tidak diubah)') + '</label><input class="input" id="m-sandi" type="password" autocomplete="new-password"></div></div>' +
        '<div class="field"><label>Mata pelajaran yang diampu</label><div class="grid g2">' + App.mapelRef().map(m => '<label class="paper check" style="padding:10px"><input type="checkbox" class="cb" value="' + esc(m.id) + '" ' + (r.mapel.indexOf(m.id) >= 0 ? 'checked' : '') + '> ' + esc(m.nama) + '</label>').join('') + '</div>' + (App.mapelRef().length ? '' : '<p class="small muted">Tambahkan mapel di Master Mapel lebih dulu.</p>') + '</div>' +
        '<div class="field"><label>Rombel yang diampu (opsional)</label><input class="input" id="m-kelas" value="' + esc(r.kelas.join(', ')) + '" placeholder="Kosongkan = semua kelas. Pisahkan dengan koma: XI TKJ 1, XI TKJ 2"></div>' +
        '<label class="check"><input type="checkbox" class="cb" id="m-aktif" ' + (r.aktif ? 'checked' : '') + '> Akun aktif</label></div>',
      aksi: [{ label: 'Batal' }, { label: 'Simpan Perubahan', kelas: 'primary', klik: async (t, m) => {
        const d = await UI.kirim('pengguna.simpan', { id: r.id || '', nama: $('#m-nama', m).value, peran: $('#m-peran', m).value, username: $('#m-user', m).value, sandi: $('#m-sandi', m).value,
          mapel: $$('.grid input:checked', m).map(i => i.value), kelas: $('#m-kelas', m).value, aktif: $('#m-aktif', m).checked });
        muat(true); App.muatRef(true);
        if (d.sandiAwal) setTimeout(() => tampilSandi('Sandi awal akun', d.sandiAwal, $('#m-user', m).value), 200);
      } }] });
  };
  tabel = Tabel($('#tbl', el), { per: 20, satuan: 'akun', kolom: [
    { k: 'nama', label: 'Nama & gelar', render: r => '<div class="row gap-s">' + UI.avatar(r.nama, 1) + '<div><b>' + esc(r.nama) + '</b><div class="tiny muted">Login: ' + (r.loginTerakhir ? F.tglJam(r.loginTerakhir) : 'belum pernah') + '</div></div></div>' },
    { k: 'username', label: 'Username', render: r => '<span class="mono">' + esc(r.username) + '</span>' },
    { k: 'peran', label: 'Peran', render: r => UI.status(r.peran) },
    { k: 'mapelNama', label: 'Mapel diampu', render: r => r.mapelNama.length ? r.mapelNama.map(m => '<span class="badge" style="margin:2px">' + esc(m) + '</span>').join('') : '<span class="tiny muted">—</span>' },
    { k: 'aktif', label: 'Status', render: r => '<label class="switch"><input type="checkbox" data-aktif="' + esc(r.id) + '" ' + (r.aktif ? 'checked' : '') + '><span></span></label>' },
    { k: '_a', label: '', urut: false, render: r => '<div class="aksi"><button class="btn icon sm ghost" data-ubah="' + esc(r.id) + '" aria-label="Ubah" title="Ubah">' + ikon('edit', 16) + '</button><button class="btn icon sm ghost" data-reset="' + esc(r.id) + '" aria-label="Reset sandi" title="Reset sandi">' + ikon('key', 16) + '</button></div>' }
  ], setelah(t) {
    $$('[data-ubah]', t).forEach(b => b.onclick = () => form(tabel.data.find(x => x.id === b.dataset.ubah)));
    $$('[data-aktif]', t).forEach(c => c.onchange = async () => { try { await UI.kirim('pengguna.aksi', { id: c.dataset.aktif, aksi: c.checked ? 'aktif' : 'nonaktif' }); muat(true); } catch (e) { c.checked = !c.checked; UI.toast(e.message, 'bad'); } });
    $$('[data-reset]', t).forEach(b => b.onclick = async () => { const u = tabel.data.find(x => x.id === b.dataset.reset); if (!(await UI.konfirmasi('Reset sandi ' + esc(u.username) + '? Sesi lamanya akan dikeluarkan.', { tombol: 'Reset sandi' }))) return; try { const d = await UI.kirim('pengguna.aksi', { id: u.id, aksi: 'reset' }, { diam: true }); tampilSandi('Sandi baru', d.sandiBaru, u.username); } catch (e) { UI.toast(e.message, 'bad'); } });
  } });
  const muat = paksa => API.swr('pengguna.list', {}, d => tabel.set(d), { maxAge: paksa ? 0 : 30000, force: paksa }).catch(e => { $('#tbl').innerHTML = UI.galat(e); });
  $('#b-tambah').onclick = () => form();
  muat(false);
} });

/* =====================================================================
 *  PENGATURAN SISTEM (tab: Umum · Anti-Curang · Analitik Esai · Impor Data · Sistem & Log)
 * ===================================================================== */
App.daftar('a/pengaturan', { judul: 'Pengaturan', crumb: 'Keamanan & integritas', admin: true, render(el, q) {
  const tab = q.tab || 'umum';
  const tabs = [['umum', 'Umum & Identitas', 'topi'], ['anticurang', 'Anti-Curang & Kode Ruang', 'perisai'], ['analitik', 'Ambang Analitik Esai', 'sidik'], ['impor', 'Impor & Migrasi Data', 'data'], ['sistem', 'Sistem & Log', 'gear']];
  el.innerHTML = Hal.header({ over: 'Modul keamanan & integritas CBT', judul: 'Pengaturan Sistem', sub: 'Perubahan berlaku untuk sesi ujian yang dimulai setelah disimpan.' }) +
    '<div class="seg mb">' + tabs.map(t => '<button data-tab="' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + ikon(t[2], 14) + ' ' + t[1] + '</button>').join('') + '</div><div id="isi"></div>';
  $$('[data-tab]', el).forEach(b => b.onclick = () => App.pergi('a/pengaturan', { tab: b.dataset.tab }));
  const isi = $('#isi');
  if (tab === 'impor') return Pengaturan.impor(isi);
  if (tab === 'sistem') return Pengaturan.sistem(isi);
  Hal.muat(isi, 'cfg.get', {}, c => Pengaturan[tab](isi, c), { maxAge: 0, kerangka: UI.skTabel(5) });
} });

const Pengaturan = {
  sw(id, label, sub, on) { return '<div class="sw-row"><div><b>' + label + '</b>' + (sub ? '<div class="tiny muted">' + sub + '</div>' : '') + '</div><label class="switch"><input type="checkbox" id="' + id + '" ' + (on ? 'checked' : '') + '><span></span></label></div>'; },
  angka(id, label, v, min, max, sat) { return '<div class="field"><label>' + label + '</label><div class="row"><input class="input mono" type="number" id="' + id + '" value="' + esc(v) + '" min="' + min + '" max="' + max + '" style="max-width:120px">' + (sat ? '<span class="small muted">' + sat + '</span>' : '') + '</div></div>'; },
  bilah(simpan) { return '<div class="card row wrap between mt" style="position:sticky;bottom:12px;z-index:5"><span class="small muted">' + ikon('info', 14) + ' Disimpan ke sheet Konfigurasi (bukan rahasia).</span><div class="row"><button class="btn ghost" onclick="App.rute()">Batal</button><button class="btn primary" id="' + simpan + '">' + ikon('cek', 16) + 'Simpan Perubahan</button></div></div>'; },
  async simpan(btn, nilai) { await UI.sibuk(btn, async () => { await UI.kirim('cfg.simpan', { nilai }); API.tandaiBasi(); App.muatPublik(); App.muatRef(true); }); },

  umum(el, c) {
    const lp = (bg, warna, teks) => '<div style="background:' + bg + ';color:' + warna + '"><div class="lg" data-logo>' + App.logoHtml() + '</div><div><div>' + teks + '</div><div class="tiny" style="opacity:.75" data-nama-app>' + esc(c.NAMA_APP) + '</div></div></div>';
    el.innerHTML = '<div class="grid g-split"><div class="card col"><h3>' + ikon('topi') + ' Identitas lembaga</h3>' +
      '<div class="field"><label>Nama resmi lembaga / sekolah <span class="wajib">*</span></label><input class="input" id="c-NAMA_LEMBAGA" value="' + esc(c.NAMA_LEMBAGA) + '"><div class="help">Tercetak di kop dokumen, kartu token, dan halaman login.</div></div>' +
      '<div class="grid g2"><div class="field"><label>Nama aplikasi</label><input class="input" id="c-NAMA_APP" value="' + esc(c.NAMA_APP) + '"></div><div class="field"><label>Tagline header</label><input class="input" id="c-TAGLINE" value="' + esc(c.TAGLINE) + '"></div></div>' +
      '<div class="grid g2"><div class="field"><label>Alamat</label><input class="input" id="c-ALAMAT" value="' + esc(c.ALAMAT) + '"></div><div class="field"><label>Kontak</label><input class="input" id="c-KONTAK" value="' + esc(c.KONTAK) + '" placeholder="Telp / email"></div></div>' +
      '<div class="grid g2"><div class="field"><label>Tahun ajaran</label><input class="input" id="c-TAHUN_AJARAN" value="' + esc(c.TAHUN_AJARAN) + '"></div><div class="field"><label>Semester</label><select class="select" id="c-SEMESTER">' + ['Ganjil', 'Genap'].map(s => '<option' + (s === c.SEMESTER ? ' selected' : '') + '>' + s + '</option>').join('') + '</select></div></div>' +
      '<div class="grid g2"><div class="field"><label>Kepala sekolah</label><input class="input" id="c-KEPALA_SEKOLAH" value="' + esc(c.KEPALA_SEKOLAH) + '"></div><div class="field"><label>NIP kepala sekolah</label><input class="input mono" id="c-NIP_KEPALA" value="' + esc(c.NIP_KEPALA) + '"></div></div>' +
      '<div class="divider"></div><h3>' + ikon('gambar') + ' Logo lembaga</h3><div class="row wrap top"><div class="drop" id="drop" style="flex:0 0 170px;height:170px;display:grid;place-items:center">' + (App.logoUrl ? '<img src="' + App.logoUrl + '" style="max-height:120px">' : '<div>' + ikon('upload', 24) + '<div class="small mt-s"><b>Seret logo</b> atau klik</div></div>') + '<input type="file" id="f-logo" class="hide" accept="image/png,image/jpeg,image/webp"></div>' +
      '<div class="grow col"><p class="small muted" style="margin:0">PNG, JPG, atau WebP, maks. 2 MB. Otomatis dikecilkan ke 512 px; latar transparan dipertahankan. Rekomendasi: PNG transparan, rasio 1:1.</p><div class="row"><button class="btn sm" id="b-ganti">' + ikon('upload', 14) + (App.logoUrl ? 'Ganti' : 'Unggah') + '</button>' + (c.ADA_LOGO ? '<button class="btn sm ghost bad" id="b-hapus">' + ikon('trash', 14) + 'Hapus</button>' : '') + '</div>' +
      '<div class="over">Pratinjau multi-panggung</div><div class="logo-prev">' + lp('var(--paper)', 'var(--text)', '1. Header terang') + lp('var(--teal)', '#fff', '2. Sidebar teal') + lp('#fff;border:1px dashed #999', '#000', '3. Kartu token') + '</div></div></div></div>' +
      '<div class="card col" style="align-self:start"><h3>' + ikon('medali') + ' Ambang standar penilaian (KKM)</h3><div class="row between"><span class="small muted">Skor ketuntasan minimal</span><b class="mono" id="kkm-v" style="font-size:22px">' + esc(c.KKM) + '</b></div><input type="range" class="range" id="c-KKM" min="50" max="100" step="1" value="' + esc(c.KKM) + '">' +
      '<div class="row between tiny muted mono"><span>50</span><span>75 (umum)</span><span>100</span></div>' + Pengaturan.sw('c-TAMPIL_NILAI', 'Tampilkan nilai ke siswa', 'Siswa melihat skor setelah menekan Kirim.', c.TAMPIL_NILAI === 'Ya') + '</div></div>' + Pengaturan.bilah('b-simpan');
    $('#c-KKM').oninput = e => { $('#kkm-v').textContent = e.target.value; };
    const drop = $('#drop'), f = $('#f-logo');
    const unggah = async file => {
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) return UI.toast('Ukuran logo maksimal 2 MB.', 'bad');
      try { const g = await UI.kecilkan(file, 512); const d = await UI.kirim('cfg.logo', { base64: g.base64, mime: g.mime }); Simpan.set('tkj_logo', d); App.logoUrl = d.dataUrl; App.terapkanMerek(); API.tandaiBasi(); App.rute(); } catch (e) { UI.toast(e.message, 'bad'); }
    };
    drop.onclick = () => f.click(); $('#b-ganti').onclick = () => f.click(); f.onchange = () => unggah(f.files[0]);
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('on'); });
    drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('on'); unggah(e.dataTransfer.files[0]); });
    const bh = $('#b-hapus'); if (bh) bh.onclick = async () => { if (!(await UI.konfirmasi('Hapus logo? Aplikasi kembali memakai logo inisial.', { bahaya: true }))) return; try { const d = await UI.kirim('cfg.logo', { hapus: true }); Simpan.set('tkj_logo', d); App.logoUrl = ''; App.terapkanMerek(); App.rute(); } catch (e) { UI.toast(e.message, 'bad'); } };
    $('#b-simpan').onclick = e => {
      const k = ['NAMA_LEMBAGA', 'NAMA_APP', 'TAGLINE', 'ALAMAT', 'KONTAK', 'TAHUN_AJARAN', 'SEMESTER', 'KEPALA_SEKOLAH', 'NIP_KEPALA', 'KKM'], n = {};
      k.forEach(x => n[x] = $('#c-' + x).value); n.TAMPIL_NILAI = $('#c-TAMPIL_NILAI').checked ? 'Ya' : 'Tidak';
      if (!n.NAMA_LEMBAGA.trim()) return UI.tandaiSalah($('#c-NAMA_LEMBAGA'), 'Nama lembaga wajib diisi.');
      Pengaturan.simpan(e.currentTarget, n);
    };
  },

  anticurang(el, c) {
    const iv = String(c.KODE_RUANG_INTERVAL);
    el.innerHTML = '<div class="grid g-split"><div class="col gap-l"><div class="card col"><div class="row between"><h3>' + ikon('pintu') + ' Kode Ruang (TOTP)</h3><label class="switch"><input type="checkbox" id="c-KODE_RUANG_WAJIB" ' + (c.KODE_RUANG_WAJIB === 'Ya' ? 'checked' : '') + '><span></span></label></div>' +
      '<p class="small muted" style="margin:0"><b>Wajibkan Kode Ruang.</b> Siswa memasukkan kode 6 digit dari layar kelas <b>satu kali</b> sebelum mulai ujian — tidak diminta lagi saat reload, koneksi putus, atau setelah buka kunci. Guru dapat menimpa pengaturan ini per paket.</p>' +
      '<div id="kr-sub" class="col"><div class="field"><label>Interval pergantian kode</label><div class="seg soft" id="c-iv">' + ['30', '60', '120'].map(x => '<button data-v="' + x + '" class="' + (x === iv ? 'on' : '') + '">' + x + ' dtk</button>').join('') + '</div><div class="help">60 detik lebih nyaman untuk kelas ramai atau siswa SD.</div></div>' +
      Pengaturan.sw('c-KODE_RUANG_SEBELUMNYA', 'Terima kode putaran sebelumnya', 'Siswa yang lambat mengetik tidak gagal karena kode baru saja berganti.', c.KODE_RUANG_SEBELUMNYA === 'Ya') + '</div>' +
      '<div class="alert soft hide" id="kr-off">' + ikon('info') + '<div class="grow">Siswa langsung mulai setelah membaca aturan.</div></div></div>' +
      '<div class="card col"><h3>' + ikon('perisai') + ' Sensor perangkat siswa</h3>' + Pengaturan.sw('c-WAJIB_LAYAR_PENUH', 'Wajib layar penuh', 'Keluar layar penuh dihitung pelanggaran. iPhone memakai mode "Tambahkan ke Layar Utama".', c.WAJIB_LAYAR_PENUH === 'Ya') +
      Pengaturan.sw('c-DETEKSI_PINDAH_TAB', 'Deteksi pindah tab / aplikasi', 'Memakai visibilitychange & blur di browser siswa.', c.DETEKSI_PINDAH_TAB === 'Ya') +
      '<div class="grid g2 mt-s">' + Pengaturan.angka('c-MAKS_PELANGGARAN', 'Maks. pelanggaran (kunci sesi)', c.MAKS_PELANGGARAN, 1, 20, 'kali') + Pengaturan.angka('c-TOLERANSI_DETIK', 'Toleransi singkat', c.TOLERANSI_DETIK, 0, 60, 'detik') + '</div></div></div>' +
      '<div class="col gap-l"><div class="card col"><h3>' + ikon('key') + ' Batas percobaan Token PIN</h3><div class="grid g2">' + Pengaturan.angka('c-PIN_MAKS_GAGAL', 'Percobaan', c.PIN_MAKS_GAGAL, 1, 10, 'kali') + Pengaturan.angka('c-PIN_JENDELA_DETIK', 'Lama kunci', c.PIN_JENDELA_DETIK, 10, 3600, 'detik') + '</div>' +
      '<div class="help">Dihitung per token dan per perangkat — bukan per IP, sehingga siswa lain di WiFi sekolah yang sama tidak ikut terkunci. Salah Kode Ruang tidak dihitung.</div></div>' +
      '<div class="card col"><h3>' + ikon('jam') + ' Sinkronisasi</h3><div class="grid g2">' + Pengaturan.angka('c-AUTOSAVE_DETIK', 'Autosave jawaban', c.AUTOSAVE_DETIK, 10, 300, 'detik') + Pengaturan.angka('c-POLLING_DETIK', 'Pembaruan monitoring', c.POLLING_DETIK, 3, 60, 'detik') + '</div>' +
      '<div class="help">Jawaban selalu tersimpan di perangkat lebih dulu. Monitoring memakai polling karena Apps Script tidak mendukung WebSocket.</div></div>' +
      '<button class="btn ghost sm" id="b-bawaan" style="align-self:flex-start">' + ikon('refresh', 14) + 'Kembalikan ke bawaan</button></div></div>' + Pengaturan.bilah('b-simpan');
    const krAtur = () => { const on = $('#c-KODE_RUANG_WAJIB').checked; $('#kr-sub').style.opacity = on ? 1 : .45; $$('#kr-sub button, #kr-sub input').forEach(x => x.disabled = !on); $('#kr-off').classList.toggle('hide', on); };
    $('#c-KODE_RUANG_WAJIB').onchange = krAtur; krAtur();
    $$('#c-iv button').forEach(b => b.onclick = () => $$('#c-iv button').forEach(x => x.classList.toggle('on', x === b)));
    $('#b-bawaan').onclick = () => { $('#c-KODE_RUANG_WAJIB').checked = false; $('#c-KODE_RUANG_SEBELUMNYA').checked = true; $('#c-WAJIB_LAYAR_PENUH').checked = true; $('#c-DETEKSI_PINDAH_TAB').checked = true; $$('#c-iv button').forEach(x => x.classList.toggle('on', x.dataset.v === '30')); [['MAKS_PELANGGARAN', 3], ['TOLERANSI_DETIK', 3], ['PIN_MAKS_GAGAL', 3], ['PIN_JENDELA_DETIK', 60], ['AUTOSAVE_DETIK', 30], ['POLLING_DETIK', 5]].forEach(x => $('#c-' + x[0]).value = x[1]); krAtur(); UI.toast('Nilai bawaan dimuat. Klik Simpan untuk menerapkan.', 'warn'); };
    $('#b-simpan').onclick = e => {
      const n = { KODE_RUANG_INTERVAL: $('#c-iv .on').dataset.v };
      ['KODE_RUANG_WAJIB', 'KODE_RUANG_SEBELUMNYA', 'WAJIB_LAYAR_PENUH', 'DETEKSI_PINDAH_TAB'].forEach(k => n[k] = $('#c-' + k).checked ? 'Ya' : 'Tidak');
      ['MAKS_PELANGGARAN', 'TOLERANSI_DETIK', 'PIN_MAKS_GAGAL', 'PIN_JENDELA_DETIK', 'AUTOSAVE_DETIK', 'POLLING_DETIK'].forEach(k => n[k] = $('#c-' + k).value);
      Pengaturan.simpan(e.currentTarget, n);
    };
  },

  analitik(el, c) {
    el.innerHTML = '<div class="grid g-split"><div class="card col"><h3>' + ikon('sidik') + ' Ambang klasifikasi analitik pengetikan esai</h3>' +
      '<div class="field"><label>% ketik minimal untuk "Wajar"</label><div class="row"><input type="range" class="range grow" id="c-AMBANG_WAJAR" min="0" max="100" value="' + esc(c.AMBANG_WAJAR) + '"><b class="mono" id="v-w" style="width:52px">' + esc(c.AMBANG_WAJAR) + '%</b></div></div>' +
      '<div class="field"><label>% ketik di bawah ini = "Dugaan Tempel"</label><div class="row"><input type="range" class="range grow" id="c-AMBANG_MENCURIGAKAN" min="0" max="100" value="' + esc(c.AMBANG_MENCURIGAKAN) + '"><b class="mono" id="v-m" style="width:52px">' + esc(c.AMBANG_MENCURIGAKAN) + '%</b></div></div>' +
      '<div class="grid g2">' + Pengaturan.angka('c-BATAS_KECEPATAN', 'Kecepatan puncak tidak wajar', c.BATAS_KECEPATAN, 100, 5000, 'karakter/menit') + Pengaturan.angka('c-TEMPEL_BESAR', 'Kejadian tempel yang dianggap banyak', c.TEMPEL_BESAR, 1, 100, 'kali') + '</div>' +
      '<button class="btn ghost sm" id="b-bawaan" style="align-self:flex-start">' + ikon('refresh', 14) + 'Kembalikan ke bawaan</button></div>' +
      '<div class="card col" style="align-self:start"><h3>' + ikon('info') + ' Cara klasifikasi</h3><div id="pratinjau"></div><p class="tiny muted">Server menghitung ulang status dari angka mentah — status yang dikirim browser tidak dipercaya. Analitik adalah indikator pendukung, bukan bukti mutlak.</p></div></div>' + Pengaturan.bilah('b-simpan');
    const prev = () => {
      const w = Number($('#c-AMBANG_WAJAR').value), m = Number($('#c-AMBANG_MENCURIGAKAN').value);
      $('#v-w').textContent = w + '%'; $('#v-m').textContent = m + '%';
      $('#pratinjau').innerHTML = '<div class="col gap-s"><div class="row">' + UI.status('Wajar') + '<span class="small">% ketik ≥ ' + w + '% dan kecepatan puncak ≤ batas</span></div><div class="row">' + UI.status('Mencurigakan') + '<span class="small">% ketik ' + m + '–' + (w - 1) + '% atau banyak kejadian tempel</span></div><div class="row">' + UI.status('Dugaan Tempel') + '<span class="small">% ketik &lt; ' + m + '% atau kecepatan puncak melebihi batas</span></div></div>' +
        (m > w ? '<div class="alert bad mt-s">' + ikon('segitiga') + '<div class="grow">Ambang Dugaan Tempel harus lebih kecil dari ambang Wajar.</div></div>' : '');
    };
    $('#c-AMBANG_WAJAR').oninput = prev; $('#c-AMBANG_MENCURIGAKAN').oninput = prev; prev();
    $('#b-bawaan').onclick = () => { $('#c-AMBANG_WAJAR').value = 70; $('#c-AMBANG_MENCURIGAKAN').value = 30; $('#c-BATAS_KECEPATAN').value = 600; $('#c-TEMPEL_BESAR').value = 3; prev(); };
    $('#b-simpan').onclick = e => { const n = {}; ['AMBANG_WAJAR', 'AMBANG_MENCURIGAKAN', 'BATAS_KECEPATAN', 'TEMPEL_BESAR'].forEach(k => n[k] = $('#c-' + k).value); Pengaturan.simpan(e.currentTarget, n); };
  },

  impor(el) {
    el.innerHTML = '<div class="grid g-split"><div class="card col"><h3>' + ikon('data') + ' Impor dari spreadsheet aplikasi lama</h3>' +
      '<p class="small muted" style="margin:0">Spreadsheet lama <b>hanya dibaca</b>, tidak pernah ditulis. Kolom dikenali berdasarkan nama header (mis. NIS, Nama, Kelas, Soal, Pilihan A, Kunci). Impor ulang tidak membuat data dobel.</p>' +
      '<div class="field"><label>URL atau ID spreadsheet lama</label><input class="input mono" id="m-src" placeholder="https://docs.google.com/spreadsheets/d/…"><div class="help">Harus dimiliki atau dibagikan ke akun Google pemilik aplikasi ini.</div></div>' +
      '<div class="field"><label>Data yang diimpor</label><div class="row wrap">' + [['Mapel', 'Mata pelajaran'], ['Siswa', 'Siswa (kunci: NIS)'], ['BankSoal', 'Bank soal (kunci: mapel + teks)']].map(x => '<label class="chip check"><input type="checkbox" class="cb" value="' + x[0] + '" checked> ' + x[1] + '</label>').join('') + '</div></div>' +
      '<div class="field"><label>Pemilik soal hasil impor</label><select class="select" id="m-pemilik"><option value="">Akun saya</option></select></div>' +
      '<label class="check"><input type="checkbox" class="cb" id="m-timpa"> Timpa data yang sudah ada (nama/kelas siswa, isi soal)</label>' +
      '<div class="row"><button class="btn" id="b-pindai">' + ikon('cari', 16) + 'Pindai (dry-run)</button><button class="btn primary" id="b-jalan">' + ikon('upload', 16) + 'Jalankan Impor</button></div><div id="hasil"></div></div>' +
      '<div class="card col" style="align-self:start"><h3>' + ikon('info') + ' Langkah cutover</h3><ol class="small" style="margin:0;padding-left:18px;line-height:1.8"><li>Impor <b>Mapel</b> dulu (otomatis berurutan: Mapel → Siswa → Soal).</li><li>Klik <b>Pindai</b> dan periksa jumlah ditambah/diperbarui.</li><li>Klik <b>Jalankan Impor</b>.</li><li>Cek Siswa &amp; Bank Soal, uji satu ujian.</li><li>Tepat sebelum pindah, jalankan impor <b>sekali lagi</b> (delta) untuk data baru di aplikasi lama.</li></ol>' +
      '<div class="alert soft mt-s">' + ikon('kunci') + '<div class="grow">Akun pengguna dan sesi lama tidak diimpor demi keamanan — buat akun guru baru di menu Pengguna.</div></div></div></div>';
    API.swr('pengguna.list', {}, d => { const s = $('#m-pemilik'); if (s) s.innerHTML = '<option value="">Akun saya</option>' + d.filter(u => u.mapel.length).map(u => '<option value="' + esc(u.id) + '">' + esc(u.nama) + '</option>').join(''); }, { diam: true }).catch(() => { });
    const jalan = async (dry, btn) => {
      const src = $('#m-src').value.trim(); if (!src) return UI.tandaiSalah($('#m-src'), 'Tempel URL spreadsheet lama.');
      const sheets = $$('.chip input:checked', el).map(i => i.value);
      if (!dry && !(await UI.konfirmasi('Jalankan impor ke database aplikasi ini?', { tombol: 'Jalankan' }))) return;
      await UI.sibuk(btn, async () => {
        const d = await UI.kirim('impor.jalankan', { sumber: src, sheets, dryRun: dry, timpa: $('#m-timpa').checked, pemilik: $('#m-pemilik').value }, { diam: dry });
        const L = d.laporan;
        $('#hasil').innerHTML = '<div class="alert ' + (dry ? '' : 'ok') + '">' + ikon(dry ? 'cari' : 'cekb') + '<div class="grow"><b>' + (dry ? 'Hasil pindai' : 'Impor selesai') + ' — ' + esc(d.sumber.nama) + '</b><p>' + (dry ? 'Belum ada data yang ditulis.' : 'Menjalankan ulang aman: data yang sama dilewati.') + '</p></div></div>' +
          '<div class="tbl-wrap mt-s"><table class="tbl"><thead><tr><th>Data</th><th class="tr">Di sumber</th><th class="tr">Ditambah</th><th class="tr">Diperbarui</th><th class="tr">Dilewati</th></tr></thead><tbody>' +
          Object.keys(L).map(k => '<tr><td><b>' + esc(k) + '</b></td><td class="tr mono">' + L[k].sumber + '</td><td class="tr mono" style="color:var(--ok)">' + L[k].ditambah + '</td><td class="tr mono">' + L[k].diperbarui + '</td><td class="tr mono muted">' + L[k].dilewati + '</td></tr>').join('') + '</tbody></table></div>' +
          (d.peringatan.length ? '<div class="alert warn mt-s">' + ikon('segitiga') + '<div class="grow"><b>Peringatan</b><p>' + d.peringatan.map(esc).join('<br>') + '</p></div></div>' : '');
        if (!dry) { API.hapusCache(); App.muatRef(true); }
      });
    };
    $('#b-pindai').onclick = e => jalan(true, e.currentTarget);
    $('#b-jalan').onclick = e => jalan(false, e.currentTarget);
  },

  sistem(el) {
    el.innerHTML = '<div class="grid g-split"><div id="log-wrap" class="card"><div class="card-h"><h3>' + ikon('daftar') + ' Log aktivitas</h3><div class="input-ikon">' + ikon('cari', 14) + '<input class="input" id="log-q" placeholder="Cari…" style="min-height:34px"></div></div><div id="log"></div></div><div id="sis" class="card col" style="align-self:start">' + UI.sk(5) + '</div></div>';
    const tabel = Tabel($('#log'), { per: 20, satuan: 'entri', urut: false, cari: r => r.pengguna + ' ' + r.aksi + ' ' + r.detail, kolom: [
      { k: 'waktu', label: 'Waktu', render: r => '<span class="mono small">' + F.tgl(r.waktu) + ' ' + F.jam(r.waktu) + '</span>' },
      { k: 'pengguna', label: 'Pengguna', render: r => '<span class="small">' + esc(r.pengguna) + '</span>' },
      { k: 'aksi', label: 'Aksi', render: r => '<span class="badge mono">' + esc(r.aksi) + '</span>' },
      { k: 'detail', label: 'Detail', render: r => '<span class="small muted">' + esc(r.detail) + '</span>' }] });
    API.swr('log.list', {}, d => tabel.set(d), { maxAge: 0 }).catch(e => { $('#log').innerHTML = UI.galat(e); });
    $('#log-q').oninput = UI.debounce(e => tabel.cari(e.target.value), 150);
    API.swr('sistem.status', {}, s => {
      $('#sis').innerHTML = '<h3>' + ikon('gear') + ' Status sistem</h3><div class="row between"><span class="muted">Versi server</span><b class="mono">v' + esc(s.versi) + '</b></div><div class="row between"><span class="muted">Zona waktu</span><span class="mono small">' + esc(s.zonaWaktu) + '</span></div>' +
        '<div class="row between"><span class="muted">Pemicu berkala</span>' + (s.pemicu.indexOf('pemicuBerkala') >= 0 ? UI.badge('Aktif · 5 menit', 'ok') : UI.badge('Belum terpasang', 'bad')) + '</div>' +
        '<div class="row between"><span class="muted">Warmup terakhir</span><span class="small">' + (s.warm ? F.relatif(new Date(s.warm.at).getTime()) + ' (' + esc(s.warm.scope) + ')' : '—') + '</span></div>' +
        '<div class="row between"><span class="muted">Script Properties</span><span class="mono small">' + F.n(s.ukuranProps / 1024, 1) + ' KB / ±500 KB</span></div><div class="divider"></div><div class="over">Jumlah baris</div>' +
        Object.keys(s.baris).map(k => '<div class="row between small"><span>' + esc(k) + '</span><span class="mono">' + s.baris[k] + '</span></div>').join('') +
        '<a class="btn sm mt-s" href="' + esc(s.spreadsheetUrl) + '" target="_blank" rel="noopener">' + ikon('data', 14) + 'Buka spreadsheet database</a><p class="tiny muted">Jangan bagikan spreadsheet database kepada siswa. Rahasia (secret sesi & Kode Ruang) ada di Script Properties, bukan di spreadsheet.</p>' +
        '<div class="divider"></div><div class="over">Kinerja browser ini</div><p class="tiny muted">Buka console (F12) lalu jalankan <span class="mono">Perf.summary()</span> untuk melihat waktu respons per aksi.</p>';
    }, { maxAge: 0 }).catch(e => { $('#sis').innerHTML = UI.galat(e); });
  }
};
