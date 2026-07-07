# QuizMaster (Multi-Teacher Platform)

Free, worldwide-hostable MCQ/quiz platform. One **Super Admin** (the platform owner)
oversees any number of **Teachers**, who each sign up their own free account and get
their own private dashboard to create quizzes, set a timer and a custom student
registration form, publish a shareable link, and monitor students live — including a
full anti-cheat violation log per student. Students fill the form, take the timed
test, and see their score instantly.

## 1. Local Setup

```bash
npm install
cp .env.example .env.local   # then edit .env.local with your real values
```

Fill in `.env.local`:

- `MONGODB_URI` — a free MongoDB Atlas connection string (see below)
- `JWT_SECRET` — any long random string (generate with the command in `.env.example`)
- `SUPER_ADMIN_NAME` / `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` — used once to seed
  the one platform-owner login (8+ chars, with a letter and a number)

Create the Super Admin account (run this once, and again any time you want to reset
that one account's password):

```bash
npm run seed:admin
```

Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000/login and sign in with the Super Admin email/password from
`.env.local` — you'll land on `/superadmin/dashboard`. Teachers create their own
accounts from http://localhost:3000/signup.

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
   `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` (same values as
   `.env.local`). `JWT_SECRET` is required in production — the app refuses to boot
   without it.
4. Deploy. You'll get a free `https://your-app.vercel.app` URL — this works worldwide,
   with no server to keep alive (fully serverless).
5. Run `npm run seed:admin` once **locally** (pointed at the same `MONGODB_URI`) to
   create the Super Admin account in your live database.

## 4. Roles

- **Super Admin** — the platform owner (one account, created by `seed:admin`). Signs
  in at `/login`, lands on `/superadmin/dashboard`. Can see every teacher, suspend/
  reactivate accounts, edit each teacher's free-tier limits (max quizzes, max
  attempts/quiz), reset a teacher's password (generates a temporary password to share
  manually — no email service is used anywhere in this app), and delete a teacher
  along with all of their quizzes/questions/attempts.
- **Teacher** — signs up free at `/signup` (name, email, phone, password), logs in at
  `/login`, lands on `/teacher/dashboard`. Full control over only their own quizzes.
  If they forget their password, they must contact the Super Admin to have it reset —
  there is no self-service/email-based reset.

## 5. How it works

- **Teacher** logs in → dashboard → "+ New Quiz" → builder (questions, timer, student
  form, negative marking, etc.) → Publish → gets a unique link + QR code.
- **Student** opens the link → reads rules → fills the registration form (fields set by
  the teacher) → fullscreen test starts → timer counts down (enforced server-side, so
  it can't be tampered with from the browser) → submits (or is auto-submitted on
  timeout / too many violations) → sees score instantly.
- **Teacher** opens "Results & Monitor" for a quiz to see every student's status live
  (in progress / submitted), score, and a full timestamped log of tab-switches,
  copy/paste attempts, fullscreen exits, etc. Click into any attempt for the full
  answer sheet.
- If a teacher's account is suspended by the Super Admin, their published quiz links
  stop accepting new attempts immediately — even mid-test-window.

## 6. Security notes

- Passwords hashed with bcrypt (cost 12), sessions are signed JWTs in httpOnly,
  sameSite cookies (secure in production).
- Login/signup are rate-limited (8 attempts / 15 min per IP+email) and return generic
  error messages so they can't be used to enumerate registered accounts.
- Every API route re-checks the caller's live role/status in the database on every
  request — a suspended teacher is locked out immediately, not just after their
  session token expires.
- No email service anywhere: signup is instant, and password reset is a manual,
  Super-Admin-mediated flow (see Roles above).

## 7. Anti-cheat notes

This is browser-based deterrence + full transparency, not an unbeatable lockdown:
fullscreen enforcement, tab/window-switch detection, copy/paste/right-click block,
common devtools shortcuts blocked, and a server-authoritative timer. Every event is
logged with a timestamp so the teacher always has visibility, and the teacher sets how
many violations trigger an automatic submit.

## 8. What's next (ideas)

Question bank & bulk import, richer analytics/charts, email results to students,
certificates, leaderboards, webcam proctoring — ask to build any of these whenever
you're ready.
