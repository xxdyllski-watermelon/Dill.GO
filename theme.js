(function (global) {
  'use strict';

  var $ = BKUtils.$;
  var $$ = BKUtils.$$;

  var THEMES = [
    { id: 'indigo', label: 'Indigo', primary: '#5050bf', soft: '#fde8cf', accent: '#ffd966' },
    { id: 'sunset', label: 'Sunset', primary: '#e8590c', soft: '#ffe8d6', accent: '#ffd43b' },
    { id: 'forest', label: 'Forest', primary: '#2b8a5a', soft: '#e3f3d3', accent: '#ffe066' },
    { id: 'ocean', label: 'Ocean', primary: '#0b7285', soft: '#d3f0f7', accent: '#ffd8a8' },
    { id: 'rose', label: 'Rose', primary: '#c2255c', soft: '#ffe0ea', accent: '#ffe3a3' },
    { id: 'mocha', label: 'Mocha', primary: '#7a5230', soft: '#f3e5d3', accent: '#f5c26b' },
    { id: 'night', label: 'Night', primary: '#8c8cf2', soft: '#2b2b52', accent: '#ffd966' }
  ];

  var GRADIENTS = [
    ['#e0e3ff', '#fde8cf'],
    ['#ffd6a5', '#ffadad'],
    ['#caffbf', '#9bf6ff'],
    ['#bdb2ff', '#ffc6ff'],
    ['#a0c4ff', '#fdffb6'],
    ['#1a1a40', '#3b3b8f']
  ];

  var DEFAULT_STATE = { theme: 'indigo', primary: null, accent: null, bg: { mode: 'theme' } };
  var state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  var root = document.documentElement;
  var layer = null;

  /* ---------- fungsi warna ---------- */
  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(rgb) {
    return '#' + rgb.map(function (v) {
      return Math.round(v).toString(16).padStart(2, '0');
    }).join('');
  }
  function luminance(hex) {
    var c = hexToRgb(hex).map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  /* Pilih teks gelap/terang agar tetap terbaca di atas warna latar. */
  function onColor(hex) { return luminance(hex) > 0.35 ? '#1d1d3a' : '#ffffff'; }
  /* amt negatif = lebih gelap, positif = lebih terang (-1 sampai 1). */
  function shade(hex, amt) {
    return rgbToHex(hexToRgb(hex).map(function (v) {
      return amt < 0 ? v * (1 + amt) : v + (255 - v) * amt;
    }));
  }

  /* ---------- menerapkan state ke halaman ---------- */
  function currentVar(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  function applyColors() {
    root.dataset.theme = state.theme;

    if (state.primary) {
      root.style.setProperty('--primary', state.primary);
      root.style.setProperty('--primary-deep', shade(state.primary, -0.22));
      root.style.setProperty('--on-primary', onColor(state.primary));
    } else {
      ['--primary', '--primary-deep', '--on-primary'].forEach(function (p) { root.style.removeProperty(p); });
    }

    if (state.accent) {
      root.style.setProperty('--accent', state.accent);
      root.style.setProperty('--on-accent', onColor(state.accent));
    } else {
      ['--accent', '--on-accent'].forEach(function (p) { root.style.removeProperty(p); });
    }

    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', currentVar('--primary') || '#5050bf');
  }

  function applyBackground() {
    var b = state.bg;
    root.classList.remove('custom-bg');
    layer.style.background = '';

    if (b.mode === 'solid') {
      layer.style.background = b.c1;
      root.classList.add('custom-bg');
    } else if (b.mode === 'gradient') {
      layer.style.background = 'linear-gradient(160deg, ' + b.c1 + ', ' + b.c2 + ')';
      root.classList.add('custom-bg');
    } else if (b.mode === 'image' && b.data) {
      layer.style.background = 'url("' + b.data + '") center / cover no-repeat';
      root.classList.add('custom-bg');
    }
  }

  function save() {
    return BKStorage.set('theme', state);
  }

  function apply() {
    applyColors();
    applyBackground();
    syncControls();
  }

  /* ---------- kontrol di tab "Tema" ---------- */
  function renderThemeGrid() {
    var grid = $('#theme-grid');
    grid.textContent = '';
    THEMES.forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-swatch';
      btn.dataset.id = t.id;
      btn.setAttribute('aria-label', 'Tema ' + t.label);

      var preview = document.createElement('span');
      preview.className = 'swatch-preview';
      preview.style.background = t.primary;
      var soft = document.createElement('i');
      soft.style.background = t.soft;
      var acc = document.createElement('b');
      acc.style.background = t.accent;
      preview.appendChild(soft);
      preview.appendChild(acc);

      var name = document.createElement('span');
      name.className = 'swatch-name';
      name.textContent = t.label;

      btn.appendChild(preview);
      btn.appendChild(name);
      btn.addEventListener('click', function () { chooseTheme(t.id); });
      grid.appendChild(btn);
    });
  }

  function renderGradientChips() {
    var box = $('#gradient-presets');
    box.textContent = '';
    GRADIENTS.forEach(function (g) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'gradient-chip';
      chip.style.background = 'linear-gradient(160deg, ' + g[0] + ', ' + g[1] + ')';
      chip.setAttribute('aria-label', 'Gradien ' + g[0] + ' ke ' + g[1]);
      chip.addEventListener('click', function () {
        state.bg = { mode: 'gradient', c1: g[0], c2: g[1] };
        save();
        apply();
      });
      box.appendChild(chip);
    });
  }

  function syncControls() {
    $$('.theme-swatch').forEach(function (el) {
      el.classList.toggle('active', el.dataset.id === state.theme);
    });

    var p = $('#pick-primary');
    var a = $('#pick-accent');
    if (p) p.value = normalizeHex(currentVar('--primary'), '#5050bf');
    if (a) a.value = normalizeHex(currentVar('--accent'), '#ffd966');

    var mode = state.bg.mode;
    $$('input[name="bgmode"]').forEach(function (r) { r.checked = r.value === mode; });
    $$('[data-panel]').forEach(function (el) { el.hidden = el.dataset.panel !== mode; });

    if (mode === 'solid') $('#bg-c1').value = state.bg.c1;
    if (mode === 'gradient') {
      $('#bg-g1').value = state.bg.c1;
      $('#bg-g2').value = state.bg.c2;
    }
  }

  function normalizeHex(value, fallback) {
    return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  }

  function chooseTheme(id) {
    state.theme = id;
    state.primary = null;
    state.accent = null;
    save();
    apply();
  }

  function randomize() {
    var t = THEMES[Math.floor(Math.random() * THEMES.length)];
    state.theme = t.id;
    state.primary = null;
    state.accent = null;
    if (Math.random() < 0.5) {
      var g = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
      state.bg = { mode: 'gradient', c1: g[0], c2: g[1] };
    } else {
      state.bg = { mode: 'theme' };
    }
    save();
    apply();
    BKUtils.toast('Tema ' + t.label + ' dipakai');
  }

  function bindControls() {
    $('#btn-random').addEventListener('click', randomize);

    $('#pick-primary').addEventListener('input', function (e) {
      state.primary = e.target.value;
      applyColors();
    });
    $('#pick-primary').addEventListener('change', save);

    $('#pick-accent').addEventListener('input', function (e) {
      state.accent = e.target.value;
      applyColors();
    });
    $('#pick-accent').addEventListener('change', save);

    $('#btn-reset-colors').addEventListener('click', function () {
      state.primary = null;
      state.accent = null;
      save();
      apply();
    });

    $$('input[name="bgmode"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var mode = r.value;
        if (mode === 'theme') state.bg = { mode: 'theme' };
        if (mode === 'solid') state.bg = { mode: 'solid', c1: $('#bg-c1').value };
        if (mode === 'gradient') state.bg = { mode: 'gradient', c1: $('#bg-g1').value, c2: $('#bg-g2').value };
        if (mode === 'image') state.bg = state.bg.data ? state.bg : { mode: 'image', data: null };
        save();
        apply();
      });
    });

    $('#bg-c1').addEventListener('input', function (e) {
      state.bg = { mode: 'solid', c1: e.target.value };
      applyBackground();
    });
    $('#bg-c1').addEventListener('change', save);

    function gradientInput() {
      state.bg = { mode: 'gradient', c1: $('#bg-g1').value, c2: $('#bg-g2').value };
      applyBackground();
    }
    $('#bg-g1').addEventListener('input', gradientInput);
    $('#bg-g2').addEventListener('input', gradientInput);
    $('#bg-g1').addEventListener('change', save);
    $('#bg-g2').addEventListener('change', save);

    $('#bg-file').addEventListener('change', function (e) {
      var file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      BKUtils.resizeImage(file, 1400, 0.78).then(function (data) {
        var previous = state.bg;
        state.bg = { mode: 'image', data: data };
        if (!save()) {
          state.bg = previous;
          BKUtils.toast('Gambar terlalu besar untuk disimpan, coba gambar lain');
          return;
        }
        apply();
        BKUtils.toast('Latar belakang diganti');
      }).catch(function (err) { BKUtils.toast(err.message); });
    });

    $('#btn-remove-bg').addEventListener('click', function () {
      state.bg = { mode: 'theme' };
      save();
      apply();
    });
  }

  function init() {
    layer = $('#bg-layer');
    var saved = BKStorage.get('theme', null);
    if (saved && saved.theme) {
      state = {
        theme: saved.theme,
        primary: saved.primary || null,
        accent: saved.accent || null,
        bg: saved.bg && saved.bg.mode ? saved.bg : { mode: 'theme' }
      };
    }
    renderThemeGrid();
    renderGradientChips();
    bindControls();
    apply();
  }

  global.BKTheme = { init: init };
})(window);
