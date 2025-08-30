import { NextResponse } from 'next/server';
import { google, sheets_v4 } from 'googleapis';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Demo mode - set to false to use Google Sheets
const DEMO_MODE = false;

// Mock data for demo
const DEMO_PARTICIPANTS = [
  { id: '1391495B', nama: 'John Doe', instansi: 'PT ABC Indonesia', jenisKelamin: 'Laki-laki', namaInstansi: 'PT ABC Indonesia' },
  { id: '2468013C', nama: 'Jane Smith', instansi: 'CV XYZ Solutions', jenisKelamin: 'Perempuan', namaInstansi: 'CV XYZ Solutions' },
  { id: '3579024D', nama: 'Ahmad Rahman', instansi: 'UD Maju Bersama', jenisKelamin: 'Laki-laki', namaInstansi: 'UD Maju Bersama' },
  { id: '4680135E', nama: 'Siti Nurhaliza', instansi: 'PT Teknologi Masa Depan', jenisKelamin: 'Perempuan', namaInstansi: 'PT Teknologi Masa Depan' },
  { id: '5791246F', nama: 'Budi Santoso', instansi: 'CV Digital Kreatif', jenisKelamin: 'Laki-laki', namaInstansi: 'CV Digital Kreatif' }
];

// Mock attendance data
const mockAttendanceLog: Array<{id: string, timestamp: string}> = [];

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

interface AttendanceByInterval {
  interval: string;
  count: number;
}

export async function GET() {
  try {
    // Check authentication
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    if (DEMO_MODE) {
      // Demo mode statistics
      const totalParticipants = DEMO_PARTICIPANTS.length;
      const attended = mockAttendanceLog.length;
      const notAttended = totalParticipants - attended;
      const attendanceRate = totalParticipants > 0 ? (attended / totalParticipants) * 100 : 0;

      // Mock 10-minute interval data
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentInterval = Math.floor(currentMinute / 10) * 10;
      
      const attendanceByInterval: AttendanceByInterval[] = [];
      
      // Generate last 6 intervals (1 hour)
      for (let i = 5; i >= 0; i--) {
        let hour = currentHour;
        let minute = currentInterval - (i * 10);
        
        if (minute < 0) {
          hour = Math.max(0, hour - 1);
          minute = 60 + minute;
        }
        
        attendanceByInterval.push({
          interval: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          count: Math.floor(Math.random() * 5) + 1
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          totalParticipants,
          attended,
          notAttended,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
          lastUpdated: new Date().toISOString(),
          attendanceByInterval
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

    // Get total participants from ProcessedData sheet
    const participantsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'ProcessedData!A:Z',
    });

    const participantRows = participantsResponse.data.values || [];
    const totalParticipants = Math.max(0, participantRows.length - 1); // Exclude header row

    // Get attendance data from Registrasi sheet
    const attendanceResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrasi!A:C',
    });

    const attendanceRows = attendanceResponse.data.values || [];
    const attended = Math.max(0, attendanceRows.length - 1); // Exclude header row
    const notAttended = totalParticipants - attended;
    const attendanceRate = totalParticipants > 0 ? (attended / totalParticipants) * 100 : 0;

    // Process attendance by 10-minute intervals
    const attendanceByInterval: AttendanceByInterval[] = [];
    const intervalCounts: { [key: string]: number } = {};

    // Process each attendance record
    for (let i = 1; i < attendanceRows.length; i++) {
      const row = attendanceRows[i];
      if (row[1]) { // Timestamp column
        try {
          // Parse Indonesian timestamp format: "30/08/2025, 14.30.25"
          const timestampStr = row[1].toString();
          const [datePart, timePart] = timestampStr.split(', ');
          if (timePart) {
            const [hour, minute] = timePart.split('.').map((x: string) => parseInt(x));
            
            // Round down to nearest 10-minute interval
            const roundedMinute = Math.floor(minute / 10) * 10;
            const intervalKey = `${hour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;
            
            intervalCounts[intervalKey] = (intervalCounts[intervalKey] || 0) + 1;
          }
        } catch (error) {
          console.warn('Error parsing timestamp:', row[1]);
        }
      }
    }

    // Convert to array and sort
    Object.keys(intervalCounts).forEach(interval => {
      attendanceByInterval.push({
        interval,
        count: intervalCounts[interval]
      });
    });

    // Sort by time
    attendanceByInterval.sort((a, b) => a.interval.localeCompare(b.interval));

    return NextResponse.json({
      success: true,
      data: {
        totalParticipants,
        attended,
        notAttended,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        lastUpdated: new Date().toISOString(),
        attendanceByInterval
      }
    });

  } catch (error) {
    console.error('Statistics error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}