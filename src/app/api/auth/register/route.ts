import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

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
    const { username, password, name } = await request.json();
    console.log('Registration attempt:', { username, name, password: '***' });

    if (!username || !password || !name) {
      return NextResponse.json({
        success: false,
        message: 'Username, password, dan nama diperlukan'
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

    // Read users from JSON file
    const usersPath = join(process.cwd(), 'data', 'users.json');
    console.log('Reading users from:', usersPath);
    
    let usersData: UsersData;
    try {
      usersData = JSON.parse(readFileSync(usersPath, 'utf8'));
    } catch (error) {
      console.error('Error reading users file:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal membaca data pengguna'
      }, { status: 500 });
    }

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
      password: password.trim(), // In production, this should be hashed
      name: name.trim(),
      role: 'user' // Default role
    };

    // Add new user to array
    usersData.users.push(newUser);

    // Write back to file
    try {
      writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf8');
      console.log('New user registered:', { id: newId, username: newUser.username, name: newUser.name });
    } catch (error) {
      console.error('Error writing users file:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal menyimpan data pengguna'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil! Silakan login.',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}