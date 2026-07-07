import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import RegisterForm from '@/components/RegisterForm';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ params }) {
  await connectDB();
  const quiz = await Quiz.findOne({ linkToken: params.token }).lean();

  if (!quiz || quiz.status !== 'published') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Test not available</h1>
          <p className="text-gray-600">This test link is invalid or currently closed.</p>
        </div>
      </main>
    );
  }

  const formConfig = JSON.parse(JSON.stringify(quiz.formConfig || []));

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card max-w-lg w-full">
        <h1 className="text-xl font-bold mb-1">Before you begin, {quiz.title}</h1>
        <p className="text-gray-500 text-sm mb-6">Please fill in your details.</p>
        <RegisterForm token={params.token} formConfig={formConfig} />
      </div>
    </main>
  );
}
