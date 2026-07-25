import type { Metadata } from 'next';
import { getPhotoManifest } from '@/lib/photos';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { Reveal } from '@/components/ui/motion';
import { ContactForm } from '@/components/marketing/ContactForm';

export const metadata: Metadata = { title: 'Contact' };
export const dynamic = 'force-dynamic';

export default function ContactPage() {
  const photos = getPhotoManifest();
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-10 md:pt-36">
      <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div>
          <Reveal>
            <p className="eyebrow text-coral">Say hey</p>
            <h1 className="mt-3 max-w-[14ch] font-display text-[clamp(38px,6vw,68px)] font-normal leading-[1.0] tracking-tight">
              Tell me where <em className="italic text-coral">you&apos;re at.</em>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink2">
              Questions about the Club, coaching, or whether this is &quot;for someone like you&quot; (it is) — write me.
              I read everything myself, usually between a workout and a batch of cookies.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10">
              <ContactForm />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
              Prefer email?{' '}
              <a
                href="mailto:hello@lylaschilling.com"
                className="break-words text-ink2 underline decoration-line underline-offset-4 transition-colors hover:text-coral"
              >
                hello@lylaschilling.com
              </a>
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.12} className="mx-auto w-full max-w-[380px] lg:mt-6 lg:max-w-none">
          <PhotoSlot src={photos['about-02']} slot="about-02" aspect="4/5" frame="arch" duotone={!!photos['about-02']} alt="Lyla on 30A">
            <span className="absolute inset-x-0 bottom-5 px-6 text-center font-mono text-[9px] uppercase tracking-[0.24em] text-shell/90">
              Santa Rosa Beach, FL
            </span>
          </PhotoSlot>
        </Reveal>
      </div>
    </div>
  );
}
