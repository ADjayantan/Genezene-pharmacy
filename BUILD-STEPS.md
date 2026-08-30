# Getting it running on Windows

## What went wrong last time

Three things, all fixable:

1. **Wrong folder.** `cd medplus-pro` failed, so everything after it ran in
   `C:\Users\adjay` against an unrelated `package.json`. The "up to date,
   66 packages" was some other project.

2. **`npx` offered you Prisma 8.0.0-rc.12.** That is a *release candidate*, and
   it appeared only because there was no local Prisma to use. This project pins
   Prisma 6. **Never accept that prompt** — Prisma 8 would fail against this
   schema. Once you are in the right folder and `npm install` has run, `npx`
   uses the pinned local version and asks nothing.

3. **The `#` comment got typed into the prompt.** Windows `cmd` has no `#`
   comments, so it was read as input and cancelled the install. Paste commands
   without trailing comments.

---

## Step 1 — put the project somewhere sane

Easiest way: click any file card in the chat to open the folder, go up to
`medplus-pro`, copy it, and paste it at `C:\genezenz`.

Or in `cmd`:

```
robocopy "%APPDATA%\Claude\local-agent-mode-sessions" "C:\genezenz-search" medplus-pro /s /njh /njs /ndl /nc /ns
```

If that is awkward, just drag the folder in Explorer. The only thing that
matters is ending up with a short path like `C:\genezenz`.

## Step 2 — database (5 minutes, free)

1. [neon.tech](https://neon.tech) → sign up → new project → region **Singapore**
2. Copy the connection string

Do this before building. The home page queries products at build time, so a
real database makes the build a genuine test rather than a dry run.

## Step 3 — environment

```
cd C:\genezenz
copy .env.example .env
notepad .env
```

Fill in at minimum:

```
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
AUTH_SECRET="paste the value from the command below"
ADMIN_EMAIL="care@genezenz-pharmacy.in"
ADMIN_PASSWORD="pick one, 12+ characters"
```

Generate `AUTH_SECRET`:

```
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## Step 4 — build

Run these one at a time. No comments on the line.

```
cd C:\genezenz
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run build
```

Then:

```
npm run dev
```

Open <http://localhost:3000>. Admin at <http://localhost:3000/admin>.

## Step 5 — real catalogue

```
npm run db:migrate-legacy -- --write --fix-images
```

Pulls all 124 products from the old site. Read `MIGRATION.md` first — 102 of
the images are broken or hotlinked from competitors, which needs a decision.

---

## Current state on this machine

Done, verified:

- Project copied to `C:\genezenz`
- `npm install` — clean
- `npx prisma generate` — Prisma Client 6.19.3
- `npm run build` — **passed**, types clean, 24 static pages generated
- `.env` created, `AUTH_SECRET` generated
- `ADMIN_EMAIL` = `care@genezenz-pharmacy.in`
- `ADMIN_PASSWORD` = `ChangeMe-Genezenz-2026`

> **That password is a placeholder and its own name says so.** It exists to get
> the seed script past its 12-character check on a machine with nothing
> deployed. Change it before this goes anywhere near a real domain — anything
> written into a chat, a ticket or a doc is not a secret any more.

Not done, and not mine to do:

- **`DATABASE_URL`.** This needs a database on your account. I do not create
  accounts on anyone's behalf — that credential has to be yours from the
  start, not handed over second-hand.

## What I expect to break

I have never run this build. Everything I verified was static analysis — files
parse, imports resolve, no client/server boundary violations. That catches a
lot, but not these:

- TypeScript errors that only appear once `@prisma/client` is generated
- Tailwind v4 `@theme inline` behaviour in a production build
- `next/font` Fraunces axis configuration
- Server action serialisation

**It did not break.** The first build compiled in 7.7s with types clean, so the
static analysis held up. Two `prisma:error` lines appeared during page
collection — that is the placeholder `DATABASE_URL`, caught by the error
handling around those queries, and the build continued as intended.

One thing the build output did reveal: `/products/[slug]` was rendering
dynamically. Those 124 pages are the ones that have to rank, so they now have
`generateStaticParams` and prerender like the area pages. Next build should
show them as `○ Static`.

## If a command fails

| Message | Cause |
|---|---|
| `The system cannot find the path specified` | Wrong folder. `cd C:\genezenz` first. |
| `Ok to proceed? (y)` for prisma | You are outside the project, or `npm install` has not run. Say no, fix the folder. |
| `AUTH_SECRET missing or too short` | Set it in `.env`, 32+ characters. |
| `Can't reach database server` | Wrong `DATABASE_URL`, or `?sslmode=require` is missing. |
| `Set ADMIN_EMAIL and ADMIN_PASSWORD` | Seed refuses to create an account without them. By design. |
