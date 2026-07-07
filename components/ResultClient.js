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
    return (
      <Center>
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
      </Center>
    );
  }

  if (!data || data.status === 'in_progress') {
    return (
      <Center>
        <p className="text-gray-600">Your test is still in progress.</p>
      </Center>
    );
  }

  if (data.hidden) {
    return (
      <Center>
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckIcon />
        </div>
        <h1 className="text-xl font-bold mb-2">Test Submitted</h1>
        <p className="text-gray-600">
          Your response for <b>{data.quizTitle}</b> has been recorded. Your instructor will share
          the results with you.
        </p>
      </Center>
    );
  }

  const percent = data.maxScore > 0 ? Math.round((data.totalScore / data.maxScore) * 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (circumference * percent) / 100;
  const ringColor = data.passed ? '#16a34a' : '#dc2626';

  return (
    <Center wide>
      <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">
        {data.status === 'auto_submitted' ? 'Auto-submitted' : 'Submitted'}
      </p>
      <h1 className="text-xl font-bold mb-6">{data.quizTitle}</h1>

      <div className="relative w-36 h-36 mx-auto mb-5">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{percent}%</span>
          <span className="text-xs text-gray-400 mt-0.5">
            {data.totalScore}/{data.maxScore}
          </span>
        </div>
      </div>

      <span
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold ${
          data.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {data.passed ? 'PASSED' : 'FAILED'}
      </span>
      <p className="text-xs text-gray-400 mt-2">Pass mark: {data.passPercent}%</p>

      {data.violationCount > 0 && (
        <p className="text-xs text-amber-600 mt-5 bg-amber-50 rounded-lg px-3 py-2">
          {data.violationCount} monitoring flag(s) were recorded during your attempt.
        </p>
      )}
    </Center>
  );
}

function CheckIcon() {
  return (
    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Center({ children, wide }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className={`card ${wide ? 'max-w-md' : 'max-w-sm'} w-full text-center`}>{children}</div>
    </main>
  );
}
