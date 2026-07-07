'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function fmt(dt) {
  return dt ? new Date(dt).toLocaleString() : '—';
}

const STATUS_STYLES = {
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-green-100 text-green-700',
  auto_submitted: 'bg-yellow-100 text-yellow-700',
  kicked: 'bg-gray-200 text-gray-600',
};

export default function ResultsTable({ quizId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stop = false;
    async function load() {
      const res = await fetch(`/api/quizzes/${quizId}/results`, { cache: 'no-store' });
      const d = await res.json();
      if (stop) return;
      if (!res.ok) {
        setError(d.error || 'Failed to load results');
        return;
      }
      setData(d);
    }
    load();
    const t = setInterval(load, 6000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [quizId]);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ['Name/Info', 'Status', 'Score', 'Max', 'Passed', 'Violations', 'Started', 'Submitted', 'IP'],
      ...data.attempts.map((a) => [
        Object.values(a.studentInfo || {}).filter((v) => v && v !== a.studentInfo.__identifier).join(' | '),
        a.status,
        a.totalScore,
        a.maxScore,
        a.passed ? 'Yes' : 'No',
        a.violationCount,
        fmt(a.startedAt),
        fmt(a.submittedAt),
        a.ipAddress,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.quizTitle || 'results'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <div className="card text-red-600">{error}</div>;
  if (!data) return <div className="card text-gray-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total" value={data.stats.total} />
        <Stat label="In Progress" value={data.stats.inProgress} />
        <Stat label="Submitted" value={data.stats.submitted} />
        <Stat label="Passed" value={data.stats.passed} />
        <Stat label="Avg Score" value={data.stats.avgScore} />
      </div>

      <div className="flex justify-end">
        <button onClick={exportCSV} className="btn-secondary text-sm">
          Export CSV
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-4">Student</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Score</th>
              <th className="py-2 pr-4">Violations</th>
              <th className="py-2 pr-4">Started</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {data.attempts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-400">
                  No attempts yet.
                </td>
              </tr>
            )}
            {data.attempts.map((a) => (
              <tr key={a._id} className="border-b last:border-0">
                <td className="py-2 pr-4">
                  {Object.entries(a.studentInfo || {})
                    .filter(([k]) => k !== '__identifier')
                    .map(([, v]) => v)
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </td>
                <td className="py-2 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[a.status] || ''}`}>
                    {a.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  {a.status === 'in_progress' ? '—' : `${a.totalScore}/${a.maxScore}`}
                </td>
                <td className="py-2 pr-4">
                  {a.violationCount > 0 ? (
                    <span className="text-red-600 font-medium">{a.violationCount}</span>
                  ) : (
                    0
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-500">{fmt(a.startedAt)}</td>
                <td className="py-2 pr-4">
                  <Link href={`/teacher/quiz/${quizId}/results/${a._id}`} className="text-brand-600">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
