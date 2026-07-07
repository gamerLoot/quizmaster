'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function PublishPanel({ quiz }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== 'undefined' && quiz.linkToken
      ? `${window.location.origin}/test/${quiz.linkToken}`
      : '';

  useEffect(() => {
    if (link) {
      QRCode.toDataURL(link, { width: 180, margin: 1 }).then(setQrDataUrl).catch(() => {});
    }
  }, [link]);

  async function handleAction(action) {
    setBusy(true);
    try {
      const res = await fetch(`/api/quizzes/${quiz._id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Action failed');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Share Link</h2>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            quiz.status === 'published'
              ? 'bg-green-100 text-green-700'
              : quiz.status === 'closed'
              ? 'bg-gray-200 text-gray-600'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {quiz.status}
        </span>
      </div>

      {quiz.status === 'draft' && (
        <button onClick={() => handleAction('publish')} disabled={busy} className="btn-primary">
          {busy ? 'Publishing…' : 'Publish & Generate Link'}
        </button>
      )}

      {quiz.linkToken && (quiz.status === 'published' || quiz.status === 'closed') && (
        <>
          <div className="flex gap-2">
            <input readOnly className="input" value={link} />
            <button type="button" onClick={copyLink} className="btn-secondary text-sm shrink-0">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR code for test link" className="rounded-lg border" />
          )}
          <div className="flex gap-2">
            {quiz.status === 'published' ? (
              <button
                onClick={() => handleAction('close')}
                disabled={busy}
                className="btn-secondary text-sm"
              >
                Close Test (stop new attempts)
              </button>
            ) : (
              <button
                onClick={() => handleAction('publish')}
                disabled={busy}
                className="btn-secondary text-sm"
              >
                Reopen Test
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
