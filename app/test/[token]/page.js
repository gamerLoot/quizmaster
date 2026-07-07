import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';

export const dynamic = 'force-dynamic';

export default async function TestRulesPage({ params }) {
  await connectDB();
  const quiz = await Quiz.findOne({ linkToken: params.token }).lean();

  if (!quiz) {
    return <StatusScreen title="Link not found" message="This test link is invalid." />;
  }

  const now = new Date();
  if (quiz.status !== 'published') {
    return (
      <StatusScreen title="Test not available" message="This test is not currently open." />
    );
  }
  if (quiz.startAt && now < new Date(quiz.startAt)) {
    return (
      <StatusScreen
        title="Not started yet"
        message={`This test will open at ${new Date(quiz.startAt).toLocaleString()}.`}
      />
    );
  }
  if (quiz.endAt && now > new Date(quiz.endAt)) {
    return <StatusScreen title="Test link expired" message="This test is no longer accepting attempts." />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card max-w-lg w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          {quiz.description && <p className="text-gray-600 mt-2">{quiz.description}</p>}
        </div>

        <div className="bg-brand-50 rounded-lg p-4 text-sm space-y-1">
          <p>⏱️ Duration: <b>{quiz.durationMinutes} minutes</b></p>
          <p>✅ Passing score: <b>{quiz.passPercent}%</b></p>
          <p>🔁 Attempts allowed: <b>{quiz.maxAttempts}</b></p>
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-semibold">Please read before you start:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>The test will open in fullscreen mode — do not exit fullscreen.</li>
            <li>Switching tabs, minimizing the window, copy/paste, and right-click are monitored and logged.</li>
            <li>Repeated violations will auto-submit your test.</li>
            <li>The timer is set by your instructor and cannot be paused — once started it keeps running.</li>
            <li>Make sure you have a stable internet connection before starting.</li>
          </ul>
        </div>

        <Link href={`/test/${params.token}/register`} className="btn-primary w-full text-center block">
          Continue to Registration
        </Link>
      </div>
    </main>
  );
}

function StatusScreen({ title, message }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <h1 className="text-xl font-bold mb-2">{title}</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </main>
  );
}
