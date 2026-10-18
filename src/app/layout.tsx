import type { Metadata, Viewport } from 'next';
import {
  Anton,
  Bodoni_Moda,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Instrument_Sans,
  Marcellus,
  Newsreader,
  EB_Garamond,
  Tiro_Devanagari_Hindi,
} from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { SiteChrome } from '@/components/site-chrome';
import { Toaster } from '@/components/ui/toaster';
import { Travel } from '@/components/travel';
import { SoundToggle } from '@/components/sound/SoundToggle';
import { QuickTravel } from '@/components/QuickTravel';
import { sortedNotes } from '@/content/notebook';
import { studies } from '@/content/studies';
import { SITE_URL } from '@/lib/site';
import Script from 'next/script';
import { HEAD_SCRIPT } from '@/components/theme/headScript';
import { FloatControls } from '@/components/motion/FloatControls';
import { ArchPortal } from '@/components/place/ArchPortal';
import '@/components/motion/motion.css';
import '@/components/theme/theme.css';
import { Cursor } from '@/components/Cursor';
import '@/components/cursor.css';

// Type system
// · Newsreader: the editorial voice of the whole site (headlines, numbers, quotes)
// · Instrument Sans: reading text and interface
// · IBM Plex Mono: labels, dates, annotations, like notes on a drawing
// Each place then has its own display face, matched to its culture:
// Marcellus (carved stone, Jaipur), IBM Plex Sans (the studio), Tiro Devanagari (the chaupal),
// Anton (jersey numbers), Bodoni Moda (letterpress), EB Garamond (the notebook and the samurai's rule; kanji fall back to the system Mincho).

const display = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-display',
  display: 'swap',
});

const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const condensed = Anton({ subsets: ['latin'], weight: '400', variable: '--font-condensed', display: 'swap', preload: false });
const stone = Marcellus({ subsets: ['latin'], weight: '400', variable: '--font-stone', display: 'swap', preload: false });
const tech = IBM_Plex_Sans({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-tech', display: 'swap', preload: false });
const tiro = Tiro_Devanagari_Hindi({ subsets: ['latin', 'devanagari'], weight: '400', style: ['normal', 'italic'], variable: '--font-tiro', display: 'swap', preload: false });
const didone = Bodoni_Moda({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-didone', display: 'swap', preload: false });
const mincho = EB_Garamond({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-mincho', display: 'swap' });

const DESCRIPTION =
  'Civil engineering student at BITS Pilani who builds systems, leads people and captained the roll ball team to its first InterBITS gold. A small world of things I have made.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Devansh Sureka', template: '%s · Devansh Sureka' },
  description: DESCRIPTION,
  // the card people see when the link is shared on WhatsApp, LinkedIn or X
  openGraph: {
    type: 'website',
    siteName: 'Devansh Sureka',
    title: 'Devansh Sureka',
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Devansh Sureka: civil engineering, BITS Pilani' }],
  },
  twitter: { card: 'summary_large_image', title: 'Devansh Sureka', description: DESCRIPTION, images: ['/og.png'] },
};

export const viewport: Viewport = {
  themeColor: '#14110f',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(display.variable, body.variable, mono.variable, condensed.variable, stone.variable, tech.variable, tiro.variable, didone.variable, mincho.variable)}
    >
      <head>
        {/* light or dark, decided before the first paint */}
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteChrome>{children}</SiteChrome>
        <Travel />
        <SoundToggle />
        <QuickTravel notes={sortedNotes.map(({ slug, title, kind }) => ({ slug, title, kind }))} studies={studies.map(({ slug, title, kind }) => ({ slug, title, kind }))} />
        <Cursor />
        <FloatControls />
        <ArchPortal />
        <Toaster />
        {/* visitor counts (Vercel Web Analytics): only runs on the live Vercel site, once switched on there */}
        {process.env.VERCEL && <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />}
      </body>
    </html>
  );
}
