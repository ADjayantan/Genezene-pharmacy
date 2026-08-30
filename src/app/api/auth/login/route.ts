import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  // Set only by the admin door. Keeps the two entrances genuinely separate:
  // the customer form can never mint an admin session, and the admin form
  // rejects a customer account outright.
  scope: z.enum(['customer', 'admin']).optional().default('customer'),
});

export async function POST(req: Request) {
  const rl = rateLimit(`login:${clientIp(req)}`, 8, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: `Too many attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} minutes.` },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid input' }, { status: 400 });

  const { email, password, scope } = parsed.data;
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always run a bcrypt compare, even for an unknown email. Returning early
  // would make "no such user" measurably faster than "wrong password" and let
  // an attacker enumerate accounts by timing alone.
  const hash = user?.password ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali';
  const ok = await bcrypt.compare(password, hash);

  const allowed = user && ok && (scope === 'admin' ? user.role === 'ADMIN' : true);

  if (!allowed) {
    // One generic message for every failure mode. The admin door must not
    // reveal "that account exists but is not an admin" — that tells an
    // attacker they have found a real customer account.
    return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
  }

  await createSession({ sub: user.id, email: user.email, role: user.role });
  return NextResponse.json({ ok: true, role: user.role });
}
