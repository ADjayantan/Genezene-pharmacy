import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Who is signed in, for the header only.
 *
 * The header used to read the session on the server, inside the root layout.
 * That called cookies(), which opts EVERY route using that layout into dynamic
 * rendering — including the eight local-area pages that exist specifically to
 * be static HTML with instant TTFB. One convenience call in the layout quietly
 * cost the whole site its static generation.
 *
 * So the header now asks after hydration instead. Public pages stay static and
 * fully cacheable; the account link fills in a moment later, which nobody
 * notices and no crawler cares about.
 *
 * Deliberately minimal: role and a display name, nothing else. This endpoint is
 * reachable by anyone, so it must never become a way to read profile data.
 */
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ signedIn: false }, { headers: { 'Cache-Control': 'private, no-store' } });

  return NextResponse.json(
    { signedIn: true, role: s.role },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
