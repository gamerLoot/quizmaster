'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AttemptClient from '@/components/AttemptClient';

function Inner({ token }) {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');

  if (!attemptId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-gray-600">Missing attempt reference. Please start the test again.</p>
      </div>
    );
  }

  return <AttemptClient token={token} attemptId={attemptId} />;
}

export default function AttemptPage({ params }) {
  return (
    <Suspense fallback={null}>
      <Inner token={params.token} />
    </Suspense>
  );
}
