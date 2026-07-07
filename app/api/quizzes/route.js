import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUser, unauthorized, forbidden } from '@/lib/apiAuth';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';

export async function GET(request) {
  const user = await requireUser(request, { roles: ['teacher'] });
  if (!user) return unauthorized();

  await connectDB();
  const quizzes = await Quiz.find({ createdBy: user._id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ quizzes });
}

export async function POST(request) {
  const user = await requireUser(request, { roles: ['teacher'] });
  if (!user) return unauthorized();

  const body = await request.json();
  const { questions = [], ...quizFields } = body;

  if (!quizFields.title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  await connectDB();

  // Free-tier protection: enforce the per-teacher quiz cap set by the super admin.
  const maxQuizzes = user.limits?.maxQuizzes ?? 10;
  const existingCount = await Quiz.countDocuments({ createdBy: user._id });
  if (existingCount >= maxQuizzes) {
    return forbidden(
      `You've reached your limit of ${maxQuizzes} quizzes. Contact the platform admin to increase it.`
    );
  }

  const quiz = await Quiz.create({
    ...quizFields,
    createdBy: user._id,
    status: 'draft',
  });

  if (questions.length > 0) {
    const docs = questions.map((q, i) => ({ ...q, quizId: quiz._id, order: i }));
    await Question.insertMany(docs);
  }

  return NextResponse.json({ quiz }, { status: 201 });
}
