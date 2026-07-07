# QuizMaster (Phase 1 MVP)

Free, worldwide-hostable MCQ/quiz platform. Admin creates a quiz, sets a timer and a
custom student registration form, publishes it, and shares the generated link.
Students fill the form, take the timed test with basic anti-cheat monitoring, and
see their score instantly. Admin sees every attempt live, including a full
violation/behavior log per student.

## 1. Local Setup

```bash
npm install
cp .env.example .env.local   # then edit .env.local with your real values
```

Fill in `.env.local`:

- `MONGODB_URI` — a free MongoDB Atlas connection string (see below)
- `JWT_SECRET` — any long random string
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — used once to seed your admin login

Create the admin account (run this once, and again any time you want to reset the password):

```bash
npm run seed:admin
```

Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000/admin/login and sign in with the email/password from `.env.local`.

## 2. Free MongoDB Atlas (database)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free **M0** cluster (512MB, $0 forever).
3. Database Access → add a user with a password.
4. Network Access → allow access from anywhere (`0.0.0.0/0`) so Vercel can connect.
5. Connect → "Drivers" → copy the connection string into `MONGODB_URI`.

## 3. Free Deployment (Vercel)

1. Push this project to a GitHub repository.
2. Go to https://vercel.com, sign up free, "Add New Project", import the repo.
3. In the Vercel project's Environment Variables, add `MONGODB_URI`, `JWT_SECRET`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD` (same values as `.env.local`).
4. Deploy. You'll get a free `https://your-app.vercel.app` URL — this works worldwide,
   with no server to keep alive (fully serverless).
5. Run `npm run seed:admin` once **locally** (pointed at the same `MONGODB_URI`) to create
   the admin account in your live database.

## 4. How it works

- **Admin** logs in → dashboard → "+ New Quiz" → builder (questions, timer, student
  form, negative marking, etc.) → Publish → gets a unique link + QR code.
- **Student** opens the link → reads rules → fills the registration form (fields set by
  admin) → fullscreen test starts → timer counts down (enforced server-side, so it
  can't be tampered with from the browser) → submits (or is auto-submitted on
  timeout / too many violations) → sees score instantly.
- **Admin** opens "Results & Monitor" for a quiz to see every student's status live
  (in progress / submitted), score, and a full timestamped log of tab-switches,
  copy/paste attempts, fullscreen exits, etc. Click into any attempt for the full
  answer sheet.

## 5. Anti-cheat notes

This is browser-based deterrence + full transparency, not an unbeatable lockdown:
fullscreen enforcement, tab/window-switch detection, copy/paste/right-click block,
common devtools shortcuts blocked, and a server-authoritative timer. Every event is
logged with a timestamp so the admin always has visibility, and the admin sets how
many violations trigger an automatic submit.

## 6. What's next (Phase 2/3 ideas)

Question bank & bulk import, richer analytics/charts, email results to students,
certificates, leaderboards, webcam proctoring — see the original blueprint for the
full roadmap. Ask to build any of these whenever you're ready.
