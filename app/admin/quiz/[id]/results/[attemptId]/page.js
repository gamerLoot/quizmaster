import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminFromCookies } from '@/lib/auth';
import AttemptDetail from '@/components/AttemptDetail';

export default function AttemptDetailPage({ params }) {
  const admin = getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      <Link href={`/admin/quiz/${params.id}/results`} className="text-sm text-brand-600">
        ← Back to results
      </Link>
      <h1 className="text-2xl font-bold">Attempt Detail</h1>
      <AttemptDetail quizId={params.id} attemptId={params.attemptId} />
    </main>
  );
}
