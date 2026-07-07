'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm({ token, formConfig }) {
  const router = useRouter();
  const sorted = [...formConfig].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [values, setValues] = useState(() =>
    Object.fromEntries(sorted.map((f) => [f.key, '']))
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/public/quiz/${token}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentInfo: values }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start the test.');
        return;
      }

      // Best-effort fullscreen request while we still have a user gesture
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el).catch(() => {});

      router.push(`/test/${token}/attempt?attemptId=${data.attemptId}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
      {sorted.map((f) => (
        <div key={f.key}>
          <label className="label">
            {f.label} {f.required && <span className="text-red-500">*</span>}
          </label>
          {f.type === 'dropdown' ? (
            <select
              className="input"
              required={f.required}
              value={values[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
            >
              <option value="">Select…</option>
              {(f.options || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type}
              required={f.required}
              className="input"
              value={values[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
            />
          )}
        </div>
      ))}
      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
        {loading ? 'Starting…' : 'Start Test'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        Your test will open in fullscreen mode once you click Start.
      </p>
    </form>
  );
}
