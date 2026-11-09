"""
calculator.py - logika perhitungan biaya bensin motor pulang-pergi (PP) kampus.

File ini dijalankan di dalam browser lewat Pyodide (lihat js/engine.js),
tetapi juga bisa dijalankan langsung di terminal:

    python py/calculator.py

Rumus utama:
    jarak_pp      = jarak_sekali_jalan * 2
    liter_per_hari = jarak_pp / konsumsi_km_per_liter * (1 + faktor_macet / 100)
    biaya_per_hari = liter_per_hari * harga_per_liter
"""

import json
import math
import sys

MINGGU_PER_SEMESTER = 16  # asumsi: 1 semester kuliah = 16 minggu


def bulatkan(nilai, desimal=0):
    """Pembulatan biasa (0.5 naik). Sengaja tidak memakai round() bawaan Python
    karena round() memakai "banker's rounding" sehingga bisa berbeda dengan
    Math.round di JavaScript (js/fallback.js)."""
    faktor = 10 ** desimal
    hasil = math.floor(nilai * faktor + 0.5) / faktor
    return int(hasil) if desimal == 0 else hasil


def _angka(nilai, nama):
    """Ubah input menjadi float dan pastikan nilainya berupa angka yang valid."""
    try:
        angka = float(nilai)
    except (TypeError, ValueError):
        raise ValueError(f"{nama} harus berupa angka")
    if not math.isfinite(angka):
        raise ValueError(f"{nama} harus berupa angka")
    return angka


def hitung(
    jarak_km,
    konsumsi_kml,
    harga_liter,
    hari_per_minggu=5,
    minggu_per_bulan=4,
    faktor_macet_persen=0,
    penumpang=1,
):
    """Hitung biaya bensin dan kembalikan hasilnya dalam bentuk dict.

    Parameter
    ---------
    jarak_km            : jarak rumah/kos ke kampus, SEKALI JALAN (km)
    konsumsi_kml        : konsumsi motor (km per liter)
    harga_liter         : harga bensin per liter (Rupiah)
    hari_per_minggu     : jumlah hari ke kampus dalam seminggu (1-7)
    minggu_per_bulan    : jumlah minggu kuliah dalam sebulan (1-6)
    faktor_macet_persen : tambahan konsumsi akibat macet, 0-100 (%)
    penumpang           : 1 = sendiri, 2 = boncengan (biaya dibagi dua)
    """
    jarak = _angka(jarak_km, "Jarak")
    konsumsi = _angka(konsumsi_kml, "Konsumsi motor")
    harga = _angka(harga_liter, "Harga bensin")
    hari = _angka(hari_per_minggu, "Hari kuliah per minggu")
    minggu = _angka(minggu_per_bulan, "Minggu kuliah per bulan")
    macet = _angka(faktor_macet_persen, "Faktor macet")
    orang = _angka(penumpang, "Jumlah penumpang")

    if not 0 < jarak <= 500:
        raise ValueError("Jarak harus lebih dari 0 dan maksimal 500 km")
    if not 0 < konsumsi <= 100:
        raise ValueError("Konsumsi motor harus lebih dari 0 dan maksimal 100 km/L")
    if harga <= 0:
        raise ValueError("Harga bensin harus lebih dari 0")
    if hari != int(hari) or not 1 <= hari <= 7:
        raise ValueError("Hari kuliah per minggu harus bilangan bulat 1 sampai 7")
    if minggu != int(minggu) or not 1 <= minggu <= 6:
        raise ValueError("Minggu kuliah per bulan harus bilangan bulat 1 sampai 6")
    if not 0 <= macet <= 100:
        raise ValueError("Faktor macet harus antara 0 sampai 100 persen")
    if orang != int(orang) or not 1 <= orang <= 2:
        raise ValueError("Jumlah penumpang harus 1 (sendiri) atau 2 (boncengan)")

    jarak_pp = jarak * 2
    liter_hari = jarak_pp / konsumsi * (1 + macet / 100)
    biaya_hari = liter_hari * harga
    biaya_minggu = biaya_hari * hari
    biaya_bulan = biaya_minggu * minggu
    biaya_semester = biaya_minggu * MINGGU_PER_SEMESTER

    return {
        "jarak_pp_km": bulatkan(jarak_pp, 2),
        "liter_per_hari": bulatkan(liter_hari, 2),
        "liter_per_bulan": bulatkan(liter_hari * hari * minggu, 1),
        "biaya_per_hari": bulatkan(biaya_hari),
        "biaya_per_minggu": bulatkan(biaya_minggu),
        "biaya_per_bulan": bulatkan(biaya_bulan),
        "biaya_per_semester": bulatkan(biaya_semester),
        "biaya_per_km": bulatkan(biaya_hari / jarak_pp),
        "biaya_per_orang_per_bulan": bulatkan(biaya_bulan / orang),
        "penumpang": int(orang),
        "faktor_macet_persen": macet,
    }


def hitung_json(payload_json):
    """Jembatan untuk JavaScript: terima JSON string, kembalikan JSON string.

    Jika input tidak valid, hasilnya {"error": "pesan kesalahan"}.
    """
    try:
        data = json.loads(payload_json)
        hasil = hitung(
            data.get("jarak"),
            data.get("konsumsi"),
            data.get("harga"),
            data.get("hari", 5),
            data.get("minggu", 4),
            data.get("macet", 0),
            data.get("penumpang", 1),
        )
    except ValueError as err:
        hasil = {"error": str(err)}
    except Exception:  # data rusak / bukan JSON object
        hasil = {"error": "Data masukan tidak valid"}
    return json.dumps(hasil)


def _demo():
    contoh = hitung(jarak_km=8, konsumsi_kml=40, harga_liter=10000)
    print("Contoh: 8 km sekali jalan, 40 km/L, Rp10.000/L, 5 hari/minggu")
    for kunci, nilai in contoh.items():
        print(f"  {kunci:28s}: {nilai}")


# Di Pyodide, sys.platform == "emscripten" sehingga demo ini tidak ikut jalan.
if __name__ == "__main__" and sys.platform != "emscripten":
    _demo()
