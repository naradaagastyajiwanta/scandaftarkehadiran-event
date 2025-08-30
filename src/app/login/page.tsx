"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Username dan password diperlukan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (data.success) {
        console.log('Login successful, redirecting...');
        // Force a full page reload to ensure middleware runs correctly
        window.location.href = '/';
      } else {
        console.log('Login failed:', data.message);
        setError(data.message || 'Login gagal');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-4 md:py-8 px-3 md:px-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #fdf2e0 0%, #f7e6c4 50%, #f4dfc0 100%)'}}>
      {/* Decorative Background Elements - mobile optimized */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 md:-top-20 -left-10 md:-left-20 w-32 md:w-60 h-32 md:h-60 rounded-full opacity-10" style={{background: 'linear-gradient(45deg, #710100, #8b2635)'}}></div>
        <div className="absolute -bottom-10 md:-bottom-20 -right-10 md:-right-20 w-40 md:w-80 h-40 md:h-80 rounded-full opacity-10" style={{background: 'linear-gradient(45deg, #8b2635, #a73030)'}}></div>
        <div className="absolute top-1/3 -left-20 md:-left-40 w-20 md:w-40 h-20 md:h-40 rounded-full opacity-10" style={{background: 'linear-gradient(45deg, #710100, #8b2635)'}}></div>
      </div>
      <div className="max-w-md w-full relative z-10">
        {/* Header - mobile optimized */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 md:mb-3" style={{
            color: '#710100',
            textShadow: '2px 2px 4px rgba(113, 1, 0, 0.2)',
            background: 'linear-gradient(135deg, #710100 0%, #8b2635 50%, #710100 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🔐 Login
          </h1>
          <p className="text-base md:text-lg px-2" style={{color: '#8b2635', opacity: 0.8}}>
            Masuk untuk mengakses sistem verifikasi peserta
          </p>
        </div>

        {/* Login Form - mobile optimized */}
        <div className="rounded-xl p-4 md:p-6 backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.02]" style={{
          backgroundColor: 'rgba(253, 242, 224, 0.98)', 
          border: '1px solid rgba(113, 1, 0, 0.2)',
          boxShadow: '0 12px 40px rgba(113, 1, 0, 0.15), 0 4px 20px rgba(113, 1, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
        }}>
          <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs md:text-sm font-semibold mb-2 md:mb-3 flex items-center gap-2" style={{color: '#710100'}}>
                👤 Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500 text-sm md:text-base"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs md:text-sm font-semibold mb-2 md:mb-3 flex items-center gap-2" style={{color: '#710100'}}>
                🔑 Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-3 md:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500 text-sm md:text-base"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="border px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base break-words" style={{backgroundColor: '#fef2f2', borderColor: '#710100', color: '#710100'}}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-300 flex items-center justify-center transform hover:scale-105 hover:shadow-xl disabled:hover:scale-100 text-sm md:text-base"
              style={{
                backgroundColor: (!username.trim() || !password.trim() || loading) ? '#9CA3AF' : '#710100',
                background: (!username.trim() || !password.trim() || loading) ? '#9CA3AF' : 'linear-gradient(135deg, #710100 0%, #8b2635 100%)',
                boxShadow: (!username.trim() || !password.trim() || loading) ? 'none' : '0 8px 25px rgba(113, 1, 0, 0.4), 0 3px 10px rgba(113, 1, 0, 0.2)'
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  🚀 Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Link to Register */}
          <div className="mt-4 md:mt-6 text-center">
            <p className="text-gray-600 text-xs md:text-sm">
              Belum punya akun?{' '}
              <Link 
                href="/register" 
                className="font-medium hover:opacity-80"
                style={{color: '#8b2635'}}
              >
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials - mobile optimized */}
        <div className="border rounded-lg p-3 md:p-4 mt-4 md:mt-6" style={{backgroundColor: 'rgba(253, 242, 224, 0.8)', borderColor: 'rgba(113, 1, 0, 0.3)'}}>
          <h4 className="font-semibold mb-2 text-sm md:text-base" style={{color: '#710100'}}>Akun Demo:</h4>
          <div className="text-xs md:text-sm space-y-1" style={{color: '#8b2635'}}>
            <div>• Admin: username: <code className="text-xs">admin</code>, password: <code className="text-xs">admin123</code></div>
            <div>• User: username: <code className="text-xs">user</code>, password: <code className="text-xs">user123</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}