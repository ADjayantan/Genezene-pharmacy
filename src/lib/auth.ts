import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

const COOKIE = 'mp_session';
const MAX_AGE = 60 * 60 * 8; // 8 hours — admin sessions should be short

function secret() {
  const s = process.env.AUTH_SECRET;
  // Refuse to run with a guessable secret. A hardcoded fallback here is how
  // "anyone can forge an admin token" bugs ship to production.
  if (!s || s.length < 32) {
    throw new Error('AUTH_SECRET missing or too short (need 32+ chars). Run: openssl rand -base64 48');
  }
  return new TextEncoder().encode(s);
}

export type Session = { sub: string; email: string; role: 'ADMIN' | 'CUSTOMER' };

export async function createSession(payload: Session) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,                                   // JS can't read it → XSS can't steal it
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',                                  // blocks CSRF on cross-site POSTs
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** cache() dedupes this across a single request's component tree. */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { sub: String(payload.sub), email: String(payload.email), role: payload.role as Session['role'] };
  } catch {
    return null;
  }
});

/**
 * Guard for admin pages AND server actions.
 *
 * Server Actions are ordinary public HTTP endpoints — the fact that a button
 * only renders for admins proves nothing about who can POST to it. Every
 * action must call this itself.
 */
export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') redirect('/admin/login');
  return s;
}

export async function requireUser(next = '/profile'): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  return s;
}
