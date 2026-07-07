import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/apiAuth';
import QuizForm from '@/components/QuizForm';

export default async function NewQuizPage() {
  const user = await getCurrentUser({ roles: ['teacher'] });
  if (!user) redirect('/login');

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>
      <QuizForm mode="new" />
    </main>
  );
}
