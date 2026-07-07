import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/apiAuth';
import User from '@/models/User';
import Quiz from '@/models/Quiz';

export async function GET(request) {
  const admin = await requireUser(request, { roles: ['super_admin'] });
  if (!admin) return unauthorized();

  await connectDB();
  const teachers = await User.find({ role: 'teacher' }).sort({ createdAt: -1 }).lean();

  const quizCounts = {};
  for (const t of teachers) {
    quizCounts[t._id] = await Quiz.countDocuments({ createdBy: t._id });
  }

  const list = teachers.map((t) => ({
    _id: t._id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    status: t.status,
    limits: t.limits,
    mustChangePassword: t.mustChangePassword,
    lastLoginAt: t.lastLoginAt,
    createdAt: t.createdAt,
    quizCount: quizCounts[t._id] ?? 0,
  }));

  return NextResponse.json({ teachers: list });
}
