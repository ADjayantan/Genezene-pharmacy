/**
 * Sticky section nav for the single-page dashboard.
 *
 * One long page is the right shape for a shop this size — the pharmacist opens
 * it once in the morning and wants the whole picture, not six clicks. The cost
 * of a long page is orientation, which this pays back: a badge appears wherever
 * something is actually waiting.
 */
export function JumpNav({ items }: { items: { id: string; label: string; count?: number }[] }) {
  return (
    <nav
      aria-label="Dashboard sections"
      className="sticky top-0 z-30 -mx-6 mb-10 border-b border-paper-edge bg-paper/95 px-6 backdrop-blur"
    >
      <div className="flex gap-1 overflow-x-auto py-2.5">
        {items.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            className="mono whitespace-nowrap rounded-[3px] px-3 py-1.5 text-[0.66rem] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:bg-paper-deep hover:text-green"
          >
            {i.label}
            {!!i.count && (
              <span className="ml-1.5 inline-block min-w-[1.25rem] rounded-[2px] bg-amber px-1 text-center text-[0.6rem] text-paper">{i.count}</span>
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function Section({
  id, label, title, aside, children,
}: {
  id: string; label: string; title: string;
  aside?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-36 border-l-[2px] border-paper-edge pl-5">
      <div className="border-t border-paper-edge pt-3">
        <span className="mono block text-[0.68rem] uppercase tracking-[0.12em] text-ink-soft">{label}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[1.7rem]">{title}</h2>
        {aside}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
