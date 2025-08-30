"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: string;
}

interface CurrentUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface UserFormData {
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

export default function AdminPanel() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    name: '',
    role: 'user'
  });
  const [formLoading, setFormLoading] = useState(false);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const data = await response.json();
      
      if (data.success && data.user.role === 'admin') {
        setCurrentUser(data.user);
        fetchUsers();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Fetch users failed:', error);
      setError('Gagal mengambil data user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = editingUser ? '/api/users' : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser 
        ? { id: editingUser.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setShowAddForm(false);
        setEditingUser(null);
        setFormData({ username: '', password: '', name: '', role: 'user' });
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      setError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role as 'admin' | 'user'
    });
    setShowAddForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Terjadi kesalahan saat menghapus user');
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', name: '', role: 'user' });
    setError('');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #fdf2e0 0%, #f7e6c4 100%)'}}>
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" style={{color: '#710100'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p style={{color: '#8b2635'}}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{background: 'linear-gradient(135deg, #fdf2e0 0%, #f7e6c4 50%, #f4dfc0 100%)'}}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="rounded-xl p-6 mb-6 flex justify-between items-center backdrop-blur-sm" style={{
          backgroundColor: 'rgba(253, 242, 224, 0.95)', 
          border: '1px solid rgba(113, 1, 0, 0.2)',
          boxShadow: '0 8px 32px rgba(113, 1, 0, 0.15)'
        }}>
          <div>
            <h1 className="text-3xl font-bold" style={{color: '#710100'}}>Admin Panel</h1>
            <p className="text-lg mt-1" style={{color: '#8b2635'}}>Kelola User Sistem</p>
            {currentUser && (
              <p className="text-sm mt-2" style={{color: '#8b2635'}}>
                Login sebagai: <strong>{currentUser.name}</strong> (@{currentUser.username})
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{backgroundColor: '#8b2635'}}
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{backgroundColor: '#710100'}}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Add User Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{
              backgroundColor: '#22c55e',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
            }}
          >
            {showAddForm ? 'Batal Tambah User' : '+ Tambah User Baru'}
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="border-2 px-6 py-4 rounded-xl mb-6" style={{
            backgroundColor: 'rgba(254, 242, 242, 0.95)', 
            borderColor: '#ef4444', 
            color: '#dc2626'
          }}>
            <div className="flex items-center gap-3">
              <div className="text-xl">❌</div>
              <div className="font-medium">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="border-2 px-6 py-4 rounded-xl mb-6" style={{
            backgroundColor: 'rgba(240, 253, 244, 0.95)', 
            borderColor: '#22c55e', 
            color: '#166534'
          }}>
            <div className="flex items-center gap-3">
              <div className="text-xl">✅</div>
              <div className="font-medium">{success}</div>
            </div>
          </div>
        )}

        {/* Add/Edit User Form */}
        {showAddForm && (
          <div className="rounded-xl p-6 mb-6 backdrop-blur-sm" style={{
            backgroundColor: 'rgba(253, 242, 224, 0.98)', 
            border: '1px solid rgba(113, 1, 0, 0.2)',
            boxShadow: '0 12px 40px rgba(113, 1, 0, 0.15)'
          }}>
            <h2 className="text-xl font-bold mb-4" style={{color: '#710100'}}>
              {editingUser ? 'Edit User' : 'Tambah User Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color: '#710100'}}>
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg outline-none"
                  style={{borderColor: '#f7e6c4', color: '#710100'}}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color: '#710100'}}>
                  Password {editingUser && '(kosongkan jika tidak ingin ubah)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg outline-none"
                  style={{borderColor: '#f7e6c4', color: '#710100'}}
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color: '#710100'}}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg outline-none"
                  style={{borderColor: '#f7e6c4', color: '#710100'}}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color: '#710100'}}>
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'user'})}
                  className="w-full px-4 py-3 border rounded-lg outline-none"
                  style={{borderColor: '#f7e6c4', color: '#710100'}}
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: formLoading ? '#9CA3AF' : '#710100',
                    background: formLoading ? '#9CA3AF' : 'linear-gradient(135deg, #710100 0%, #8b2635 100%)'
                  }}
                >
                  {formLoading ? 'Menyimpan...' : (editingUser ? 'Update User' : 'Tambah User')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-700 bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="rounded-xl backdrop-blur-sm overflow-hidden" style={{
          backgroundColor: 'rgba(253, 242, 224, 0.98)', 
          border: '1px solid rgba(113, 1, 0, 0.2)',
          boxShadow: '0 12px 40px rgba(113, 1, 0, 0.15)'
        }}>
          <div className="px-6 py-4 border-b" style={{borderColor: 'rgba(113, 1, 0, 0.1)'}}>
            <h2 className="text-xl font-bold" style={{color: '#710100'}}>
              Daftar User ({users.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b" style={{borderColor: 'rgba(113, 1, 0, 0.1)'}}>
                <tr>
                  <th className="px-6 py-4 text-left font-semibold" style={{color: '#710100'}}>ID</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{color: '#710100'}}>Username</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{color: '#710100'}}>Password</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{color: '#710100'}}>Nama</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{color: '#710100'}}>Role</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{color: '#710100'}}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50" style={{borderColor: 'rgba(113, 1, 0, 0.05)'}}>
                    <td className="px-6 py-4 text-gray-900">{user.id}</td>
                    <td className="px-6 py-4 text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 text-gray-900 font-mono">{user.password}</td>
                    <td className="px-6 py-4 text-gray-900">{user.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Edit
                        </button>
                        {currentUser && user.id !== currentUser.id && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}