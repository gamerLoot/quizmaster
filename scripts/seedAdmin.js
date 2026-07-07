/* eslint-disable no-console */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!uri || !email || !password) {
    console.error('MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const AdminSchema = new mongoose.Schema(
    { email: String, passwordHash: String },
    { timestamps: true }
  );
  const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await Admin.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Updated existing admin: ${email}`);
  } else {
    await Admin.create({ email: email.toLowerCase(), passwordHash });
    console.log(`Created admin: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
