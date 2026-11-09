/* utils.js - fungsi bantu kecil yang dipakai di banyak file. */
(function (global) {
  'use strict';

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

  var nf = new Intl.NumberFormat('id-ID');

  function rupiah(n) { return 'Rp ' + nf.format(n); }
  function angka(n) { return nf.format(n); }

  var toastTimer = null;
  function toast(pesan) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = pesan;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  /* Perkecil gambar sebelum disimpan, supaya muat di localStorage (batas ~5 MB). */
  function resizeImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) {
        reject(new Error('File harus berupa gambar'));
        return;
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Gagal membaca gambar'));
      };
      img.src = url;
    });
  }

  global.BKUtils = { $: $, $$: $$, rupiah: rupiah, angka: angka, toast: toast, resizeImage: resizeImage };
})(window);
