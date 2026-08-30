import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{8,20}$/, 'Enter a valid phone number'),
  email: z.string().trim().email().max(120).optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional(),
  // Honeypot: real users never fill a hidden field. Kills most form spam
  // without inflicting a CAPTCHA on genuine customers.
  website: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`lead:${ip}`, 5, 10 * 60 * 1000); // 5 per 10 min
  if (!rl.ok) {
    return NextResponse.json(
      { message: 'Too many submissions. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Please check your details', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { website, ...data } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // silently drop bots

  await db.lead.create({
    data: {
      source: 'WEBSITE',
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      message: data.message || null,
    },
  });

  return NextResponse.json({ ok: true, message: "Thanks! We'll call you back shortly." });
}
