# Event Participant Verification App

Aplikasi verifikasi peserta event dengan QR code scanning yang terintegrasi dengan Google Sheets API.

## ✨ Fitur Utama

- 🔍 **Verifikasi Peserta**: Input ID melalui QR scanner atau manual dengan pencarian real-time di Google Sheets
- ✅ **Pencatatan Kehadiran**: Otomatis mencatat kehadiran dengan timestamp ke sheet terpisah
- 🚫 **Pencegahan Duplikasi**: Sistem mengecek dan mencegah pencatatan kehadiran ganda
- 📱 **Mobile-First**: Responsive design yang dioptimalkan untuk scanner mobile
- ⚡ **Real-time**: Integrasi langsung dengan Google Sheets API tanpa delay
- 🎯 **Auto-Focus**: Input otomatis fokus untuk workflow QR scanning yang smooth

## 🏗️ Arsitektur Sistem

### Frontend (Next.js 15 + TypeScript)
- **Framework**: Next.js dengan App Router
- **Styling**: Tailwind CSS untuk responsive design
- **Components**: React dengan TypeScript untuk type safety
- **State Management**: React hooks untuk form state dan API calls

### Backend API (Next.js API Routes)
- **Verifikasi**: `GET /api/participants?id={id}` - Cari peserta di sheet "ProcessedData"
- **Kehadiran**: `POST /api/participants` - Catat kehadiran di sheet "Registrasi"
- **Debug**: Endpoint debug untuk monitoring sheet data

### Database (Google Sheets)
- **ProcessedData Sheet**: Database peserta dengan ID di kolom K
- **Registrasi Sheet**: Log kehadiran dengan pencegahan duplikasi
- **Authentication**: Service Account dengan private key

## 📋 Workflow Aplikasi

1. **Input ID** → Scanner QR atau input manual
2. **Verifikasi** → Sistem cari di ProcessedData sheet kolom K
3. **Tampil Data** → Nama dan instansi peserta ditampilkan
4. **Mark Attendance** → ID dicatat di Registrasi sheet dengan timestamp
5. **Duplikasi Check** → Sistem cegah double attendance
6. **Reset** → Siap untuk peserta berikutnya

## Teknologi

- **Framework**: Next.js 15 dengan TypeScript
- **Styling**: Tailwind CSS
- **Database**: Google Sheets (via Google Sheets API)
- **Authentication**: Google Service Account

## Setup dan Instalasi

### 1. Clone dan Install Dependencies

```bash
git clone [repository-url]
cd scanwebapp2
npm install
```

### 2. Setup Google Sheets API

Ikuti panduan lengkap di [SETUP_GOOGLE_SHEETS.md](./SETUP_GOOGLE_SHEETS.md)

Ringkasan:
1. Buat project di Google Cloud Console
2. Aktifkan Google Sheets API
3. Buat Service Account dan download JSON key
4. Buat Google Sheets dengan format yang benar
5. Share sheets dengan service account

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dengan:
```env
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Format Google Sheets

Struktur yang diperlukan:

| Kolom | Deskripsi | Contoh |
|-------|-----------|--------|
| A | ID Peserta | 8971010E |
| B | Nama Lengkap | John Doe |
| C | Instansi | PT ABC |
| D | Status Kehadiran | (otomatis diisi) |

## API Endpoints

### GET /api/participants?id={participantId}
Cek data peserta berdasarkan ID

**Response:**
```json
{
  "status": "found",
  "data": {
    "id": "8971010E",
    "nama": "John Doe",
    "instansi": "PT ABC",
    "status": "Belum Hadir"
  }
}
```

### POST /api/participants
Tandai peserta hadir

**Request:**
```json
{
  "id": "8971010E"
}
```

**Response:**
```json
{
  "status": "verified",
  "message": "Kehadiran berhasil dicatat",
  "data": {
    "id": "8971010E",
    "nama": "John Doe",
    "instansi": "PT ABC",
    "status": "Hadir - 20/08/2025 14:30:25"
  }
}
```

## Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Connect repository di [Vercel](https://vercel.com)
3. Tambahkan environment variables di Vercel dashboard
4. Deploy

### Environment Variables untuk Production

Pastikan menambahkan di platform deployment:
- `GOOGLE_SPREADSHEET_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

## Troubleshooting

Lihat [SETUP_GOOGLE_SHEETS.md](./SETUP_GOOGLE_SHEETS.md) untuk troubleshooting umum.

## Kontribusi

1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
