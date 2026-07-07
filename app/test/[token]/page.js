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

  const rules = [
    { icon: '🖥️', text: 'The test will open in fullscreen mode — do not exit fullscreen.' },
    { icon: '👁️', text: 'Switching tabs, minimizing the window, copy/paste, and right-click are monitored and logged.' },
    { icon: '⚠️', text: 'Repeated violations will auto-submit your test.' },
    { icon: '⏱️', text: 'The timer is set by your instructor and cannot be paused — once started it keeps running.' },
    { icon: '📶', text: 'Make sure you have a stable internet connection before starting.' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="card max-w-lg w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          {quiz.description && <p className="text-gray-600 mt-2">{quiz.description}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Duration" value={`${quiz.durationMinutes} min`} />
          <StatCard label="Pass mark" value={`${quiz.passPercent}%`} />
          <StatCard label="Attempts" value={quiz.maxAttempts} />
        </div>

        <div>
          <p className="font-semibold text-sm mb-3">Please read before you start</p>
          <ul className="space-y-2.5">
            {rules.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="text-base leading-none mt-0.5">{r.icon}</span>
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link href={`/test/${params.token}/register`} className="btn-primary w-full text-center block">
          Continue to Registration
        </Link>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-brand-50 rounded-lg py-3 px-2 text-center">
      <p className="text-lg font-bold text-brand-700">{value}</p>
      <p className="text-[11px] text-brand-600/70 mt-0.5">{label}</p>
    </div>
  );
}

function StatusScreen({ title, message }) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <h1 className="text-xl font-bold mb-2">{title}</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </main>
  );
}
