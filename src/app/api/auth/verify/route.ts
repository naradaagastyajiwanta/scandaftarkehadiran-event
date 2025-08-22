import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Token tidak ditemukan'
      }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      id: string;
      username: string;
      name: string;
      role: string;
    };

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        name: decoded.name,
        role: decoded.role
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Token tidak valid'
    }, { status: 401 });
  }
}