import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/apiAuth';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import ResultsTable from '@/components/ResultsTable';

export const dynamic = 'force-dynamic';

export default async function ResultsPage({ params }) {
  const user = await getCurrentUser({ roles: ['teacher'] });
  if (!user) redirect('/login');

  await connectDB();
  const quiz = await Quiz.findOne({ _id: params.id, createdBy: user._id }).lean();
  if (!quiz) notFound();

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div>
        <Link href={`/teacher/quiz/${params.id}`} className="text-sm text-brand-600">
          ← Back to quiz
        </Link>
        <h1 className="text-2xl font-bold mt-1">{quiz.title} — Live Monitor & Results</h1>
        <p className="text-gray-500 text-sm">Auto-refreshes every few seconds.</p>
      </div>
      <ResultsTable quizId={params.id} />
    </main>
  );
}
