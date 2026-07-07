// Shared grading logic used by the submit API route.
// Never trust the client with correct answers before this point.

export function gradeAnswer(question, answer) {
  const marks = question.marks ?? 1;
  const negativeMarks = question.negativeMarks ?? 0;

  if (!answer) {
    return { isCorrect: false, marksAwarded: 0, attempted: false };
  }

  if (question.type === 'mcq_single' || question.type === 'true_false') {
    const selected = answer.selectedOptionIds?.[0];
    if (!selected) return { isCorrect: false, marksAwarded: 0, attempted: false };
    const correct = question.options.find((o) => o.isCorrect);
    const isCorrect = correct && String(correct._id) === String(selected);
    return {
      isCorrect: !!isCorrect,
      marksAwarded: isCorrect ? marks : -negativeMarks,
      attempted: true,
    };
  }

  if (question.type === 'mcq_multi') {
    const selectedIds = (answer.selectedOptionIds || []).map(String).sort();
    if (selectedIds.length === 0) return { isCorrect: false, marksAwarded: 0, attempted: false };
    const correctIds = question.options
      .filter((o) => o.isCorrect)
      .map((o) => String(o._id))
      .sort();
    const isCorrect =
      selectedIds.length === correctIds.length &&
      selectedIds.every((id, i) => id === correctIds[i]);
    return {
      isCorrect,
      marksAwarded: isCorrect ? marks : -negativeMarks,
      attempted: true,
    };
  }

  if (question.type === 'short_answer') {
    const text = (answer.textAnswer || '').trim().toLowerCase();
    if (!text) return { isCorrect: false, marksAwarded: 0, attempted: false };
    const accepted = (question.correctText || '')
      .split('|')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const isCorrect = accepted.includes(text);
    return {
      isCorrect,
      marksAwarded: isCorrect ? marks : -negativeMarks,
      attempted: true,
    };
  }

  return { isCorrect: false, marksAwarded: 0, attempted: false };
}
