import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from './auth';
import { connectDB } from './db';
import User from '../models/User';

// Decodes the JWT only — does NOT hit the database. Use for cheap checks.
export function getSessionFromRequest(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Server Component equivalent of requireUser() — reads the cookie via next/headers
 * instead of a NextRequest, then re-checks the live status/role in the database.
 * Use this in page.js files so a suspended teacher is bounced out immediately
 * rather than after their 7-day token expires. Returns the lean User doc or null.
 */
export async function getCurrentUser({ roles } = {}) {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifySessionToken(token);
  if (!session?.userId) return null;

  await connectDB();
  const user = await User.findById(session.userId).lean();
  if (!user || user.status !== 'active') return null;
  if (roles && !roles.includes(user.role)) return null;

  return user;
}

/**
 * Full auth check: verifies the JWT AND re-checks the user's current status/role
 * in the database, so a suspended account is locked out immediately rather than
 * waiting for their 7-day token to expire.
 *
 * Returns the live User document (lean) or null.
 */
export async function requireUser(request, { roles } = {}) {
  const session = getSessionFromRequest(request);
  if (!session?.userId) return null;

  await connectDB();
  const user = await User.findById(session.userId).lean();
  if (!user || user.status !== 'active') return null;
  if (roles && !roles.includes(user.role)) return null;

  return user;
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}
