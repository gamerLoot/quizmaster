'use client';

import { useEffect, useState } from 'react';

function fmt(dt) {
  return dt ? new Date(dt).toLocaleString() : '—';
}

export default function TeacherManager() {
  const [teachers, setTeachers] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [tempPasswordFor, setTempPasswordFor] = useState(null); // { teacherId, name, password }
  const [editingLimitsFor, setEditingLimitsFor] = useState(null); // teacherId
  const [limitsDraft, setLimitsDraft] = useState({ maxQuizzes: 10, maxAttemptsPerQuiz: 200 });

  async function load() {
    const res = await fetch('/api/superadmin/teachers', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to load teachers');
      return;
    }
    setTeachers(data.teachers);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(t) {
    setBusyId(t._id);
    try {
      const nextStatus = t.status === 'active' ? 'suspended' : 'active';
      const res = await fetch(`/api/superadmin/teachers/${t._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Action failed');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(t) {
    if (!confirm(`Generate a new temporary password for ${t.name}? Their current password will stop working immediately.`)) {
      return;
    }
    setBusyId(t._id);
    try {
      const res = await fetch(`/api/superadmin/teachers/${t._id}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Reset failed');
        return;
      }
      setTempPasswordFor({ teacherId: t._id, name: t.name, password: data.tempPassword });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTeacher(t) {
    if (
      !confirm(
        `Permanently delete ${t.name} (${t.email}) and ALL of their quizzes, questions and attempts? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(t._id);
    try {
      const res = await fetch(`/api/superadmin/teachers/${t._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Delete failed');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  function openLimitsEditor(t) {
    setEditingLimitsFor(t._id);
    setLimitsDraft({
      maxQuizzes: t.limits?.maxQuizzes ?? 10,
      maxAttemptsPerQuiz: t.limits?.maxAttemptsPerQuiz ?? 200,
    });
  }

  async function saveLimits(t) {
    setBusyId(t._id);
    try {
      const res = await fetch(`/api/superadmin/teachers/${t._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits: limitsDraft }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Update failed');
        return;
      }
      setEditingLimitsFor(null);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <div className="card text-red-600">{error}</div>;
  if (!teachers) return <div className="card text-gray-500">Loading…</div>;

  return (
    <div className="space-y-4">
      {tempPasswordFor && (
        <div className="card bg-yellow-50 border border-yellow-200 space-y-2">
          <p className="font-semibold">
            New temporary password for {tempPasswordFor.name}
          </p>
          <p className="font-mono text-lg bg-white border rounded px-3 py-2 inline-block">
            {tempPasswordFor.password}
          </p>
          <p className="text-sm text-gray-600">
            Share this with the teacher yourself (phone/WhatsApp/in person). They'll be required to
            set their own new password the next time they log in.
          </p>
          <button className="btn-secondary text-sm" onClick={() => setTempPasswordFor(null)}>
            Done
          </button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-4">Teacher</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Quizzes</th>
              <th className="py-2 pr-4">Limits</th>
              <th className="py-2 pr-4">Last login</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-400">
                  No teachers have signed up yet.
                </td>
              </tr>
            )}
            {teachers.map((t) => (
              <tr key={t._id} className="border-b last:border-0 align-top">
                <td className="py-2 pr-4">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.email}</p>
                  {t.phone && <p className="text-gray-400 text-xs">{t.phone}</p>}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      t.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {t.status}
                  </span>
                  {t.mustChangePassword && (
                    <p className="text-xs text-yellow-600 mt-1">Password reset pending</p>
                  )}
                </td>
                <td className="py-2 pr-4">{t.quizCount}</td>
                <td className="py-2 pr-4">
                  {editingLimitsFor === t._id ? (
                    <div className="flex flex-col gap-2 w-40">
                      <label className="text-xs text-gray-500">
                        Max quizzes
                        <input
                          type="number"
                          min={0}
                          className="input mt-0.5"
                          value={limitsDraft.maxQuizzes}
                          onChange={(e) =>
                            setLimitsDraft((d) => ({ ...d, maxQuizzes: Number(e.target.value) }))
                          }
                        />
                      </label>
                      <label className="text-xs text-gray-500">
                        Max attempts/quiz
                        <input
                          type="number"
                          min={0}
                          className="input mt-0.5"
                          value={limitsDraft.maxAttemptsPerQuiz}
                          onChange={(e) =>
                            setLimitsDraft((d) => ({
                              ...d,
                              maxAttemptsPerQuiz: Number(e.target.value),
                            }))
                          }
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          className="btn-primary text-xs"
                          disabled={busyId === t._id}
                          onClick={() => saveLimits(t)}
                        >
                          Save
                        </button>
                        <button
                          className="btn-secondary text-xs"
                          onClick={() => setEditingLimitsFor(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="text-brand-600 text-xs underline"
                      onClick={() => openLimitsEditor(t)}
                    >
                      {t.limits?.maxQuizzes ?? 10} quizzes · {t.limits?.maxAttemptsPerQuiz ?? 200}/quiz
                    </button>
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-500">{fmt(t.lastLoginAt)}</td>
                <td className="py-2 pr-4">
                  <div className="flex flex-col gap-1.5 items-start">
                    <button
                      className="text-xs text-brand-600 underline disabled:opacity-50"
                      disabled={busyId === t._id}
                      onClick={() => toggleStatus(t)}
                    >
                      {t.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                    <button
                      className="text-xs text-brand-600 underline disabled:opacity-50"
                      disabled={busyId === t._id}
                      onClick={() => resetPassword(t)}
                    >
                      Reset password
                    </button>
                    <button
                      className="text-xs text-red-600 underline disabled:opacity-50"
                      disabled={busyId === t._id}
                      onClick={() => deleteTeacher(t)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
