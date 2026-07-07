// DEPRECATED: superseded by models/User.js (multi-teacher + super_admin roles).
// Kept only so this file isn't dangling; nothing in the app imports it anymore.
// Not deleted because file deletion isn't permitted in this environment — safe to
// remove by hand once you've confirmed the User migration is fully deployed.
import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
