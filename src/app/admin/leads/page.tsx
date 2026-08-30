import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { whatsappLink } from '@/lib/config';
import { LeadStatusSelect } from './LeadStatusSelect';
import { RuleLabel } from '@/components/ui';
import type { LeadSource, LeadStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/* Distinct tint per channel so the eye can scan the column without
   reading it. Density matters more than decoration here — a pharmacist
   working through the morning's leads wants rows, not padding. */
const SOURCE: Record<LeadSource, string> = {
  FACEBOOK:  'bg-[#E7EDF7] text-[#2B4C7E] dark:bg-[#1B2A3F] dark:text-[#A9C4E8]',
  INSTAGRAM: 'bg-[#F7E9EF] text-[#8E3A5E] dark:bg-[#33202A] dark:text-[#E5A8C4]',
  WHATSAPP:  'bg-[#E6F2E9] text-[#1E6B3A] dark:bg-[#16301F] dark:text-[#8FD3A8]',
  WEBSITE:   'bg-green-wash text-green',
  PHONE:     'bg-paper-deep text-ink-soft',
  OTHER:     'bg-paper-deep text-ink-soft',
};

const STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];
const PAGE_SIZE = 50;

export default async function LeadsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; source?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;

  const where: Prisma.LeadWhereInput = {};
  if (sp.status && STATUSES.includes(sp.status as LeadStatus)) where.status = sp.status as LeadStatus;
  if (sp.source) where.source = sp.source as LeadSource;

  const page = Math.max(1, Number(sp.page) || 1);

  const [leads, total] = await Promise.all([
    db.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    db.lead.count({ where }),
  ]);

  const pill = (on: boolean) =>
    `rounded-[3px] border px-3.5 py-1.5 text-[0.8rem] capitalize transition-colors ${
      on ? 'border-green bg-green text-green-on font-semibold' : 'border-paper-edge text-ink-soft hover:border-green hover:text-green'
    }`;

  return (
    <div>
      <RuleLabel>Facebook · Instagram · WhatsApp · Website in one inbox</RuleLabel>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-[1.9rem]">Leads</h1>
        <p className="mono text-[0.7rem] uppercase tracking-[0.08em] text-ink-soft">{total} total</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/admin/leads" className={pill(!sp.status && !sp.source)}>All</a>
        {STATUSES.map((s) => (
          <a key={s} href={`/admin/leads?status=${s}`} className={pill(sp.status === s)}>
            {s.toLowerCase()}
          </a>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="mt-8 rounded-[4px] border border-dashed border-paper-edge px-6 py-12 text-center text-[0.87rem] text-ink-soft">
          No leads match this filter yet.
        </p>
      ) : (
        // Wide table scrolls inside its own container — the page body must
        // never scroll sideways.
        <div className="mt-6 overflow-x-auto rounded-[4px] border border-paper-edge">
          <table className="w-full min-w-[860px] text-[0.85rem]">
            <thead>
              <tr>
                {['Contact', 'Channel', 'Message', 'Received', 'Status', 'Action'].map((h) => (
                  <th key={h} className="mono border-b border-paper-edge px-4 py-3 text-left text-[0.62rem] font-medium uppercase tracking-[0.1em] text-ink-soft">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-paper-edge align-top last:border-b-0">
                  <td className="px-4 py-3.5">
                    <div className="font-medium">{l.name || '—'}</div>
                    {l.phone && <a href={`tel:${l.phone}`} className="mono block text-[0.74rem] text-green hover:underline">{l.phone}</a>}
                    {l.email && <a href={`mailto:${l.email}`} className="mono block text-[0.72rem] text-ink-soft hover:underline">{l.email}</a>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`mono inline-block rounded-[2px] px-[0.45rem] py-[0.18rem] text-[0.62rem] font-medium uppercase tracking-[0.08em] ${SOURCE[l.source]}`}>
                      {l.source.toLowerCase()}
                    </span>
                    {l.formName && <div className="mt-1 text-[0.68rem] text-ink-soft">{l.formName}</div>}
                  </td>
                  <td className="max-w-[20rem] px-4 py-3.5 text-ink-soft">
                    {l.message ? <span className="line-clamp-3">{l.message}</span> : <span className="opacity-40">—</span>}
                  </td>
                  <td className="mono whitespace-nowrap px-4 py-3.5 text-[0.72rem] text-ink-soft">
                    {new Intl.DateTimeFormat('en-IN', {
                      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
                    }).format(l.createdAt)}
                  </td>
                  <td className="px-4 py-3.5"><LeadStatusSelect id={l.id} status={l.status} /></td>
                  <td className="px-4 py-3.5">
                    {l.phone && (
                      <a
                        href={whatsappLink(`Hello ${l.name ?? ''}, this is Genezenz Pharmacy following up on your enquiry.`)
                          .replace('wa.me/', `wa.me/${l.phone.replace(/\D/g, '')}#`)}
                        target="_blank" rel="noopener noreferrer"
                        className="whitespace-nowrap rounded-[3px] bg-[#25D366] px-3 py-1.5 text-[0.72rem] font-semibold text-white"
                      >
                        WhatsApp
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <nav className="mono mt-8 flex justify-center gap-6 text-[0.75rem] uppercase tracking-[0.08em]">
          {page > 1 && <a href={`/admin/leads?page=${page - 1}`} className="hover:text-green">← Previous</a>}
          <span className="text-ink-soft">Page {page}</span>
          {page * PAGE_SIZE < total && <a href={`/admin/leads?page=${page + 1}`} className="hover:text-green">Next →</a>}
        </nav>
      )}
    </div>
  );
}
