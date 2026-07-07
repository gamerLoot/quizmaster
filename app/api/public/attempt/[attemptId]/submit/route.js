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

  const quiz = await Quiz.findById(attempt.quizId).lean();

  if (attempt.status === 'in_progress') {
    const questions = await Question.find({ quizId: attempt.quizId }).lean();
    finalizeAttempt(attempt, questions, quiz, 'submitted');
    await attempt.save();
  }

  return NextResponse.json({ ok: true, showResult: quiz.showResultImmediately });
}
