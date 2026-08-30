import { db } from '@/lib/db';
import { whatsappLink } from '@/lib/config';
import { metaConfigured } from '@/lib/meta';
import { LeadStatusSelect } from '@/app/admin/leads/LeadStatusSelect';
import { ShareBar } from '@/components/admin/Chart';
import { Section } from '@/components/admin/JumpNav';
import type { LeadSource } from '@prisma/client';

const SOURCE: Record<LeadSource, string> = {
  FACEBOOK:  'bg-[#E7EDF7] text-[#2B4C7E] dark:bg-[#1B2A3F] dark:text-[#A9C4E8]',
  INSTAGRAM: 'bg-[#F7E9EF] text-[#8E3A5E] dark:bg-[#33202A] dark:text-[#E5A8C4]',
  WHATSAPP:  'bg-[#E6F2E9] text-[#1E6B3A] dark:bg-[#16301F] dark:text-[#8FD3A8]',
  WEBSITE:   'bg-green-wash text-green',
  PHONE:     'bg-paper-deep text-ink-soft',
  OTHER:     'bg-paper-deep text-ink-soft',
};

const COLOR: Record<string, string> = {
  FACEBOOK: '#2B4C7E', INSTAGRAM: '#8E3A5E', WHATSAPP: '#1E6B3A',
  WEBSITE: 'var(--green)', PHONE: 'var(--ink-soft)', OTHER: 'var(--paper-edge)',
};

export async function LeadsSection() {
  const [leads, total, bySource] = await Promise.all([
    db.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 15 }),
    db.lead.count(),
    db.lead.groupBy({ by: ['source'], _count: { _all: true } }),
  ]);

  return (
    <Section
      id="s-leads"
      label="Facebook · Instagram · WhatsApp · Website in one inbox"
      title="Leads"
      aside={<p className="mono text-[0.7rem] uppercase tracking-[0.08em] text-ink-soft">{total} total</p>}
    >
      <div className="rounded-[4px] border border-paper-edge bg-paper-deep p-5">
        <ShareBar
          parts={bySource.map((s) => ({
            label: s.source.toLowerCase(), value: s._count._all,
            color: COLOR[s.source] ?? 'var(--ink-soft)',
          }))}
        />
      </div>

      {leads.length === 0 ? (
        <p className="mt-6 rounded-[4px] border border-dashed border-paper-edge px-6 py-10 text-center text-[0.87rem] text-ink-soft">
          No leads yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[4px] border border-paper-edge">
          <table className="w-full min-w-[860px] text-[0.85rem]">
            <thead>
              <tr>
                {['Contact', 'Channel', 'Message', 'Received', 'Status', 'Action'].map((h) => (
                  <th key={h} className="mono border-b border-paper-edge px-4 py-2.5 text-left text-[0.62rem] font-medium uppercase tracking-[0.1em] text-ink-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-paper-edge align-top last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.name || '—'}</div>
                    {l.phone && <a href={`tel:${l.phone}`} className="mono block text-[0.74rem] text-green hover:underline">{l.phone}</a>}
                    {l.email && <a href={`mailto:${l.email}`} className="mono block text-[0.72rem] text-ink-soft hover:underline">{l.email}</a>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`mono inline-block rounded-[2px] px-[0.45rem] py-[0.18rem] text-[0.62rem] font-medium uppercase tracking-[0.08em] ${SOURCE[l.source]}`}>
                      {l.source.toLowerCase()}
                    </span>
                    {l.formName && <div className="mt-1 text-[0.68rem] text-ink-soft">{l.formName}</div>}
                  </td>
                  <td className="max-w-[20rem] px-4 py-3 text-ink-soft">
                    {l.message ? <span className="line-clamp-3">{l.message}</span> : <span className="opacity-40">—</span>}
                  </td>
                  <td className="mono whitespace-nowrap px-4 py-3 text-[0.72rem] text-ink-soft">
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(l.createdAt)}
                  </td>
                  <td className="px-4 py-3"><LeadStatusSelect id={l.id} status={l.status} /></td>
                  <td className="px-4 py-3">
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

      {!metaConfigured() && (
        <div className="mt-5 rounded-[4px] border border-amber bg-amber-wash px-5 py-4 text-[0.87rem] leading-relaxed">
          <b className="font-display mb-1 block font-semibold">
            Facebook &amp; Instagram lead sync is not connected yet.
          </b>
          The webhook is live at{' '}
          <code className="mono rounded-[2px] bg-amber/20 px-1.5 py-0.5">/api/webhooks/meta</code>.
          Add <code className="mono rounded-[2px] bg-amber/20 px-1.5 py-0.5">META_APP_SECRET</code>{' '}
          and <code className="mono rounded-[2px] bg-amber/20 px-1.5 py-0.5">META_PAGE_ACCESS_TOKEN</code>{' '}
          once Meta approves Business verification. Website and WhatsApp leads work today.
        </div>
      )}
    </Section>
  );
}
