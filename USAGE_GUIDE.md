# Panduan Penggunaan Aplikasi Verifikasi Peserta Event

## Fitur Utama

### 1. 🔍 Verifikasi Peserta
- Input ID peserta melalui QR scanner atau manual
- Sistem akan mencari data di sheet "ProcessedData" kolom K
- Menampilkan nama dan instansi peserta yang ditemukan

### 2. ✅ Pencatatan Kehadiran
- Setelah verifikasi berhasil, klik tombol "Mark Attendance"
- ID peserta akan dicatat di sheet "Registrasi" dengan timestamp
- Sistem mencegah duplikasi pencatatan kehadiran

### 3. 🚫 Pencegahan Duplikasi
- Jika peserta sudah pernah absen, sistem akan menampilkan pesan error
- Timestamp kehadiran sebelumnya akan ditampilkan

## Cara Penggunaan

### Step 1: Verifikasi Peserta
1. Masukkan ID peserta di kolom input
2. Klik "Verify Participant" atau tekan Enter
3. Sistem akan menampilkan data peserta jika ditemukan

### Step 2: Pencatatan Kehadiran
1. Setelah data peserta muncul, klik "Mark Attendance"
2. Sistem akan mencatat kehadiran di sheet "Registrasi"
3. Pesan konfirmasi akan muncul

### Step 3: Reset untuk Peserta Berikutnya
1. Klik "Reset" untuk membersihkan form
2. Input akan kembali fokus untuk peserta berikutnya

## Struktur Data

### Sheet "ProcessedData"
- **Kolom K**: ID Unik Peserta (untuk verifikasi)
- **Kolom B**: Nama Lengkap
- **Kolom F & G**: Data Instansi

### Sheet "Registrasi"
- **Kolom A**: ID Peserta yang sudah hadir
- **Kolom B**: Timestamp kehadiran (format: DD/MM/YYYY, HH.MM.SS)

## Pesan Sistem

### Status Berhasil
- ✅ **"Peserta ditemukan"** - Verifikasi berhasil
- ✅ **"Kehadiran berhasil dicatat"** - Attendance berhasil dicatat

### Status Error
- ❌ **"Peserta tidak ditemukan"** - ID tidak ada di database
- ❌ **"Peserta sudah pernah absen sebelumnya"** - Duplikasi dicegah
- ❌ **"Terjadi kesalahan"** - Error sistem

## Tips Penggunaan

1. **Untuk QR Scanner**: Input otomatis akan fokus setelah reset
2. **Untuk Input Manual**: Tekan Enter setelah mengetik ID
3. **Monitoring Kehadiran**: Cek sheet "Registrasi" untuk data kehadiran real-time
4. **Troubleshooting**: Gunakan endpoint `/api/debug` dan `/api/debug-registrasi` untuk debugging

## Keyboard Shortcuts

- **Enter**: Verifikasi peserta
- **Escape**: Reset form
- **Tab**: Navigasi antar tombol

## Mobile Support

Aplikasi dioptimalkan untuk penggunaan mobile dengan:
- Responsive design
- Touch-friendly buttons
- Auto-focus input untuk QR scanner
- Loading states yang jelas
