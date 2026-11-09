(function (global) {
  'use strict';

  var MINGGU_PER_SEMESTER = 16;

  function bulatkan(nilai, desimal) {
    desimal = desimal || 0;
    var faktor = Math.pow(10, desimal);
    return Math.floor(nilai * faktor + 0.5) / faktor;
  }

  function angka(nilai, nama) {
    if (nilai === null || nilai === undefined || nilai === '' || typeof nilai === 'boolean') {
      throw new Error(nama + ' harus berupa angka');
    }
    var n = Number(nilai);
    if (!isFinite(n)) throw new Error(nama + ' harus berupa angka');
    return n;
  }

  function hitung(d) {
    try {
      var jarak = angka(d.jarak, 'Jarak');
      var konsumsi = angka(d.konsumsi, 'Konsumsi motor');
      var harga = angka(d.harga, 'Harga bensin');
      var hari = angka(d.hari === undefined ? 5 : d.hari, 'Hari kuliah per minggu');
      var minggu = angka(d.minggu === undefined ? 4 : d.minggu, 'Minggu kuliah per bulan');
      var macet = angka(d.macet === undefined ? 0 : d.macet, 'Faktor macet');
      var orang = angka(d.penumpang === undefined ? 1 : d.penumpang, 'Jumlah penumpang');

      if (!(jarak > 0 && jarak <= 500)) throw new Error('Jarak harus lebih dari 0 dan maksimal 500 km');
      if (!(konsumsi > 0 && konsumsi <= 100)) throw new Error('Konsumsi motor harus lebih dari 0 dan maksimal 100 km/L');
      if (!(harga > 0)) throw new Error('Harga bensin harus lebih dari 0');
      if (hari !== Math.floor(hari) || hari < 1 || hari > 7) throw new Error('Hari kuliah per minggu harus bilangan bulat 1 sampai 7');
      if (minggu !== Math.floor(minggu) || minggu < 1 || minggu > 6) throw new Error('Minggu kuliah per bulan harus bilangan bulat 1 sampai 6');
      if (macet < 0 || macet > 100) throw new Error('Faktor macet harus antara 0 sampai 100 persen');
      if (orang !== Math.floor(orang) || orang < 1 || orang > 2) throw new Error('Jumlah penumpang harus 1 (sendiri) atau 2 (boncengan)');

      var jarakPP = jarak * 2;
      var literHari = jarakPP / konsumsi * (1 + macet / 100);
      var biayaHari = literHari * harga;
      var biayaMinggu = biayaHari * hari;
      var biayaBulan = biayaMinggu * minggu;
      var biayaSemester = biayaMinggu * MINGGU_PER_SEMESTER;

      return {
        jarak_pp_km: bulatkan(jarakPP, 2),
        liter_per_hari: bulatkan(literHari, 2),
        liter_per_bulan: bulatkan(literHari * hari * minggu, 1),
        biaya_per_hari: bulatkan(biayaHari),
        biaya_per_minggu: bulatkan(biayaMinggu),
        biaya_per_bulan: bulatkan(biayaBulan),
        biaya_per_semester: bulatkan(biayaSemester),
        biaya_per_km: bulatkan(biayaHari / jarakPP),
        biaya_per_orang_per_bulan: bulatkan(biayaBulan / orang),
        penumpang: orang,
        faktor_macet_persen: macet
      };
    } catch (err) {
      return { error: err.message };
    }
  }

  var api = { hitung: hitung };
  global.BKFallback = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
