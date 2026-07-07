import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold mb-3">QuizMaster</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Create MCQ tests, share a link with students anywhere in the world, and monitor
        their attempts live — 100% free.
      </p>
      <Link href="/admin/login" className="btn-primary">
        Admin Login
      </Link>
    </main>
  );
}
