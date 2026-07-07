import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import Attempt from '@/models/Attempt';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(request, { params }) {
  await connectDB();
  const quiz = await Quiz.findOne({ linkToken: params.token });
  if (!quiz) return NextResponse.json({ error: 'Invalid test link.' }, { status: 404 });

  const now = new Date();
  if (quiz.status !== 'published') {
    return NextResponse.json({ error: 'This test is not currently open.' }, { status: 403 });
  }
  if (quiz.startAt && now < quiz.startAt) {
    return NextResponse.json({ error: 'This test has not started yet.' }, { status: 403 });
  }
  if (quiz.endAt && now > quiz.endAt) {
    return NextResponse.json({ error: 'This test link has expired.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const rawInfo = body.studentInfo || {};

  for (const field of quiz.formConfig) {
    if (field.required && !String(rawInfo[field.key] || '').trim()) {
      return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 });
    }
  }

  const studentInfo = {};
  for (const [k, v] of Object.entries(rawInfo)) {
    studentInfo[k] = String(v ?? '').trim();
  }

  const identifierParts = ['email', 'phone', 'name']
    .map((k) => (studentInfo[k] || '').toLowerCase())
    .filter(Boolean);
  const identifier = identifierParts.join('|') || JSON.stringify(studentInfo);
  studentInfo.__identifier = identifier;

  const prevAttempts = await Attempt.countDocuments({
    quizId: quiz._id,
    'studentInfo.__identifier': identifier,
  });

  if (prevAttempts >= quiz.maxAttempts) {
    return NextResponse.json(
      { error: 'You have already used your allowed attempt(s) for this test.' },
      { status: 403 }
    );
  }

  let questions = await Question.find({ quizId: quiz._id }).sort({ order: 1 }).lean();
  if (quiz.shuffleQuestions) questions = shuffle(questions);

  const startedAt = now;
  const deadlineAt = new Date(now.getTime() + quiz.durationMinutes * 60000);

  const attempt = await Attempt.create({
    quizId: quiz._id,
    studentInfo,
    startedAt,
    deadlineAt,
    status: 'in_progress',
    questionOrder: questions.map((q) => q._id),
    ipAddress: request.headers.get('x-forwarded-for') || request.ip || '',
    userAgent: request.headers.get('user-agent') || '',
  });

  return NextResponse.json({ attemptId: attempt._id });
}
