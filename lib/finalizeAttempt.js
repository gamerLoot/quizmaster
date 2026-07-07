import { gradeAnswer } from './grading';

// Mutates and returns the attempt (Mongoose document). Caller must still call attempt.save().
export function finalizeAttempt(attempt, questions, quiz, status = 'submitted') {
  if (attempt.status !== 'in_progress') return attempt;

  const questionMap = new Map(questions.map((q) => [String(q._id), q]));
  let totalScore = 0;
  let maxScore = 0;
  for (const q of questions) maxScore += q.marks ?? 1;

  attempt.answers.forEach((a) => {
    const q = questionMap.get(String(a.questionId));
    if (!q) return;
    const result = gradeAnswer(q, a);
    a.isCorrect = result.isCorrect;
    a.marksAwarded = result.marksAwarded;
    a.attempted = result.attempted;
    totalScore += result.marksAwarded;
  });

  const percent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  attempt.totalScore = totalScore;
  attempt.maxScore = maxScore;
  attempt.passed = percent >= (quiz.passPercent || 0);
  attempt.status = status;
  attempt.submittedAt = new Date();
  return attempt;
}
