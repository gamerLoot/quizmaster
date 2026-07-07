import { redirect } from 'next/navigation';

// Old single-admin route, superseded by the multi-teacher /login page.
export default function OldAdminLoginPage() {
  redirect('/login');
}
