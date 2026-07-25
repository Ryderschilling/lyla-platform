import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/marketing/LoginForm';
import { SunMark } from '@/components/ui/marks';
import { Reveal } from '@/components/ui/motion';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage({ searchParams }: { searchParams: { next?: string; deactivated?: string } }) {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-5 pb-24 pt-32">
      <Reveal className="w-full">
        <div className="rounded-3xl border border-line bg-card p-8 md:p-10">
          <div className="flex flex-col items-center text-center">
            <SunMark className="h-8 w-8 text-coral" />
            <h1 className="mt-5 font-display text-3xl font-normal tracking-tight">Welcome back.</h1>
            <p className="mt-2 text-sm text-ink2">The Club&apos;s inside. Your streak missed you.</p>
          </div>
          <div className="mt-8">
            <Suspense>
              <LoginForm next={searchParams.next} deactivated={!!searchParams.deactivated} />
            </Suspense>
          </div>
        </div>
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] leading-relaxed text-mute">
          No login yet? Memberships are set up personally by Lyla —{' '}
          <a href="/the-club" className="text-ink2 underline decoration-line underline-offset-4 hover:text-coral">
            here&apos;s how to join
          </a>
        </p>
      </Reveal>
    </div>
  );
}
