import { NextResponse } from 'next/server';
import { google, sheets_v4 } from 'googleapis';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Demo mode - set to false to use Google Sheets
const DEMO_MODE = false;

// Mock data for demo
const DEMO_PARTICIPANTS = [
  { id: '1391495B', nama: 'John Doe', instansi: 'PT ABC Indonesia' },
  { id: '2468013C', nama: 'Jane Smith', instansi: 'CV XYZ Solutions' },
  { id: '3579024D', nama: 'Ahmad Rahman', instansi: 'UD Maju Bersama' },
  { id: '4680135E', nama: 'Siti Nurhaliza', instansi: 'PT Teknologi Masa Depan' },
  { id: '5791246F', nama: 'Budi Santoso', instansi: 'CV Digital Kreatif' }
];

const attendanceLog: Array<{id: string, timestamp: string}> = [];

// Google Sheets credentials
const GOOGLE_SPREADSHEET_ID = '1VF_kpv0UyZwxGrDSlU5cSoRcyygK2Wdk6p4SMH58sXs';
const GOOGLE_CLIENT_EMAIL = 'event-verification-service@n8n-rsh.iam.gserviceaccount.com';
const GOOGLE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDfrI2jL7ZYal4d
EK7a9w8w/9zbc7AkDZJv8lm/q83KUkDS3/mJ6BngMCFAiGz31zCUL2XDaMoX30Zz
gjb6BPTiAO7cHp4uRxphORPcGK4+RpcQrM78KexEEzfXr0b0bTgOPqmyNXZxbgng
GLlLfYSexFKx1nJ2c6HAWAlyEsujdYjyOu3NUHnD6FLuGtqaPZsrWjdanaTwSlVY
mlBglIFXlws+YY6y8UB7dgGcQEdcyeY/k43qDoVWNyKCu+L696l8zJzOXYhUkZVS
qace2eG9aWxIUuFcEfSMr7TaWb6qedzDeKtGdssRX9R3n7VMickEH0wWkQmTEsjr
zC5Kc10bAgMBAAECggEAFBqbzm+S6aaB2AXwWXD8VhChRr5CtjLcFyDGzVIBWK6E
8g88jBcnAD4DNxwsAyi9zovmDybDh1rDp80r6NP6OLgRwAomeI1egx+Qt+cl/iX1
HQQTRJn2CPZbPhEchQquD6W1NfXVNAPKcnB2cyEQgv6tWhumxRvGjZW8H5st336d
aa2GVWflZjaZQomuzuyq0tgPXqg1uAMrpLVedkhPyBJ72cj4i37Q5qLtzvqcarHT
9ub0SNNbkQksvBW2aenUqgNJ7NdqVxN6XcNNryEfegaEw+49mjzalaoDrT3Mnsxs
qQOrMO98H+/HZw9Rf6fLm+9rpuqgswRRfTorf8RifQKBgQD4HEMx//ELFf7/LIob
b+SuwGskiDXoMQv07Xl00RL7DS/yRvC4p+HeEt7pD6rh5doMdoRdDugNGjepPWmx
ZNpSnzqI7OJPytE6EmNmuwgsY/xcA/11fG1GhrTrTcHTne5rPPHYDnSxT4Fv5nyw
G5YzSAko1SpF7HfMllyMoVxRbwKBgQDmyV346OUDuFH1NBARpcCmurssWFhK8Bjo
UpKxdpHiaKOj8Hkk8inmPvaOyRrYHrl/UFTe22IUWLxyaiJB8YsdjH+WlJucvCw0
WBVAvZJysn9CtEkvnhYH2p/KFNG5yHaE9GaGh4gxd9FA1AiYG7VndjOqNIwBGMB4
MTSU3UTBFQKBgQDvmouh66OiqxlY4HB3UrWrtZNC8m/szgDYBcX3dDk6TV/yP2QV
T7umtN6kgEbsZQcQZhwpqk2a6ai7Pd2mPNlCVRc4SFu95wXraPqpqRGZnO2HByts
nD8Dju+FFdCLRseKtI5xsnQrD7bWk+XyRJHm8Dg4QLPUVyrSXpr+DI6U7QKBgQCr
e0RQBvzj3rlHMQAfnMGhIW6ibKJuTCi1t2U4Z5nOWWH+Flhtk2J+qpoZTmSb4XiD
mPT3ApvF8olTmnkJ9qgftJ25DYLy2v8dhbWE/Vcr0mWs8rjOoPBNtay1QvLy0HkA
IXlszJft6dGaEfKw0yXfUnzhI1pEFlgs9qLTWfYUYQKBgFWTHYB2RwmvOYGuO5Wx
5IyZKZWkQ121cXY3Ucgqzgg007++Q2Vq0ezqCUE4W1cTjQPAmueBNJ7GbAPqtkdd
iwNGksygrbg2kCOLsx9nC7FGRdytR66GPGLEEkH2j+6L2eu2uF4hl3R1DXv5titX
/zxoeH7g1mGxfyAT2nxLJHYo
-----END PRIVATE KEY-----`;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Initialize auth and sheets only if not in demo mode
let auth: InstanceType<typeof google.auth.GoogleAuth> | null = null;
let sheets: sheets_v4.Sheets | null = null;

if (!DEMO_MODE) {
  auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  sheets = google.sheets({ version: 'v4', auth });
}

// Helper function to get user from token
async function getUserFromToken(): Promise<{ name: string; username: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      name: decoded.name,
      username: decoded.username
    };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        status: 'error',
        message: 'ID parameter diperlukan'
      }, { status: 400 });
    }

    if (DEMO_MODE) {
      // Demo mode - search in mock data
      const participant = DEMO_PARTICIPANTS.find(p => p.id === id.trim());
      
      if (!participant) {
        return NextResponse.json({
          status: 'not_found',
          message: 'Peserta tidak ditemukan'
        }, { status: 404 });
      }

      return NextResponse.json({
        status: 'found',
        message: 'Peserta ditemukan',
        data: participant
      });
    }

    // Production mode - use Google Sheets
    if (!sheets) {
      return NextResponse.json({
        status: 'error',
        message: 'Google Sheets not initialized'
      }, { status: 500 });
    }

    const spreadsheetId = GOOGLE_SPREADSHEET_ID;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'ProcessedData!A:Z',
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Data tidak ditemukan di sheet'
      }, { status: 404 });
    }

    let participantRow = null;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[10] && row[10].toString().trim() === id.trim()) {
        participantRow = row;
        break;
      }
    }

    if (!participantRow) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Peserta tidak ditemukan'
      }, { status: 404 });
    }

    const participantData = {
      id: participantRow[10],
      nama: participantRow[1] || 'Tidak ada nama',
      instansi: participantRow[5] || participantRow[6] || 'Tidak ada instansi'
    };

    return NextResponse.json({
      status: 'found',
      message: 'Peserta ditemukan',
      data: participantData
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Terjadi kesalahan server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({
        status: 'error',
        message: 'ID diperlukan'
      }, { status: 400 });
    }

    // Get user info from token
    const currentUser = await getUserFromToken();
    if (!currentUser) {
      return NextResponse.json({
        status: 'error',
        message: 'User tidak terautentikasi'
      }, { status: 401 });
    }

    if (DEMO_MODE) {
      // Demo mode - use in-memory attendance log
      const existingAttendance = attendanceLog.find(a => a.id === id.trim());
      
      if (existingAttendance) {
        return NextResponse.json({
          status: 'error',
          message: 'Peserta sudah pernah absen sebelumnya',
          timestamp: existingAttendance.timestamp
        }, { status: 409 });
      }

      const participant = DEMO_PARTICIPANTS.find(p => p.id === id.trim());
      
      if (!participant) {
        return NextResponse.json({
          status: 'error',
          message: 'Peserta tidak ditemukan'
        }, { status: 404 });
      }

      const timestamp = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
      });

      attendanceLog.push({ id: id.trim(), timestamp });

      return NextResponse.json({
        status: 'verified',
        message: 'Kehadiran berhasil dicatat',
        data: {
          ...participant,
          status: `Hadir - ${timestamp} (oleh: ${currentUser.name})`
        }
      });
    }

    // Production mode - use Google Sheets
    if (!sheets) {
      return NextResponse.json({
        status: 'error',
        message: 'Google Sheets not initialized'
      }, { status: 500 });
    }

    const spreadsheetId = GOOGLE_SPREADSHEET_ID;

    // Check if participant already registered
    const checkResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrasi!A:C',
    });

    const existingRows = checkResponse.data.values || [];
    
    for (let i = 1; i < existingRows.length; i++) {
      const row = existingRows[i];
      if (row[0] && row[0].toString().trim() === id.trim()) {
        return NextResponse.json({
          status: 'error',
          message: 'Peserta sudah pernah absen sebelumnya',
          timestamp: row[1] || 'Tidak ada timestamp' // Kolom B = index 1
        }, { status: 409 });
      }
    }

    // Get participant data first
    const participantResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'ProcessedData!A:Z',
    });

    const participantRows = participantResponse.data.values || [];
    let participantData = null;

    for (let i = 1; i < participantRows.length; i++) {
      const row = participantRows[i];
      if (row[10] && row[10].toString().trim() === id.trim()) {
        participantData = {
          id: row[10],
          nama: row[1] || 'Tidak ada nama',
          instansi: row[5] || row[6] || 'Tidak ada instansi'
        };
        break;
      }
    }

    if (!participantData) {
      return NextResponse.json({
        status: 'error',
        message: 'Peserta tidak ditemukan'
      }, { status: 404 });
    }

    const timestamp = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta'
    });

    // Find next empty row to write to
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrasi!A:A',
    });
    
    const nextRow = (existingData.data.values?.length || 0) + 1;
    
    // Update columns A, B, and C (ID, timestamp, recorder name)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Registrasi!A${nextRow}:C${nextRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[id, timestamp, currentUser.name]] // ID, timestamp, recorder name
      }
    });

    return NextResponse.json({
      status: 'verified',
      message: 'Kehadiran berhasil dicatat',
      data: {
        ...participantData,
        status: `Hadir - ${timestamp} (oleh: ${currentUser.name})`
      }
    });

  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Terjadi kesalahan server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}