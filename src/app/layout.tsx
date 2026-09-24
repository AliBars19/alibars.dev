import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
import { SHEET_IDS } from '@/lib/pile';
import './globals.css';

// adjustFontFallback:false stops next/font from injecting a metric-matched
// local Arial `@font-face` ahead of the CSS fallback stack. That generated
// face wins for glyphs missing from the web font (e.g. the → arrow, not in
// IBM Plex Sans), so the arrow rendered from Arial instead of falling
// through to system-ui as globals.css intends (slice-rvat-03).
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
  adjustFontFallback: false,
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
  adjustFontFallback: false,
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal'],
  variable: '--font-source-serif',
  display: 'swap',
  adjustFontFallback: false,
});

// No `title` here: Pile renders the one React 19 <title> the document ever
// has (see Pile.tsx), so nothing competes with it after hydration
// (slice-gpi-02 / behaviour-02 / code-r3-01 and duplicates).
export const metadata: Metadata = {
  description: 'iOS engineer and founder of Crumbify. I build cool things.',
  openGraph: {
    title: 'Ali Bars',
    description: 'iOS engineer and founder of Crumbify. I build cool things.',
    url: 'https://alibars.dev',
    siteName: 'Ali Bars',
    type: 'website',
  },
};

// Pre-hydration script: avoids a flash of the wrong theme, a flash of the
// title page on a deep link, and (via data-top) a flash of the CV sheet
// before a non-CV deep link's own sheet paints. Runs before React hydrates
// and paints, so it sets data attributes on <html> that CSS in globals.css
// reacts to synchronously; React's own state (computed from the same
// signals) then matches on hydration with no visible change.
//
// localStorage.getItem is wrapped in its own inner try: when storage is
// blocked (e.g. a SecurityError from blocked site data), that alone must
// not abort the rest of the script, or an OS-dark visitor gets the light
// desk and a deep link flashes the title page for the whole load (gl-28).
const preHydrationScript = `(function(){try{
  var d=document.documentElement;
  var stored=null;
  try{stored=localStorage.getItem('alibars-desk');}catch(e){}
  var dark=stored?stored==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
  d.setAttribute('data-desk',dark?'dark':'light');
  var hash=(window.location.hash||'').replace('#','');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var known=${JSON.stringify(SHEET_IDS)};
  var skip=known.indexOf(hash)!==-1 || reduced;
  d.setAttribute('data-intro',skip?'skip':'play');
  if(known.indexOf(hash)!==-1 && hash!=='cv'){d.setAttribute('data-top',hash);}
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${plexSans.variable} ${plexMono.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: preHydrationScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
