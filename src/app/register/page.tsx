"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim() || !name.trim()) {
      setError('Semua field harus diisi');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name })
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (data.success) {
        setSuccess(data.message);
        console.log('Registration successful, redirecting to login...');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        console.log('Registration failed:', data.message);
        setError(data.message || 'Registrasi gagal');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4" style={{background: 'linear-gradient(135deg, #fdf2e0 0%, #f7e6c4 100%)'}}>
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{color: '#710100'}}>
            Daftar Akun
          </h1>
          <p style={{color: '#8b2635'}}>
            Buat akun baru untuk mengakses sistem verifikasi peserta
          </p>
        </div>

        {/* Registration Form */}
        <div className="rounded-lg shadow-lg p-6" style={{backgroundColor: 'rgba(253, 242, 224, 0.95)', border: '1px solid rgba(113, 1, 0, 0.15)'}}>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={{color: '#710100'}}>
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2" style={{color: '#710100'}}>
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username (min. 3 karakter)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{color: '#710100'}}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password (min. 6 karakter)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="border px-4 py-3 rounded-lg" style={{backgroundColor: '#fef2f2', borderColor: '#710100', color: '#710100'}}>
                {error}
              </div>
            )}

            {success && (
              <div className="border px-4 py-3 rounded-lg" style={{backgroundColor: '#f0fdf4', borderColor: '#22c55e', color: '#166534'}}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim() || !name.trim()}
              className="w-full disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center hover:opacity-90"
              style={{backgroundColor: !username.trim() || !password.trim() || !name.trim() || loading ? '#9CA3AF' : '#8b2635'}}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mendaftar...
                </>
              ) : (
                '🎉 Daftar'
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Sudah punya akun?{' '}
              <Link 
                href="/login" 
                className="font-medium hover:opacity-80"
                style={{color: '#710100'}}
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="border rounded-lg p-4 mt-6" style={{backgroundColor: 'rgba(253, 242, 224, 0.8)', borderColor: 'rgba(113, 1, 0, 0.3)'}}>
          <h4 className="font-semibold mb-2" style={{color: '#710100'}}>Informasi:</h4>
          <ul className="text-sm space-y-1" style={{color: '#8b2635'}}>
            <li>• Username minimal 3 karakter</li>
            <li>• Password minimal 6 karakter</li>
            <li>• Akun baru akan memiliki role &quot;user&quot;</li>
            <li>• Setelah daftar, silakan login dengan akun yang dibuat</li>
          </ul>
        </div>
      </div>
    </div>
  );
}