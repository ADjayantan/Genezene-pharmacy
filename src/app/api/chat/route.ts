import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { site, fullAddress } from '@/lib/config';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({ message: z.string().trim().min(1).max(500) });

/**
 * Pharmacy assistant.
 *
 * Deliberately answers only SHOP questions — hours, delivery, how to order,
 * stock and price lookups. It never gives dosage, interaction or "what should
 * I take" advice, and it never diagnoses.
 *
 * That restraint is a product decision, not a limitation: an unsupervised bot
 * handing out dosing advice on a licensed pharmacy's own website is a
 * regulatory and liability problem the client does not want.
 */

type Reply = { text: string; links?: { label: string; href: string }[] };

const HELP_TOPICS: { match: RegExp; reply: () => Reply }[] = [
  {
    match: /\b(hour|open|clos|timing|time)/i,
    reply: () => ({
      text: `We're open Monday to Saturday, 9:00 AM to 8:00 PM. You can order on the website any time and we'll process it the next working morning.`,
      links: [{ label: 'Contact us', href: '/contact' }],
    }),
  },
  {
    match: /\b(deliver|shipping|courier|how long|when will)/i,
    reply: () => ({
      text: `We deliver across Coimbatore. Orders placed before ${site.offers.dispatchCutoff} are dispatched the same day. Delivery is free above ₹${site.offers.freeDeliveryAbove}, otherwise ₹49.`,
      links: [{ label: 'Browse medicines', href: '/products' }],
    }),
  },
  {
    match: /\b(prescription|rx|doctor'?s? note|upload)/i,
    reply: () => ({
      text: `For prescription medicines, upload a clear photo or PDF of your prescription. A licensed pharmacist reviews it, confirms availability, and prepares your order before dispatch.`,
      links: [{ label: 'Upload prescription', href: '/upload-prescription' }],
    }),
  },
  {
    match: /\b(address|location|where|shop|store|visit|direction)/i,
    reply: () => ({
      text: `We're at ${fullAddress()}. Open Mon–Sat, 9 AM – 8 PM. Call ${site.phoneDisplay} if you need directions.`,
      links: [{ label: 'Contact & map', href: '/contact' }],
    }),
  },
  {
    match: /\b(offer|discount|coupon|code|promo|cheap)/i,
    reply: () => ({
      text: `Use ${site.offers.firstOrderCode} for 10% off your first order, or ${site.offers.signupCode} for ₹50 off orders above ₹299. Delivery is free above ₹${site.offers.freeDeliveryAbove}.`,
      links: [{ label: 'Shop now', href: '/products' }],
    }),
  },
  {
    match: /\b(return|refund|cancel|exchange)/i,
    reply: () => ({
      text: `Returns are accepted within 7 days for unopened items in original packaging. For anything temperature-sensitive or already opened, call us on ${site.phoneDisplay} first and we'll sort it out.`,
    }),
  },
  {
    match: /\b(insurance|claim|reimburse|gst|invoice|bill)/i,
    reply: () => ({
      text: `We issue GST invoices with our GSTIN and drug licence number — that's what insurers ask for. Mention it when ordering.`,
      links: [{ label: 'Talk to us', href: '/contact' }],
    }),
  },
  {
    match: /\b(track|my order|order status)\b/i,
    reply: () => ({
      text: `You can see every order and its status in your account.`,
      links: [{ label: 'My orders', href: '/profile' }],
    }),
  },
];

// Anything that sounds like a request for medical advice gets redirected
// to a human pharmacist. This list is intentionally broad.
const MEDICAL = /\b(dose|dosage|how (much|many)|mg\b|should i take|safe to take|side ?effect|interact|pregnan|breastfeed|overdose|instead of|substitute|diagnos|symptom|treat|cure|prescribe for me)\b/i;

export async function POST(req: Request) {
  const rl = rateLimit(`chat:${clientIp(req)}`, 30, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ text: 'You’re sending messages quite fast — give me a moment.' }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ text: 'Sorry, I didn’t catch that.' }, { status: 400 });

  const msg = parsed.data.message;

  if (MEDICAL.test(msg)) {
    return NextResponse.json({
      text: `That's a question for a pharmacist rather than me — dosage and interactions depend on your prescription and your medical history, and I'm not able to advise on them. Please call us on ${site.phoneDisplay} (Mon–Sat, 9 AM – 8 PM) and one of our pharmacists will help you properly.`,
      links: [{ label: 'Contact a pharmacist', href: '/contact' }],
    } satisfies Reply);
  }

  for (const t of HELP_TOPICS) {
    if (t.match.test(msg)) return NextResponse.json(t.reply());
  }

  // Fall through to a product lookup — "do you have dolo 650" is the
  // single most common thing people type into a pharmacy chat.
  const term = msg.replace(/\b(do you (have|stock)|is|are|available|price of|cost of|got|any)\b/gi, '').trim();
  if (term.length >= 3) {
    const found = await db.product
      .findMany({
        where: {
          published: true,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { saltName: { contains: term, mode: 'insensitive' } },
            { brand: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 4,
        orderBy: { stock: 'desc' },
      })
      .catch(() => []);

    if (found.length) {
      return NextResponse.json({
        text: `Here's what we have matching “${term}”:`,
        links: found.map((p) => ({
          label: `${p.name} — ₹${Number(p.price).toFixed(2)}${p.stock <= 0 ? ' (out of stock)' : ''}`,
          href: `/products/${p.slug}`,
        })),
      } satisfies Reply);
    }
  }

  return NextResponse.json({
    text: `I couldn't find that one. I can help with delivery, opening hours, offers, prescriptions and stock checks — or call us on ${site.phoneDisplay} and a pharmacist will help directly.`,
    links: [
      { label: 'Browse all medicines', href: '/products' },
      { label: 'Talk to us', href: '/contact' },
    ],
  } satisfies Reply);
}
