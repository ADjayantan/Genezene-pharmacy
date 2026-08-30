import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = { title: 'Create account', robots: { index: false, follow: false } };

export default async function RegisterPage() {
  if (await getSession()) redirect('/profile');
  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-16">
      <Suspense><AuthForm mode="register" /></Suspense>
    </div>
  );
}
