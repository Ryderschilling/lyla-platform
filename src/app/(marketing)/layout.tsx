import { Nav } from '@/components/marketing/Nav';
import { Footer } from '@/components/marketing/Footer';
import { CursorGlow } from '@/components/marketing/CursorGlow';
import { LenisProvider } from '@/components/marketing/LenisProvider';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider>
      <CursorGlow />
      <Nav />
      <main className="relative">{children}</main>
      <Footer />
    </LenisProvider>
  );
}
