import type { Metadata, Viewport } from 'next';
import { SunMark } from '@/components/ui/marks';

export const metadata: Metadata = { title: 'Welcome — The Progress Club' };
export const viewport: Viewport = { themeColor: '#141E1A', width: 'device-width', initialScale: 1 };

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-dark grain min-h-screen bg-night-bg text-night-text">
      <header className="border-b border-night-line">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2.5 px-5 font-mono text-[9.5px] tracking-[0.26em]">
          <SunMark className="h-4 w-4 text-coral" />
          THE PROGRESS CLUB
        </div>
      </header>
      {children}
    </div>
  );
}
