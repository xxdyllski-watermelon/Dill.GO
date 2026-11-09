# Dill.GO

Web app untuk menghitung biaya bensin motor pulang-pergi (PP) ke kampus: per hari, minggu, bulan, dan semester. Logika perhitungannya ditulis dalam **Python** dan dijalankan langsung di browser memakai [Pyodide](https://pyodide.org). Tidak butuh server.

Fitur:

- Kalkulator: jarak, konsumsi motor (km/L), harga bensin, hari kuliah, kondisi lalu lintas, dan patungan boncengan
- Tema yang bisa diganti: 7 tema siap pakai, tombol Acak, warna utama/aksen sendiri, latar belakang warna / gradien / gambar sendiri
- Profil pengguna: nama, kampus, prodi, motor, foto, dan nilai bawaan kalkulator
- Riwayat 5 hitungan terakhir
- Semua data disimpan di browser (localStorage), tidak dikirim ke mana pun

## Catatan

- Harga bensin tidak diisi otomatis karena bisa berubah. Isi sesuai harga di SPBU-mu, atau simpan sebagai nilai bawaan di tab Profil.
- Pyodide diunduh dari CDN (sekitar beberapa MB) saat halaman pertama kali dibuka; setelahnya biasanya di-cache browser.
