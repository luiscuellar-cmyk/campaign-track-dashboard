import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // 1. Permitir rutas públicas
  if (request.nextUrl.pathname.startsWith('/api/auth/login')) {
    return NextResponse.next();
  }

  // 2. Verificar token en cookies
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'campaign-dashboard-secret-2026');
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export const config = {
  matcher: '/api/:path*',
};