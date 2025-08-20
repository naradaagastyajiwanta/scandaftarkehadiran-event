import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_CLIENT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// GET - Debug Registrasi sheet
export async function GET() {
  try {
    if (!SPREADSHEET_ID || !GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL) {
      return NextResponse.json(
        { status: 'error', message: 'Konfigurasi Google Sheets tidak lengkap' },
        { status: 500 }
      );
    }

    // Ambil data dari sheet Registrasi
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Registrasi!A:B', // Kolom A dan B
    });

    const rows = response.data.values;
    
    return NextResponse.json({
      status: 'success',
      data: {
        totalRows: rows?.length || 0,
        headers: rows?.[0] || [],
        registeredParticipants: rows?.slice(1) || [] // Semua data kecuali header
      }
    });

  } catch (error) {
    console.error('Error fetching registrasi data:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Terjadi kesalahan server', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
