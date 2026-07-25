import type { Metadata, Viewport } from 'next';
// Self-hosted brand fonts (Fraunces + Manrope + Fragment Mono) — same families
// as the Google Fonts spec, served first-party with font-display: swap.
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/fraunces/opsz-italic.css';
import '@fontsource-variable/manrope/wght.css';
import '@fontsource/fragment-mono/400.css';
import '@fontsource/fragment-mono/400-italic.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'Lyla Schilling — Chase progress, not perfection.',
    template: '%s — Lyla Schilling',
  },
  description:
    'A new workout every sunrise, coaching in your pocket, and a club that notices when you show up. Nutrition + strength coaching by Lyla Schilling, Santa Rosa Beach, FL.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#F7F1E6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain">{children}</body>
    </html>
  );
}
