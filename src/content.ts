/**
 * Single typed content module. All copy + URLs for the site live here.
 * Ported verbatim from design_handoff_alibars_portfolio/content.json, with
 * the owner overrides from docs/implementation-notes.md applied:
 *  - City Racing CV bullet keeps "Aug. 2025 – Present" removed in favour of a
 *    two-bullet CV entry (dates below) and the csg.racing bullet dropped.
 *  - Unknown URLs are '#TODO-...' placeholders so buttons still render.
 */

import type { SheetId } from '@/lib/pile';

export type { SheetId };

export type Tab = { id: SheetId; label: string; color: string };

export type ContactItem = { label: string; href?: string };

export type EducationEntry = {
  school: string;
  place?: string;
  degree: string;
  dates: string;
  modules?: string[];
};

export type ExperienceEntry = {
  title: string;
  opens: SheetId;
  dates: string;
  org: string;
  place: string;
  bullets: string[];
};

type ProjectEntryBase = {
  title: string;
  highlight: 'yellow' | 'purple';
  stack: string;
  year: string;
  bullets: string[];
};

// A plain intersection of Base & (A | B) loses discriminated-union narrowing
// for the 'in' operator in some TS control-flow positions (closures,
// straight-line narrowing of an optional-never branch); a union of two full
// intersections narrows reliably instead.
type InternalProject = ProjectEntryBase & { opens: SheetId };
type ExternalProject = ProjectEntryBase & { href: string; icon?: 'github' };

export type ProjectEntry = InternalProject | ExternalProject;

export type SkillGroup = { label: string; items: string };

export const site = {
  domain: 'alibars.dev',
  downloadCvLabel: 'Download CV (PDF)',
  // Owner decision (docs/implementation-notes.md): the redacted PDF lives in
  // public/ and is downloaded directly, no external URL needed.
  downloadCvHref: '/Ali_Bars_CV.pdf',
  themeLabels: { light: 'Lights off', dark: 'Lights on' },
};

export const title = {
  kicker: 'vol. 01',
  name: 'Ali Bars',
  line: 'My name is Ali, and I build things.',
  cta: 'click to open →',
};

export const note = 'psst: click anything highlighted (or a tab) to pull that page from the pile.';

export const tabs: Tab[] = [
  { id: 'cv', label: 'cv', color: '#ebe6da' },
  { id: 'crumbify', label: 'crumbify', color: '#f3e3a1' },
  { id: 'racing', label: 'racing', color: '#cfe3c9' },
  { id: 'video', label: 'video bot', color: '#f2cdbf' },
  { id: 'about', label: 'about', color: '#cdd9ef' },
];

// Declared separately with an explicit `: ProjectEntry[]` annotation, not
// `satisfies`: for a discriminated union, `satisfies` infers the array's own
// homogenised literal type (every field optional across all elements) rather
// than checking each element against the union, which then breaks `'opens'
// in project` narrowing (including inside closures) wherever this is read.
// See docs/implementation-notes.md.
const projects: ProjectEntry[] = [
  {
    title: 'Video Automation Pipeline',
    opens: 'video',
    highlight: 'yellow',
    stack: 'Python, ffmpeg, OpenAI Whisper, JSX, AWS EC2',
    year: '2025',
    bullets: [
      'Built a batch pipeline processing 50+ audio jobs per run: ffmpeg extraction and trimming, dominant-colour analysis, and Whisper transcription producing word-level timestamps.',
      'Scripted Adobe After Effects via JSX to assemble templated compositions, apply colour grading, sync timed lyrics and queue 12+ renders per run on AWS EC2, removing the manual editing step entirely.',
      'This pipeline results in a TikTok page totaling 25K followers, 7.1M likes and 60M+ views in total.',
    ],
  },
  {
    title: 'Automated Publishing Platform',
    // TODO(ali): GitHub repo URL for the Automated Publishing Platform.
    href: '#TODO-automated-publishing-platform-github',
    highlight: 'purple',
    icon: 'github',
    stack: 'Next.js, TypeScript, OAuth',
    year: '2025',
    bullets: [
      'Next.js service that schedules and publishes to TikTok and YouTube through OAuth-integrated APIs, parsing filenames into per-platform metadata and tracking publish state across both.',
    ],
  },
];

