import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attempt from '@/models/Attempt';

export async function POST(request, { params }) {
  await connectDB();
  const attempt = await Attempt.findById(params.attemptId);
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (attempt.status !== 'in_progress') {
    return NextResponse.json(
      { error: 'This attempt has already finished.', status: attempt.status },
      { status: 409 }
    );
  }
  if (new Date() >= attempt.deadlineAt) {
    return NextResponse.json({ error: 'Time is up.', expired: true }, { status: 409 });
  }

  const { questionId, selectedOptionIds, textAnswer } = await request.json();
  const idx = attempt.answers.findIndex((a) => String(a.questionId) === String(questionId));

  if (idx >= 0) {
    attempt.answers[idx].selectedOptionIds = selectedOptionIds || [];
    attempt.answers[idx].textAnswer = textAnswer || '';
    attempt.answers[idx].answeredAt = new Date();
  } else {
    attempt.answers.push({
      questionId,
      selectedOptionIds: selectedOptionIds || [],
      textAnswer: textAnswer || '',
      answeredAt: new Date(),
    });
  }

  await attempt.save();
  return NextResponse.json({ ok: true });
}
