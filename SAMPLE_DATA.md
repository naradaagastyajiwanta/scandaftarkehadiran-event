# Contoh Data untuk Google Sheets

Berikut adalah contoh struktur dan data yang bisa Anda gunakan untuk testing aplikasi:

## Struktur Sheet "Peserta"

| A (ID)    | B (Nama)              | C (Instansi)           | D (Status)      |
|-----------|----------------------|------------------------|-----------------|
| 8971010E  | Ahmad Rizki Pratama  | PT Teknologi Nusantara | Belum Hadir     |
| 8971010F  | Siti Nurhaliza       | Universitas Indonesia  | Belum Hadir     |
| 8971010G  | Budi Santoso         | CV Digital Solusi      | Belum Hadir     |
| 8971010H  | Maya Sari            | Bank Mandiri           | Belum Hadir     |
| 8971010I  | Eko Prasetyo         | Telkom Indonesia       | Belum Hadir     |

## Format QR Code

QR Code harus berisi hanya ID peserta, contoh:
- `8971010E`
- `8971010F`
- `8971010G`

## Format ID yang Disarankan

Untuk memudahkan identifikasi, gunakan format:
- **Angka**: `001`, `002`, `003`
- **Alphanumeric**: `EVT001`, `EVT002`, `EVT003`
- **Mixed**: `8971010E`, `8971010F`, `8971010G`

## Cara Input ke Google Sheets

1. Buat sheet baru dengan nama "Peserta"
2. Di baris pertama (header), masukkan:
   - A1: `ID`
   - B1: `Nama`
   - C1: `Instansi`
   - D1: `Status`

3. Mulai dari baris 2, masukkan data peserta:
   ```
   A2: 8971010E    B2: Ahmad Rizki Pratama    C2: PT Teknologi Nusantara    D2: (kosong)
   A3: 8971010F    B3: Siti Nurhaliza        C3: Universitas Indonesia     D3: (kosong)
   ```

4. Kolom D (Status) akan otomatis diisi oleh aplikasi saat peserta di-scan

## Tips

- Pastikan ID peserta unik dan tidak ada duplikat
- Gunakan ID yang mudah di-scan QR code (hindari karakter khusus)
- Kolom Status sebaiknya dibiarkan kosong atau diisi "Belum Hadir"
- Jangan ubah urutan kolom A-D

## Test Data CSV

Jika ingin import dari CSV, gunakan format ini:

```csv
ID,Nama,Instansi,Status
8971010E,Ahmad Rizki Pratama,PT Teknologi Nusantara,Belum Hadir
8971010F,Siti Nurhaliza,Universitas Indonesia,Belum Hadir
8971010G,Budi Santoso,CV Digital Solusi,Belum Hadir
8971010H,Maya Sari,Bank Mandiri,Belum Hadir
8971010I,Eko Prasetyo,Telkom Indonesia,Belum Hadir
```
