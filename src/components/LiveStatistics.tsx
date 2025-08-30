"use client";

import { useState, useEffect } from 'react';

interface AttendanceByInterval {
  interval: string;
  count: number;
}

interface StatisticsData {
  totalParticipants: number;
  attended: number;
  notAttended: number;
  attendanceRate: number;
  lastUpdated: string;
  attendanceByInterval: AttendanceByInterval[];
}

interface LiveStatisticsProps {
  refreshInterval?: number; // in milliseconds
}

export default function LiveStatistics({ refreshInterval = 10000 }: LiveStatisticsProps) {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setError('');
        setLastRefresh(new Date());
      } else {
        setError(data.message || 'Gagal mengambil statistik');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Koneksi bermasalah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStatistics();

    // Set up interval for auto-refresh
    const interval = setInterval(fetchStatistics, refreshInterval);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading && !stats) {
    return (
      <div className="rounded-xl p-4 md:p-6 backdrop-blur-sm animate-pulse" style={{
        backgroundColor: 'rgba(253, 242, 224, 0.98)', 
        border: '1px solid rgba(113, 1, 0, 0.2)',
        boxShadow: '0 12px 40px rgba(113, 1, 0, 0.15)'
      }}>
        <div className="h-5 md:h-6 bg-gray-300 rounded mb-3 md:mb-4 w-32 md:w-48"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 md:h-24 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="rounded-xl p-4 md:p-6 backdrop-blur-sm" style={{
        backgroundColor: 'rgba(254, 242, 242, 0.95)', 
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 12px 40px rgba(239, 68, 68, 0.15)'
      }}>
        <div className="flex items-start gap-3">
          <div className="text-lg md:text-xl">⚠️</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-red-800 text-sm md:text-base">Gagal Memuat Statistik</h3>
            <p className="text-red-600 text-xs md:text-sm mt-1 break-words">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxIntervalCount = Math.max(...stats.attendanceByInterval.map(item => item.count), 1);

  return (
    <div className="rounded-xl p-4 md:p-6 backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.01]" style={{
      backgroundColor: 'rgba(253, 242, 224, 0.98)', 
      border: '1px solid rgba(113, 1, 0, 0.2)',
      boxShadow: '0 12px 40px rgba(113, 1, 0, 0.15)'
    }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold" style={{color: '#710100'}}>
            📊 Statistik Live
          </h2>
          <p className="text-xs md:text-sm mt-1" style={{color: '#8b2635'}}>
            Terakhir diperbarui: {formatTime(lastRefresh)}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium" style={{color: '#22c55e'}}>LIVE</span>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
        {/* Total Participants */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 md:p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-xs md:text-sm font-medium">Total Peserta</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-800">{stats.totalParticipants}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Attended */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 md:p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-xs md:text-sm font-medium">Sudah Hadir</p>
              <p className="text-2xl md:text-3xl font-bold text-green-800">{stats.attended}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-200 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Not Attended */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 md:p-4 border border-orange-200 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-xs md:text-sm font-medium">Belum Hadir</p>
              <p className="text-2xl md:text-3xl font-bold text-orange-800">{stats.notAttended}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-200 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Rate Progress Bar */}
      <div className="mb-4 md:mb-6">
        <div className="flex justify-between items-center mb-2 md:mb-3">
          <h3 className="text-base md:text-lg font-semibold" style={{color: '#710100'}}>Tingkat Kehadiran</h3>
          <span className="text-base md:text-lg font-bold" style={{color: '#710100'}}>{stats.attendanceRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 md:h-4 relative overflow-hidden">
          <div 
            className="h-3 md:h-4 rounded-full transition-all duration-1000 ease-out relative"
            style={{
              width: `${Math.min(stats.attendanceRate, 100)}%`,
              background: stats.attendanceRate >= 80 
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : stats.attendanceRate >= 50 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
        </div>
        <div className="flex justify-between text-xs mt-1 md:mt-2" style={{color: '#8b2635'}}>
          <span>0%</span>
          <span className="hidden sm:inline">25%</span>
          <span>50%</span>
          <span className="hidden sm:inline">75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* 10-Minute Interval Attendance Chart */}
      {stats.attendanceByInterval.length > 0 && (
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4" style={{color: '#710100'}}>
            Kehadiran per 10 Menit
          </h3>
          {/* Mobile-optimized chart */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-end gap-1 md:gap-2 min-w-max px-2">
              {stats.attendanceByInterval.map((item) => (
                <div key={item.interval} className="flex flex-col items-center min-w-0">
                  {/* Bar */}
                  <div className="relative">
                    <div 
                      className="w-6 md:w-8 bg-gradient-to-t from-purple-200 to-purple-400 rounded-t transition-all duration-1000 ease-out"
                      style={{
                        height: `${Math.max((item.count / maxIntervalCount) * 60, 8)}px`,
                        minHeight: '8px',
                        maxHeight: '120px'
                      }}
                    ></div>
                    {/* Count label - mobile optimized */}
                    <div className="absolute -top-5 md:-top-6 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs font-medium text-purple-700 bg-purple-100 px-1 rounded whitespace-nowrap">
                        {item.count}
                      </span>
                    </div>
                  </div>
                  {/* Interval label - mobile optimized */}
                  <div className="mt-1 md:mt-2 text-center">
                    <span className="text-xs font-medium block transform -rotate-45 md:rotate-0 origin-center whitespace-nowrap" style={{color: '#8b2635'}}>
                      {item.interval}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="flex justify-center mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs" style={{color: '#8b2635'}}>
          <svg className="w-3 h-3 md:w-4 md:h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs">Auto-refresh setiap {refreshInterval / 1000} detik</span>
        </div>
      </div>
    </div>
  );
}