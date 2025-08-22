"use client";

import { useState, useEffect, useRef } from 'react';
import QrScanner from '@/components/QrScanner';
import ClientOnly from '@/components/ClientOnly';

// Types for API responses
interface ParticipantData {
  id: string;
  nama: string;
  instansi: string;
}

interface ApiResponse {
  status: 'found' | 'not_found' | 'verified' | 'error';
  message?: string;
  data?: ParticipantData;
}

// API Configuration - menggunakan API route lokal
const API_URL = '/api/participant';

export default function ParticipantVerification() {
  const [participantId, setParticipantId] = useState('');
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isQrScannerActive, setIsQrScannerActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input for mobile QR scanners
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Check participant data
  const checkParticipant = async (id: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking participant:', error);
      return { status: 'error', message: 'Network error' };
    }
  };

  // Mark participant as present
  const markAsPresent = async (id: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking attendance:', error);
      return { status: 'error', message: 'Network error' };
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantId.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setParticipant(null);
    setIsVerified(false);

    const result = await checkParticipant(participantId.trim());

    if (result.status === 'found' && result.data) {
      setParticipant(result.data);
      
      // Automatically mark attendance
      const markResult = await markAsPresent(result.data.id);
      
      if (markResult.status === 'verified') {
        setSuccess('Kehadiran berhasil dicatat! ✅');
        setIsVerified(true);
      } else if (markResult.status === 'error') {
        setError(markResult.message || 'Gagal mencatat kehadiran');
      }
    } else if (result.status === 'not_found') {
      setError('Data tidak ditemukan ❌');
    } else if (result.status === 'error') {
      setError(result.message || 'Terjadi kesalahan saat mengambil data');
    }

    setLoading(false);
  };

  // Handle mark attendance
  const handleMarkAttendance = async () => {
    if (!participant) return;

    setMarking(true);
    setError('');
    setSuccess('');

    const result = await markAsPresent(participant.id);

    if (result.status === 'verified') {
      setSuccess('Kehadiran berhasil dicatat! ✅');
      setIsVerified(true);
    } else if (result.status === 'error') {
      setError(result.message || 'Gagal mencatat kehadiran');
    }

    setMarking(false);
  };

  // Handle QR scan result
  const handleQrScan = async (scannedId: string) => {
    setIsQrScannerActive(false);
    setParticipantId(scannedId);
    
    // Auto-verify and mark attendance after QR scan
    setLoading(true);
    setError('');
    setSuccess('');
    setParticipant(null);
    setIsVerified(false);

    const result = await checkParticipant(scannedId.trim());

    if (result.status === 'found' && result.data) {
      setParticipant(result.data);
      
      // Automatically mark attendance
      const markResult = await markAsPresent(result.data.id);
      
      if (markResult.status === 'verified') {
        setSuccess('Kehadiran berhasil dicatat! ✅');
        setIsVerified(true);
      } else if (markResult.status === 'error') {
        setError(markResult.message || 'Gagal mencatat kehadiran');
      }
    } else if (result.status === 'not_found') {
      setError('Data tidak ditemukan ❌');
    } else if (result.status === 'error') {
      setError(result.message || 'Terjadi kesalahan saat mengambil data');
    }

    setLoading(false);
  };

  // Reset form
  const resetForm = () => {
    setParticipantId('');
    setParticipant(null);
    setError('');
    setSuccess('');
    setIsVerified(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Verifikasi Peserta
          </h1>
          <p className="text-gray-600">
            Scan QR Code atau masukkan ID peserta
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="participantId" className="block text-sm font-medium text-gray-700 mb-2">
                ID Peserta
              </label>
              <input
                ref={inputRef}
                type="text"
                id="participantId"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="Masukkan atau scan ID peserta"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !participantId.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mencatat kehadiran...
                  </>
                ) : (
                  'Catat Kehadiran'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setIsQrScannerActive(true)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                title="Scan QR Code"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 16a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM15 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM13 13h8v8h-8v-8z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Participant Information Card */}
        {participant && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Data Peserta</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">ID:</span>
                <span className="text-gray-800 font-mono">{participant.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Nama:</span>
                <span className="text-gray-800 text-right">{participant.nama}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Instansi:</span>
                <span className="text-gray-800 text-right">{participant.instansi}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Status:</span>
                <span className="text-green-600 font-semibold">Terdaftar ✅</span>
              </div>
            </div>


            {isVerified && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-green-600 font-semibold">Kehadiran Tercatat ✅</div>
                <div className="text-green-500 text-sm mt-1">Peserta telah berhasil diabsen</div>
              </div>
            )}
          </div>
        )}

        {/* Reset Button */}
        {(participant || error) && (
          <button
            onClick={resetForm}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Scan Peserta Lain
          </button>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-blue-800 mb-2">Petunjuk Penggunaan:</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Klik tombol hijau untuk scan QR code atau ketik manual ID peserta</li>
            <li>• Tekan tombol &quot;Catat Kehadiran&quot; untuk langsung mencatat absen</li>
            <li>• Kehadiran akan otomatis tercatat jika data peserta ditemukan</li>
            <li>• Gunakan &quot;Scan Peserta Lain&quot; untuk melanjutkan</li>
          </ul>
        </div>

        {/* QR Scanner Modal */}
        <ClientOnly>
          <QrScanner
            isActive={isQrScannerActive}
            onScan={handleQrScan}
            onClose={() => setIsQrScannerActive(false)}
          />
        </ClientOnly>
      </div>
    </div>
  );
}
