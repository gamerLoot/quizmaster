import mongoose from 'mongoose';

const ViolationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g. tab_switch, fullscreen_exit, copy_attempt, paste_attempt, devtools, right_click, blur
    detail: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOptionIds: [{ type: mongoose.Schema.Types.ObjectId }],
    textAnswer: { type: String, default: '' },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
    attempted: { type: Boolean, default: false },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AttemptSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    studentInfo: { type: Map, of: String, default: {} },

    startedAt: { type: Date, required: true },
    deadlineAt: { type: Date, required: true }, // server-authoritative — startedAt + durationMinutes
    submittedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted', 'kicked'],
      default: 'in_progress',
    },

    answers: { type: [AnswerSchema], default: [] },
    violationLog: { type: [ViolationSchema], default: [] },
    violationCount: { type: Number, default: 0 },

    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },

    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },

    questionOrder: [{ type: mongoose.Schema.Types.ObjectId }], // shuffled order shown to this student
  },
  { timestamps: true }
);

export default mongoose.models.Attempt || mongoose.model('Attempt', AttemptSchema);
