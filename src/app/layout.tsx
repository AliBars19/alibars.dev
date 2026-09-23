import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ali Bars',
  description: 'iOS engineer and founder of Crumbify. I build cool things.',
  openGraph: {
    title: 'Ali Bars',
    description: 'iOS engineer and founder of Crumbify. I build cool things.',
    url: 'https://alibars.dev',
    siteName: 'Ali Bars',
    type: 'website',
  },
};

// Pre-hydration script: avoids a flash of the wrong theme and a flash of the
// title page on a deep link. Runs before React hydrates and paints, so it
// sets data attributes on <html> that CSS in globals.css reacts to
// synchronously; React's own state (computed from the same signals) then
// matches on hydration with no visible change.
const preHydrationScript = `(function(){try{
  var d=document.documentElement;
  var stored=localStorage.getItem('alibars-desk');
  var dark=stored?stored==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
  d.setAttribute('data-desk',dark?'dark':'light');
  var hash=(window.location.hash||'').replace('#','');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var skip=['cv','crumbify','racing','video','about'].indexOf(hash)!==-1 || reduced;
  d.setAttribute('data-intro',skip?'skip':'play');
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: preHydrationScript }} />
      </head>
      <body className={`${plexSans.variable} ${plexMono.variable} ${sourceSerif.variable}`}>{children}</body>
    </html>
  );
}
