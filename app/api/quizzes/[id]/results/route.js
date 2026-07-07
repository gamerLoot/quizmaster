import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/apiAuth';
import Quiz from '@/models/Quiz';
import Attempt from '@/models/Attempt';
import { mapToObject } from '@/lib/serialize';

export async function GET(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const quiz = await Quiz.findOne({ _id: params.id, createdBy: admin.adminId }).lean();
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const attempts = await Attempt.find({ quizId: params.id })
    .sort({ createdAt: -1 })
    .select('-answers -questionOrder')
    .lean();

  const summary = attempts.map((a) => ({
    _id: a._id,
    studentInfo: mapToObject(a.studentInfo),
    status: a.status,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    deadlineAt: a.deadlineAt,
    totalScore: a.totalScore,
    maxScore: a.maxScore,
    passed: a.passed,
    violationCount: a.violationCount,
    ipAddress: a.ipAddress,
  }));

  const stats = {
    total: attempts.length,
    inProgress: attempts.filter((a) => a.status === 'in_progress').length,
    submitted: attempts.filter((a) => a.status !== 'in_progress').length,
    passed: attempts.filter((a) => a.passed).length,
    avgScore:
      attempts.length > 0
        ? Math.round(
            (attempts.reduce((s, a) => s + (a.totalScore || 0), 0) / attempts.length) * 10
          ) / 10
        : 0,
  };

  return NextResponse.json({ quizTitle: quiz.title, attempts: summary, stats });
}
