import { NextResponse } from 'next/server';
import { getSessionCookieOptions } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const cookieOpts = getSessionCookieOptions();
  res.cookies.set(cookieOpts.name, '', { ...cookieOpts, maxAge: 0 });
  return res;
}
