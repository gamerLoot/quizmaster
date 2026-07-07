import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attempt from '@/models/Attempt';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import { finalizeAttempt } from '@/lib/finalizeAttempt';

export async function POST(request, { params }) {
  await connectDB();
  const attempt = await Attempt.findById(params.attemptId);
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (attempt.status !== 'in_progress') {
    return NextResponse.json({ status: attempt.status });
  }

  const { type, detail } = await request.json();
  attempt.violationLog.push({ type, detail: detail || '', at: new Date() });
  attempt.violationCount += 1;

  const quiz = await Quiz.findById(attempt.quizId).lean();
  let autoSubmitted = false;

  if (quiz.violationLimit && attempt.violationCount >= quiz.violationLimit) {
    const questions = await Question.find({ quizId: attempt.quizId }).lean();
    finalizeAttempt(attempt, questions, quiz, 'auto_submitted');
    autoSubmitted = true;
  }

  await attempt.save();
  return NextResponse.json({ ok: true, violationCount: attempt.violationCount, autoSubmitted });
}
