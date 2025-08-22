"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

// API Configuration - menggunakan API route lokal
const API_URL = '/api/participant';

export default function ParticipantVerification() {
  const [participantId, setParticipantId] = useState('');
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isQrScannerActive, setIsQrScannerActive] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...');
      const response = await fetch('/api/auth/verify');
      const data = await response.json();
      console.log('Auth check response:', data);
      
      if (data.success) {
        setUser(data.user);
        console.log('User authenticated:', data.user);
      } else {
        console.log('Not authenticated, redirecting to login');
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setAuthLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Auto-focus input for mobile QR scanners
  useEffect(() => {
    if (inputRef.current && !authLoading) {
      inputRef.current.focus();
    }
  }, [authLoading]);

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
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 404) {
          return { status: 'not_found', message: `🔍 ${data.message || 'Peserta tidak ditemukan'}\n💡 Pastikan ID peserta sudah benar` };
        } else if (response.status === 400) {
          return { status: 'error', message: `❌ ${data.message || 'ID tidak valid'}\n📝 Periksa format ID peserta` };
        } else if (response.status === 401) {
          // Redirect to login if session expired
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          return { status: 'error', message: '🔐 Sesi telah berakhir, akan dialihkan ke halaman login...' };
        } else if (response.status >= 500) {
          return { status: 'error', message: '🔧 Terjadi kesalahan server, coba lagi nanti\n📞 Hubungi admin jika masalah berlanjut' };
        } else {
          return { status: 'error', message: `⚠️ ${data.message || 'Terjadi kesalahan tidak dikenal'}\n🔄 Silakan coba lagi` };
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error checking participant:', error);
      return { status: 'error', message: '📡 Koneksi bermasalah, periksa internet Anda\n🔄 Pastikan koneksi stabil dan coba lagi' };
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
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 409) {
          return { status: 'error', message: `⚠️ ${data.message || 'Peserta sudah pernah absen sebelumnya'}${data.timestamp ? `\n📅 Waktu absen: ${data.timestamp}` : ''}` };
        } else if (response.status === 404) {
          return { status: 'error', message: '🔍 Peserta tidak ditemukan dalam database\n💡 Pastikan peserta sudah terdaftar' };
        } else if (response.status === 400) {
          return { status: 'error', message: `❌ ${data.message || 'Data tidak valid'}\n📝 Periksa kembali data peserta` };
        } else if (response.status === 401) {
          // Redirect to login if session expired
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          return { status: 'error', message: '🔐 Sesi telah berakhir, akan dialihkan ke halaman login...' };
        } else if (response.status >= 500) {
          return { status: 'error', message: '🔧 Terjadi kesalahan server, coba lagi nanti\n📞 Hubungi admin jika masalah berlanjut' };
        } else {
          return { status: 'error', message: `⚠️ ${data.message || 'Gagal mencatat kehadiran'}\n🔄 Silakan coba lagi` };
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error marking attendance:', error);
      return { status: 'error', message: '📡 Koneksi bermasalah, periksa internet Anda\n🔄 Pastikan koneksi stabil dan coba lagi' };
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

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #fdf2e0 0%, #f7e6c4 100%)'}}>
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" style={{color: '#710100'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p style={{color: '#8b2635'}}>Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #fdf2e0 0%, #f7e6c4 50%, #f4dfc0 100%)'}}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{background: 'linear-gradient(45deg, #710100, #8b2635)'}}></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10" style={{background: 'linear-gradient(45deg, #8b2635, #a73030)'}}></div>
        <div className="absolute top-1/2 -right-40 w-40 h-40 rounded-full opacity-10" style={{background: 'linear-gradient(45deg, #710100, #8b2635)'}}></div>
      </div>
      <div className="max-w-md mx-auto relative z-10">
        {/* User Info Header */}
        {user && (
          <div className="rounded-xl p-4 mb-6 flex justify-between items-center backdrop-blur-sm transform transition-all duration-300 hover:scale-105" style={{
            backgroundColor: 'rgba(253, 242, 224, 0.95)', 
            border: '1px solid rgba(113, 1, 0, 0.2)',
            boxShadow: '0 8px 32px rgba(113, 1, 0, 0.15), 0 2px 16px rgba(113, 1, 0, 0.1)'
          }}>
            <div>
              <h2 className="text-lg font-semibold" style={{color: '#710100'}}>{user.name}</h2>
              <p className="text-sm" style={{color: '#8b2635'}}>@{user.username} • {user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg transform"
              style={{
                backgroundColor: '#710100',
                background: 'linear-gradient(135deg, #710100 0%, #8b2635 100%)',
                boxShadow: '0 4px 15px rgba(113, 1, 0, 0.3)'
              }}
            >
              Logout
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 -top-4 -bottom-4 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 rounded-full blur-xl"></div>
          <h1 className="text-4xl font-bold mb-3 relative z-10" style={{
            color: '#710100',
            textShadow: '2px 2px 4px rgba(113, 1, 0, 0.2)',
            background: 'linear-gradient(135deg, #710100 0%, #8b2635 50%, #710100 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ✨ Verifikasi Peserta
          </h1>
          <p className="text-lg relative z-10" style={{color: '#8b2635', opacity: 0.8}}>
            🔍 Scan QR Code atau masukkan ID peserta
          </p>
        </div>

        {/* Input Form */}
        <div className="rounded-xl p-6 mb-6 backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.02]" style={{
          backgroundColor: 'rgba(253, 242, 224, 0.98)', 
          border: '1px solid rgba(113, 1, 0, 0.2)',
          boxShadow: '0 12px 40px rgba(113, 1, 0, 0.15), 0 4px 20px rgba(113, 1, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
        }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="participantId" className="block text-sm font-semibold mb-3 flex items-center gap-2" style={{color: '#710100'}}>
                🎫 ID Peserta
              </label>
              <input
                ref={inputRef}
                type="text"
                id="participantId"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="Masukkan atau scan ID peserta"
                className="w-full px-4 py-4 border-2 rounded-xl outline-none text-lg transition-all duration-300 focus:scale-[1.02]"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderColor: '#f7e6c4',
                  color: '#710100',
                  '::placeholder': { color: '#8b2635', opacity: 0.6 }
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#710100';
                  e.target.style.boxShadow = '0 0 0 3px rgba(113, 1, 0, 0.1), 0 8px 25px rgba(113, 1, 0, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#f7e6c4';
                  e.target.style.boxShadow = 'none';
                }}
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !participantId.trim()}
                className="flex-1 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center transform hover:scale-105 hover:shadow-xl disabled:hover:scale-100"
                style={{
                  backgroundColor: (loading || !participantId.trim()) ? '#9CA3AF' : '#710100',
                  background: (loading || !participantId.trim()) ? '#9CA3AF' : 'linear-gradient(135deg, #710100 0%, #8b2635 100%)',
                  boxShadow: (loading || !participantId.trim()) ? 'none' : '0 8px 25px rgba(113, 1, 0, 0.4), 0 3px 10px rgba(113, 1, 0, 0.2)'
                }}
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
                  <>
                    📝 Catat Kehadiran
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setIsQrScannerActive(true)}
                disabled={loading}
                className="text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center transform hover:scale-105 hover:shadow-xl disabled:hover:scale-100"
                title="Scan QR Code"
                style={{
                  backgroundColor: loading ? '#9CA3AF' : '#8b2635',
                  background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #8b2635 0%, #a73030 100%)',
                  boxShadow: loading ? 'none' : '0 8px 25px rgba(139, 38, 53, 0.4), 0 3px 10px rgba(139, 38, 53, 0.2)'
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 16a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM15 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM13 13h8v8h-8v-8z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Notifications */}
        {error && (
          <div className="border-2 px-6 py-4 rounded-xl mb-6 transform transition-all duration-300 animate-pulse" style={{
            backgroundColor: 'rgba(254, 242, 242, 0.95)', 
            borderColor: '#710100', 
            color: '#710100',
            boxShadow: '0 8px 25px rgba(113, 1, 0, 0.2), 0 3px 10px rgba(113, 1, 0, 0.1)'
          }}>
            <div className="flex items-start gap-3">
              <div className="text-xl mt-0.5">❌</div>
              <div className="font-medium whitespace-pre-line flex-1">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="border-2 px-6 py-4 rounded-xl mb-6 transform transition-all duration-300 animate-bounce" style={{
            backgroundColor: 'rgba(240, 253, 244, 0.95)', 
            borderColor: '#22c55e', 
            color: '#166534',
            boxShadow: '0 8px 25px rgba(34, 197, 94, 0.2), 0 3px 10px rgba(34, 197, 94, 0.1)'
          }}>
            <div className="flex items-center gap-3">
              <div className="text-xl">✅</div>
              <div className="font-medium">{success}</div>
            </div>
          </div>
        )}

        {/* Participant Information Card */}
        {participant && (
          <div className="rounded-xl p-6 mb-6 backdrop-blur-sm transform transition-all duration-500 hover:scale-[1.02] animate-fade-in" style={{
            backgroundColor: 'rgba(253, 242, 224, 0.98)', 
            border: '1px solid rgba(113, 1, 0, 0.2)',
            boxShadow: '0 12px 40px rgba(113, 1, 0, 0.15), 0 4px 20px rgba(113, 1, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
          }}>
            <div className="text-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-300 hover:scale-110" style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.2) 100%)',
                  border: '2px solid rgba(34, 197, 94, 0.3)'
                }}>
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              </div>
              <h3 className="text-xl font-bold flex items-center justify-center gap-2" style={{color: '#710100'}}>
                👤 Data Peserta
              </h3>
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
