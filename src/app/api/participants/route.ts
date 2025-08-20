import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;

// Sheet range configuration
const SHEET_NAME = 'ProcessedData'; // Nama sheet yang benar
const DATA_RANGE = `${SHEET_NAME}!A:Z`; // Ambil semua kolom untuk memastikan kita mendapat kolom K

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_CLIENT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

interface ParticipantData {
  id: string;
  nama: string;
  instansi: string;
  status?: string;
}

// GET - Cek data peserta
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('id');

    if (!participantId) {
      return NextResponse.json(
        { status: 'error', message: 'ID peserta diperlukan' },
        { status: 400 }
      );
    }

    if (!SPREADSHEET_ID || !GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL) {
      return NextResponse.json(
        { status: 'error', message: 'Konfigurasi Google Sheets tidak lengkap' },
        { status: 500 }
      );
    }

    // Ambil data dari Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: DATA_RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Data peserta tidak ditemukan'
      });
    }

    // Cari peserta berdasarkan ID di kolom K (index 10)
    const participant = rows.find((row, index) => {
      // Skip header row (index 0)
      if (index === 0) return false;
      // Kolom K adalah index 10 (K = 11th column, 0-based = 10)
      return row[10] && row[10].toString().toLowerCase() === participantId.toLowerCase();
    });

    if (!participant) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Peserta tidak ditemukan'
      });
    }

    // Asumsi struktur kolom di ProcessedData sheet berdasarkan debug
    // Kolom K (index 10) = ID Unik
    // Kolom B (index 1) = Nama Lengkap  
    // Kolom F (index 5) = Instansi
    // Kolom G (index 6) = Nama Instansi
    // Kolom Q (index 16) = Status (kolom kosong untuk status kehadiran)
    const participantData: ParticipantData = {
      id: participant[10] || '', // Kolom K (ID Unik)
      nama: participant[1] || '', // Kolom B (Nama Lengkap)
      instansi: participant[6] || participant[5] || '', // Kolom G (Nama Instansi) atau F (Instansi)
      status: participant[16] || 'Belum Hadir' // Kolom Q untuk status kehadiran
    };

    return NextResponse.json({
      status: 'found',
      data: participantData
    });

  } catch (error) {
    console.error('Error fetching participant data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST - Tandai peserta hadir
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id: participantId } = body;

    if (!participantId) {
      return NextResponse.json(
        { status: 'error', message: 'ID peserta diperlukan' },
        { status: 400 }
      );
    }

    if (!SPREADSHEET_ID || !GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL) {
      return NextResponse.json(
        { status: 'error', message: 'Konfigurasi Google Sheets tidak lengkap' },
        { status: 500 }
      );
    }

    // Pertama, cek apakah peserta ada di ProcessedData
    const processedDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: DATA_RANGE,
    });

    const processedRows = processedDataResponse.data.values;
    if (!processedRows || processedRows.length <= 1) {
      return NextResponse.json({
        status: 'error',
        message: 'Data peserta tidak ditemukan'
      });
    }

    // Cari peserta di ProcessedData berdasarkan kolom K (index 10)
    const participant = processedRows.find((row, index) => {
      if (index === 0) return false; // Skip header
      return row[10] && row[10].toString().toLowerCase() === participantId.toLowerCase();
    });

    if (!participant) {
      return NextResponse.json({
        status: 'error',
        message: 'Peserta tidak ditemukan'
      });
    }

    // Cek apakah sudah pernah absen di sheet Registrasi
    const registrasiResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Registrasi!A:B', // Kolom A untuk ID, B untuk timestamp
    });

    const registrasiRows = registrasiResponse.data.values || [];
    
    // Cek apakah ID sudah ada di sheet Registrasi
    const alreadyRegistered = registrasiRows.some((row, index) => {
      if (index === 0) return false; // Skip header
      return row[0] && row[0].toString().toLowerCase() === participantId.toLowerCase();
    });

    if (alreadyRegistered) {
      return NextResponse.json({
        status: 'error',
        message: 'Peserta sudah pernah absen sebelumnya'
      });
    }

    // Tambah ID ke sheet Registrasi
    const timestamp = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Append data ke sheet Registrasi
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Registrasi!A:B',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[participantId, timestamp]]
      }
    });

    // Return data peserta
    const participantData: ParticipantData = {
      id: participant[10] || '',
      nama: participant[1] || '',
      instansi: participant[6] || participant[5] || '',
      status: `Hadir - ${timestamp}`
    };

    return NextResponse.json({
      status: 'verified',
      message: 'Kehadiran berhasil dicatat',
      data: participantData
    });

  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Gagal mencatat kehadiran',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