export const cv = {
  name: 'Ali Bars',
  tagline: 'iOS engineer & founder of Crumbify. I build cool things.',
  contact: [
    { label: 'London, UK' },
    { label: 'alibars999@gmail.com', href: 'mailto:alibars999@gmail.com' },
    { label: 'linkedin.com/in/alibars', href: 'https://linkedin.com/in/alibars' },
    { label: 'github.com/AliBars19', href: 'https://github.com/AliBars19' },
  ] satisfies ContactItem[],
  education: [
    {
      school: 'City, University of London',
      place: 'London, UK',
      degree: 'BSc Computer Science (Predicted First, 1:1)',
      dates: 'Sept. 2024 – July 2027',
      modules: [
        'Data Structures & Algorithms',
        'Databases',
        'Operating Systems',
        'Systems Architecture',
        'Network Systems',
        'Language Processors',
        'Team Project',
      ],
    },
    {
      school: 'Compton Sixth Form',
      dates: 'Sept. 2022 – June 2024',
      degree: 'BTEC Applied Science (Distinction, Distinction), A Level Mathematics (A)',
    },
  ] satisfies EducationEntry[],
  experience: [
    {
      title: 'Founder & Lead Engineer',
      opens: 'crumbify',
      dates: 'Mar. 2026 – Present',
      org: 'Crumbify Ltd',
      place: 'London, UK',
      bullets: [
        'Sole founder and engineer of a social food-discovery iOS app, built in React Native, Expo and TypeScript on a Supabase (Postgres) backend.',
        'Designed a local-first architecture (on-device SQLite synced to Postgres with row-level security) so the app stays fast offline and fetches minimally on cold start.',
        'Took the product from concept to v1.0.0 App Store submission solo, covering TestFlight beta cycles, RevenueCat subscriptions, AdMob and EU DSA trader compliance, while running Crumbify Ltd as sole director.',
      ],
    },
    {
      // Owner decision: dates end "July 2026" (not "Present"), and the
      // csg.racing bullet is removed here (kept on the Racing page).
      title: 'Data Acquisition & Firmware Engineer',
      opens: 'racing',
      dates: 'Aug. 2025 – July 2026',
      org: 'City Racing (Formula Student)',
      place: 'London, UK',
      bullets: [
        'Building a live telemetry pipeline in Python (cantools, mcap) that decodes CAN bus frames from the car and streams them over WebSocket into Foxglove for an F1-style live dashboard.',
        'Wrote a C++ tool that projects logged GPS data points onto satellite maps of the FSUK circuit, pinpointing where simulated and measured laps diverge and sharply reducing debugging time.',
      ],
    },
  ] satisfies ExperienceEntry[],
  projects,
  skills: [
    { label: 'Languages', items: 'Python, Java, TypeScript, JavaScript, C++, SQL, C#, Go' },
    {
      label: 'Frameworks & Libraries',
      items: 'React, React Native, Next.js, Node.js, Expo, Supabase (Postgres), OpenAI Whisper',
    },
    {
      label: 'Developer Tools',
      items: 'Git, AWS (EC2), Jira, VS Code, JetBrains IDEs, Visual Studio, Microsoft Dynamics 365',
    },
  ] satisfies SkillGroup[],
  footer: { prefix: 'Off the page:', link: 'motorsport / F1, music, esports', opens: 'about' as SheetId },
};

