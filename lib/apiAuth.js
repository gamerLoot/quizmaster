import { verifyAdminToken, ADMIN_COOKIE_NAME } from './auth';

// Helper for use inside app/api route handlers (NextRequest available there)
export function requireAdmin(request) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
