'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAntiCheat } from '@/hooks/useAntiCheat';

function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function AttemptClient({ token, attemptId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [violationLimit, setViolationLimit] = useState(5);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const load = useCallback(async () => {
    const res = await fetch(`/api/public/attempt/${attemptId}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.status && data.status !== 'in_progress') {
      router.replace(`/test/${token}/result?attemptId=${attemptId}`);
      return;
    }
    if (!res.ok) {
      setError(data.error || 'Could not load your test.');
      setLoading(false);
      return;
    }
    setQuizTitle(data.quizTitle);
    setQuestions(data.questions);
    setViolationLimit(data.violationLimit);
    setViolationCount(data.violationCount);
    setRemaining(data.remainingSeconds);
    setAnswers((prev) => ({ ...data.answers, ...prev }));
    setLoading(false);
  }, [attemptId, router, token]);

  useEffect(() => {
    load();
  }, [load]);

  // Local 1-second countdown for smooth UI
  useEffect(() => {
    if (loading || finished) return undefined;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          submit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, finished]);

  // Periodic resync with server (authoritative clock + status)
  useEffect(() => {
    if (loading || finished) return undefined;
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [loading, finished, load]);

  const reportViolation = useCallback(
    async (type, detail) => {
      const res = await fetch(`/api/public/attempt/${attemptId}/violation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, detail }),
      });
      const data = await res.json();
      setViolationCount(data.violationCount ?? 0);
      return data;
    },
    [attemptId]
  );

  const handleAutoSubmitted = useCallback(() => {
    setFinished(true);
    router.replace(`/test/${token}/result?attemptId=${attemptId}`);
  }, [attemptId, router, token]);

  const { requestFullscreen } = useAntiCheat({
    active: !loading && !finished,
    onViolation: reportViolation,
    onAutoSubmitted: handleAutoSubmitted,
  });

  useEffect(() => {
    if (!loading) requestFullscreen();
  }, [loading, requestFullscreen]);

  async function saveAnswer(questionId, patch) {
    const next = { ...answersRef.current[questionId], ...patch };
    setAnswers((a) => ({ ...a, [questionId]: next }));
    await fetch(`/api/public/attempt/${attemptId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, ...next }),
    }).catch(() => {});
  }

  async function submit(auto = false) {
    setFinished(true);
    await fetch(`/api/public/attempt/${attemptId}/submit`, { method: 'POST' }).catch(() => {});
    router.replace(`/test/${token}/result?attemptId=${attemptId}`);
  }

  if (loading) {
    return <CenterMsg>Loading your test…</CenterMsg>;
  }
  if (error) {
    return <CenterMsg>{error}</CenterMsg>;
  }

  const q = questions[currentIdx];
  const answered = questions.filter((qq) => {
    const a = answers[qq._id];
    return a && (a.textAnswer || (a.selectedOptionIds && a.selectedOptionIds.length));
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 no-select flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-semibold">{quizTitle}</h1>
          <p className="text-xs text-gray-500">
            {answered}/{questions.length} answered
            {violationCount > 0 && (
              <span className="text-red-600 ml-2">
                ⚠ {violationCount}/{violationLimit} violations
              </span>
            )}
          </p>
        </div>
        <div
          className={`font-mono text-lg font-bold px-3 py-1 rounded-lg ${
            remaining < 60 ? 'bg-red-100 text-red-700' : 'bg-brand-50 text-brand-700'
          }`}
        >
          {formatTime(remaining)}
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {q && (
          <div className="card">
            <p className="text-sm text-gray-500 mb-2">
              Question {currentIdx + 1} of {questions.length} · {q.marks} mark(s)
            </p>
            <p className="font-medium mb-4">{q.text}</p>
            {q.imageUrl && (
              <img src={q.imageUrl} alt="question" className="max-w-full rounded-lg mb-4" />
            )}

            {q.type === 'short_answer' ? (
              <input
                className="input"
                value={answers[q._id]?.textAnswer || ''}
                onChange={(e) => saveAnswer(q._id, { textAnswer: e.target.value })}
                placeholder="Type your answer"
              />
            ) : (
              <div className="space-y-2">
                {q.options.map((o) => {
                  const selected = (answers[q._id]?.selectedOptionIds || []).includes(o._id);
                  const isMulti = q.type === 'mcq_multi';
                  return (
                    <label
                      key={o._id}
                      className={`flex items-center gap-3 border rounded-lg px-3 py-2 cursor-pointer ${
                        selected ? 'border-brand-500 bg-brand-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type={isMulti ? 'checkbox' : 'radio'}
                        name={`q-${q._id}`}
                        checked={selected}
                        onChange={() => {
                          if (isMulti) {
                            const current = answers[q._id]?.selectedOptionIds || [];
                            const next = selected
                              ? current.filter((id) => id !== o._id)
                              : [...current, o._id];
                            saveAnswer(q._id, { selectedOptionIds: next });
                          } else {
                            saveAnswer(q._id, { selectedOptionIds: [o._id] });
                          }
                        }}
                      />
                      {o.text}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <button
            className="btn-secondary"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          >
            ← Previous
          </button>

          <div className="flex flex-wrap gap-1 justify-center max-w-md">
            {questions.map((qq, i) => {
              const a = answers[qq._id];
              const done = a && (a.textAnswer || (a.selectedOptionIds && a.selectedOptionIds.length));
              return (
                <button
                  key={qq._id}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-7 h-7 text-xs rounded ${
                    i === currentIdx
                      ? 'bg-brand-600 text-white'
                      : done
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {currentIdx < questions.length - 1 ? (
            <button className="btn-secondary" onClick={() => setCurrentIdx((i) => i + 1)}>
              Next →
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => {
                if (confirm('Submit the test now? You cannot change answers after this.')) {
                  submit(false);
                }
              }}
            >
              Submit Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CenterMsg({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <p className="text-gray-600">{children}</p>
    </div>
  );
}
