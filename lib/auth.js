import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  // Fail loudly in production rather than silently signing tokens with a guessable
  // fallback secret.
  throw new Error('JWT_SECRET is not set. Refusing to start in production without it.');
}

const EFFECTIVE_SECRET = JWT_SECRET || 'dev-only-insecure-secret-change-me';
const COOKIE_NAME = 'qm_session';

export function signSessionToken(payload) {
  // payload: { userId, role }
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: '7d' });
}

export function verifySessionToken(token) {
  try {
    return jwt.verify(token, EFFECTIVE_SECRET);
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

// Server Component helper (reads the cookie via next/headers)
export function getSessionFromCookies() {
  const store = cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
