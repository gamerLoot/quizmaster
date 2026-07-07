import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUser, unauthorized, forbidden } from '@/lib/apiAuth';
import User from '@/models/User';
import Quiz from '@/models/Quiz';
import Attempt from '@/models/Attempt';
import Question from '@/models/Question';

export async function PATCH(request, { params }) {
  const admin = await requireUser(request, { roles: ['super_admin'] });
  if (!admin) return unauthorized();

  await connectDB();
  const teacher = await User.findOne({ _id: params.id, role: 'teacher' });
  if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));

  if (typeof body.status === 'string') {
    if (!['active', 'suspended'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    teacher.status = body.status;
  }

  if (body.limits && typeof body.limits === 'object') {
    const maxQuizzes = Number(body.limits.maxQuizzes);
    const maxAttemptsPerQuiz = Number(body.limits.maxAttemptsPerQuiz);
    if (Number.isFinite(maxQuizzes) && maxQuizzes >= 0) {
      teacher.limits.maxQuizzes = maxQuizzes;
    }
    if (Number.isFinite(maxAttemptsPerQuiz) && maxAttemptsPerQuiz >= 0) {
      teacher.limits.maxAttemptsPerQuiz = maxAttemptsPerQuiz;
    }
  }

  await teacher.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const admin = await requireUser(request, { roles: ['super_admin'] });
  if (!admin) return unauthorized();

  await connectDB();
  const teacher = await User.findOne({ _id: params.id, role: 'teacher' });
  if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Cascade-delete everything this teacher owns so we don't leave orphaned
  // quizzes/questions/attempts behind (and don't waste free-tier storage).
  const quizzes = await Quiz.find({ createdBy: teacher._id }).select('_id').lean();
  const quizIds = quizzes.map((q) => q._id);

  await Promise.all([
    Question.deleteMany({ quizId: { $in: quizIds } }),
    Attempt.deleteMany({ quizId: { $in: quizIds } }),
    Quiz.deleteMany({ createdBy: teacher._id }),
    teacher.deleteOne(),
  ]);

  return NextResponse.json({ ok: true });
}
