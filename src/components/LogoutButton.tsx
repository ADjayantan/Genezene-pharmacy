'use client';

import { useRouter } from 'next/navigation';
import { Button } from './ui';

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      tone="quiet"
      size="sm"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
