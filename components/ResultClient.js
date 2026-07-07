'use client';

import { useEffect, useState } from 'react';

export default function ResultClient({ attemptId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/attempt/${attemptId}/result`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [attemptId]);

  if (loading) {
    return <Center>Loading result…</Center>;
  }

  if (!data || data.status === 'in_progress') {
    return <Center>Your test is still in progress.</Center>;
  }

  if (data.hidden) {
    return (
      <Center>
        <h1 className="text-xl font-bold mb-2">Test Submitted ✅</h1>
        <p className="text-gray-600">
          Your response for <b>{data.quizTitle}</b> has been recorded. Your instructor will share
          the results with you.
        </p>
      </Center>
    );
  }

  const percent = data.maxScore > 0 ? Math.round((data.totalScore / data.maxScore) * 100) : 0;

  return (
    <Center>
      <h1 className="text-xl font-bold mb-1">{data.quizTitle}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {data.status === 'auto_submitted' ? 'Auto-submitted (time up or violation limit reached)' : 'Submitted'}
      </p>

      <div
        className={`text-5xl font-bold mb-2 ${data.passed ? 'text-green-600' : 'text-red-600'}`}
      >
        {data.totalScore} / {data.maxScore}
      </div>
      <p className="text-gray-500 mb-4">{percent}%</p>

      <span
        className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
          data.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {data.passed ? 'PASSED' : 'FAILED'} · Pass mark {data.passPercent}%
      </span>

      {data.violationCount > 0 && (
        <p className="text-xs text-gray-400 mt-4">
          {data.violationCount} monitoring flag(s) were recorded during your attempt.
        </p>
      )}
    </Center>
  );
}

function Center({ children }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">{children}</div>
    </main>
  );
}
