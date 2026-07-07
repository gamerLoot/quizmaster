import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import User from '@/models/User';

export async function GET(request, { params }) {
  await connectDB();
  const quiz = await Quiz.findOne({ linkToken: params.token }).lean();
  if (!quiz) return NextResponse.json({ error: 'Invalid or unknown test link.' }, { status: 404 });

  const now = new Date();
  let state = 'active';

  // If the owning teacher's account has been suspended, treat the link as closed
  // immediately — regardless of the quiz's own status/dates.
  const owner = await User.findById(quiz.createdBy).select('status').lean();
  if (!owner || owner.status !== 'active') state = 'closed';
  else if (quiz.status !== 'published') state = 'closed';
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
