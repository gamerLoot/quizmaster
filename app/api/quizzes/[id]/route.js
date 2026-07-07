import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/apiAuth';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import Attempt from '@/models/Attempt';

export async function GET(request, { params }) {
  const user = await requireUser(request, { roles: ['teacher'] });
  if (!user) return unauthorized();

  await connectDB();
  const quiz = await Quiz.findOne({ _id: params.id, createdBy: user._id }).lean();
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const questions = await Question.find({ quizId: params.id }).sort({ order: 1 }).lean();
  return NextResponse.json({ quiz, questions });
}

export async function PUT(request, { params }) {
  const user = await requireUser(request, { roles: ['teacher'] });
  if (!user) return unauthorized();

  const body = await request.json();
  const { questions, ...quizFields } = body;

  await connectDB();
  const quiz = await Quiz.findOne({ _id: params.id, createdBy: user._id });
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  Object.assign(quiz, quizFields);
  await quiz.save();

  if (Array.isArray(questions)) {
    await Question.deleteMany({ quizId: quiz._id });
    if (questions.length > 0) {
      const docs = questions.map((q, i) => ({ ...q, quizId: quiz._id, order: i }));
      await Question.insertMany(docs);
    }
  }

  return NextResponse.json({ quiz });
}

export async function DELETE(request, { params }) {
  const user = await requireUser(request, { roles: ['teacher'] });
  if (!user) return unauthorized();

  await connectDB();
  const quiz = await Quiz.findOne({ _id: params.id, createdBy: user._id });
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await Promise.all([
    Question.deleteMany({ quizId: quiz._id }),
    Attempt.deleteMany({ quizId: quiz._id }),
    quiz.deleteOne(),
  ]);

  return NextResponse.json({ ok: true });
}