export const crumbify = {
  date: 'Mar. 2026 – Present',
  title: 'Crumbify',
  intro:
    'An iOS app for finding food through the people you follow. I designed and built it on my own, got it through App Store review, and run Crumbify Ltd as the sole director.',
  ctas: [
    // TODO(ali): App Store URL for Crumbify.
    { label: 'Get it on the App Store ↗', href: '#TODO-crumbify-app-store' },
    // TODO(ali): GitHub repo URL for Crumbify.
    { label: 'View on GitHub', href: '#TODO-crumbify-github', icon: 'github' as const },
  ],
  screenshots: ['/images/cv-crumb-1.webp', '/images/cv-crumb-2.webp', '/images/cv-crumb-3.webp'],
  underTheHoodLabel: 'Under the hood',
  specs: [
    {
      k: 'App',
      v: 'Built in React Native and Expo with TypeScript. App state lives in Zustand stores.',
      tech: 'React Native · Expo · TypeScript · Zustand',
    },
    {
      k: 'Data',
      v: 'Every read comes from an on-device SQLite database that syncs to Postgres in the background, so the app works offline and does very little fetching on cold start.',
      tech: 'SQLite · Supabase Postgres',
    },
    {
      k: 'Security',
      v: 'Supabase handles auth, and row-level security on the Postgres side decides what each user can read and write.',
      tech: 'Supabase Auth · RLS',
    },
    { k: 'Revenue', v: 'Subscriptions run through RevenueCat, with AdMob for ads.', tech: 'RevenueCat · AdMob' },
    {
      k: 'Shipping',
      v: 'TestFlight beta rounds, App Store review and EU DSA trader compliance, all done solo.',
      tech: 'TestFlight · App Store Connect',
    },
  ],
};

export const racing = {
  // Owner decision: dates end "July 2026" (not "Present"), unchanged from handoff.
  date: 'Aug. 2025 – July 2026',
  title: 'City Racing',
  subtitle: 'Formula Student · Data Acquisition & Firmware Engineer',
  hero: '/images/cv-racing-car.webp',
  telemetry: {
    lead: 'Live telemetry.',
    text: 'Python (cantools, mcap) decodes CAN bus frames from the car and streams them over WebSocket into Foxglove, which gives the team an F1-style live dashboard.',
  },
  gps: {
    lead: 'GPS lap tool (C++).',
    text: 'Projects logged GPS points onto satellite maps of the FSUK circuit, so you can see exactly where the simulated lap and the real one split.',
    image: '/images/cv-racing-gps.webp',
    // The reference stores this crop as scale 1.8 / offset x +18% / y +50%
    // (design_handoff .../reference/.image-slots.state.json), a pan applied on
    // top of an object-fit:cover baseline. That literal offset doesn't
    // translate 1:1 through object-fit:cover on our copy of the (low-res,
    // to-be-replaced) source asset, so objectPosition below reproduces the
    // reference's *intent* (zoom into the on-screen map, centred on the GPS
    // track) instead of the literal x/y pan values. See
    // docs/implementation-notes.md deviations log.
    imageCrop: { scale: 1.8, objectPosition: '58% 22%' },
  },
  website: { prefix: "Here's the team website →", label: 'csg.racing', href: 'https://csg.racing' },
};

export const video = {
  date: '2025',
  title: 'Audio in, lyric video out.',
  sample: '/images/cv-video-sample.webp',
  stats: [
    { v: '60M+', l: 'views' },
    { v: '7.1M', l: 'likes' },
    { v: '25K', l: 'followers' },
  ],
  tiktok: { label: '@apollovaaa on TikTok ↗', href: 'https://www.tiktok.com/@apollovaaa' },
  body: [
    "A batch pipeline in Python. ffmpeg pulls and trims the audio, Whisper transcribes it with word-level timestamps, and a JSX script drives After Effects to build the composition, grade the colours and sync the lyrics. It runs 50+ jobs at a time and renders on AWS EC2, so there's no manual editing left.",
    'Finished videos go to a separate Next.js service that schedules and posts them to TikTok and YouTube.',
  ],
  // TODO(ali): GitHub repo URL for the video pipeline.
  cta: { label: 'View the code on GitHub', href: '#TODO-video-pipeline-github', icon: 'github' as const },
};

export const about = {
  photos: [
    { src: '/images/cv-portrait.webp', caption: 'London, UK' },
    { src: '/images/cv-activity.webp', caption: 'Paris, France' },
  ],
  title: 'Off the page',
  body: "CS at City, University of London. When I'm not shipping, I'm watching F1, deep in music, or playing something competitive.",
  chips: ['motorsport / f1', 'music', 'esports'],
  contact: { prefix: 'Say hi at', email: 'alibars999@gmail.com' },
};

export const sheetTitles: Record<SheetId, string> = {
  cv: 'Ali Bars',
  crumbify: 'Crumbify · Ali Bars',
  racing: 'City Racing · Ali Bars',
  video: 'Video bot · Ali Bars',
  about: 'About · Ali Bars',
};
