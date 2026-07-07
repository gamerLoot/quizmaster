import { redirect } from 'next/navigation';

// Old single-admin route, superseded by /teacher/quiz/[id]/results/[attemptId].
export default function OldAttemptDetailPage({ params }) {
  redirect(`/teacher/quiz/${params.id}/results/${params.attemptId}`);
}
