import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Runs on the Edge runtime — no DB access here. This is a fast first line of
// defense (redirect unauthenticated / wrong-role users away from protected
// pages). Every API route ALSO re-checks the user's live status/role against
// the database via requireUser() in lib/apiAuth.js, so a suspended account is
// still blocked even before its cookie expires.
//
// NOTE: we use `jose` here (not `jsonwebtoken`) because the Edge runtime does
// not support Node's `crypto` module, which `jsonwebtoken` depends on. `jose`
// uses Web Crypto and works on both Edge and Node. Tokens are still signed
// with `jsonwebtoken` in lib/auth.js (Node runtime) — both are plain HS256
// JWTs, so either library can verify a token the other one signed.

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me'
);
const COOKIE_NAME = 'qm_session';

async function decode(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await decode(token) : null;

  const isTeacherArea = pathname.startsWith('/teacher');
  const isSuperAdminArea = pathname.startsWith('/superadmin');

  if (isTeacherArea || isSuperAdminArea) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    if (isSuperAdminArea && session.role !== 'super_admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/teacher/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Already-logged-in users hitting the public auth pages get sent to their dashboard
  if ((pathname === '/login' || pathname === '/signup') && session) {
    const url = request.nextUrl.clone();
    url.pathname = session.role === 'super_admin' ? '/superadmin/dashboard' : '/teacher/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/teacher/:path*', '/superadmin/:path*', '/login', '/signup'],
};
