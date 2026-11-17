/*
 * profile.js - profil pengguna (nama, kampus, motor, foto, nilai bawaan).
 * Data disimpan di localStorage lewat BKStorage.
 */
(function (global) {
  'use strict';

  var $ = BKUtils.$;

  var EMPTY = {
    nama: '', kampus: '', prodi: '', motor: '',
    konsumsi: '', jarak: '', harga: '', foto: null
  };
  var profile = Object.assign({}, EMPTY);
  var onSaved = null;
  // Teks sambutan bawaan diambil dari index.html, jadi kalau kamu mengubah
  // tulisannya di HTML, itulah yang tampil saat profil masih kosong.
  var defaultHello = '';
  var defaultSub = '';

  function get() { return profile; }

  function firstName() {
    return (profile.nama || '').trim().split(/\s+/)[0] || '';
  }

  /* Tampilkan foto/inisial di avatar kecil pada header dan di tab profil. */
  function renderAvatar() {
    var initial = (profile.nama || '?').trim().charAt(0).toUpperCase() || '?';
    [['#avatar-img', '#avatar-fallback'], ['#profile-img', '#profile-fallback']].forEach(function (pair) {
      var img = $(pair[0]);
      var fb = $(pair[1]);
      if (profile.foto) {
        img.src = profile.foto;
        img.hidden = false;
        fb.hidden = true;
      } else {
        img.removeAttribute('src');
        img.hidden = true;
        fb.hidden = false;
        fb.textContent = initial;
      }
    });
  }

  function renderGreeting() {
    var name = firstName();
    $('#hero-hello').textContent = name ? 'Halo, ' + name + '!' : defaultHello;
    var detail = [profile.prodi, profile.kampus].filter(Boolean).join(' - ');
    $('#hero-sub').textContent = detail || defaultSub;
  }

  function fillForm() {
    var form = $('#profile-form');
    ['nama', 'kampus', 'prodi', 'motor', 'konsumsi', 'jarak', 'harga'].forEach(function (k) {
      form.elements[k].value = profile[k] || '';
    });
  }

  function render() {
    renderAvatar();
    renderGreeting();
  }

  function saveFromForm() {
    var form = $('#profile-form');
    var next = Object.assign({}, profile);
    ['nama', 'kampus', 'prodi', 'motor'].forEach(function (k) {
      next[k] = form.elements[k].value.trim().slice(0, 60);
    });
    ['konsumsi', 'jarak', 'harga'].forEach(function (k) {
      var v = form.elements[k].value.trim();
      next[k] = v === '' ? '' : Number(v);
    });
    if (!BKStorage.set('profile', next)) {
      BKUtils.toast('Gagal menyimpan profil (penyimpanan penuh?)');
      return;
    }
    profile = next;
    render();
    BKUtils.toast('Profil disimpan');
    if (onSaved) onSaved(profile);
  }

  function bind() {
    $('#profile-form').addEventListener('submit', function (e) {
      e.preventDefault();
      saveFromForm();
    });

    $('#photo-file').addEventListener('change', function (e) {
      var file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      BKUtils.resizeImage(file, 256, 0.85).then(function (data) {
        var next = Object.assign({}, profile, { foto: data });
        if (!BKStorage.set('profile', next)) {
          BKUtils.toast('Foto terlalu besar untuk disimpan');
          return;
        }
        profile = next;
        renderAvatar();
        BKUtils.toast('Foto profil diganti');
      }).catch(function (err) { BKUtils.toast(err.message); });
    });

    $('#btn-remove-photo').addEventListener('click', function () {
      profile = Object.assign({}, profile, { foto: null });
      BKStorage.set('profile', profile);
      renderAvatar();
    });
  }

  function init(callback) {
    onSaved = callback;
    defaultHello = $('#hero-hello').textContent;
    defaultSub = $('#hero-sub').textContent;
    var saved = BKStorage.get('profile', null);
    if (saved) profile = Object.assign({}, EMPTY, saved);
    fillForm();
    render();
    bind();
  }

  function reset() {
    profile = Object.assign({}, EMPTY);
    fillForm();
    render();
  }

  global.BKProfile = { init: init, get: get, reset: reset };
})(window);
