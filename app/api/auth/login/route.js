import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { signSessionToken, getSessionCookieOptions } from '@/lib/auth';
import { checkRateLimit, recordFailure, resetRateLimit, normalizeEmail } from '@/lib/security';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);

    // Rate-limit by IP+email combo so one attacker can't lock out a real user's
    // email by spamming failed logins from many IPs, while still slowing down
    // brute force against any single account.
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `login:${ip}:${normalizedEmail}`;
    const rl = checkRateLimit(rateLimitKey);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).` },
        { status: 429 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: normalizedEmail });

    // Deliberately generic error message + same code path whether the user
    // exists or not, so this endpoint can't be used to enumerate registered emails.
    const genericError = () => {
      recordFailure(rateLimitKey);
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    };

    if (!user) return genericError();

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return genericError();

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact the platform admin.' },
        { status: 403 }
      );
    }

    resetRateLimit(rateLimitKey);
    user.lastLoginAt = new Date();
    await user.save();

    const token = signSessionToken({ userId: user._id.toString(), role: user.role });
    const res = NextResponse.json({
      ok: true,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });
    const cookieOpts = getSessionCookieOptions();
    res.cookies.set(cookieOpts.name, token, cookieOpts);
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
