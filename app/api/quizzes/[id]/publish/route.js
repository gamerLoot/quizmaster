import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { connectDB } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/apiAuth';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';

export async function POST(request, { params }) {
  const user = await requireUser(request, { roles: ['teacher'] });
  if (!user) return unauthorized();

  await connectDB();
  const quiz = await Quiz.findOne({ _id: params.id, createdBy: user._id });
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const action = body.action || 'publish'; // 'publish' | 'close' | 'reopen'

  if (action === 'close') {
    quiz.status = 'closed';
  } else {
    const questionCount = await Question.countDocuments({ quizId: quiz._id });
    if (questionCount === 0) {
      return NextResponse.json(
        { error: 'Add at least one question before publishing' },
        { status: 400 }
      );
    }
    if (!quiz.linkToken) quiz.linkToken = nanoid(10);
    quiz.status = 'published';
  }

  await quiz.save();
  return NextResponse.json({ quiz });
}
