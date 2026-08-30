# Setup — step by step

You do domain + hosting. This walks through both.

---

## Part 1 — Database (5 minutes, free)

1. Go to **[neon.tech](https://neon.tech)** → sign up with GitHub
2. Create a project, region **Singapore** (closest to India — lower latency)
3. Copy the connection string. It looks like:
   `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. That's your `DATABASE_URL`

Supabase works too, same idea.

---

## Part 2 — Run it locally first

```bash
cd medplus-pro
cp .env.example .env
```

Open `.env` and fill in:

```bash
DATABASE_URL="…the Neon string…"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
AUTH_SECRET="…run: openssl rand -base64 48…"
ADMIN_EMAIL="care@genezenz-pharmacy.in"
ADMIN_PASSWORD="…at least 12 characters…"
```

> On Windows, if `openssl` isn't available:
> `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`

Then:

```bash
npm install
npx prisma db push     # creates the tables
npm run db:seed        # admin user + categories + 8 sample products
npm run dev
```

Open **http://localhost:3000**. Admin panel at **/admin**.

**Check these work before deploying:** register an account, add to cart, place an
order, upload a prescription, approve it in the admin panel, submit the homepage
lead form and confirm it appears in `/admin/leads`.

---

## Part 3 — Domain

Buy from **Namecheap**, **GoDaddy**, or **Hostinger**. For an Indian pharmacy,
`.in` or `.com` — around ₹700–1200/year.

Suggestions: `genezenzpharmacy.in`, `genezenz.in`, `genezenzpharmacy.com`

Buy the domain only. Do **not** buy their hosting — you don't need it, and
shared cPanel hosting cannot run this app.

---

## Part 4 — Hosting (Vercel, free tier)

1. Push this folder to a **new** GitHub repo (keep the old `medplus` repo as-is
   until the new site is live)
2. **[vercel.com](https://vercel.com)** → sign in with GitHub → **Import Project**
3. Vercel detects Next.js automatically — don't change the build settings
4. Under **Environment Variables**, add every line from your `.env`, with:
   - `NEXT_PUBLIC_SITE_URL` = your real domain, e.g. `https://www.genezenzpharmacy.in`
   - `NODE_ENV` is set by Vercel — don't add it
5. **Deploy**

### Prescription storage on Vercel — do not skip this

Vercel's filesystem is wiped on every deploy. Without a blob store, uploaded
prescriptions disappear.

Vercel dashboard → **Storage** → **Create** → **Blob** → connect it to the
project. That injects `BLOB_READ_WRITE_TOKEN` automatically. Redeploy.

### Connect the domain

1. Vercel project → **Settings → Domains** → add your domain
2. Vercel shows the DNS records to create
3. In your registrar's DNS panel, add them:
   - `A` record, `@` → `76.76.21.21`
   - `CNAME`, `www` → `cname.vercel-dns.com`
4. Wait 10 minutes to a few hours. HTTPS is issued automatically.

---

## Part 5 — Google (do this on launch day)

1. **[Search Console](https://search.google.com/search-console)** → add your
   domain → verify (Vercel domains verify via DNS TXT)
2. Submit `https://yourdomain.com/sitemap.xml`
3. **Google Business Profile** — claim/verify the Ganapathy listing. Name,
   address and phone must match the website **character for character**, or
   local ranking suffers.
4. Add the GBP listing's exact coordinates to `src/lib/config.ts` (`geo`)

Indexing takes 1–4 weeks. Local pack movement takes 4–12 weeks. That is normal
and not something a code change speeds up.

---

## Part 6 — Meta (start the paperwork on day one)

Full walkthrough in `README.md` → *Connecting Meta*.

The short version: Business Verification takes 3 days to 2 weeks, App Review
another 3 days to 2 weeks. **Submit both before you finish building**, because
that clock runs regardless of what you do.

The site works fine without it. The admin dashboard shows a banner explaining
the state, and website + WhatsApp leads flow from day one.

---

## Migrating the old catalogue

All 124 products from the old site import automatically:

```bash
npm run db:migrate-legacy                            # dry run
npm run db:migrate-legacy -- --write --fix-images    # import
```

Run this **instead of** `npm run db:seed` if you want the real catalogue rather
than the 8 sample products. (Run `db:seed` first anyway — it creates the admin
user.)

**Read `MIGRATION.md` before you do.** 102 of the 124 product images are broken
or hotlinked from competitors' CDNs, and that needs a decision from the client.

---

## Costs

| | Cost |
|---|---|
| Domain | ₹700–1200 / year |
| Vercel Hobby | Free |
| Neon Postgres | Free (0.5 GB) |
| Vercel Blob | Free (1 GB) |
| **Total** | **Domain only** |

Move to Vercel Pro (~$20/month) only when traffic actually needs it. It will not
for a long time.

---

## If something breaks

| Symptom | Cause |
|---|---|
| `AUTH_SECRET missing or too short` | Set it, 32+ characters |
| `Can't reach database server` | Wrong `DATABASE_URL`, or `?sslmode=require` missing |
| Seed fails: "Set ADMIN_EMAIL…" | Fill both in `.env`; password needs 12+ chars |
| Prescriptions vanish after deploy | Vercel Blob not connected (Part 4) |
| Meta webhook won't verify | `META_VERIFY_TOKEN` must match the value typed into Meta exactly |
| Pages not in Google after a week | Normal. Check Search Console → Pages for the actual status |
