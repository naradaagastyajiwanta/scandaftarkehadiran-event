import { NextResponse } from 'next/server';
import { google, sheets_v4 } from 'googleapis';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Demo mode - set to false to use Google Sheets
const DEMO_MODE = false;

// Mock data for demo with unique IDs
const DEMO_PARTICIPANTS = [
  { id: '1391495A', nama: 'John Doe', instansi: 'PT ABC Indonesia', jenisKelamin: 'Laki-laki', namaInstansi: 'PT ABC Indonesia', status: 'Belum Hadir' },
  { id: '2468013B', nama: 'Jane Smith', instansi: 'CV XYZ Solutions', jenisKelamin: 'Perempuan', namaInstansi: 'CV XYZ Solutions', status: 'Hadir' },
  { id: '3579024C', nama: 'Ahmad Rahman', instansi: 'UD Maju Bersama', jenisKelamin: 'Laki-laki', namaInstansi: 'UD Maju Bersama', status: 'Belum Hadir' },
  { id: '4680135D', nama: 'Siti Nurhaliza', instansi: 'PT Teknologi Masa Depan', jenisKelamin: 'Perempuan', namaInstansi: 'PT Teknologi Masa Depan', status: 'Hadir' },
  { id: '5791246E', nama: 'Budi Santoso', instansi: 'CV Digital Kreatif', jenisKelamin: 'Laki-laki', namaInstansi: 'CV Digital Kreatif', status: 'Belum Hadir' },
  { id: '6802357F', nama: 'Maria Gonzalez', instansi: 'PT Inovasi Global', jenisKelamin: 'Perempuan', namaInstansi: 'PT Inovasi Global', status: 'Hadir' },
  { id: '7913468G', nama: 'Rudi Hartono', instansi: 'CV Mandiri Jaya', jenisKelamin: 'Laki-laki', namaInstansi: 'CV Mandiri Jaya', status: 'Belum Hadir' },
  { id: '8024579H', nama: 'Lisa Wijaya', instansi: 'PT Smart Solution', jenisKelamin: 'Perempuan', namaInstansi: 'PT Smart Solution', status: 'Hadir' },
];

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

// Helper function to check authentication
async function checkAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return false;
    }
    
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    return false;
  }
}

interface ParticipantData {
  id: string;
  nama: string;
  instansi: string;
  jenisKelamin: string;
  namaInstansi: string;
  status: string;
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (DEMO_MODE) {
      // Demo mode - use mock data
      let filteredParticipants = DEMO_PARTICIPANTS;

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filteredParticipants = filteredParticipants.filter(p => 
          p.id.toLowerCase().includes(searchLower) ||
          p.nama.toLowerCase().includes(searchLower) ||
          p.instansi.toLowerCase().includes(searchLower) ||
          p.namaInstansi.toLowerCase().includes(searchLower)
        );
      }

      // Apply status filter
      if (status) {
        filteredParticipants = filteredParticipants.filter(p => 
          status === 'hadir' ? p.status === 'Hadir' : p.status === 'Belum Hadir'
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedParticipants = filteredParticipants.slice(startIndex, endIndex);

      return NextResponse.json({
        success: true,
        data: {
          participants: paginatedParticipants,
          pagination: {
            page,
            limit,
            total: filteredParticipants.length,
            totalPages: Math.ceil(filteredParticipants.length / limit)
          }
        }
      });
    }

    // Production mode - use Google Sheets
    if (!sheets) {
      return NextResponse.json({
        success: false,
        message: 'Google Sheets not initialized'
      }, { status: 500 });
    }

    const spreadsheetId = GOOGLE_SPREADSHEET_ID;

    // Get participants data
    const participantsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'ProcessedData!A:Z',
    });

    const participantRows = participantsResponse.data.values || [];
    
    if (participantRows.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          participants: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    // Get attendance data to determine status
    const attendanceResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrasi!A:C',
    });

    const attendanceRows = attendanceResponse.data.values || [];
    const attendedIds = new Set();

    // Build set of attended participant IDs
    for (let i = 1; i < attendanceRows.length; i++) {
      const row = attendanceRows[i];
      if (row[0]) {
        attendedIds.add(row[0].toString().trim());
      }
    }

    // Process participant data with duplicate prevention
    const allParticipants: ParticipantData[] = [];
    const seenIds = new Set<string>();
    
    for (let i = 1; i < participantRows.length; i++) {
      const row = participantRows[i];
      if (row[10]) { // Check if ID exists (column K)
        const participantId = row[10].toString().trim();
        
        // Skip duplicates
        if (seenIds.has(participantId)) {
          console.warn(`Duplicate participant ID found: ${participantId}, skipping...`);
          continue;
        }
        
        seenIds.add(participantId);
        
        const participant: ParticipantData = {
          id: participantId,
          nama: row[1] || 'Tidak ada nama',
          instansi: row[5] || row[6] || 'Tidak ada instansi',
          jenisKelamin: row[3] || 'Tidak diketahui',
          namaInstansi: row[6] || row[5] || 'Tidak ada nama instansi',
          status: attendedIds.has(participantId) ? 'Hadir' : 'Belum Hadir'
        };
        allParticipants.push(participant);
      }
    }

    // Apply search filter
    let filteredParticipants = allParticipants;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredParticipants = filteredParticipants.filter(p => 
        p.id.toLowerCase().includes(searchLower) ||
        p.nama.toLowerCase().includes(searchLower) ||
        p.instansi.toLowerCase().includes(searchLower) ||
        p.namaInstansi.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status) {
      filteredParticipants = filteredParticipants.filter(p => 
        status === 'hadir' ? p.status === 'Hadir' : p.status === 'Belum Hadir'
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedParticipants = filteredParticipants.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        participants: paginatedParticipants,
        pagination: {
          page,
          limit,
          total: filteredParticipants.length,
          totalPages: Math.ceil(filteredParticipants.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Participants list error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}