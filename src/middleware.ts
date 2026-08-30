import { NextResponse, type NextRequest } from 'next/server';

/**
 * Passes the current path to Server Components via a header, so the admin
 * layout can tell "/admin/login" apart from the pages it must guard.
 */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set('x-pathname', req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
