"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QrScanner from '@/components/QrScanner';
import ClientOnly from '@/components/ClientOnly';
import LiveStatistics from '@/components/LiveStatistics';
import { feedback } from '@/utils/haptic';

// Types for API responses
interface ParticipantData {
  id: string;
  nama: string;
  instansi: string;
  jenisKelamin: string;
  namaInstansi: string;
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
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      feedback.tap();
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      feedback.error();
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

  // Cleanup auto-submit timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
    };
  }, []);

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
  const handleSubmit = async (e: React.FormEvent, overrideId?: string) => {
    e.preventDefault();
    const idToUse = overrideId || participantId;
    if (!idToUse.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setParticipant(null);
    setIsVerified(false);

    const result = await checkParticipant(idToUse.trim());

    if (result.status === 'found' && result.data) {
      setParticipant(result.data);
      
      // Automatically mark attendance
      const markResult = await markAsPresent(result.data.id);
      
      if (markResult.status === 'verified') {
        setSuccess('Kehadiran berhasil dicatat! ✅');
        setIsVerified(true);
        feedback.success();
      } else if (markResult.status === 'error') {
        setError(markResult.message || 'Gagal mencatat kehadiran');
        feedback.error();
      }
    } else if (result.status === 'not_found') {
      setError('Data tidak ditemukan ❌');
      feedback.error();
    } else if (result.status === 'error') {
      setError(result.message || 'Terjadi kesalahan saat mengambil data');
      feedback.error();
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
        feedback.success();
      } else if (markResult.status === 'error') {
        setError(markResult.message || 'Gagal mencatat kehadiran');
        feedback.error();
      }
    } else if (result.status === 'not_found') {
      setError('Data tidak ditemukan ❌');
      feedback.error();
    } else if (result.status === 'error') {
      setError(result.message || 'Terjadi kesalahan saat mengambil data');
      feedback.error();
    }

    setLoading(false);
  };

  // Reset form
  const resetForm = () => {
    feedback.tap();
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
    <div className="min-h-screen py-4 md:py-8 px-3 md:px-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #fdf2e0 0%, #f7e6c4 50%, #f4dfc0 100%)'}}>
      {/* Decorative Background Elements - smaller on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 md:-top-20 -right-10 md:-right-20 w-40 md:w-80 h-40 md:h-80 rounded-full opacity-10" style={{background: 'linear-gradient(45deg, #710100, #8b2635)'}}></div>
        <div className="absolute -bottom-10 md:-bottom-20 -left-10 md:-left-20 w-32 md:w-60 h-32 md:h-60 rounded-full opacity-10" style={{background: 'linear-gradient(45deg, #8b2635, #a73030)'}}></div>
        <div className="absolute top-1/2 -right-20 md:-right-40 w-20 md:w-40 h-20 md:h-40 rounded-full opacity-10" style={{background: 'linear-gradient(45deg, #710100, #8b2635)'}}></div>
      </div>
      <div className="max-w-md mx-auto relative z-10">
        {/* User Info Header - mobile optimized */}
        {user && (
          <div className="rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center backdrop-blur-sm transform transition-all duration-300 hover:scale-105" style={{
            backgroundColor: 'rgba(253, 242, 224, 0.95)', 
            border: '1px solid rgba(113, 1, 0, 0.2)',
            boxShadow: '0 8px 32px rgba(113, 1, 0, 0.15), 0 2px 16px rgba(113, 1, 0, 0.1)'
          }}>
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold truncate" style={{color: '#710100'}}>{user.name}</h2>
              <p className="text-xs md:text-sm truncate" style={{color: '#8b2635'}}>@{user.username} • {user.role}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 md:gap-2 justify-end sm:justify-start">
              <button
                onClick={() => router.push('/participants')}
                className="text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg transform"
                style={{
                  backgroundColor: '#a73030',
                  background: 'linear-gradient(135deg, #a73030 0%, #8b2635 100%)',
                  boxShadow: '0 4px 15px rgba(167, 48, 48, 0.3)'
                }}
              >
                📋 Daftar Peserta
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg transform"
                  style={{
                    backgroundColor: '#8b2635',
                    background: 'linear-gradient(135deg, #8b2635 0%, #a73030 100%)',
                    boxShadow: '0 4px 15px rgba(139, 38, 53, 0.3)'
                  }}
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg transform"
                style={{
                  backgroundColor: '#710100',
                  background: 'linear-gradient(135deg, #710100 0%, #8b2635 100%)',
                  boxShadow: '0 4px 15px rgba(113, 1, 0, 0.3)'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Header - mobile optimized */}
        <div className="text-center mb-6 md:mb-8 relative">
          <div className="absolute inset-0 -top-2 md:-top-4 -bottom-2 md:-bottom-4 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 rounded-full blur-xl"></div>
          <div className="mb-3 md:mb-4">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 relative z-10" style={{
              color: '#710100',
              textShadow: '2px 2px 4px rgba(113, 1, 0, 0.2)',
              background: 'linear-gradient(135deg, #710100 0%, #8b2635 50%, #710100 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              ✨ Verifikasi Peserta
            </h1>
            <div className="text-center mb-2 md:mb-3">
              <div className="mb-2 p-2 md:p-3 rounded-lg" style={{
                backgroundColor: 'rgba(113, 1, 0, 0.05)',
                border: '1px solid rgba(113, 1, 0, 0.1)'
              }}>
                <h2 className="text-lg md:text-xl font-bold leading-tight mb-1" style={{
                  color: '#710100',
                  textShadow: '1px 1px 2px rgba(113, 1, 0, 0.2)'
                }}>
                  🇮🇩 Manusia Indonesia Jaya
                </h2>
                <h3 className="text-sm md:text-lg font-semibold leading-tight" style={{
                  color: '#8b2635',
                  opacity: 0.95
                }}>
                  Meretas Jalan Kembali ke Jati Diri Bangsa
                </h3>
              </div>
            </div>
          </div>
          <p className="text-base md:text-lg relative z-10" style={{color: '#8b2635', opacity: 0.8}}>
            🔍 Scan QR Code atau masukkan ID peserta
          </p>
        </div>

        {/* Input Form - mobile optimized */}
        <div className="rounded-xl p-4 md:p-6 mb-4 md:mb-6 backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.02]" style={{
          backgroundColor: 'rgba(253, 242, 224, 0.98)', 
          border: '1px solid rgba(113, 1, 0, 0.2)',
          boxShadow: '0 12px 40px rgba(113, 1, 0, 0.15), 0 4px 20px rgba(113, 1, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
        }}>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div>
              <label htmlFor="participantId" className="block text-xs md:text-sm font-semibold mb-2 md:mb-3 flex items-center gap-2" style={{color: '#710100'}}>
                🎫 ID Peserta
              </label>
              <input
                ref={inputRef}
                type="text"
                id="participantId"
                value={participantId}
                onChange={(e) => {
                  const value = e.target.value;
                  setParticipantId(value);
                  
                  // Clear existing timeout
                  if (autoSubmitTimeoutRef.current) {
                    clearTimeout(autoSubmitTimeoutRef.current);
                  }
                  
                  // Auto-submit when input reaches exactly 8 characters
                  if (value.length === 8 && !loading) {
                    autoSubmitTimeoutRef.current = setTimeout(() => {
                      if (!loading) {
                        // Create a synthetic form event and pass the current value
                        const syntheticEvent = {
                          preventDefault: () => {},
                          target: e.target,
                          currentTarget: e.currentTarget
                        } as unknown as React.FormEvent;
                        handleSubmit(syntheticEvent, value); // Pass the exact value that triggered this
                      }
                    }, 300);
                  }
                }}
                placeholder="Masukkan ID peserta (8 karakter)"
                className="w-full px-3 md:px-4 py-3 md:py-4 border-2 rounded-xl outline-none text-base md:text-lg transition-all duration-300 focus:scale-[1.02]"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderColor: '#f7e6c4',
                  color: '#710100'
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
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
              <button
                type="submit"
                disabled={loading || !participantId.trim()}
                className="flex-1 text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-300 flex items-center justify-center transform hover:scale-105 hover:shadow-xl disabled:hover:scale-100 text-sm md:text-base"
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
                onClick={() => {
                  feedback.tap();
                  setIsQrScannerActive(true);
                }}
                disabled={loading}
                className="sm:flex-none text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-300 flex items-center justify-center transform hover:scale-105 hover:shadow-xl disabled:hover:scale-100 text-sm md:text-base"
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
          <div className="rounded-xl mb-6 backdrop-blur-sm transform transition-all duration-500 hover:scale-[1.02] animate-fade-in overflow-hidden" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)', 
            border: '2px solid rgba(113, 1, 0, 0.15)',
            boxShadow: '0 15px 50px rgba(113, 1, 0, 0.12), 0 5px 25px rgba(113, 1, 0, 0.08)'
          }}>
            {/* Header Section */}
            <div className="px-6 py-4" style={{
              background: 'linear-gradient(135deg, rgba(113, 1, 0, 0.95) 0%, rgba(139, 38, 53, 0.95) 100%)'
            }}>
              <div className="flex items-center justify-center gap-3 text-white">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold">Data Peserta Event</h3>
                  <p className="text-sm opacity-90">Manusia Indonesia Jaya</p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
              <div className="grid gap-4">
                {/* ID Section */}
                <div className="flex items-center justify-between p-3 rounded-lg" style={{backgroundColor: 'rgba(113, 1, 0, 0.05)'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(113, 1, 0, 0.1)'}}>
                      <svg className="w-4 h-4" style={{color: '#710100'}} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm-2 5V6a2 2 0 114 0v1H8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-semibold" style={{color: '#710100'}}>ID Peserta</span>
                  </div>
                  <span className="font-mono text-lg font-bold" style={{color: '#710100'}}>{participant.id}</span>
                </div>

                {/* Name Section */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-700">Nama Lengkap</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-right max-w-xs">{participant.nama}</span>
                </div>

                {/* Gender Section */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-700">Jenis Kelamin</span>
                  </div>
                  <span className="font-semibold text-purple-700">{participant.jenisKelamin}</span>
                </div>

                {/* Institution Section */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-700">Instansi</span>
                  </div>
                  <span className="font-semibold text-green-700 text-right max-w-xs">{participant.instansi}</span>
                </div>

                {/* Institution Name Section */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100">
                      <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-700">Nama Instansi</span>
                  </div>
                  <span className="font-semibold text-orange-700 text-right max-w-xs">{participant.namaInstansi}</span>
                </div>
              </div>

              {/* Status Section */}
              {isVerified && (
                <div className="mt-6 p-4 rounded-lg text-center" style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.2) 100%)',
                  border: '2px solid rgba(34, 197, 94, 0.3)'
                }}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-green-700 font-bold text-lg">KEHADIRAN TERCATAT</span>
                  </div>
                  <p className="text-green-600 text-sm font-medium">Peserta telah berhasil diabsen pada sistem</p>
                </div>
              )}
            </div>
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
            <li>• Scan QR code atau ketik manual ID peserta (8 karakter)</li>
            <li>• ID akan otomatis diproses setelah 8 karakter dimasukkan</li>
            <li>• Kehadiran akan langsung tercatat jika data peserta ditemukan</li>
            <li>• Gunakan &quot;Scan Peserta Lain&quot; untuk melanjutkan ke peserta berikutnya</li>
          </ul>
        </div>

        {/* Live Statistics */}
        <LiveStatistics refreshInterval={15000} />

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
