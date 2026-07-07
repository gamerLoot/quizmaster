import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/apiAuth';
import LogoutButton from '@/components/LogoutButton';
import TeacherManager from '@/components/TeacherManager';

export const dynamic = 'force-dynamic';

export default async function SuperAdminDashboardPage() {
  const user = await getCurrentUser({ roles: ['super_admin'] });
  if (!user) redirect('/login');

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Platform Admin</h1>
          <p className="text-gray-500 text-sm">{user.name} · {user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <TeacherManager />
    </main>
  );
}
