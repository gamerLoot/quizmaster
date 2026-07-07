import { redirect } from 'next/navigation';

// Old single-admin route, superseded by /teacher/quiz/[id]/results.
export default function OldResultsPage({ params }) {
  redirect(`/teacher/quiz/${params.id}/results`);
}
