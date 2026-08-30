import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { site } from '@/lib/config';

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/* Not a section menu — the dashboard holds everything. This is a way back
   from the product editor, and the old per-section routes still resolve for
   deep links and bookmarks. */
const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'All products' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // middleware sets x-pathname (set, not appended — a client cannot forge it),
  // so the guard can tell /admin/login apart from the pages it must protect.
  const path = (await headers()).get('x-pathname') ?? '';
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    if (!path.includes('/admin/login')) redirect('/admin/login');
    return <div className="admin-scope min-h-screen">{children}</div>;
  }

  return (
    <div className="admin-scope min-h-screen">
      {/* A dark chrome bar you cannot mistake for the shop. The point is that
          a glance tells you which side of the business you are looking at.
          Hidden when printing so an invoice comes out as a clean white sheet. */}
      <div className="bg-ink text-paper print:hidden">
        <div className="container-x flex flex-col sm:flex-row sm:h-auto min-h-[3.5rem] items-start sm:items-center justify-between gap-y-3 py-3 sm:py-0">
          {/* Top Row on Mobile: Logo + Actions */}
          <div className="flex w-full sm:w-auto items-center justify-between gap-4">
            <span className="flex items-center gap-2.5">
              <Logo size={24} />
              <span className="mono text-[0.68rem] uppercase tracking-[0.16em] opacity-90">
                Back office
              </span>
            </span>

            {/* Actions (Shop & Sign out) - right aligned on mobile */}
            <div className="flex items-center gap-3 sm:hidden">
              <Link
                href="/"
                className="mono text-[0.66rem] uppercase tracking-[0.1em] opacity-60 transition-opacity hover:opacity-100"
              >
                Shop ↗
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="mono rounded-[3px] border border-paper/30 px-2 py-1 text-[0.66rem] uppercase tracking-[0.08em] opacity-80 transition-opacity hover:opacity-100">
                  Sign out
                </button>
              </form>
            </div>
          </div>

          {/* Nav Links - bottom row on mobile, inline on desktop */}
          <nav aria-label="Admin" className="flex items-center gap-4 text-[0.82rem] w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="opacity-70 transition-opacity hover:opacity-100 whitespace-nowrap">
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/"
              className="mono text-[0.66rem] uppercase tracking-[0.1em] opacity-60 transition-opacity hover:opacity-100"
            >
              Shop ↗
            </Link>
            <span className="mono text-[0.66rem] opacity-50">{session.email}</span>
            <form action="/api/auth/logout" method="post">
              <button className="mono rounded-[3px] border border-paper/30 px-3 py-1 text-[0.66rem] uppercase tracking-[0.08em] opacity-80 transition-opacity hover:opacity-100">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container-x py-8 pb-24">{children}</div>

      <footer className="mono border-t border-paper-edge py-5 text-center text-[0.66rem] uppercase tracking-[0.08em] text-ink-soft">
        {site.name} back office · not indexed · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
