'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ResultClient from '@/components/ResultClient';

function Inner() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');

  if (!attemptId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-gray-600">Missing attempt reference.</p>
      </div>
    );
  }

  return <ResultClient attemptId={attemptId} />;
}

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
