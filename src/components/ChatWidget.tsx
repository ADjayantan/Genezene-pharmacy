'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { site } from '@/lib/config';

type Msg = { role: 'bot' | 'user'; text: string; links?: { label: string; href: string }[] };

const GREETING: Msg = {
  role: 'bot',
  text: 'Hello. I can help with delivery, opening hours, offers, prescriptions, or checking whether we stock something. What do you need?',
  links: [
    { label: 'Browse the counter', href: '/products' },
    { label: 'Upload a prescription', href: '/upload-prescription' },
  ],
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    setMsgs((m) => [...m, { role: 'user', text }]);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: 'bot', text: data.text, links: data.links }]);
    } catch {
      setMsgs((m) => [...m, { role: 'bot', text: `I can't reach the shop right now. Please call ${site.phoneDisplay}.` }]);
    }
    setBusy(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
        className="fixed bottom-6 right-[5.5rem] z-50 grid h-[52px] w-[52px] place-items-center rounded-[3px] bg-green text-green-on transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="square" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="square" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.2-4.4A8 8 0 1 1 21 12Z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pharmacy assistant"
          className="fixed bottom-[5.75rem] right-6 z-50 flex h-[28rem] w-[min(22rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-[4px] border border-paper-edge bg-paper"
        >
          <header className="bg-green px-4 py-3 text-green-on">
            <p className="font-display text-[0.95rem] font-semibold">Genezenz Assistant</p>
            <p className="mono text-[0.62rem] uppercase tracking-[0.1em] opacity-80">
              Shop questions &amp; stock checks
            </p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                <div
                  className={`inline-block max-w-[85%] rounded-[3px] px-3.5 py-2 text-left text-[0.85rem] leading-relaxed ${
                    m.role === 'user' ? 'bg-green text-green-on' : 'bg-paper-deep text-ink'
                  }`}
                >
                  {m.text}
                </div>
                {m.links && (
                  <div className="mt-1.5 flex flex-col items-start gap-1">
                    {m.links.map((l) => (
                      <Link
                        key={l.href + l.label}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="rounded-[3px] border border-paper-edge px-2.5 py-1.5 text-[0.75rem] font-semibold text-green transition-colors hover:border-green"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <p className="mono text-[0.7rem] text-ink-soft">Typing…</p>}
            <div ref={end} />
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-paper-edge p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about delivery, stock…"
              aria-label="Message"
              maxLength={500}
              className="flex-1 rounded-[3px] border border-paper-edge bg-paper-deep px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-green"
            />
            <button
              disabled={busy || !input.trim()}
              className="rounded-[3px] bg-green px-4 text-[0.8rem] font-semibold text-green-on disabled:opacity-45"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
