import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { signSessionToken, getSessionCookieOptions } from '@/lib/auth';
import {
  checkRateLimit,
  recordFailure,
  isValidEmail,
  normalizeEmail,
  validatePasswordStrength,
} from '@/lib/security';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = checkRateLimit(`signup:${ip}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many signup attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = normalizeEmail(body.email);
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');

    if (!name || name.length > 100) {
      return NextResponse.json({ error: 'Please enter a valid name.' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (phone && phone.length > 20) {
      return NextResponse.json({ error: 'Phone number is too long.' }, { status: 400 });
    }
    const pwError = validatePasswordStrength(password);
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      recordFailure(`signup:${ip}`);
      // Generic message — don't confirm which emails are already registered.
      return NextResponse.json(
        { error: 'Could not create account with these details. Try logging in instead.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: 'teacher',
      status: 'active',
    });

    const token = signSessionToken({ userId: user._id.toString(), role: user.role });
    const res = NextResponse.json({ ok: true, role: user.role }, { status: 201 });
    const cookieOpts = getSessionCookieOptions();
    res.cookies.set(cookieOpts.name, token, cookieOpts);
    return res;
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
