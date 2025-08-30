import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: string;
}

interface UsersData {
  users: User[];
}

// Verify JWT token and check if user is admin
function verifyAdmin(request: Request) {
  const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - List all users (admin only)
export async function GET(request: Request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 401 });
    }

    const usersPath = join(process.cwd(), 'data', 'users.json');
    const usersData: UsersData = JSON.parse(readFileSync(usersPath, 'utf8'));

    // Return users with passwords for admin
    const safeUsers = usersData.users.map(user => ({
      id: user.id,
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role
    }));

    return NextResponse.json({
      success: true,
      users: safeUsers
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}

// POST - Create new user (admin only)
export async function POST(request: Request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 401 });
    }

    const { username, password, name, role } = await request.json();

    if (!username || !password || !name || !role) {
      return NextResponse.json({
        success: false,
        message: 'Username, password, nama, dan role diperlukan'
      }, { status: 400 });
    }

    // Validate input
    if (username.length < 3) {
      return NextResponse.json({
        success: false,
        message: 'Username minimal 3 karakter'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password minimal 6 karakter'
      }, { status: 400 });
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({
        success: false,
        message: 'Role harus admin atau user'
      }, { status: 400 });
    }

    // Read users from JSON file
    const usersPath = join(process.cwd(), 'data', 'users.json');
    const usersData: UsersData = JSON.parse(readFileSync(usersPath, 'utf8'));

    // Check if username already exists
    const existingUser = usersData.users.find(u => u.username === username.toLowerCase().trim());
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Username sudah digunakan'
      }, { status: 409 });
    }

    // Generate new ID
    const maxId = Math.max(...usersData.users.map(u => parseInt(u.id))) || 0;
    const newId = (maxId + 1).toString();

    // Create new user
    const newUser: User = {
      id: newId,
      username: username.toLowerCase().trim(),
      password: password.trim(),
      name: name.trim(),
      role: role
    };

    // Add new user to array
    usersData.users.push(newUser);

    // Write back to file
    writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      message: 'User berhasil ditambahkan',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}

// PUT - Update user (admin only)
export async function PUT(request: Request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 401 });
    }

    const { id, username, password, name, role } = await request.json();

    if (!id || !username || !name || !role) {
      return NextResponse.json({
        success: false,
        message: 'ID, username, nama, dan role diperlukan'
      }, { status: 400 });
    }

    // Validate input
    if (username.length < 3) {
      return NextResponse.json({
        success: false,
        message: 'Username minimal 3 karakter'
      }, { status: 400 });
    }

    if (password && password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password minimal 6 karakter'
      }, { status: 400 });
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({
        success: false,
        message: 'Role harus admin atau user'
      }, { status: 400 });
    }

    // Read users from JSON file
    const usersPath = join(process.cwd(), 'data', 'users.json');
    const usersData: UsersData = JSON.parse(readFileSync(usersPath, 'utf8'));

    // Find user to update
    const userIndex = usersData.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'User tidak ditemukan'
      }, { status: 404 });
    }

    // Check if username already exists (excluding current user)
    const existingUser = usersData.users.find(u => u.username === username.toLowerCase().trim() && u.id !== id);
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Username sudah digunakan'
      }, { status: 409 });
    }

    // Update user
    usersData.users[userIndex].username = username.toLowerCase().trim();
    usersData.users[userIndex].name = name.trim();
    usersData.users[userIndex].role = role;
    
    // Only update password if provided
    if (password) {
      usersData.users[userIndex].password = password.trim();
    }

    // Write back to file
    writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      message: 'User berhasil diupdate',
      user: {
        id: usersData.users[userIndex].id,
        username: usersData.users[userIndex].username,
        name: usersData.users[userIndex].name,
        role: usersData.users[userIndex].role
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(request: Request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID diperlukan'
      }, { status: 400 });
    }

    // Read users from JSON file
    const usersPath = join(process.cwd(), 'data', 'users.json');
    const usersData: UsersData = JSON.parse(readFileSync(usersPath, 'utf8'));

    // Find user to delete
    const userIndex = usersData.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'User tidak ditemukan'
      }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (usersData.users[userIndex].id === admin.id) {
      return NextResponse.json({
        success: false,
        message: 'Tidak dapat menghapus akun sendiri'
      }, { status: 400 });
    }

    // Remove user from array
    const deletedUser = usersData.users.splice(userIndex, 1)[0];

    // Write back to file
    writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus',
      deletedUser: {
        id: deletedUser.id,
        username: deletedUser.username,
        name: deletedUser.name,
        role: deletedUser.role
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}