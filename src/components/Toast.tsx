'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type Toast = { id: number; text: string; tone: 'ok' | 'err' };
const Ctx = createContext<(text: string, tone?: 'ok' | 'err') => void>(() => {});

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((v) => [...v, { id, text, tone }]);
    setTimeout(() => setItems((v) => v.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      {/* aria-live so a screen reader announces the message without
          stealing focus from whatever the user is doing. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-6 top-24 z-[100] flex flex-col items-end gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`mono pointer-events-auto rounded-[3px] px-4 py-3 text-[0.8rem] ${
              t.tone === 'ok' ? 'bg-ink text-paper' : 'bg-out text-white'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
