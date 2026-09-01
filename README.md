# Health

A private, two-person health tracker — water intake, heart rate, blood
pressure, and symptoms, each logged with a date/time stamp. Caleb and his
wife each sign in with a name + PIN and only ever see their own data.

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS, Prisma +
Supabase Postgres for the database, NextAuth for sign-in, deployed on
Vercel.

---

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project (free tier is plenty)

1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's created, go to **Project Settings → Database → Connection
   string**.
3. Copy the connection string
4. Copy the file `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — the **Transaction pooler** connection string (port `6543`, add `?pgbouncer=true` if it's not already there). This is what the running app uses.
   - `DIRECT_URL` — the **Session/direct** connection string (port `5432`). This is only used when pushing schema changes.
   - `NEXTAUTH_SECRET` — generate one with `openssl rand -base64 32`.
   - `NEXTAUTH_URL` — `http://localhost:3000` for now; you'll change this to your Vercel URL later.

## 3. Create the database tables

```bash
npx prisma db push
```

This creates the tables in your Supabase database from `prisma/schema.prisma`.

## 4. Create your two accounts

```bash
npm run setup-users
```

You'll be prompted for a display name and a 4-8 digit PIN, twice (once per
person). Re-run this any time to change a PIN — it updates in place.

## 5. Run it locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the
login screen with two name cards.

---

## 6. Push to GitHub

You said you already have a GitHub account and Vercel account set up, so
this is the short version:

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create healthapp --private --source=. --remote=origin --push
```

(If you don't have the `gh` CLI, create an empty repo on github.com
instead, then `git remote add origin <your-repo-url>` and `git push -u
origin main`.)

**Important:** `.env` is already in `.gitignore`, so your Supabase
credentials never get committed. Don't remove that line.

## 7. Deploy on Vercel

1. In the Vercel dashboard: **Add New → Project**, import the GitHub repo
   you just pushed.
2. Before deploying, open **Environment Variables** and add the same four
   values from your `.env` file:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` — set this to your production URL, e.g.
     `https://healthapp.vercel.app` (you can update it after the first
     deploy once you know the exact URL, then redeploy).
3. Click **Deploy**.

Your Vercel deployment talks to the same Supabase database as your local
machine, so you do **not** need to re-run `prisma db push` or
`setup-users` separately for production — they already apply.

### Making changes later

Because Vercel is connected to your GitHub repo, any time you want to
change something:

```bash
git add .
git commit -m "Describe the change"
git push
```

Vercel automatically rebuilds and redeploys on every push to `main`.

If you ever change `prisma/schema.prisma` (add a new field, etc.), run
`npx prisma db push` locally once after pulling/writing the change — that
updates the shared Supabase database for both local and production.

---

## How the pieces fit together

- **Login** (`/login`) — pick your name, enter your PIN. Handled by
  NextAuth's Credentials provider; PINs are stored hashed (bcrypt), never
  in plain text.
- **Today** (`/dashboard`) — the four logging cards. Each write goes
  through a Next.js Server Action (`src/lib/actions.ts`), which checks
  who's signed in server-side before touching the database, so your data
  and your wife's data can never cross.
- **Symptoms** — typing a custom symptom both logs it *and* saves it into
  your personal dropdown of past symptoms (`SymptomOption` table), so it's
  one tap next time. Everything is stored lowercased/trimmed alongside the
  original text, which is what the History search matches against.
- **History** (`/history`) — every entry you've ever logged, searchable,
  filterable by type and date range, and exportable to CSV to bring to a
  provider.

## Project structure

```
prisma/schema.prisma       Database models
prisma/seed.js             The `npm run setup-users` script
src/lib/auth.ts            NextAuth configuration (PIN login)
src/lib/actions.ts         Server Actions — all writes go through here
src/lib/normalize.ts       Symptom text normalization + BP parsing
src/app/login              Sign-in screen
src/app/dashboard          Today's logging screen
src/app/history            Searchable history + CSV export
src/components             UI pieces (one file per card)
```
