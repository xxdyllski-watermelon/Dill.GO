(function () {
  'use strict';

  var $ = BKUtils.$;
  var $$ = BKUtils.$$;
  var rupiah = BKUtils.rupiah;
  var angka = BKUtils.angka;

  var DEFAULTS = { jarak: 8, konsumsi: 40, harga: 10000, hari: 5, minggu: 4, macet: 0, penumpang: 1, bensin: 'Pertalite' };
  var MAX_HISTORY = 5;

  var form = $('#calc-form');

  /* ---------- tab ---------- */
  function showTab(name) {
    $$('.tab').forEach(function (el) { el.hidden = el.id !== 'tab-' + name; });
    $$('.tabbar button').forEach(function (btn) {
      var active = btn.dataset.tab === name;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- formulir ---------- */
  function setForm(values) {
    ['jarak', 'konsumsi', 'harga', 'hari', 'minggu'].forEach(function (k) {
      form.elements[k].value = values[k];
    });
    ['bensin', 'macet', 'penumpang'].forEach(function (k) {
      var wanted = String(values[k]);
      $$('input[name="' + k + '"]', form).forEach(function (r) { r.checked = r.value === wanted; });
    });
  }

  function readForm() {
    var data = new FormData(form);
    function num(key) {
      var v = String(data.get(key) || '').trim();
      return v === '' ? null : Number(v);
    }
    return {
      jarak: num('jarak'),
      konsumsi: num('konsumsi'),
      harga: num('harga'),
      hari: num('hari'),
      minggu: num('minggu'),
      macet: num('macet'),
      penumpang: num('penumpang'),
      bensin: data.get('bensin') || DEFAULTS.bensin
    };
  }

  function profileDefaults() {
    var p = BKProfile.get();
    var out = {};
    if (p.jarak !== '') out.jarak = p.jarak;
    if (p.konsumsi !== '') out.konsumsi = p.konsumsi;
    if (p.harga !== '') out.harga = p.harga;
    return out;
  }

  function showError(msg) {
    var el = $('#form-error');
    el.textContent = msg;
    el.hidden = false;
  }
  function clearError() { $('#form-error').hidden = true; }

  /* ---------- hasil ---------- */
  function setText(id, text) { $(id).textContent = text; }

  function renderResult(res, input) {
    setText('#res-hari', rupiah(res.biaya_per_hari));
    setText('#res-meta', res.jarak_pp_km + ' km PP, ' + res.liter_per_hari + ' liter ' + input.bensin);
    setText('#res-minggu', rupiah(res.biaya_per_minggu));
    setText('#res-bulan', rupiah(res.biaya_per_bulan));
    setText('#res-semester', rupiah(res.biaya_per_semester));
    setText('#res-liter', angka(res.liter_per_bulan) + ' L');
    setText('#res-km', rupiah(res.biaya_per_km));

    var split = $('#res-split');
    if (res.penumpang > 1) {
      split.hidden = false;
      setText('#res-split-val', rupiah(res.biaya_per_orang_per_bulan));
    } else {
      split.hidden = true;
    }

    setText('#res-engine', res.engine === 'python'
      ? 'Dihitung oleh Python (Pyodide) di browser kamu'
      : 'Dihitung oleh JavaScript cadangan (Python belum tersedia)');

    var box = $('#result');
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- riwayat ---------- */
  function loadHistory() { return BKStorage.get('history', []); }

  function addHistory(res, input) {
    var list = loadHistory();
    list.unshift({
      t: Date.now(),
      label: input.jarak + ' km - ' + input.konsumsi + ' km/L - ' + input.bensin,
      bulan: res.biaya_per_bulan
    });
    BKStorage.set('history', list.slice(0, MAX_HISTORY));
    renderHistory();
  }

  function renderHistory() {
    var list = loadHistory();
    var ul = $('#history-list');
    ul.textContent = '';
    $('#history-card').hidden = list.length === 0;

    list.forEach(function (item) {
      var li = document.createElement('li');
      var left = document.createElement('span');
      var title = document.createElement('strong');
      title.textContent = rupiah(item.bulan) + ' / bulan';
      var sub = document.createElement('small');
      var date = new Date(item.t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      sub.textContent = item.label + ' - ' + date;
      left.appendChild(title);
      left.appendChild(sub);
      li.appendChild(left);
      ul.appendChild(li);
    });
  }

  /* ---------- pasang semua event ---------- */
  function bind() {
    $$('.tabbar button').forEach(function (btn) {
      btn.addEventListener('click', function () { showTab(btn.dataset.tab); });
    });
    $('#avatar-btn').addEventListener('click', function () { showTab('profil'); });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var input = readForm();
      BKStorage.set('inputs', input);
      var res = await BKEngine.hitung(input);
      if (res.error) {
        showError(res.error);
        $('#result').hidden = true;
        return;
      }
      clearError();
      renderResult(res, input);
      addHistory(res, input);
    });

    $('#btn-reset-form').addEventListener('click', function () {
      setForm(Object.assign({}, DEFAULTS, profileDefaults()));
      clearError();
      $('#result').hidden = true;
    });

    $('#btn-clear-history').addEventListener('click', function () {
      BKStorage.remove('history');
      renderHistory();
    });

    $('#btn-clear-all').addEventListener('click', function () {
      if (!confirm('Hapus profil, tema, dan riwayat dari perangkat ini?')) return;
      BKStorage.clearAll();
      location.reload();
    });

    BKEngine.onStatus(function (s) {
      var badge = $('#engine-badge');
      badge.dataset.state = s;
      $('span', badge).textContent =
        s === 'python' ? 'Python aktif' :
        s === 'fallback' ? 'Mode cadangan JS' : 'Memuat Python...';
    });
  }

  /* ---------- mulai ---------- */
  function start() {
    BKTheme.init();
    BKProfile.init(function () {
      // Saat profil disimpan, nilai bawaan (jarak, konsumsi, harga) ikut mengisi kalkulator.
      var d = profileDefaults();
      if (Object.keys(d).length) setForm(Object.assign({}, readForm(), d));
    });

    var saved = BKStorage.get('inputs', null);
    setForm(Object.assign({}, DEFAULTS, profileDefaults(), saved || {}));

    bind();
    renderHistory();
    showTab('hitung');
    BKEngine.init();
  }

  start();
})();
