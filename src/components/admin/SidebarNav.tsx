'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';

const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/prescriptions', label: 'Prescriptions' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/leads', label: 'Leads' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-paper-deep border-r border-paper-edge print:hidden">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-paper-edge">
        <Logo size={28} />
        <span className="mono text-[0.75rem] uppercase tracking-[0.16em] font-semibold text-ink">
          Back Office
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {NAV.map((n) => {
          const isActive = n.exact 
            ? pathname === n.href 
            : pathname.startsWith(n.href);

          return (
            <Link 
              key={n.href} 
              href={n.href}
              className={`block px-4 py-2.5 rounded-[4px] text-[0.87rem] font-medium transition-colors ${
                isActive 
                  ? 'bg-green/10 text-green' 
                  : 'text-ink hover:bg-paper-edge hover:text-ink'
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-6 border-t border-paper-edge space-y-3">
        <Link
          href="/admin/products/new"
          className="block w-full text-center rounded-[4px] bg-green px-4 py-2 text-[0.8rem] font-semibold text-white hover:bg-green/90 transition-colors"
        >
          + Add Product
        </Link>
        <Link
          href="/"
          className="block w-full text-center rounded-[4px] border border-paper-edge bg-paper px-4 py-2 text-[0.8rem] font-medium text-ink hover:bg-paper-deep transition-colors"
        >
          View Shop ↗
        </Link>
      </div>
    </div>
  );
}
