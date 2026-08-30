import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { RxReview } from '@/components/admin/RxReview';
import { RuleLabel } from '@/components/ui';
import { Timeline } from '@/components/Timeline';
import type { RxStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const STATUSES: RxStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const TAG: Record<string, string> = {
  PENDING: 'bg-amber-wash text-amber',
  APPROVED: 'bg-green-wash text-in',
  REJECTED: 'bg-out/10 text-out',
};

export default async function AdminPrescriptions({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;

  const rows = await db.prescription.findMany({
    where: STATUSES.includes(sp.status as RxStatus) ? { status: sp.status as RxStatus } : undefined,
    include: {
      user: { select: { name: true, email: true, phone: true } },
      events: { orderBy: { at: 'asc' } },
      order: { select: { orderNo: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  });

  const pill = (on: boolean) =>
    `rounded-[3px] border px-3.5 py-1.5 text-[0.8rem] capitalize transition-colors ${
      on ? 'border-green bg-green text-green-on font-semibold' : 'border-paper-edge text-ink-soft hover:border-green hover:text-green'
    }`;

  return (
    <div>
      <RuleLabel>Pharmacist queue</RuleLabel>
      <h1 className="mt-2 text-[1.9rem]">Prescriptions</h1>
      <p className="mt-1 text-[0.87rem] text-ink-soft">
        Review each upload before the order is dispatched.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/admin/prescriptions" className={pill(!sp.status)}>All</a>
        {STATUSES.map((s) => (
          <a key={s} href={`/admin/prescriptions?status=${s}`} className={pill(sp.status === s)}>{s.toLowerCase()}</a>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-[4px] border border-dashed border-paper-edge px-6 py-12 text-center text-[0.87rem] text-ink-soft">
          Nothing to review.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((rx) => (
            <div key={rx.id} className="rounded-[4px] border border-paper-edge p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-display text-[1rem] font-semibold">
                      {rx.patientName || rx.user.name}
                    </p>
                    <span className={`mono rounded-[2px] px-2 py-[0.15rem] text-[0.62rem] font-medium uppercase tracking-[0.06em] ${TAG[rx.status]}`}>
                      {rx.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="mono mt-1.5 text-[0.8rem] text-ink-soft">
                    {rx.user.email}
                    {rx.user.phone && (
                      <> · <a href={`tel:${rx.user.phone}`} className="text-green hover:underline">{rx.user.phone}</a></>
                    )}
                  </p>
                  {rx.doctorName && <p className="mt-0.5 text-[0.85rem] text-ink-soft">Dr. {rx.doctorName}</p>}
                  {rx.notes && <p className="mt-1 text-[0.85rem] italic text-ink-soft">“{rx.notes}”</p>}
                  <p className="mono mt-2 text-[0.68rem] text-ink-soft">
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(rx.createdAt)}
                    {' · '}{(rx.sizeBytes / 1024).toFixed(0)} KB
                    {' · '}{rx.mimeType.replace('application/', '').replace('image/', '').toUpperCase()}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <a
                    href={`/api/prescriptions/file/${rx.id}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex rounded-[3px] border border-paper-edge px-4 py-2 text-[0.85rem] font-semibold transition-colors hover:border-green hover:text-green"
                  >
                    Open file →
                  </a>
                  {/* The pharmacist should know the file is protected and that
                      opening it is a deliberate act. */}
                  <p className="mono mt-1.5 text-[0.62rem] uppercase tracking-[0.08em] text-ink-soft">
                    Encrypted · decrypted on request
                  </p>
                </div>
              </div>

              {rx.order && (
                <p className="mono mt-3 text-[0.72rem] text-ink-soft">
                  Dispensed against order <span className="text-ink">{rx.order.orderNo}</span>
                </p>
              )}

              <RxReview id={rx.id} status={rx.status} note={rx.reviewNote} />

              {rx.events.length > 0 && (
                <details className="mt-4 border-t border-paper-edge pt-4">
                  <summary className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">
                    Review history ({rx.events.length})
                  </summary>
                  <div className="mt-4">
                    <Timeline events={rx.events} showActor />
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
