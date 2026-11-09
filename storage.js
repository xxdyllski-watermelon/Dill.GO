(function (global) {
  'use strict';

  var PREFIX = 'bk:v1:';

  var BKStorage = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false; // penyimpanan penuh atau diblokir
      }
    },
    remove: function (key) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) { /* abaikan */ }
    },
    clearAll: function () {
      try {
        Object.keys(localStorage).forEach(function (k) {
          if (k.indexOf(PREFIX) === 0) localStorage.removeItem(k);
        });
      } catch (e) { /* abaikan */ }
    }
  };

  global.BKStorage = BKStorage;
})(window);
