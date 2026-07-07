import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attempt from '@/models/Attempt';
import Quiz from '@/models/Quiz';

export async function GET(request, { params }) {
  await connectDB();
  const attempt = await Attempt.findById(params.attemptId).lean();
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const quiz = await Quiz.findById(attempt.quizId).lean();

  if (attempt.status === 'in_progress') {
    return NextResponse.json({ status: 'in_progress' });
  }

  if (!quiz.showResultImmediately) {
    return NextResponse.json({ status: attempt.status, hidden: true, quizTitle: quiz.title });
  }

  return NextResponse.json({
    status: attempt.status,
    quizTitle: quiz.title,
    totalScore: attempt.totalScore,
    maxScore: attempt.maxScore,
    passed: attempt.passed,
    passPercent: quiz.passPercent,
    violationCount: attempt.violationCount,
  });
}
