import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/apiAuth';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import Attempt from '@/models/Attempt';
import { mapToObject } from '@/lib/serialize';

export async function GET(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const quiz = await Quiz.findOne({ _id: params.id, createdBy: admin.adminId }).lean();
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const attempt = await Attempt.findOne({ _id: params.attemptId, quizId: params.id }).lean();
  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

  const questions = await Question.find({ quizId: params.id }).sort({ order: 1 }).lean();
  const qMap = new Map(questions.map((q) => [String(q._id), q]));

  const orderIds = (attempt.questionOrder || []).map(String);
  const answerMap = new Map(attempt.answers.map((a) => [String(a.questionId), a]));

  const answerSheet = orderIds
    .map((id) => qMap.get(id))
    .filter(Boolean)
    .map((q) => {
      const a = answerMap.get(String(q._id));
      return {
        questionText: q.text,
        type: q.type,
        marks: q.marks,
        options: q.options?.map((o) => ({ text: o.text, isCorrect: o.isCorrect, _id: o._id })),
        correctText: q.correctText,
        selectedOptionIds: (a?.selectedOptionIds || []).map(String),
        textAnswer: a?.textAnswer || '',
        isCorrect: a?.isCorrect || false,
        marksAwarded: a?.marksAwarded || 0,
        attempted: a?.attempted || false,
      };
    });

  return NextResponse.json({
    quizTitle: quiz.title,
    studentInfo: mapToObject(attempt.studentInfo),
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    deadlineAt: attempt.deadlineAt,
    totalScore: attempt.totalScore,
    maxScore: attempt.maxScore,
    passed: attempt.passed,
    ipAddress: attempt.ipAddress,
    userAgent: attempt.userAgent,
    violationLog: attempt.violationLog,
    answerSheet,
  });
}
