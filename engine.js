/*
 * engine.js - jembatan antara halaman web (JavaScript) dan logika Python.
 *
 * Alurnya:
 *   1. Muat Pyodide (Python versi WebAssembly) dari CDN.
 *   2. Ambil py/calculator.py lalu jalankan di Pyodide.
 *   3. Saat tombol "Hitung" ditekan, kirim data ke fungsi Python hitung_json().
 *   4. Jika Pyodide gagal dimuat (offline / diblokir), pakai js/fallback.js.
 */
(function (global) {
  'use strict';

  var PYODIDE_VERSION = '0.26.4';
  var BASE = 'https://cdn.jsdelivr.net/pyodide/v' + PYODIDE_VERSION + '/full/';

  var hitungJson = null;
  var status = 'loading'; // loading | python | fallback
  var listeners = [];

  function setStatus(s) {
    status = s;
    listeners.forEach(function (fn) { fn(s); });
  }

  function onStatus(fn) {
    listeners.push(fn);
    fn(status);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement('script');
      el.src = src;
      el.onload = resolve;
      el.onerror = function () { reject(new Error('Gagal memuat ' + src)); };
      document.head.appendChild(el);
    });
  }

  async function initPython() {
    try {
      await loadScript(BASE + 'pyodide.js');
      var pyodide = await global.loadPyodide({ indexURL: BASE });
      var res = await fetch('calculator.py');
      if (!res.ok) throw new Error('calculator.py tidak ditemukan');
      pyodide.runPython(await res.text());
      hitungJson = pyodide.globals.get('hitung_json');
      setStatus('python');
    } catch (err) {
      console.warn('[engine] Python tidak tersedia, memakai JavaScript cadangan.', err);
      setStatus('fallback');
    }
  }

  async function hitung(input) {
    var raw, engine;
    if (hitungJson) {
      raw = hitungJson(JSON.stringify(input));
      engine = 'python';
    } else {
      raw = JSON.stringify(global.BKFallback.hitung(input));
      engine = 'js';
    }
    var data = JSON.parse(raw);
    data.engine = engine;
    return data;
  }

  global.BKEngine = { init: initPython, hitung: hitung, onStatus: onStatus };
})(window);
