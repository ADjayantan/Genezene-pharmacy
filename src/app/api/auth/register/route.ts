import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: z.string().trim().email('Enter a valid email').max(120),
  // 8 chars minimum. The old site allowed 6, which is below current guidance
  // for an account that stores health information.
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{8,20}$/, 'Enter a valid phone number'),
});

export async function POST(req: Request) {
  const rl = rateLimit(`register:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ message: 'Too many sign-ups from this network. Try again later.' }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Invalid details', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, password, phone } = parsed.data;
  const lower = email.toLowerCase();

  if (await db.user.findUnique({ where: { email: lower } })) {
    return NextResponse.json({ message: 'That email is already registered. Try signing in.' }, { status: 409 });
  }

  // Hash exactly once, here. The old Express app hashed in the route AND in a
  // Mongoose pre-save hook, which double-hashed and broke every login.
  const user = await db.user.create({
    data: { name, email: lower, password: await bcrypt.hash(password, 12), phone, role: 'CUSTOMER' },
  });

  await createSession({ sub: user.id, email: user.email, role: 'CUSTOMER' });
  return NextResponse.json({ ok: true });
}
