import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
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

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    console.log('Login attempt:', { username, password: '***' });

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: 'Username dan password diperlukan'
      }, { status: 400 });
    }

    // Read users from JSON file
    const usersPath = join(process.cwd(), 'data', 'users.json');
    console.log('Reading users from:', usersPath);
    const usersData: UsersData = JSON.parse(readFileSync(usersPath, 'utf8'));

    // Find user
    const user = usersData.users.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Username atau password salah'
      }, { status: 401 });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        name: user.name, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create response with httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });

    // Set httpOnly cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}