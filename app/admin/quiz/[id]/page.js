import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getAdminFromCookies } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import QuizForm from '@/components/QuizForm';
import PublishPanel from '@/components/PublishPanel';

export const dynamic = 'force-dynamic';

export default async function ManageQuizPage({ params }) {
  const admin = getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  await connectDB();
  const quizDoc = await Quiz.findOne({ _id: params.id, createdBy: admin.adminId }).lean();
  if (!quizDoc) notFound();

  const questionsDoc = await Question.find({ quizId: params.id }).sort({ order: 1 }).lean();

  const quiz = JSON.parse(JSON.stringify(quizDoc));
  const questions = JSON.parse(JSON.stringify(questionsDoc));

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/dashboard" className="text-sm text-brand-600">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-1">{quiz.title}</h1>
        </div>
        <Link href={`/admin/quiz/${quiz._id}/results`} className="btn-secondary">
          View Results & Monitor
        </Link>
      </div>

      <PublishPanel quiz={quiz} />

      <div>
        <h2 className="font-semibold text-lg mb-4">Edit Quiz</h2>
        <QuizForm mode="edit" quizId={quiz._id} initialQuiz={quiz} initialQuestions={questions} />
      </div>
    </main>
  );
}
