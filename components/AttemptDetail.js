'use client';

import { useEffect, useState } from 'react';

function fmt(dt) {
  return dt ? new Date(dt).toLocaleString() : '—';
}

export default function AttemptDetail({ quizId, attemptId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stop = false;
    async function load() {
      const res = await fetch(`/api/quizzes/${quizId}/attempts/${attemptId}`, { cache: 'no-store' });
      const d = await res.json();
      if (stop) return;
      if (!res.ok) {
        setError(d.error || 'Failed to load');
        return;
      }
      setData(d);
    }
    load();
    const t = setInterval(load, 8000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [quizId, attemptId]);

  if (error) return <div className="card text-red-600">{error}</div>;
  if (!data) return <div className="card text-gray-500">Loading…</div>;

  const info = Object.entries(data.studentInfo || {}).filter(([k]) => k !== '__identifier');

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-semibold mb-3">Student Info</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {info.map(([k, v]) => (
            <div key={k}>
              <p className="text-gray-400 capitalize">{k}</p>
              <p className="font-medium">{v || '—'}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-4 pt-4 border-t">
          <div>
            <p className="text-gray-400">Status</p>
            <p className="font-medium capitalize">{data.status.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-gray-400">Score</p>
            <p className="font-medium">
              {data.status === 'in_progress' ? '—' : `${data.totalScore} / ${data.maxScore}`}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Started</p>
            <p className="font-medium">{fmt(data.startedAt)}</p>
          </div>
          <div>
            <p className="text-gray-400">Submitted</p>
            <p className="font-medium">{fmt(data.submittedAt)}</p>
          </div>
          <div>
            <p className="text-gray-400">IP Address</p>
            <p className="font-medium">{data.ipAddress || '—'}</p>
          </div>
          <div className="col-span-2 md:col-span-3">
            <p className="text-gray-400">Device / Browser</p>
            <p className="font-medium truncate">{data.userAgent || '—'}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">
          Behavior / Violation Log ({data.violationLog.length})
        </h2>
        {data.violationLog.length === 0 ? (
          <p className="text-sm text-gray-400">No violations recorded — clean attempt.</p>
        ) : (
          <ul className="space-y-2 text-sm max-h-72 overflow-y-auto">
            {data.violationLog.map((v, i) => (
              <li key={i} className="flex justify-between border-b pb-1">
                <span className="font-medium text-red-600 capitalize">
                  {v.type.replace('_', ' ')}
                </span>
                <span className="text-gray-400">{v.detail}</span>
                <span className="text-gray-400">{fmt(v.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Answer Sheet</h2>
        <div className="space-y-4">
          {data.answerSheet.map((q, i) => (
            <div key={i} className="border-b pb-3 last:border-0">
              <p className="text-sm text-gray-500 mb-1">
                Q{i + 1} · {q.marks} mark(s){' '}
                {q.attempted ? (
                  <span className={q.isCorrect ? 'text-green-600' : 'text-red-600'}>
                    ({q.isCorrect ? `+${q.marksAwarded}` : q.marksAwarded})
                  </span>
                ) : (
                  <span className="text-gray-400">(not attempted)</span>
                )}
              </p>
              <p className="font-medium mb-2">{q.questionText}</p>
              {q.type === 'short_answer' ? (
                <p className="text-sm">
                  Answer: <b>{q.textAnswer || '—'}</b>
                </p>
              ) : (
                <ul className="text-sm space-y-1">
                  {q.options.map((o, oi) => {
                    const picked = q.selectedOptionIds.includes(String(o._id));
                    return (
                      <li
                        key={oi}
                        className={
                          o.isCorrect
                            ? 'text-green-600 font-medium'
                            : picked
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }
                      >
                        {picked ? '●' : '○'} {o.text} {o.isCorrect ? '(correct)' : ''}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
