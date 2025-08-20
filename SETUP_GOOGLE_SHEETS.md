# Setup Google Sheets API

Panduan lengkap untuk mengonfigurasi Google Sheets API untuk aplikasi verifikasi peserta.

## Langkah 1: Persiapan Google Cloud Console

1. **Buka Google Cloud Console**
   - Kunjungi: https://console.cloud.google.com/
   - Login dengan akun Google Anda

2. **Buat Project Baru (jika belum ada)**
   - Klik "Select a project" di bagian atas
   - Klik "New Project"
   - Beri nama project: "Event Verification App"
   - Klik "Create"

3. **Aktifkan Google Sheets API**
   - Di sidebar, pilih "APIs & Services" > "Library"
   - Cari "Google Sheets API"
   - Klik dan pilih "Enable"

## Langkah 2: Buat Service Account

1. **Buat Service Account**
   - Di sidebar, pilih "APIs & Services" > "Credentials"
   - Klik "Create Credentials" > "Service Account"
   - Beri nama: "event-verification-service"
   - Beri deskripsi: "Service account for event verification app"
   - Klik "Create and Continue"

2. **Set Role (optional)**
   - Skip atau pilih "Basic" > "Editor"
   - Klik "Continue"

3. **Generate Key**
   - Klik pada service account yang baru dibuat
   - Pilih tab "Keys"
   - Klik "Add Key" > "Create New Key"
   - Pilih "JSON" dan klik "Create"
   - File JSON akan didownload - **SIMPAN FILE INI DENGAN AMAN!**

## Langkah 3: Setup Google Sheets

1. **Buat Google Sheets**
   - Buka: https://sheets.google.com/
   - Buat spreadsheet baru
   - Beri nama: "Data Peserta Event"

2. **Format Sheet "ProcessedData"**
   - Pastikan ada sheet bernama "ProcessedData"
   - Struktur yang digunakan:
     ```
     Kolom K (index 10): ID Unik Peserta
     Kolom B (index 1): Nama Lengkap
     Kolom F (index 5): Instansi
     Kolom G (index 6): Nama Instansi
     ```

3. **Format Sheet "Registrasi"**
   - Buat sheet baru bernama "Registrasi"
   - Format header di baris 1:
     ```
     A1: Unique Code TerScan
     B1: Checking...
     ```
   - Data kehadiran akan otomatis ditambahkan mulai dari baris 2:
     ```
     A2: ID Peserta (contoh: 1391495B)
     B2: Timestamp (contoh: 20/08/2025, 23.42.25)
     ```

4. **Share dengan Service Account**
   - Klik "Share" di Google Sheets
   - Masukkan email service account (dari file JSON: `client_email`)
   - Beri akses "Editor"
   - Hapus centang "Notify people"
   - Klik "Share"

## Langkah 4: Konfigurasi Environment Variables

1. **Salin file template**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit file .env.local dengan data dari JSON:**
   ```env
   # Dari URL Google Sheets
   GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   
   # Dari file JSON yang didownload
   GOOGLE_CLIENT_EMAIL=event-verification-service@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB...\n-----END PRIVATE KEY-----\n"
   ```

3. **Cara mendapatkan SPREADSHEET_ID:**
   - Dari URL Google Sheets: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
   - Copy bagian setelah `/d/` dan sebelum `/edit`

4. **Cara format PRIVATE_KEY:**
   - Buka file JSON yang didownload
   - Copy nilai `private_key`
   - Pastikan ada tanda kutip dan `\n` untuk newline

## Langkah 5: Testing

1. **Restart development server**
   ```bash
   npm run dev
   ```

2. **Test dengan ID peserta yang ada di sheets**
   - Buka aplikasi di browser
   - Masukkan ID peserta (contoh: 8971010E)
   - Klik "Verifikasi"

## Troubleshooting

### Error: "Sheets API has not been used"
- Pastikan Google Sheets API sudah di-enable di Google Cloud Console

### Error: "The caller does not have permission"
- Pastikan service account sudah di-share ke Google Sheets
- Periksa kembali email service account

### Error: "Invalid private key"
- Pastikan GOOGLE_PRIVATE_KEY di format dengan benar
- Pastikan ada `\n` untuk newline dalam string

### Error: "Spreadsheet not found"
- Periksa GOOGLE_SPREADSHEET_ID di .env.local
- Pastikan ID diambil dari URL yang benar

## Struktur Sheet yang Disarankan

```
Row 1 (Header): ID | Nama | Instansi | Status
Row 2: 8971010E | John Doe | PT ABC | 
Row 3: 8971010F | Jane Smith | Universitas XYZ | 
```

**Catatan Penting:**
- Kolom Status akan otomatis diisi dengan timestamp saat peserta di-scan
- Jangan ubah urutan kolom A-D
- Pastikan ID peserta unik dan tidak ada duplikat
