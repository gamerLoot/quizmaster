'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAntiCheat } from '@/hooks/useAntiCheat';

function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function isQuestionAnswered(q, answers) {
  const a = answers[q._id];
  return !!(a && (a.textAnswer?.trim() || (a.selectedOptionIds && a.selectedOptionIds.length)));
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

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
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [justFlagged, setJustFlagged] = useState(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const saveTimeoutRef = useRef(null);

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

  // Track real fullscreen state just for the UI banner (separate from the
  // anti-cheat hook, which independently logs the violation to the server).
  useEffect(() => {
    function check() {
      setIsFullscreen(
        !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement)
      );
    }
    check();
    document.addEventListener('fullscreenchange', check);
    document.addEventListener('webkitfullscreenchange', check);
    return () => {
      document.removeEventListener('fullscreenchange', check);
      document.removeEventListener('webkitfullscreenchange', check);
    };
  }, []);

  const reportViolation = useCallback(
    async (type, detail) => {
      setJustFlagged(type);
      setTimeout(() => setJustFlagged((cur) => (cur === type ? null : cur)), 3000);
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
    setSaveState('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    try {
      await fetch(`/api/public/attempt/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, ...next }),
      });
      setSaveState('saved');
    } catch {
      setSaveState('idle');
    }
    saveTimeoutRef.current = setTimeout(() => setSaveState('idle'), 1500);
  }

  async function submit(auto = false) {
    setFinished(true);
    setShowSubmitModal(false);
    await fetch(`/api/public/attempt/${attemptId}/submit`, { method: 'POST' }).catch(() => {});
    router.replace(`/test/${token}/result?attemptId=${attemptId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your test…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 text-center">
        <div className="card max-w-md">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const answeredCount = questions.filter((qq) => isQuestionAnswered(qq, answers)).length;
  const progressPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const unansweredCount = questions.length - answeredCount;

  const urgency = remaining <= 60 ? 'danger' : remaining <= 300 ? 'warning' : 'normal';
  const timerClasses =
    urgency === 'danger'
      ? 'bg-red-100 text-red-700 animate-pulse'
      : urgency === 'warning'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-brand-50 text-brand-700';

  return (
    <div className="min-h-screen bg-gray-50 no-select flex flex-col">
      {/* Violation flash toast */}
      {justFlagged && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg animate-pulse">
          ⚠ Suspicious activity detected and logged
        </div>
      )}

      {!isFullscreen && (
        <div className="bg-amber-500 text-white text-sm px-4 py-2 flex items-center justify-center gap-3 sticky top-0 z-30">
          <span>You've exited fullscreen. This has been logged.</span>
          <button
            onClick={requestFullscreen}
            className="underline font-semibold hover:no-underline"
          >
            Return to fullscreen
          </button>
        </div>
      )}

      <header className="bg-white border-b px-4 sm:px-6 py-3 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-semibold truncate">{quizTitle}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-500">
                {answeredCount}/{questions.length} answered
              </p>
              {saveState === 'saving' && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" /> Saving…
                </span>
              )}
              {saveState === 'saved' && (
                <span className="text-xs text-green-600">Saved</span>
              )}
              {violationCount > 0 && (
                <span className="text-xs text-red-600 font-medium">
                  ⚠ {violationCount}/{violationLimit} violations
                </span>
              )}
            </div>
          </div>
          <div className={`font-mono text-lg font-bold px-3 py-1.5 rounded-lg shrink-0 ${timerClasses}`}>
            {formatTime(remaining)}
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 grid lg:grid-cols-[1fr_260px] gap-6">
        <div>
          {q && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Question <span className="font-semibold text-gray-700">{currentIdx + 1}</span> of{' '}
                  {questions.length}
                </p>
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {q.marks} mark{q.marks === 1 ? '' : 's'}
                </span>
              </div>

              <p className="font-medium text-lg leading-relaxed mb-4">{q.text}</p>
              {q.imageUrl && (
                <img src={q.imageUrl} alt="question" className="max-w-full rounded-lg mb-4 border" />
              )}

              {q.type === 'short_answer' ? (
                <input
                  className="input"
                  value={answers[q._id]?.textAnswer || ''}
                  onChange={(e) => saveAnswer(q._id, { textAnswer: e.target.value })}
                  placeholder="Type your answer"
                  autoComplete="off"
                />
              ) : (
                <div className="space-y-2.5">
                  {q.options.map((o, idx) => {
                    const selected = (answers[q._id]?.selectedOptionIds || []).includes(o._id);
                    const isMulti = q.type === 'mcq_multi';
                    return (
                      <label
                        key={o._id}
                        className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition ${
                          selected
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                            selected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {OPTION_LETTERS[idx] ?? idx + 1}
                        </span>
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
                          className="sr-only"
                        />
                        <span className="text-gray-800">{o.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-6 gap-3">
            <button
              className="btn-secondary"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            >
              ← Previous
            </button>

            <button
              className="lg:hidden text-sm text-brand-600 font-medium underline"
              onClick={() => setPaletteOpen(true)}
            >
              All questions
            </button>

            {currentIdx < questions.length - 1 ? (
              <button className="btn-primary" onClick={() => setCurrentIdx((i) => i + 1)}>
                Next →
              </button>
            ) : (
              <button className="btn-primary" onClick={() => setShowSubmitModal(true)}>
                Review &amp; Submit
              </button>
            )}
          </div>
        </div>

        {/* Question palette — desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="card sticky top-24">
            <p className="text-sm font-semibold mb-3">Questions</p>
            <QuestionGrid
              questions={questions}
              answers={answers}
              currentIdx={currentIdx}
              onJump={setCurrentIdx}
            />
            <Legend />
            <button
              className="btn-primary w-full mt-4 text-sm"
              onClick={() => setShowSubmitModal(true)}
            >
              Submit Test
            </button>
          </div>
        </aside>
      </div>

      {/* Question palette — mobile bottom sheet */}
      {paletteOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPaletteOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold">All Questions</p>
              <button onClick={() => setPaletteOpen(false)} className="text-gray-400 text-xl leading-none">
                ×
              </button>
            </div>
            <QuestionGrid
              questions={questions}
              answers={answers}
              currentIdx={currentIdx}
              onJump={(i) => {
                setCurrentIdx(i);
                setPaletteOpen(false);
              }}
            />
            <Legend />
            <button
              className="btn-primary w-full mt-4"
              onClick={() => {
                setPaletteOpen(false);
                setShowSubmitModal(true);
              }}
            >
              Submit Test
            </button>
          </div>
        </div>
      )}

      {/* Submit confirmation modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSubmitModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold mb-2">Submit your test?</h2>
            <p className="text-sm text-gray-600 mb-4">
              You've answered <b>{answeredCount}</b> of <b>{questions.length}</b> questions.
              {unansweredCount > 0 && (
                <span className="text-amber-600"> {unansweredCount} question(s) are still unanswered.</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mb-5">
              Time remaining: {formatTime(remaining)}. You cannot change answers after submitting.
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setShowSubmitModal(false)}>
                Keep working
              </button>
              <button className="btn-primary flex-1" onClick={() => submit(false)}>
                Submit now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionGrid({ questions, answers, currentIdx, onJump }) {
  return (
    <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5">
      {questions.map((qq, i) => {
        const done = isQuestionAnswered(qq, answers);
        return (
          <button
            key={qq._id}
            onClick={() => onJump(i)}
            className={`aspect-square text-xs font-medium rounded-lg transition ${
              i === currentIdx
                ? 'bg-brand-600 text-white ring-2 ring-brand-300'
                : done
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Answered
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> Unanswered
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded bg-brand-600" /> Current
      </span>
    </div>
  );
}
