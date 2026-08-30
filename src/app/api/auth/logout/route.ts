import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  await destroySession();

  // The admin bar signs out with a plain <form method="post">, so it works
  // without JavaScript. A browser form navigation sends Accept: text/html —
  // answer that with a redirect rather than a JSON blob on screen.
  if ((req.headers.get('accept') ?? '').includes('text/html')) {
    return NextResponse.redirect(new URL('/', req.url), { status: 303 });
  }
  return NextResponse.json({ ok: true });
}
