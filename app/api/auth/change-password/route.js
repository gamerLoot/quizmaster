import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { requireUser, unauthorized } from '@/lib/apiAuth';
import { validatePasswordStrength } from '@/lib/security';

export async function POST(request) {
  const sessionUser = await requireUser(request);
  if (!sessionUser) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');

  const pwError = validatePasswordStrength(newPassword);
  if (pwError) {
    return NextResponse.json({ error: pwError }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(sessionUser._id);
  if (!user) return unauthorized();

  // Not required on a super-admin-forced reset the very first time (mustChangePassword
  // guarantees the user just proved their identity by logging in with the temp password),
  // but we still ask for it here since this endpoint is also used for voluntary changes.
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  await user.save();

  return NextResponse.json({ ok: true });
}
