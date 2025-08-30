"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ParticipantData {
  id: string;
  nama: string;
  instansi: string;
  jenisKelamin: string;
  namaInstansi: string;
  status: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

export default function ParticipantsListPage() {
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  const fetchParticipants = useCallback(async (page: number = 1, searchQuery: string = '', status: string = '') => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/participants?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setParticipants(data.data.participants);
        setPagination(data.data.pagination);
      } else {
        if (response.status === 401) {
          router.push('/login');
        } else {
          setError(data.message || 'Gagal mengambil data peserta');
        }
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      setError('Koneksi bermasalah, periksa internet Anda');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, router]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchParticipants(1, search, statusFilter);
  }, [search, statusFilter, fetchParticipants]);

  const handleStatusFilter = useCallback((newStatus: string) => {
    setStatusFilter(newStatus);
    fetchParticipants(1, search, newStatus);
  }, [search, fetchParticipants]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchParticipants(newPage, search, statusFilter);
  }, [search, statusFilter, fetchParticipants]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchParticipants();
    }
  }, [authLoading, user, fetchParticipants]);

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
    <div className="min-h-screen py-4 px-4" style={{background: 'linear-gradient(135deg, #fdf2e0 0%, #f7e6c4 50%, #f4dfc0 100%)'}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="rounded-xl p-4 md:p-6 mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center backdrop-blur-sm gap-4" style={{
          backgroundColor: 'rgba(253, 242, 224, 0.95)', 
          border: '1px solid rgba(113, 1, 0, 0.2)',
          boxShadow: '0 8px 32px rgba(113, 1, 0, 0.15)'
        }}>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{color: '#710100'}}>📋 Daftar Peserta</h1>
            <p className="text-sm md:text-base mt-1" style={{color: '#8b2635'}}>
              Total: {pagination.total} peserta
            </p>
            {user && (
              <p className="text-xs md:text-sm mt-1" style={{color: '#8b2635'}}>
                Login sebagai: <strong>{user.name}</strong> (@{user.username})
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => router.push('/')}
              className="text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm md:text-base"
              style={{backgroundColor: '#8b2635'}}
            >
              Dashboard
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm md:text-base"
                style={{backgroundColor: '#a73030'}}
              >
                Admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm md:text-base"
              style={{backgroundColor: '#710100'}}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="rounded-xl p-4 md:p-6 mb-6 backdrop-blur-sm" style={{
          backgroundColor: 'rgba(253, 242, 224, 0.98)', 
          border: '1px solid rgba(113, 1, 0, 0.2)',
          boxShadow: '0 12px 40px rgba(113, 1, 0, 0.15)'
        }}>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-semibold mb-2" style={{color: '#710100'}}>
                  🔍 Cari Peserta
                </label>
                <input
                  type="text"
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan ID, nama, atau instansi..."
                  className="w-full px-4 py-3 border rounded-lg outline-none transition-all duration-300 text-sm md:text-base"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: '#f7e6c4',
                    color: '#710100'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#710100';
                    e.target.style.boxShadow = '0 0 0 3px rgba(113, 1, 0, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#f7e6c4';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-semibold mb-2" style={{color: '#710100'}}>
                  📊 Filter Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg outline-none transition-all duration-300 text-sm md:text-base"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: '#f7e6c4',
                    color: '#710100'
                  }}
                >
                  <option value="">Semua Status</option>
                  <option value="hadir">Sudah Hadir</option>
                  <option value="belum">Belum Hadir</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 text-sm md:text-base"
                style={{
                  backgroundColor: loading ? '#9CA3AF' : '#710100',
                  background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #710100 0%, #8b2635 100%)',
                  boxShadow: loading ? 'none' : '0 8px 25px rgba(113, 1, 0, 0.4)'
                }}
              >
                {loading ? 'Mencari...' : '🔍 Cari'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  fetchParticipants(1, '', '');
                }}
                className="text-gray-700 bg-gray-200 hover:bg-gray-300 py-3 px-6 rounded-xl font-bold transition-all duration-300 text-sm md:text-base"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border-2 px-4 md:px-6 py-4 rounded-xl mb-6" style={{
            backgroundColor: 'rgba(254, 242, 242, 0.95)', 
            borderColor: '#ef4444', 
            color: '#dc2626'
          }}>
            <div className="flex items-center gap-3">
              <div className="text-xl">❌</div>
              <div className="font-medium text-sm md:text-base">{error}</div>
            </div>
          </div>
        )}

        {/* Participants Table */}
        <div className="rounded-xl backdrop-blur-sm overflow-hidden" style={{
          backgroundColor: 'rgba(253, 242, 224, 0.98)', 
          border: '1px solid rgba(113, 1, 0, 0.2)',
          boxShadow: '0 12px 40px rgba(113, 1, 0, 0.15)'
        }}>
          {loading ? (
            <div className="p-8 text-center">
              <svg className="animate-spin h-8 w-8 mx-auto mb-4" style={{color: '#710100'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p style={{color: '#8b2635'}}>Memuat data peserta...</p>
            </div>
          ) : participants.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg md:text-xl font-semibold mb-2" style={{color: '#710100'}}>
                Tidak ada data peserta
              </h3>
              <p className="text-sm md:text-base" style={{color: '#8b2635'}}>
                {search || statusFilter ? 'Coba ubah kriteria pencarian Anda' : 'Belum ada peserta yang terdaftar'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View - enhanced */}
              <div className="block md:hidden space-y-3">
                {participants.map((participant, index) => (
                  <div key={`mobile-${participant.id}-${index}`} className="rounded-lg border border-gray-200 p-3 transition-all duration-200 hover:shadow-md" style={{backgroundColor: 'rgba(255, 255, 255, 0.8)'}}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate" style={{color: '#710100'}}>
                          {participant.nama}
                        </h3>
                        <p className="text-sm font-mono text-gray-600">
                          ID: {participant.id}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                        participant.status === 'Hadir' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {participant.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex">
                        <span className="font-medium text-gray-600 w-20 flex-shrink-0">Instansi:</span>
                        <span className="text-gray-800 break-words">{participant.instansi}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-600 w-20 flex-shrink-0">Nama:</span>
                        <span className="text-gray-800 break-words">{participant.namaInstansi}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-600 w-20 flex-shrink-0">Gender:</span>
                        <span className="text-gray-800">{participant.jenisKelamin}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b" style={{borderColor: 'rgba(113, 1, 0, 0.1)'}}>
                    <tr>
                      <th className="px-4 md:px-6 py-4 text-left font-semibold text-sm md:text-base" style={{color: '#710100'}}>ID</th>
                      <th className="px-4 md:px-6 py-4 text-left font-semibold text-sm md:text-base" style={{color: '#710100'}}>Nama</th>
                      <th className="px-4 md:px-6 py-4 text-left font-semibold text-sm md:text-base" style={{color: '#710100'}}>Instansi</th>
                      <th className="px-4 md:px-6 py-4 text-left font-semibold text-sm md:text-base" style={{color: '#710100'}}>Nama Instansi</th>
                      <th className="px-4 md:px-6 py-4 text-left font-semibold text-sm md:text-base" style={{color: '#710100'}}>Jenis Kelamin</th>
                      <th className="px-4 md:px-6 py-4 text-left font-semibold text-sm md:text-base" style={{color: '#710100'}}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant, index) => (
                      <tr key={`desktop-${participant.id}-${index}`} className="border-b hover:bg-gray-50 transition-colors" style={{borderColor: 'rgba(113, 1, 0, 0.05)'}}>
                        <td className="px-4 md:px-6 py-4 text-gray-900 font-mono text-sm md:text-base">{participant.id}</td>
                        <td className="px-4 md:px-6 py-4 text-gray-900 font-medium text-sm md:text-base">{participant.nama}</td>
                        <td className="px-4 md:px-6 py-4 text-gray-900 text-sm md:text-base">{participant.instansi}</td>
                        <td className="px-4 md:px-6 py-4 text-gray-900 text-sm md:text-base">{participant.namaInstansi}</td>
                        <td className="px-4 md:px-6 py-4 text-gray-900 text-sm md:text-base">{participant.jenisKelamin}</td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            participant.status === 'Hadir' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {participant.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-4 md:px-6 py-4 border-t" style={{borderColor: 'rgba(113, 1, 0, 0.1)'}}>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm" style={{color: '#8b2635'}}>
                      Halaman {pagination.page} dari {pagination.totalPages} 
                      <span className="hidden sm:inline"> ({pagination.total} total peserta)</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: pagination.page <= 1 ? '#e5e7eb' : '#710100',
                          color: pagination.page <= 1 ? '#9ca3af' : 'white'
                        }}
                      >
                        ← Sebelumnya
                      </button>
                      
                      <span className="px-4 py-2 text-sm font-medium flex items-center" style={{color: '#8b2635'}}>
                        {pagination.page} / {pagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: pagination.page >= pagination.totalPages ? '#e5e7eb' : '#710100',
                          color: pagination.page >= pagination.totalPages ? '#9ca3af' : 'white'
                        }}
                      >
                        Selanjutnya →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}