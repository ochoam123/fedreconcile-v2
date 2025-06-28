// src/app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { signMockJwt } from '../../../lib/jwt'; // Adjust path if needed

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // --- TEMPORARY: Hardcoded credentials for demonstration ---
    if (username === 'admin' && password === 'password123') {
      const payload = { userId: 'adminUser', role: 'admin' };
      const token = signMockJwt(payload); // Sign a mock JWT
      return NextResponse.json({ success: true, token, message: 'Authentication successful.' });
    } else if (username === 'analyst' && password === 'gtaspass') {
        const payload = { userId: 'gtasAnalyst', role: 'gtas_analyst' };
        const token = signMockJwt(payload); // Sign a mock JWT
        return NextResponse.json({ success: true, token, message: 'Authentication successful.' });
    }
    // --- END TEMPORARY ---

    return NextResponse.json({ success: false, message: 'Invalid username or password.' }, { status: 401 });

  } catch (error) {
    console.error('Authentication API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}