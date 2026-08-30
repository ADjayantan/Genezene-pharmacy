import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getFile } from '@/lib/storage';

export const runtime = 'nodejs';

/**
 * The ONLY way to read a prescription file. Ownership is checked on every
 * request — a prescription is medical data, so "unguessable URL" is not
 * an access control mechanism.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const rx = await db.prescription.findUnique({ where: { id } });
  if (!rx) return new Response('Not found', { status: 404 });

  if (rx.userId !== session.sub && session.role !== 'ADMIN') {
    // 404, not 403 — don't confirm that this id exists to someone who
    // isn't allowed to see it.
    return new Response('Not found', { status: 404 });
  }

  const buf = await getFile(rx.storageKey);
  if (!buf) return new Response('File missing', { status: 404 });

  // The filename comes from the uploader's device, so it is untrusted input
  // going into a response header. Stripping only quotes is not enough — a CR
  // or LF would let the uploader inject additional headers. Reduce it to a
  // conservative charset and cap the length.
  const safeName =
    (rx.originalName || 'prescription')
      .replace(/[^\w.\- ]+/g, '_')
      .slice(0, 80) || 'prescription';

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': rx.mimeType,
      'Content-Disposition': `inline; filename="${safeName}"`,
      // Private: must never be stored by a CDN or shared proxy cache.
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      // Even if something slipped past the sniffer, this stops it executing.
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; object-src 'none'; sandbox",
    },
  });
}
