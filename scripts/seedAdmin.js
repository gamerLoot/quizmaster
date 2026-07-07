/* eslint-disable no-console */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  const uri = process.env.MONGODB_URI;
  const name = process.env.SUPER_ADMIN_NAME;
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!uri || !name || !email || !password) {
    console.error(
      'MONGODB_URI, SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env.local'
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('SUPER_ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(uri);

  // Minimal inline schema mirroring models/User.js — kept standalone so this script
  // has no dependency on Next.js path aliases and can run with plain `node`.
  const UserSchema = new mongoose.Schema(
    {
      name: String,
      email: { type: String, unique: true, lowercase: true, trim: true },
      phone: { type: String, default: '' },
      passwordHash: String,
      role: { type: String, enum: ['super_admin', 'teacher'], default: 'teacher' },
      status: { type: String, enum: ['active', 'suspended'], default: 'active' },
      limits: {
        maxQuizzes: { type: Number, default: 10 },
        maxAttemptsPerQuiz: { type: Number, default: 200 },
      },
      mustChangePassword: { type: Boolean, default: false },
      lastLoginAt: { type: Date, default: null },
    },
    { timestamps: true }
  );
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const passwordHash = await bcrypt.hash(password, 12);
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.role = 'super_admin';
    existing.status = 'active';
    existing.mustChangePassword = false;
    await existing.save();
    console.log(`Updated existing super admin: ${normalizedEmail}`);
  } else {
    await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: 'super_admin',
      status: 'active',
    });
    console.log(`Created super admin: ${normalizedEmail}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
