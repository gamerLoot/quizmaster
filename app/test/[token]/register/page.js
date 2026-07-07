import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import RegisterForm from '@/components/RegisterForm';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ params }) {
  await connectDB();
  const quiz = await Quiz.findOne({ linkToken: params.token }).lean();

  if (!quiz || quiz.status !== 'published') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Test not available</h1>
          <p className="text-gray-600">This test link is invalid or currently closed.</p>
        </div>
      </main>
    );
  }

  const formConfig = JSON.parse(JSON.stringify(quiz.formConfig || []));

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="card max-w-lg w-full">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-brand-600 font-semibold mb-1">
            One last step
          </p>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <p className="text-gray-500 text-sm mt-1">Please fill in your details to begin.</p>
        </div>
        <RegisterForm token={params.token} formConfig={formConfig} />
      </div>
    </main>
  );
}
