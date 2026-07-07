import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';

export async function GET(request, { params }) {
  await connectDB();
  const quiz = await Quiz.findOne({ linkToken: params.token }).lean();
  if (!quiz) return NextResponse.json({ error: 'Invalid or unknown test link.' }, { status: 404 });

  const now = new Date();
  let state = 'active';
  if (quiz.status !== 'published') state = 'closed';
  else if (quiz.startAt && now < new Date(quiz.startAt)) state = 'not_started';
  else if (quiz.endAt && now > new Date(quiz.endAt)) state = 'expired';

  return NextResponse.json({
    state,
    quiz: {
      title: quiz.title,
      description: quiz.description,
      durationMinutes: quiz.durationMinutes,
      formConfig: quiz.formConfig,
      startAt: quiz.startAt,
      endAt: quiz.endAt,
    },
  });
}
