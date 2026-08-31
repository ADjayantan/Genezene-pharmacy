import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { site } from '@/lib/config';
import { SidebarNav } from '@/components/admin/SidebarNav';

import { MobileSidebar } from '@/components/admin/MobileSidebar';

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get('x-pathname') ?? '';
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    if (!path.includes('/admin/login')) redirect('/admin/login');
    return <div className="admin-scope min-h-screen">{children}</div>;
  }

  return (
    <div className="admin-scope flex min-h-screen bg-paper">
      {/* Sidebar - fixed width */}
      <aside className="w-[260px] flex-shrink-0 fixed inset-y-0 left-0 z-10 hidden md:block">
        <SidebarNav />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        {/* Top Header for mobile toggle / user info */}
        <header className="flex h-[60px] items-center justify-between px-6 md:justify-end md:px-8 border-b border-paper-edge bg-paper print:hidden">
          <MobileSidebar />
          <div className="flex items-center gap-4">
            <span className="mono text-[0.7rem] text-ink">{session.email}</span>
            <form action="/api/auth/logout" method="post">
              <button className="mono rounded-[3px] border border-paper-edge px-3 py-1.5 text-[0.66rem] uppercase tracking-[0.08em] text-ink hover:bg-paper-deep hover:text-out transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="flex-1 px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10 max-w-6xl w-full">
          {children}
        </div>

        <footer className="mono border-t border-paper-edge py-6 text-center text-[0.66rem] uppercase tracking-[0.08em] text-ink-soft mt-auto">
          {site.name} back office · not indexed · {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}
