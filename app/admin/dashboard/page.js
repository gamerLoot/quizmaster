import { redirect } from 'next/navigation';

// Old single-admin route, superseded by /teacher/dashboard.
export default function OldAdminDashboardPage() {
  redirect('/teacher/dashboard');
}
