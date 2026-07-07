import { redirect } from 'next/navigation';

// Old single-admin route, superseded by /teacher/quiz/[id].
export default function OldManageQuizPage({ params }) {
  redirect(`/teacher/quiz/${params.id}`);
}
