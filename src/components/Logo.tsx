import { site } from '@/lib/config';

import Image from 'next/image';

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Image 
      src="/logo.png" 
      alt="Genezenz Pharmacy Logo" 
      width={size} 
      height={size} 
      className="rounded-full overflow-hidden object-cover shadow-sm"
    />
  );
}

export function Wordmark({ size = 32, hideSuffix = false }: { size?: number; hideSuffix?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-2.5">
      <Logo size={size} />
      <span>
        <span className="font-display text-[1.15rem] font-semibold tracking-[-0.02em]">Genezenz</span>
        <span className={`text-[0.95rem] text-ink-soft ${hideSuffix ? 'hidden sm:inline' : ''}`}>
          {' '}Pharmacy
        </span>
      </span>
    </span>
  );
}
