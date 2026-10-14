import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  let validSession = false;
  if (session && process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    try {
      const { payload } = await jwtVerify(session, new TextEncoder().encode(process.env.JWT_SECRET), { algorithms: ['HS256'] });
      validSession = typeof payload.userId === 'string' && !!payload.userId.trim() && typeof payload.role === 'string' && !!payload.role.trim() && typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch { /* Invalid cookies must not prevent reauthentication. */ }
  }
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');

  // Allow API auth routes to be accessed publicly
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // If there's no session and the user isn't already on the login page, redirect to login
  if (!validSession && !isLoginPage) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (session) response.cookies.delete('session');
    return response;
  }

  // If there is a session and the user is explicitly trying to visit the login page, redirect to home
  if (validSession && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next();
  if (session && !validSession) response.cookies.delete('session');
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|fonts/|vendor/).*)'],
};
