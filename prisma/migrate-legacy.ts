/**
 * Migrate the legacy MedPlus/Genezenz catalogue (MongoDB via the old Express
 * API) into Postgres.
 *
 *   npx tsx prisma/migrate-legacy.ts              # dry run — reports, writes nothing
 *   npx tsx prisma/migrate-legacy.ts --write      # actually import
 *   npx tsx prisma/migrate-legacy.ts --write --fix-images
 *
 * --fix-images additionally searches Wikimedia Commons for a genuine,
 * freely-licensed photo of each medicine whose original image is broken.
 *
 * Safe to re-run: products are upserted on slug.
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const LEGACY_API = process.env.LEGACY_API || 'https://medplus-lkr7.onrender.com';
const WRITE = process.argv.includes('--write');
const FIX_IMAGES = process.argv.includes('--fix-images');

type Legacy = {
  _id: string; name: string; price: number; mrp?: number; category: string;
  description: string; image?: string; stock: number;
  requiresPrescription?: boolean; manufacturer?: string; tags?: string[];
  // `rating` and `reviews` exist on the old records but are NOT migrated.
  // They are unverifiable self-reported numbers; publishing them as review
  // data on a licensed pharmacy site is a Google penalty risk and, more
  // importantly, a claim the client cannot substantiate.
};

/**
 * Hosts we must not hotlink from. These are competitors' and third parties'
 * CDNs — using their product photography is copyright infringement, and they
 * can rate-limit or swap the file at any time, silently breaking the shop.
 */
const FORBIDDEN_HOSTS = [
  'onemg.gumlet.io',      // Tata 1mg
  'cdn01.pharmeasy.in',   // PharmEasy
  'practostatic.com',     // Practo
  'imimg.com',            // IndiaMART seller uploads
  'netmeds.com',
  'apollopharmacy.in',
  'canva.link',           // share link, expires
];

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);

async function urlWorks(url?: string): Promise<boolean> {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    if (FORBIDDEN_HOSTS.some((h) => host.endsWith(h) || host.includes(h))) return false;

    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!res.ok) return false;
    return (res.headers.get('content-type') ?? '').startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Red flags in a Commons filename. A loose keyword search returns things like
 * "RECALLED – Lubricant Eye Drops" and rat-cornea research photos — measurably
 * worse on a pharmacy product page than an honest placeholder.
 */
const BAD_TITLE =
  /recall|withdraw|counterfeit|\brat\b|mouse|mice|microscop|histolog|structure|molecul|chemical|skeletal|crystal|synthesis|formula|graph|chart|logo|poster|protest|overdose|abuse/i;

/** "Amlodipine 5mg" → "Amlodipine" */
const baseName = (n: string) => (n.match(/^([A-Za-z][A-Za-z-]{4,})/) ?? [])[1] ?? '';

/**
 * Look for a real, freely-licensed image on Wikimedia Commons.
 * Commons content is CC/public-domain, so this is legitimate — unlike
 * hotlinking a competitor's product photography.
 *
 * Matching is deliberately STRICT: the drug's name must actually appear in
 * the filename. Loose matching recovered ~30% of images but a third of those
 * were wrong, and a wrong photo on a medicine page is worse than none.
 * Strict matching recovers fewer, but everything it returns is correct.
 */
async function findCommonsImage(term: string, base: string): Promise<string | null> {
  if (!base) return null;
  try {
    const u = new URL('https://commons.wikimedia.org/w/api.php');
    u.searchParams.set('action', 'query');
    u.searchParams.set('generator', 'search');
    u.searchParams.set('gsrsearch', `filetype:bitmap ${term}`);
    u.searchParams.set('gsrlimit', '6');
    u.searchParams.set('gsrnamespace', '6'); // File:
    u.searchParams.set('prop', 'imageinfo');
    u.searchParams.set('iiprop', 'url');
    u.searchParams.set('iiurlwidth', '600');
    u.searchParams.set('format', 'json');

    const res = await fetch(u.toString(), {
      headers: { 'User-Agent': 'GenezenzPharmacy/1.0 (catalogue migration)' },
    });
    if (!res.ok) return null;

    const json: any = await res.json();
    const pages = json?.query?.pages;
    if (!pages) return null;

    for (const page of Object.values<any>(pages)) {
      const title = String(page?.title ?? '').replace(/^File:/, '');
      const info = page?.imageinfo?.[0];
      if (!info) continue;
      if (!title.toLowerCase().includes(base.toLowerCase())) continue;
      if (BAD_TITLE.test(title)) continue;
      return info.thumburl ?? info.url;
    }
    return null;
  } catch {
    return null;
  }
}

/** Normalise the old free-text tags — they drive product similarity. */
function cleanTags(tags?: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  return [...new Set(
    tags.map((t) => String(t).toLowerCase().trim()).filter((t) => t.length > 1 && t.length < 60),
  )].slice(0, 25);
}

