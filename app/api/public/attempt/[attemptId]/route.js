import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attempt from '@/models/Attempt';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import { finalizeAttempt } from '@/lib/finalizeAttempt';

export async function GET(request, { params }) {
  await connectDB();
  const attempt = await Attempt.findById(params.attemptId);
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const quiz = await Quiz.findById(attempt.quizId).lean();
  const questions = await Question.find({ quizId: attempt.quizId }).lean();

  const now = new Date();
  if (attempt.status === 'in_progress' && now >= attempt.deadlineAt) {
    finalizeAttempt(attempt, questions, quiz, 'auto_submitted');
    await attempt.save();
  }

  if (attempt.status !== 'in_progress') {
    return NextResponse.json({ status: attempt.status });
  }

  const orderIds = attempt.questionOrder.map(String);
  const qMap = new Map(questions.map((q) => [String(q._id), q]));
  const orderedQuestions = orderIds
    .map((id) => qMap.get(id))
    .filter(Boolean)
    .map((q) => ({
      _id: q._id,
      type: q.type,
      text: q.text,
      imageUrl: q.imageUrl,
      marks: q.marks,
      options: (q.options || []).map((o) => ({ _id: o._id, text: o.text })),
    }));

  const answersMap = {};
  attempt.answers.forEach((a) => {
    answersMap[String(a.questionId)] = {
      selectedOptionIds: (a.selectedOptionIds || []).map(String),
      textAnswer: a.textAnswer,
    };
  });

  return NextResponse.json({
    status: 'in_progress',
    quizTitle: quiz.title,
    violationLimit: quiz.violationLimit,
    remainingSeconds: Math.max(0, Math.floor((attempt.deadlineAt - now) / 1000)),
    questions: orderedQuestions,
    answers: answersMap,
    violationCount: attempt.violationCount,
  });
}
