import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/apiAuth';
import User from '@/models/User';
import { generateTempPassword } from '@/lib/security';

// Manual, free, no-email password reset: the super admin generates a temp password
// here and shares it with the teacher out-of-band (phone/WhatsApp/in person). The
// teacher is forced to set their own new password on next login.
export async function POST(request, { params }) {
  const admin = await requireUser(request, { roles: ['super_admin'] });
  if (!admin) return unauthorized();

  await connectDB();
  const teacher = await User.findOne({ _id: params.id, role: 'teacher' });
  if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const tempPassword = generateTempPassword();
  teacher.passwordHash = await bcrypt.hash(tempPassword, 12);
  teacher.mustChangePassword = true;
  await teacher.save();

  return NextResponse.json({ ok: true, tempPassword });
}
