import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const CATEGORIES = [
  { name: 'Diabetes Care', slug: 'diabetes-care' },
  { name: 'Vitamins & Supplements', slug: 'vitamins' },
  { name: 'Cold & Fever', slug: 'cold-fever' },
  { name: 'Personal Care', slug: 'personal-care' },
  { name: 'Baby Care', slug: 'baby-care' },
  { name: 'Pain Relief', slug: 'pain-relief' },
];

/**
 * Starter catalogue. Prices are illustrative placeholders — the client must
 * set real prices before go-live. Descriptions are deliberately written out
 * in full: a one-line description is the fastest way to build a page Google
 * classifies as thin and refuses to rank.
 */
const PRODUCTS = [
  {
    name: 'Paracetamol 650mg Tablets (Strip of 15)', cat: 'pain-relief',
    brand: 'Generic', salt: 'Paracetamol 650mg', price: 30, mrp: 35, stock: 120, rx: false,
    description: 'Paracetamol 650mg tablets for the relief of fever and mild to moderate pain. Strip of 15 tablets, stored and dispensed under pharmacist supervision.',
    content: 'Paracetamol is one of the most widely used medicines for bringing down fever and easing everyday pain such as headache, toothache, body ache and period pain.\n\nWe stock it in the standard 650mg strength. Take it exactly as your doctor or the pack insert directs, and do not exceed the stated daily maximum. If fever persists beyond three days, see a doctor rather than continuing on your own.\n\nAvailable for same-day dispatch across Coimbatore.',
  },
  {
    name: 'Metformin 500mg Tablets (Strip of 15)', cat: 'diabetes-care',
    brand: 'Generic', salt: 'Metformin Hydrochloride 500mg', price: 45, mrp: 55, stock: 80, rx: true,
    description: 'Metformin 500mg tablets, commonly prescribed for the management of type 2 diabetes. Prescription required — verified by our pharmacist before dispatch.',
    content: 'Metformin is a first-line medicine in the management of type 2 diabetes and is usually taken alongside diet and exercise changes.\n\nThis is a prescription-only medicine. Upload your prescription and one of our pharmacists will check the dosage and confirm availability before preparing your order. We never substitute a brand or strength without speaking to you first.\n\nIf you are already taking other diabetes medication, mention it when you order so our pharmacist can flag anything worth raising with your doctor.',
  },
  {
    name: 'Vitamin D3 60000 IU Sachets (Pack of 4)', cat: 'vitamins',
    brand: 'Generic', salt: 'Cholecalciferol 60000 IU', price: 180, mrp: 220, stock: 60, rx: false,
    description: 'Weekly Vitamin D3 60000 IU sachets for correcting vitamin D deficiency. Pack of 4 sachets.',
    content: 'Vitamin D deficiency is extremely common in India, including in sunny cities like Coimbatore, because most people spend their days indoors.\n\nThese 60000 IU sachets are the standard weekly dose used to correct a diagnosed deficiency. They are usually taken once a week for a set number of weeks, then reviewed with a blood test.\n\nHave your levels checked before starting a high-dose course, and follow the schedule your doctor gives you.',
  },
  {
    name: 'Cetirizine 10mg Tablets (Strip of 10)', cat: 'cold-fever',
    brand: 'Generic', salt: 'Cetirizine Hydrochloride 10mg', price: 25, mrp: 32, stock: 150, rx: false,
    description: 'Cetirizine 10mg antihistamine tablets for allergy symptoms — sneezing, runny nose, itchy eyes and skin allergies.',
    content: 'Cetirizine is a second-generation antihistamine used for allergic rhinitis, hay fever, hives and itching.\n\nIt causes less drowsiness than older antihistamines, but it can still make some people sleepy — be careful driving until you know how it affects you.\n\nUsually taken once daily, ideally in the evening.',
  },
  {
    name: 'Digital Blood Glucose Monitor with 25 Strips', cat: 'diabetes-care',
    brand: 'Generic', salt: null, price: 899, mrp: 1250, stock: 25, rx: false,
    description: 'Compact digital glucometer kit with 25 test strips, lancing device and 25 lancets. For home blood sugar monitoring.',
    content: 'Regular home monitoring is one of the most useful things you can do to manage diabetes well, and it gives your doctor far better information than an occasional lab test.\n\nThis kit includes the meter, 25 test strips, a lancing device and 25 lancets — everything needed to start. Results appear in about five seconds.\n\nCome into the shop and our pharmacist will show you how to use it properly, free of charge.',
  },
  {
    name: 'Baby Gentle Cleansing Wipes (Pack of 72)', cat: 'baby-care',
    brand: 'Generic', salt: null, price: 199, mrp: 249, stock: 90, rx: false,
    description: 'Alcohol-free, fragrance-free baby wipes with aloe vera. Dermatologically tested for sensitive newborn skin. Pack of 72.',
    content: 'Thick, soft wipes for nappy changes and everyday cleaning, made without alcohol or added fragrance so they are gentle on newborn skin.\n\nThe resealable lid keeps the remaining wipes moist. Dermatologically and paediatrician tested.',
  },
  {
    name: 'Moisturising Lotion for Dry Skin 200ml', cat: 'personal-care',
    brand: 'Generic', salt: null, price: 320, mrp: 399, stock: 45, rx: false,
    description: 'Fragrance-free moisturising lotion for very dry and sensitive skin. Non-greasy, absorbs quickly, 200ml pump bottle.',
    content: 'A daily moisturiser for dry, tight or flaky skin, formulated without fragrance or parabens so it suits sensitive and eczema-prone skin.\n\nApply after a bath while the skin is still slightly damp — that traps the moisture and works noticeably better than applying to fully dry skin.',
  },
  {
    name: 'ORS Electrolyte Powder (Pack of 10 Sachets)', cat: 'cold-fever',
    brand: 'Generic', salt: 'Oral Rehydration Salts (WHO formula)', price: 90, mrp: 110, stock: 200, rx: false,
    description: 'WHO-formula oral rehydration salts for dehydration from diarrhoea, vomiting, heat or fever. Pack of 10 sachets.',
    content: 'ORS replaces the water and electrolytes the body loses during diarrhoea, vomiting, or heavy sweating in hot weather. It is one of the most effective and least expensive medicines there is.\n\nDissolve one sachet in the volume of clean water stated on the pack — no more, no less, as a stronger solution can make dehydration worse. Sip it steadily rather than drinking it all at once.\n\nFor a young child or an elderly person who cannot keep fluids down, seek medical help rather than managing at home.',
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  // No default credentials. A seeded "admin123" that nobody remembers to
  // change is how small sites get taken over.
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  }

  await db.user.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: {
      name: 'Genezenz Admin',
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 12),
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin ready: ${email}`);

  const catMap = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    catMap.set(c.slug, row.id);
  }
  console.log(`✓ ${CATEGORIES.length} categories`);

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 90);

  // Expiry demo data, relative to today so the dashboard always has something
  // to show: one already expired, one due within 30 days, the rest healthy.
  const addMonths = (m: number) => {
    const d = new Date(); d.setMonth(d.getMonth() + m); return d;
  };
  const expiryFor = (i: number) =>
    i === 3 ? addMonths(-1) : i === 7 ? addMonths(1) : addMonths(12 + i);

  for (const [i, p] of PRODUCTS.entries()) {
    const slug = slugify(p.name);
    // GST band: scheduled/generic medicines sit at 5%, everything else at 12%.
    const gstRate = p.salt ? 5 : 12;
    await db.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name, slug, description: p.description, content: p.content,
        price: p.price, mrp: p.mrp, stock: p.stock, brand: p.brand,
        saltName: p.salt, rxRequired: p.rx, published: true,
        categoryId: catMap.get(p.cat),
        gstRate,
        batchNo: `B${(1000 + i * 137).toString(36).toUpperCase()}`,
        expiryDate: expiryFor(i),
      },
    });
  }
  console.log(`✓ ${PRODUCTS.length} products`);
  console.log('\nSeed complete. Prices are placeholders — set real ones in /admin/products.');
}

main()
  .catch((e) => {
    console.error('\n✗', e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
