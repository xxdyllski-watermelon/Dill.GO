"""Tes sederhana untuk calculator.py.  Jalankan:  python -m unittest discover py"""

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))

from calculator import hitung, hitung_json  # noqa: E402


class TestHitung(unittest.TestCase):
    def test_kasus_dasar(self):
        r = hitung(10, 40, 10000, 5, 4, 0, 1)
        self.assertEqual(r["jarak_pp_km"], 20)
        self.assertEqual(r["liter_per_hari"], 0.5)
        self.assertEqual(r["biaya_per_hari"], 5000)
        self.assertEqual(r["biaya_per_minggu"], 25000)
        self.assertEqual(r["biaya_per_bulan"], 100000)
        self.assertEqual(r["biaya_per_semester"], 400000)
        self.assertEqual(r["biaya_per_km"], 250)

    def test_macet_menambah_konsumsi(self):
        r = hitung(10, 40, 10000, 5, 4, 25, 1)
        self.assertEqual(r["liter_per_hari"], 0.63)  # 0.625 dibulatkan naik
        self.assertEqual(r["biaya_per_hari"], 6250)
        self.assertEqual(r["biaya_per_bulan"], 125000)

    def test_boncengan_dibagi_dua(self):
        r = hitung(10, 40, 10000, 5, 4, 0, 2)
        self.assertEqual(r["biaya_per_orang_per_bulan"], 50000)
        self.assertEqual(r["biaya_per_bulan"], 100000)

    def test_input_tidak_valid(self):
        with self.assertRaises(ValueError):
            hitung(0, 40, 10000)
        with self.assertRaises(ValueError):
            hitung(10, -5, 10000)
        with self.assertRaises(ValueError):
            hitung(10, 40, 10000, hari_per_minggu=8)
        with self.assertRaises(ValueError):
            hitung("abc", 40, 10000)
        with self.assertRaises(ValueError):
            hitung(10, 40, 10000, penumpang=3)

    def test_hitung_json(self):
        payload = json.dumps({"jarak": 10, "konsumsi": 40, "harga": 10000})
        hasil = json.loads(hitung_json(payload))
        self.assertEqual(hasil["biaya_per_bulan"], 100000)

    def test_hitung_json_error(self):
        hasil = json.loads(hitung_json(json.dumps({"jarak": 0, "konsumsi": 40, "harga": 1})))
        self.assertIn("error", hasil)
        hasil = json.loads(hitung_json("bukan json"))
        self.assertIn("error", hasil)


if __name__ == "__main__":
    unittest.main()
