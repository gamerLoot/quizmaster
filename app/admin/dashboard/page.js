import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminFromCookies } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import Attempt from '@/models/Attempt';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const admin = getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  await connectDB();
  const quizzes = await Quiz.find({ createdBy: admin.adminId }).sort({ createdAt: -1 }).lean();

  const counts = {};
  for (const q of quizzes) {
    counts[q._id] = await Attempt.countDocuments({ quizId: q._id });
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Your Quizzes</h1>
          <p className="text-gray-500 text-sm">{admin.email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/quiz/new" className="btn-primary">
            + New Quiz
          </Link>
          <LogoutButton />
        </div>
      </div>

      {quizzes.length === 0 ? (
        <div className="card text-center text-gray-500">
          No quizzes yet. Click <b>+ New Quiz</b> to create your first test.
        </div>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((q) => (
            <div key={q._id} className="card flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">{q.title}</h2>
                <div className="text-sm text-gray-500 flex gap-3 mt-1">
                  <span className="capitalize">{q.status}</span>
                  <span>{q.durationMinutes} min</span>
                  <span>{counts[q._id] ?? 0} attempts</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/quiz/${q._id}`} className="btn-secondary text-sm">
                  Manage
                </Link>
                <Link href={`/admin/quiz/${q._id}/results`} className="btn-secondary text-sm">
                  Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
