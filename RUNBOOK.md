# Genezenz Pharmacy — running the shop

A plain guide for whoever runs the store day to day. No coding needed for
anything in Part 1.

---

## Part 1 — daily operations (admin panel)

Sign in at **yourdomain.com/admin** with the email and password you were given.
Change the password at first sign-in (see Part 3).

Everything is on one page, top to bottom. The sticky bar at the top jumps to any
section, and a number badge shows where something is waiting.

### Every morning
Open the dashboard. The **Attention** row at the top shows what needs you:
new leads, orders to confirm, prescriptions to review. If it says "nothing
waiting", you are clear.

### A new enquiry came in (Leads)
Someone filled the callback form, or messaged on WhatsApp/Facebook/Instagram.
1. Go to **Leads**. New ones are at the top, tagged by channel.
2. Call them back (tap the phone number) or hit **WhatsApp** for a prefilled
   message.
3. Change their status: new → contacted → qualified → converted (or lost).
   > The whole point of this inbox is that nobody gets forgotten. Call back fast.

### A customer placed an order (Orders)
1. Go to **Orders**. New orders are **Pending**.
2. Check the items and address, then move the status:
   Pending → Confirmed → Packed → Shipped → Delivered.
3. When it ships, fill **Delivery tracking** (courier, tracking ID, expected
   date). The customer sees this on their order page, so they stop calling to
   ask where it is.
4. If you cancel an order, the stock is automatically returned to inventory.

### A prescription was uploaded (Prescriptions)
1. Go to **Prescriptions**. Pending ones are highlighted.
2. Click **Open file** to view it (it is decrypted only when you open it).
3. Check it is valid and the medicines are available.
4. Type a **pharmacist note** — the customer sees this — then **Approve** or
   **Reject**.
   > You cannot reject without a note. That is on purpose: the customer needs to
   > know what to fix.

### Managing products (Products)
- **Add:** click **+ Add product**, fill name, price, stock, category. Add a
  **cost price** too if you want profit to show on the dashboard.
- **Photos:** in the product form, paste an image URL. Upload the photo to the
  shop's Cloudinary account first. Do NOT copy images from 1mg, PharmEasy or
  Netmeds — that is their copyright and the picture can break any time.
- **Edit:** click Edit on any row.
- **Out of stock:** set stock to 0 — it shows "out of stock" and cannot be
  ordered. **Hide** a product by unticking "Published".
- **Delete:** if the product was ever in an order it is hidden (not deleted) so
  old orders stay readable.

### Reading the money (dashboard)
- **Revenue / profit / margin** — last 30 days. Profit shows only for products
  that have a cost price; the rest are left out rather than guessed.
- **Loss & risk** — cancelled orders, out-of-stock, low-stock, stock value.
- **Best sellers** and **reorder soon** — what to restock.

---

## Part 2 — content to keep current

- **Prices** — keep them right. Customers see them live.
- **Stock** — the dashboard flags low stock; restock before it hits zero.
- **Offers** — the free-delivery threshold and codes live in one settings file
  (`src/lib/config.ts`); ask your developer to change them.
- **Opening hours / address** — also in that settings file. If the address
  changes, it must match your Google Business Profile exactly.

---

## Part 3 — occasional technical tasks (or your developer)

### Change the admin password
The safe way is to create a new admin. Simplest: set a new `ADMIN_PASSWORD` in
`.env`, then run `npm run db:seed` again — it updates the existing admin. Do this
on the server/hosting, not by editing the database by hand.

### Deploy an update
If hosted on Vercel: push the changed code to GitHub; Vercel rebuilds and
deploys automatically. Check the build succeeded in the Vercel dashboard.

### Rotate a secret (do this once, at launch)
- **Database password** (the Neon connection string was shared during setup):
  Neon dashboard → reset password → copy the new string → update `DATABASE_URL`
  in your hosting environment → redeploy.
- **AUTH_SECRET / FILE_ENCRYPTION_KEY**: set strong values once at launch and do
  not change them casually — rotating `FILE_ENCRYPTION_KEY` makes already-uploaded
  prescriptions unreadable.

### Connect Facebook/Instagram leads (once Meta approves)
Add `META_APP_SECRET` and `META_PAGE_ACCESS_TOKEN` to the hosting environment and
redeploy. The leads then appear in the inbox automatically. Full steps in
`README.md`.

### Import the real catalogue
`npm run db:migrate-legacy -- --write --fix-images` pulls the products from the
old site. Read `MIGRATION.md` first — most old images need replacing.

---

## Who to call

- **Something's broken on the site** → your developer.
- **A drug-inspector or licensing question** → your pharmacist-in-charge and,
  if needed, your lawyer. Nothing on the site substitutes for that.
- **A customer needs a medicine urgently and the site is down** → the shop phone
  still works; take the order the old way.
