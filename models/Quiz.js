import mongoose from 'mongoose';

const FormFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // e.g. "name", "phone", "email", or custom_xxx
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'email', 'tel', 'dropdown'], default: 'text' },
    required: { type: Boolean, default: true },
    options: [{ type: String }], // used when type === 'dropdown'
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const QuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

    durationMinutes: { type: Number, required: true, default: 30 },
    startAt: { type: Date, default: null }, // link becomes active from this time
    endAt: { type: Date, default: null }, // link expires after this time

    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },

    negativeMarking: {
      enabled: { type: Boolean, default: false },
      value: { type: Number, default: 0 }, // marks deducted per wrong answer
    },

    maxAttempts: { type: Number, default: 1 }, // per student (matched by email/phone)
    passPercent: { type: Number, default: 40 },
    showResultImmediately: { type: Boolean, default: true },
    violationLimit: { type: Number, default: 5 }, // auto-submit after this many violations

    formConfig: { type: [FormFieldSchema], default: () => defaultFormConfig() },

    linkToken: { type: String, unique: true, sparse: true, index: true },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  },
  { timestamps: true }
);

function defaultFormConfig() {
  return [
    { key: 'name', label: 'Full Name', type: 'text', required: true, order: 0 },
    { key: 'phone', label: 'Phone Number', type: 'tel', required: true, order: 1 },
    { key: 'email', label: 'Email (Gmail)', type: 'email', required: false, order: 2 },
  ];
}

export default mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);
