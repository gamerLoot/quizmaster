import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/apiAuth';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function TeacherSettingsPage() {
  const user = await getCurrentUser({ roles: ['teacher'] });
  if (!user) redirect('/login');

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/teacher/dashboard" className="text-sm text-brand-600">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-1">Account Settings</h1>
        </div>
        <LogoutButton />
      </div>

      <section className="card space-y-2 max-w-md">
        <h2 className="font-semibold text-lg">Profile</h2>
        <div className="text-sm">
          <p className="text-gray-400">Name</p>
          <p className="font-medium">{user.name}</p>
        </div>
        <div className="text-sm">
          <p className="text-gray-400">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div className="text-sm">
          <p className="text-gray-400">Phone</p>
          <p className="font-medium">{user.phone || '—'}</p>
        </div>
        <div className="text-sm pt-2 border-t mt-2">
          <p className="text-gray-400">Plan limits</p>
          <p className="font-medium">
            {user.limits?.maxQuizzes ?? 10} quizzes · {user.limits?.maxAttemptsPerQuiz ?? 200} attempts/quiz
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="card max-w-md text-gray-400">Loading…</div>}>
        <ChangePasswordForm />
      </Suspense>

      <p className="text-xs text-gray-400 max-w-md">
        Forgot your password entirely and can't log in? Ask the platform admin to reset it for you —
        there's no email-based reset since this app doesn't use an email service.
      </p>
    </main>
  );
}
