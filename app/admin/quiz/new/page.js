import { redirect } from 'next/navigation';

// Old single-admin route, superseded by /teacher/quiz/new.
export default function OldNewQuizPage() {
  redirect('/teacher/quiz/new');
}
