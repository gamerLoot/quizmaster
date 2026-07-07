import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true, maxlength: 20 },
    passwordHash: { type: String, required: true },

    role: { type: String, enum: ['super_admin', 'teacher'], default: 'teacher', index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },

    // Free-tier protection: sensible per-teacher caps, editable by super admin
    limits: {
      maxQuizzes: { type: Number, default: 10 },
      maxAttemptsPerQuiz: { type: Number, default: 200 },
    },

    // Forces a password change on next login after a super-admin reset
    mustChangePassword: { type: Boolean, default: false },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Never let a stray query/log accidentally leak the hash
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
