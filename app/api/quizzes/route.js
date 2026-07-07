import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/apiAuth';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';

export async function GET(request) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const quizzes = await Quiz.find({ createdBy: admin.adminId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ quizzes });
}

export async function POST(request) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { questions = [], ...quizFields } = body;

  if (!quizFields.title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  await connectDB();

  const quiz = await Quiz.create({
    ...quizFields,
    createdBy: admin.adminId,
    status: 'draft',
  });

  if (questions.length > 0) {
    const docs = questions.map((q, i) => ({ ...q, quizId: quiz._id, order: i }));
    await Question.insertMany(docs);
  }

  return NextResponse.json({ quiz }, { status: 201 });
}