/** Pull the strength/salt out of a name like "Amlodipine 5mg". */
function guessSalt(name: string): string | null {
  const m = name.match(/^([A-Za-z][A-Za-z\s+.'-]*?)\s*(\d+\s*(?:mg|mcg|ml|g|IU|%)[^()]*)/i);
  if (m) return `${m[1].trim()} ${m[2].trim()}`;
  return null;
}

async function main() {
  console.log(`\nSource: ${LEGACY_API}/api/products`);
  console.log(WRITE ? 'Mode: WRITE\n' : 'Mode: DRY RUN (add --write to import)\n');

  const res = await fetch(`${LEGACY_API}/api/products?limit=2000`);
  if (!res.ok) throw new Error(`Legacy API returned ${res.status}. Is the Render service awake?`);

  const payload: any = await res.json();
  const items: Legacy[] = payload.products ?? payload;
  console.log(`Fetched ${items.length} products.\n`);

  // ── Categories ────────────────────────────────────────
  const names = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const catId = new Map<string, string>();

  for (const name of names) {
    const slug = slugify(name);
    if (WRITE) {
      const row = await db.category.upsert({
        where: { slug },
        update: { name },
        create: { name, slug },
      });
      catId.set(name, row.id);
    }
  }
  console.log(`Categories: ${names.length} — ${names.join(', ')}\n`);

  // ── Images ────────────────────────────────────────────
  console.log('Checking images…');
  const report = { kept: 0, forbidden: 0, broken: 0, recovered: 0, none: 0 };
  const needsImage: string[] = [];
  const imageFor = new Map<string, string | null>();

  for (const it of items) {
    let url: string | null = null;
    const host = (() => { try { return new URL(it.image!).hostname } catch { return '' } })();

    if (!it.image) {
      report.none++;
    } else if (FORBIDDEN_HOSTS.some((h) => host.endsWith(h) || host.includes(h))) {
      report.forbidden++;
    } else if (await urlWorks(it.image)) {
      url = it.image;
      report.kept++;
    } else {
      report.broken++;
    }

    if (!url && FIX_IMAGES) {
      const term = guessSalt(it.name) ?? it.name.replace(/\(.*?\)/g, '').trim();
      const found = await findCommonsImage(term, baseName(it.name));
      if (found) {
        url = found;
        report.recovered++;
      }
      await new Promise((r) => setTimeout(r, 250)); // be polite to the Commons API
    }

    if (!url) needsImage.push(it.name);
    imageFor.set(it._id, url);
  }

  console.log(
    `  kept ${report.kept} · broken ${report.broken} · third-party/blocked ${report.forbidden} · ` +
    `missing ${report.none}${FIX_IMAGES ? ` · recovered ${report.recovered}` : ''}\n`,
  );

  // ── Products ──────────────────────────────────────────
  let created = 0;
  const seen = new Set<string>();

  for (const it of items) {
    let slug = slugify(it.name);
    // The old data has duplicate names; slug is the URL so it must be unique.
    let n = 1;
    while (seen.has(slug)) slug = `${slugify(it.name)}-${++n}`;
    seen.add(slug);

    if (!WRITE) { created++; continue; }

    await db.product.upsert({
      where: { slug },
      update: {
        name: it.name,
        description: it.description,
        price: it.price,
        mrp: it.mrp ?? null,
        stock: it.stock ?? 0,
        brand: it.manufacturer ?? null,
        saltName: guessSalt(it.name),
        rxRequired: Boolean(it.requiresPrescription),
        tags: cleanTags(it.tags),
        imageUrl: imageFor.get(it._id) ?? null,
        categoryId: catId.get(it.category) ?? null,
      },
      create: {
        name: it.name,
        slug,
        description: it.description,
        price: it.price,
        mrp: it.mrp ?? null,
        stock: it.stock ?? 0,
        brand: it.manufacturer ?? null,
        saltName: guessSalt(it.name),
        rxRequired: Boolean(it.requiresPrescription),
        tags: cleanTags(it.tags),
        imageUrl: imageFor.get(it._id) ?? null,
        categoryId: catId.get(it.category) ?? null,
        published: true,
      },
    });
    created++;
  }

  console.log(`Products ${WRITE ? 'imported' : 'would import'}: ${created}\n`);

  if (needsImage.length) {
    console.log(`── ${needsImage.length} products still have NO usable image ──`);
    console.log('These render with a pill placeholder. That is honest and tidy, but a');
    console.log('catalogue of placeholders will not convert well — real photos matter here.');
    console.log('Ask the client to photograph the packs, or use the manufacturer’s own');
    console.log('press/media assets. Do NOT copy images from 1mg, PharmEasy or Netmeds:');
    console.log('that is their copyright, and they can block or swap the file at any time.\n');
    needsImage.slice(0, 40).forEach((n) => console.log('  •', n));
    if (needsImage.length > 40) console.log(`  … and ${needsImage.length - 40} more`);
    console.log();
  }

  if (!WRITE) console.log('Nothing was written. Re-run with --write to import.\n');
}

main()
  .catch((e) => { console.error('\n✗', e.message); process.exit(1); })
  .finally(() => db.$disconnect());
