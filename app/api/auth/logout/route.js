import { NextResponse } from 'next/server';
import { getAdminSessionCookieOptions } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const cookieOpts = getAdminSessionCookieOptions();
  res.cookies.set(cookieOpts.name, '', { ...cookieOpts, maxAge: 0 });
  return res;
}
