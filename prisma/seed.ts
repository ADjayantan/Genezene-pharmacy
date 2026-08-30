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
  // ── Pain Relief ──────────────────────────────────────────────
  {
    name: 'Paracetamol 650mg Tablets (Strip of 15)', cat: 'pain-relief',
    brand: 'Generic', salt: 'Paracetamol 650mg', price: 30, mrp: 35, cost: 20, stock: 120, rx: false,
    description: 'Paracetamol 650mg tablets for the relief of fever and mild to moderate pain. Strip of 15 tablets, stored and dispensed under pharmacist supervision.',
    content: 'Paracetamol is one of the most widely used medicines for bringing down fever and easing everyday pain such as headache, toothache, body ache and period pain.\n\nWe stock it in the standard 650mg strength. Take it exactly as your doctor or the pack insert directs, and do not exceed the stated daily maximum. If fever persists beyond three days, see a doctor rather than continuing on your own.\n\nAvailable for same-day dispatch across Coimbatore.',
  },
  {
    name: 'Ibuprofen 400mg Tablets (Strip of 15)', cat: 'pain-relief',
    brand: 'Generic', salt: 'Ibuprofen 400mg', price: 42, mrp: 52, cost: 28, stock: 100, rx: false,
    description: 'Ibuprofen 400mg tablets — an anti-inflammatory painkiller for headache, back pain, muscle and joint pain, and period pain. Strip of 15.',
    content: 'Ibuprofen belongs to the group of medicines called NSAIDs. As well as relieving pain it reduces inflammation, which makes it useful for sprains, back pain, dental pain and painful periods.\n\nTake it with or just after food to protect your stomach, and use the lowest dose that works. If you have a history of stomach ulcers, asthma, kidney trouble or are pregnant, check with our pharmacist or your doctor before using it.',
  },
  {
    name: 'Diclofenac Pain Relief Gel 30g', cat: 'pain-relief',
    brand: 'Generic', salt: 'Diclofenac Diethylamine 1.16%', price: 95, mrp: 120, cost: 62, stock: 75, rx: false,
    description: 'Topical diclofenac gel for muscle, joint and back pain, sprains and strains. Fast-absorbing, 30g tube.',
    content: 'A pain-relieving gel you rub directly onto the sore area — handy for knee pain, a stiff neck, a sprained ankle or lower-back ache.\n\nApply a thin layer three to four times a day and wash your hands afterwards. Because it works mainly where you put it, it is a good option for people who prefer not to take painkillers by mouth. Do not use it on broken skin.',
  },
  // ── Diabetes Care ────────────────────────────────────────────
  {
    name: 'Metformin 500mg Tablets (Strip of 15)', cat: 'diabetes-care',
    brand: 'Generic', salt: 'Metformin Hydrochloride 500mg', price: 45, mrp: 55, cost: 30, stock: 80, rx: true,
    description: 'Metformin 500mg tablets, commonly prescribed for the management of type 2 diabetes. Prescription required — verified by our pharmacist before dispatch.',
    content: 'Metformin is a first-line medicine in the management of type 2 diabetes and is usually taken alongside diet and exercise changes.\n\nThis is a prescription-only medicine. Upload your prescription and one of our pharmacists will check the dosage and confirm availability before preparing your order. We never substitute a brand or strength without speaking to you first.\n\nIf you are already taking other diabetes medication, mention it when you order so our pharmacist can flag anything worth raising with your doctor.',
  },
  {
    name: 'Glimepiride 2mg Tablets (Strip of 10)', cat: 'diabetes-care',
    brand: 'Generic', salt: 'Glimepiride 2mg', price: 68, mrp: 85, cost: 44, stock: 60, rx: true,
    description: 'Glimepiride 2mg tablets for type 2 diabetes, often prescribed alongside metformin. Prescription required.',
    content: 'Glimepiride helps lower blood sugar by prompting the pancreas to release more insulin. It is frequently added when metformin alone is not enough.\n\nBecause it can lower blood sugar quite effectively, it can sometimes cause hypoglycaemia (a sugar low) — carry a quick sugar source and learn the warning signs. Take it with breakfast. This is a prescription-only medicine; our pharmacist verifies every order.',
  },
  {
    name: 'Digital Blood Glucose Monitor with 25 Strips', cat: 'diabetes-care',
    brand: 'Generic', salt: null, price: 899, mrp: 1250, cost: 620, stock: 25, rx: false,
    description: 'Compact digital glucometer kit with 25 test strips, lancing device and 25 lancets. For home blood sugar monitoring.',
    content: 'Regular home monitoring is one of the most useful things you can do to manage diabetes well, and it gives your doctor far better information than an occasional lab test.\n\nThis kit includes the meter, 25 test strips, a lancing device and 25 lancets — everything needed to start. Results appear in about five seconds.\n\nCome into the shop and our pharmacist will show you how to use it properly, free of charge.',
  },
  {
    name: 'Glucometer Test Strips (Pack of 50)', cat: 'diabetes-care',
    brand: 'Generic', salt: null, price: 780, mrp: 950, cost: 540, stock: 40, rx: false,
    description: 'Refill pack of 50 blood glucose test strips for home glucometers. Check compatibility with your meter model.',
    content: 'A refill pack of 50 strips for regular blood sugar testing at home. Running out of strips is the usual reason people stop monitoring, so it is worth keeping a spare pack.\n\nStrips are meter-specific — tell us your glucometer model when you order and we will confirm the right strips before dispatch. Store them in the sealed vial away from heat and humidity.',
  },
  // ── Vitamins & Supplements ───────────────────────────────────
  {
    name: 'Vitamin D3 60000 IU Sachets (Pack of 4)', cat: 'vitamins',
    brand: 'Generic', salt: 'Cholecalciferol 60000 IU', price: 180, mrp: 220, cost: 120, stock: 60, rx: false,
    description: 'Weekly Vitamin D3 60000 IU sachets for correcting vitamin D deficiency. Pack of 4 sachets.',
    content: 'Vitamin D deficiency is extremely common in India, including in sunny cities like Coimbatore, because most people spend their days indoors.\n\nThese 60000 IU sachets are the standard weekly dose used to correct a diagnosed deficiency. They are usually taken once a week for a set number of weeks, then reviewed with a blood test.\n\nHave your levels checked before starting a high-dose course, and follow the schedule your doctor gives you.',
  },
  {
    name: 'Vitamin C 500mg Chewable Tablets (Strip of 15)', cat: 'vitamins',
    brand: 'Generic', salt: 'Ascorbic Acid 500mg', price: 110, mrp: 140, cost: 72, stock: 130, rx: false,
    description: 'Chewable Vitamin C 500mg tablets to support immunity and skin health. Orange-flavoured, strip of 15.',
    content: 'Vitamin C supports the immune system, helps the body absorb iron, and plays a role in healthy skin and gums.\n\nThese chewable tablets are an easy daily option, especially during the cold and flu season. They are a supplement, not a cure — a balanced diet with fruit and vegetables is still the best source. Suitable for adults and older children.',
  },
  {
    name: 'Calcium + Vitamin D3 Tablets (Strip of 15)', cat: 'vitamins',
    brand: 'Generic', salt: 'Calcium Carbonate 500mg + Vitamin D3 250 IU', price: 145, mrp: 180, cost: 95, stock: 95, rx: false,
    description: 'Calcium with Vitamin D3 tablets for bone health, prescribed commonly for women, older adults and during pregnancy.',
    content: 'Calcium keeps bones and teeth strong, and Vitamin D3 helps the body actually absorb that calcium — which is why the two are combined.\n\nThis is a common daily supplement for older adults, post-menopausal women and during pregnancy on a doctor’s advice. Take it with water after a meal for best absorption, and space it apart from iron tablets if you take those too.',
  },
  {
    name: 'Daily Multivitamin Tablets (Bottle of 30)', cat: 'vitamins',
    brand: 'Generic', salt: 'Multivitamin & Multimineral', price: 260, mrp: 320, cost: 170, stock: 85, rx: false,
    description: 'Once-daily multivitamin and multimineral tablets covering everyday nutritional gaps. Bottle of 30.',
    content: 'A once-a-day multivitamin covering the vitamins and minerals most people fall short on — useful during recovery, busy periods, or when meals are irregular.\n\nIt is a top-up, not a replacement for food. Take one tablet a day with water after breakfast. If you are pregnant or on regular medication, check with our pharmacist first, as some vitamins interact with certain medicines.',
  },
  {
    name: 'Iron + Folic Acid Tablets (Strip of 15)', cat: 'vitamins',
    brand: 'Generic', salt: 'Ferrous Ascorbate 100mg + Folic Acid 1.5mg', price: 85, mrp: 105, cost: 55, stock: 110, rx: false,
    description: 'Iron with folic acid tablets for iron-deficiency anaemia and during pregnancy. Strip of 15.',
    content: 'Iron-deficiency anaemia is very common, especially in women, and shows up as tiredness, breathlessness and pale skin. Iron with folic acid is the standard treatment, and folic acid is also important in pregnancy.\n\nTake it on an empty stomach if you can tolerate it, or with food if it upsets your stomach. Vitamin C helps absorption, while tea and calcium reduce it. Do not be alarmed if it darkens your stools — that is normal.',
  },
  // ── Cold & Fever ─────────────────────────────────────────────
  {
    name: 'Cetirizine 10mg Tablets (Strip of 10)', cat: 'cold-fever',
    brand: 'Generic', salt: 'Cetirizine Hydrochloride 10mg', price: 25, mrp: 32, cost: 16, stock: 150, rx: false,
    description: 'Cetirizine 10mg antihistamine tablets for allergy symptoms — sneezing, runny nose, itchy eyes and skin allergies.',
    content: 'Cetirizine is a second-generation antihistamine used for allergic rhinitis, hay fever, hives and itching.\n\nIt causes less drowsiness than older antihistamines, but it can still make some people sleepy — be careful driving until you know how it affects you.\n\nUsually taken once daily, ideally in the evening.',
  },
  {
    name: 'ORS Electrolyte Powder (Pack of 10 Sachets)', cat: 'cold-fever',
    brand: 'Generic', salt: 'Oral Rehydration Salts (WHO formula)', price: 90, mrp: 110, cost: 58, stock: 200, rx: false,
    description: 'WHO-formula oral rehydration salts for dehydration from diarrhoea, vomiting, heat or fever. Pack of 10 sachets.',
    content: 'ORS replaces the water and electrolytes the body loses during diarrhoea, vomiting, or heavy sweating in hot weather. It is one of the most effective and least expensive medicines there is.\n\nDissolve one sachet in the volume of clean water stated on the pack — no more, no less, as a stronger solution can make dehydration worse. Sip it steadily rather than drinking it all at once.\n\nFor a young child or an elderly person who cannot keep fluids down, seek medical help rather than managing at home.',
  },
  {
    name: 'Cough Syrup 100ml (Dry & Wet Cough)', cat: 'cold-fever',
    brand: 'Generic', salt: 'Dextromethorphan + Chlorpheniramine', price: 105, mrp: 130, cost: 68, stock: 90, rx: false,
    description: 'Soothing cough syrup for dry and allergic cough with cold. 100ml bottle.',
    content: 'A cough syrup for a troublesome dry or allergic cough, especially the kind that keeps you up at night. It calms the cough reflex and eases an accompanying runny nose.\n\nIt can cause drowsiness, so avoid driving after taking it and do not combine it with other sedatives. Use the measuring cup provided and stick to the stated dose. If a cough lasts more than a week or comes with high fever or breathlessness, see a doctor.',
  },
  {
    name: 'Azithromycin 500mg Tablets (Strip of 5)', cat: 'cold-fever',
    brand: 'Generic', salt: 'Azithromycin 500mg', price: 78, mrp: 98, cost: 50, stock: 70, rx: true,
    description: 'Azithromycin 500mg antibiotic tablets for bacterial infections of the chest, throat and skin. Prescription required.',
    content: 'Azithromycin is a widely used antibiotic for certain chest, throat, sinus and skin infections. It is typically a short three-to-five day course.\n\nAntibiotics only work against bacterial infections, not colds or flu, and must be taken exactly as prescribed — finish the full course even if you feel better, to avoid resistance. This is a prescription-only medicine; our pharmacist verifies your prescription before dispatch.',
  },
  // ── Personal Care ────────────────────────────────────────────
  {
    name: 'Moisturising Lotion for Dry Skin 200ml', cat: 'personal-care',
    brand: 'Generic', salt: null, price: 320, mrp: 399, cost: 210, stock: 45, rx: false,
    description: 'Fragrance-free moisturising lotion for very dry and sensitive skin. Non-greasy, absorbs quickly, 200ml pump bottle.',
    content: 'A daily moisturiser for dry, tight or flaky skin, formulated without fragrance or parabens so it suits sensitive and eczema-prone skin.\n\nApply after a bath while the skin is still slightly damp — that traps the moisture and works noticeably better than applying to fully dry skin.',
  },
  {
    name: 'Antiseptic Disinfectant Liquid 500ml', cat: 'personal-care',
    brand: 'Generic', salt: 'Chloroxylenol 4.8%', price: 199, mrp: 245, cost: 130, stock: 80, rx: false,
    description: 'Multi-purpose antiseptic disinfectant liquid for first aid, personal hygiene and household surfaces. 500ml.',
    content: 'A concentrated antiseptic for cleaning minor cuts and grazes, for personal hygiene, and for disinfecting floors and surfaces at home.\n\nAlways dilute it as directed on the label — it is far too strong to use neat on skin. For a wound, a mild diluted solution is enough; for mopping, use the household dilution. Keep it well out of reach of children.',
  },
  // ── Baby Care ────────────────────────────────────────────────
  {
    name: 'Baby Gentle Cleansing Wipes (Pack of 72)', cat: 'baby-care',
    brand: 'Generic', salt: null, price: 199, mrp: 249, cost: 130, stock: 90, rx: false,
    description: 'Alcohol-free, fragrance-free baby wipes with aloe vera. Dermatologically tested for sensitive newborn skin. Pack of 72.',
    content: 'Thick, soft wipes for nappy changes and everyday cleaning, made without alcohol or added fragrance so they are gentle on newborn skin.\n\nThe resealable lid keeps the remaining wipes moist. Dermatologically and paediatrician tested.',
  },
  {
    name: 'Baby Diapers Medium (Pack of 40)', cat: 'baby-care',
    brand: 'Generic', salt: null, price: 649, mrp: 799, cost: 440, stock: 55, rx: false,
    description: 'Soft, breathable medium-size baby diapers with up to 12-hour absorption and a wetness indicator. Pack of 40, for 7–12 kg.',
    content: 'Comfortable, breathable diapers sized Medium for babies roughly 7 to 12 kg. The absorbent core locks away wetness for up to 12 hours to help your baby sleep through the night.\n\nA wetness indicator line changes colour when it is time for a change. The soft elastic waist and leak guards keep things comfortable without leaving marks. Change promptly to help prevent nappy rash.',
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
      update: {
        name: p.name, description: p.description, content: p.content,
        price: p.price, mrp: p.mrp, costPrice: p.cost, stock: p.stock, brand: p.brand,
        saltName: p.salt, rxRequired: p.rx, published: true,
        categoryId: catMap.get(p.cat),
        gstRate,
        batchNo: `B${(1000 + i * 137).toString(36).toUpperCase()}`,
        expiryDate: expiryFor(i),
      },
      create: {
        name: p.name, slug, description: p.description, content: p.content,
        price: p.price, mrp: p.mrp, costPrice: p.cost, stock: p.stock, brand: p.brand,
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
