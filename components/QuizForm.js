'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const QUESTION_TYPES = [
  { value: 'mcq_single', label: 'MCQ (Single correct)' },
  { value: 'mcq_multi', label: 'MCQ (Multiple correct)' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short Answer (text match)' },
];

function emptyQuestion(type = 'mcq_single') {
  if (type === 'true_false') {
    return {
      type,
      text: '',
      marks: 1,
      negativeMarks: 0,
      options: [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false },
      ],
    };
  }
  if (type === 'short_answer') {
    return { type, text: '', marks: 1, negativeMarks: 0, correctText: '' };
  }
  return {
    type,
    text: '',
    marks: 1,
    negativeMarks: 0,
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  };
}

function emptyFormField() {
  return { key: `custom_${Date.now()}`, label: '', type: 'text', required: false, order: 99 };
}

export default function QuizForm({ mode, quizId, initialQuiz, initialQuestions }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [meta, setMeta] = useState(() => ({
    title: initialQuiz?.title || '',
    description: initialQuiz?.description || '',
    durationMinutes: initialQuiz?.durationMinutes ?? 30,
    startAt: initialQuiz?.startAt ? initialQuiz.startAt.slice(0, 16) : '',
    endAt: initialQuiz?.endAt ? initialQuiz.endAt.slice(0, 16) : '',
    shuffleQuestions: initialQuiz?.shuffleQuestions ?? false,
    shuffleOptions: initialQuiz?.shuffleOptions ?? false,
    negativeMarking: initialQuiz?.negativeMarking ?? { enabled: false, value: 0.25 },
    maxAttempts: initialQuiz?.maxAttempts ?? 1,
    passPercent: initialQuiz?.passPercent ?? 40,
    showResultImmediately: initialQuiz?.showResultImmediately ?? true,
    violationLimit: initialQuiz?.violationLimit ?? 5,
  }));

  const [formConfig, setFormConfig] = useState(
    initialQuiz?.formConfig || [
      { key: 'name', label: 'Full Name', type: 'text', required: true, order: 0 },
      { key: 'phone', label: 'Phone Number', type: 'tel', required: true, order: 1 },
      { key: 'email', label: 'Email (Gmail)', type: 'email', required: false, order: 2 },
    ]
  );

  const [questions, setQuestions] = useState(
    initialQuestions?.length ? initialQuestions : [emptyQuestion()]
  );

  function updateMeta(key, value) {
    setMeta((m) => ({ ...m, [key]: value }));
  }

  function updateQuestion(idx, patch) {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function changeQuestionType(idx, type) {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? emptyQuestion(type) : q)));
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion()]);
  }

  function removeQuestion(idx) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  }

  function updateOption(qIdx, oIdx, patch) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.map((o, j) => (j === oIdx ? { ...o, ...patch } : o));
        return { ...q, options };
      })
    );
  }

  function toggleCorrectOption(qIdx, oIdx) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.type === 'mcq_single' || q.type === 'true_false') {
          const options = q.options.map((o, j) => ({ ...o, isCorrect: j === oIdx }));
          return { ...q, options };
        }
        const options = q.options.map((o, j) =>
          j === oIdx ? { ...o, isCorrect: !o.isCorrect } : o
        );
        return { ...q, options };
      })
    );
  }

  function addOption(qIdx) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, { text: '', isCorrect: false }] } : q
      )
    );
  }

  function removeOption(qIdx, oIdx) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q
      )
    );
  }

  function updateFormField(idx, patch) {
    setFormConfig((fc) => fc.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function addFormField() {
    setFormConfig((fc) => [...fc, emptyFormField()]);
  }

  function removeFormField(idx) {
    setFormConfig((fc) => fc.filter((_, i) => i !== idx));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');

    if (!meta.title.trim()) {
      setError('Quiz title is required');
      return;
    }
    for (const q of questions) {
      if (!q.text.trim()) {
        setError('Every question needs text');
        return;
      }
      if ((q.type === 'mcq_single' || q.type === 'mcq_multi' || q.type === 'true_false')) {
        if (!q.options.some((o) => o.isCorrect)) {
          setError(`Mark a correct answer for: "${q.text.slice(0, 40)}"`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...meta,
        startAt: meta.startAt ? new Date(meta.startAt).toISOString() : null,
        endAt: meta.endAt ? new Date(meta.endAt).toISOString() : null,
        formConfig,
        questions,
      };
      const url = mode === 'edit' ? `/api/quizzes/${quizId}` : '/api/quizzes';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Save failed');
        return;
      }
      const savedId = mode === 'edit' ? quizId : data.quiz._id;
      router.push(`/admin/quiz/${savedId}`);
      router.refresh();
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 pb-16">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* Quiz meta */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-lg">1. Quiz Info & Timer</h2>
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={meta.title}
            onChange={(e) => updateMeta('title', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Description (shown to students)</label>
          <textarea
            className="input"
            rows={2}
            value={meta.description}
            onChange={(e) => updateMeta('description', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Duration (minutes)</label>
            <input
              type="number"
              min={1}
              className="input"
              value={meta.durationMinutes}
              onChange={(e) => updateMeta('durationMinutes', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Max attempts / student</label>
            <input
              type="number"
              min={1}
              className="input"
              value={meta.maxAttempts}
              onChange={(e) => updateMeta('maxAttempts', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Pass %</label>
            <input
              type="number"
              min={0}
              max={100}
              className="input"
              value={meta.passPercent}
              onChange={(e) => updateMeta('passPercent', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Violation auto-submit limit</label>
            <input
              type="number"
              min={1}
              className="input"
              value={meta.violationLimit}
              onChange={(e) => updateMeta('violationLimit', Number(e.target.value))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Link active from (optional)</label>
            <input
              type="datetime-local"
              className="input"
              value={meta.startAt}
              onChange={(e) => updateMeta('startAt', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Link expires at (optional)</label>
            <input
              type="datetime-local"
              className="input"
              value={meta.endAt}
              onChange={(e) => updateMeta('endAt', e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={meta.shuffleQuestions}
              onChange={(e) => updateMeta('shuffleQuestions', e.target.checked)}
            />
            Shuffle question order per student
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={meta.shuffleOptions}
              onChange={(e) => updateMeta('shuffleOptions', e.target.checked)}
            />
            Shuffle option order per student
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={meta.showResultImmediately}
              onChange={(e) => updateMeta('showResultImmediately', e.target.checked)}
            />
            Show score to student immediately after submit
          </label>
        </div>
        <div className="flex items-center gap-4 pt-2 border-t mt-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={meta.negativeMarking.enabled}
              onChange={(e) =>
                updateMeta('negativeMarking', { ...meta.negativeMarking, enabled: e.target.checked })
              }
            />
            Enable negative marking
          </label>
          {meta.negativeMarking.enabled && (
            <input
              type="number"
              step="0.25"
              min={0}
              className="input w-32"
              value={meta.negativeMarking.value}
              onChange={(e) =>
                updateMeta('negativeMarking', {
                  ...meta.negativeMarking,
                  value: Number(e.target.value),
                })
              }
              placeholder="Marks deducted"
            />
          )}
        </div>
      </section>

      {/* Questions */}
      <section className="card space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">2. Questions ({questions.length})</h2>
          <button type="button" onClick={addQuestion} className="btn-secondary text-sm">
            + Add Question
          </button>
        </div>

        {questions.map((q, qIdx) => (
          <div key={qIdx} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-500">Q{qIdx + 1}</span>
              <select
                className="input w-56"
                value={q.type}
                onChange={(e) => changeQuestionType(qIdx, e.target.value)}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="number"
                  className="input w-20"
                  title="Marks"
                  value={q.marks}
                  onChange={(e) => updateQuestion(qIdx, { marks: Number(e.target.value) })}
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="text-red-600 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>

            <textarea
              className="input"
              rows={2}
              placeholder="Question text"
              value={q.text}
              onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
            />

            {q.type === 'short_answer' ? (
              <input
                className="input"
                placeholder="Accepted answer(s), separate multiple with | "
                value={q.correctText}
                onChange={(e) => updateQuestion(qIdx, { correctText: e.target.value })}
              />
            ) : (
              <div className="space-y-2">
                {q.options.map((o, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type={q.type === 'mcq_multi' ? 'checkbox' : 'radio'}
                      name={`correct-${qIdx}`}
                      checked={o.isCorrect}
                      onChange={() => toggleCorrectOption(qIdx, oIdx)}
                    />
                    <input
                      className="input"
                      placeholder={`Option ${oIdx + 1}`}
                      value={o.text}
                      disabled={q.type === 'true_false'}
                      onChange={(e) => updateOption(qIdx, oIdx, { text: e.target.value })}
                    />
                    {q.type !== 'true_false' && q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIdx, oIdx)}
                        className="text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {q.type !== 'true_false' && (
                  <button
                    type="button"
                    onClick={() => addOption(qIdx)}
                    className="text-brand-600 text-sm"
                  >
                    + Add option
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Student form config */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">3. Student Registration Form</h2>
          <button type="button" onClick={addFormField} className="btn-secondary text-sm">
            + Add Field
          </button>
        </div>
        <p className="text-sm text-gray-500">
          This form is shown to students before the test starts. Choose which fields to show and
          whether each is compulsory.
        </p>
        {formConfig.map((f, idx) => (
          <div key={idx} className="flex flex-wrap items-center gap-3 border-b pb-3">
            <input
              className="input w-52"
              placeholder="Field label (e.g. Roll No)"
              value={f.label}
              onChange={(e) => updateFormField(idx, { label: e.target.value })}
            />
            <select
              className="input w-40"
              value={f.type}
              onChange={(e) => updateFormField(idx, { type: e.target.value })}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="email">Email</option>
              <option value="tel">Phone</option>
              <option value="dropdown">Dropdown</option>
            </select>
            {f.type === 'dropdown' && (
              <input
                className="input w-56"
                placeholder="Comma separated options"
                value={(f.options || []).join(',')}
                onChange={(e) =>
                  updateFormField(idx, { options: e.target.value.split(',').map((s) => s.trim()) })
                }
              />
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={f.required}
                onChange={(e) => updateFormField(idx, { required: e.target.checked })}
              />
              Required
            </label>
            <button
              type="button"
              onClick={() => removeFormField(idx)}
              className="text-red-500 text-sm ml-auto"
            >
              Remove
            </button>
          </div>
        ))}
      </section>

      <div className="flex justify-end gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Quiz (Draft)'}
        </button>
      </div>
    </form>
  );
}
