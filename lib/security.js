// Lightweight, dependency-free security helpers.
// Rate limiting here is in-memory (per server instance) — good enough to slow down
// casual brute-force/credential-stuffing on a small free-tier deployment. It resets
// on redeploy/cold-start, which is an accepted trade-off for staying 100% free
// (no Redis needed).

const attempts = new Map(); // key -> { count, firstAt }
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 8;

function cleanup(now) {
  for (const [key, v] of attempts) {
    if (now - v.firstAt > WINDOW_MS) attempts.delete(key);
  }
}

/**
 * Returns { allowed, retryAfterSeconds }. Call `recordFailure(key)` only when the
 * attempt actually fails, so legitimate users typing their password correctly are
 * never penalized.
 */
export function checkRateLimit(key) {
  const now = Date.now();
  cleanup(now);
  const v = attempts.get(key);
  if (!v) return { allowed: true };
  if (now - v.firstAt > WINDOW_MS) return { allowed: true };
  if (v.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((WINDOW_MS - (now - v.firstAt)) / 1000) };
  }
  return { allowed: true };
}

export function recordFailure(key) {
  const now = Date.now();
  const v = attempts.get(key);
  if (!v || now - v.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
  } else {
    v.count += 1;
  }
}

export function resetRateLimit(key) {
  attempts.delete(key);
}

/**
 * Minimal but real password strength check — not just "length >= 6".
 * Requires 8+ chars, at least one letter and one digit.
 */
export function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (password.length > 128) {
    return 'Password is too long.';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return null; // valid
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Generates a random, human-shareable temporary password (used by super-admin "reset password")
export function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
