import { redirect } from 'next/navigation';
import { getAdminFromCookies } from '@/lib/auth';
import QuizForm from '@/components/QuizForm';

export default function NewQuizPage() {
  const admin = getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>
      <QuizForm mode="new" />
    </main>
  );
}
