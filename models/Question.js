import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  }
);

const QuestionSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    type: {
      type: String,
      enum: ['mcq_single', 'mcq_multi', 'true_false', 'short_answer'],
      default: 'mcq_single',
    },
    text: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    options: { type: [OptionSchema], default: [] }, // used for mcq_single / mcq_multi / true_false
    correctText: { type: String, default: '' }, // used for short_answer, "|" separated accepted answers
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
