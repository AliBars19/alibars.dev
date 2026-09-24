# Handoff: alibars.dev — "The Pile" interactive CV portfolio

## Overview
Personal portfolio for **Ali Bars** (iOS engineer, founder of Crumbify), to live at **alibars.dev**. Audience: recruiters, users, anyone.

The whole site is a **pile of paper on a desk**. On load, the pile slides in from the left with a **title page** on top. The visitor must **click the title page** to pull it away, revealing a **real, typeset CV** as the top sheet. Highlighted words on the CV (like marker highlighter) and coloured **divider tabs** poking out from under the right edge of the pile let you pull a **project page** out of the pile: it slides out to the right from under the top sheet, then slides back in on top. "← back to CV" (or Esc) does the same for the CV.

There is one "page" in routing terms, with 5 sheets: **CV, Crumbify, City Racing, Video bot, About**.

## About the design files
Files in `reference/` are **design references created in HTML**: a working prototype that shows intended look and behaviour. They are **not production code to copy**. The task is to **recreate this design in a real codebase**. No codebase exists yet, so pick the best stack. Recommended: **Next.js (App Router) + TypeScript + React**, deployed on Vercel. Styling via CSS Modules or Tailwind; animation via plain CSS transitions (as in the prototype) or Framer Motion. Keep it a static site (no backend needed).

To view the reference: serve the `reference/` folder with any static server (`npx serve reference`) and open `Interactive CV v3.dc.html`. It must be served over http (not `file://`) so images load from `.image-slots.state.json`. The prototype uses a small custom template runtime (`support.js`). Ignore that runtime; read the markup + the `class Component` logic at the bottom of the file for behaviour.

## Fidelity
**High-fidelity.** Final colours, type, spacing, copy and interactions. Recreate pixel-accurately. All values below are exact.

---

## Global layout

- **Body/desk**: full viewport, `min-height:100vh`, `overflow-x:hidden`.
  - Light desk (default): background `#d3ccbf`, desk text `#1c1b19`.
  - Dark desk: background `radial-gradient(ellipse at 50% 0%, #34302b 0%, #161513 70%)`, desk text `#e8e4dc`.
  - Background/color transition `.5s`.
  - Paper stays the same colour in both modes.
- **Header bar** (sits on the desk, above the pile, z-index 100): flex row, `gap:16px`, `padding:20px 28px`, `font-size:13px`, wraps.
  - Left: `alibars.dev` in IBM Plex Mono, `margin-right:auto`.
  - `Download CV (PDF)` link (color inherit, underlined). Should download the mobile-focused CV PDF (see Assets).
  - Theme toggle button: pill, `border:1px solid currentColor`, `border-radius:999px`, `padding:6px 14px`, `opacity:.8`, `white-space:nowrap`. Label: `Lights off` (when light) / `Lights on` (when dark).
- **Main**: flex, centred horizontally, `padding:28px 64px 140px 20px` (extra right padding leaves room for the tabs).
- **Stage (the pile)**: `position:relative; width:min(760px,100%); display:grid; aspect-ratio:1/1.414` (A4). **All sheets stack in the same grid cell** (`grid-area:1/1`), so every sheet is the same size and the pile height is A4 unless a page's content is taller (it then grows; it must never clip). Every page is designed to fit within A4 at 760px width.

### The pile (behind the top sheet)
Rendered back to front:
1. **Thickness block**: same cell, `background:repeating-linear-gradient(to bottom,#efebe1 0 2px,#d6cfc0 2px 3px)` (looks like stacked page edges), `transform:translate(5px, T px)` where `T = round(min(pileSize,60)*0.9)+4` (pileSize default 16, so T = 18), `box-shadow:0 18px 40px rgba(0,0,0,.28)`.
2. **Filler sheets**: `m = min(pileSize, 8)` blank sheets (no content, only outlines, for performance). Each: backgrounds cycle `#f6f3ec, #f1ede3, #f8f6f0, #eeeadf`; `border:1px solid rgba(0,0,0,.07)`; z-index `1..m`; a **fixed, deterministic** jitter transform per sheet (never changes after load):
   ```js
   jitter(id){ let i=0; for (const ch of id) i=(i*31+ch.charCodeAt(0))%997;
     return { r:(((i*37)%13)-6)*0.55 /*deg*/, x:(((i*53)%9)-4)*3.5 /*px*/, y:(((i*29)%7)-3)*2.5 /*px*/ }; }
   // filler i uses id 'f'+i → transform: translate(x px, y px) rotate(r deg)
   ```
3. **Content sheets** (CV, Crumbify, Racing, Video, About). Only the **top** sheet (plus whichever sheets are mid-transition) is rendered with content; all other content sheets are `visibility:hidden` with no children mounted. **The visible pile must look identical no matter which page is on top.**
4. **Divider tabs** (see below), z-index `m+1`, which is **under** the top sheet.
5. **Title page** (intro only), z-index `m+10`.
6. **Sticky note hint**, z-index 90.

### Sheet (paper) base style
`background:#fbfaf6`; `box-shadow:0 2px 4px rgba(0,0,0,.08), 0 14px 30px rgba(0,0,0,.16)`; top-sheet transform `translate(0,0) rotate(-.4deg)`; `transition:transform .45s cubic-bezier(.4,0,.2,1)`. Padding `clamp(28px,5vw,56px)` (CV uses `clamp(24px,4.5vw,48px)`). Content column is a flex column with `flex:none` on the inner wrapper (important: stops wrapped rows collapsing).

---

## Typography
Google Fonts: `IBM Plex Mono 400/500`, `IBM Plex Sans 400/500/600`, `Source Serif 4 (opsz 8..60) 500/600`.
- **Display/headings**: Source Serif 4, 600, `letter-spacing:-.01em` to `-.02em`.
- **Body**: IBM Plex Sans.
- **Meta/labels/UI chrome**: IBM Plex Mono.
- **Section labels on the CV**: Plex Sans 600, 11px, `letter-spacing:.14em`, uppercase, `border-bottom:1px solid #d8d4cc`, `padding-bottom:6px`.

Scale used:
- Title page name: `clamp(64px,13vw,120px)`, line-height .92.
- Project page H2: `clamp(38px,6vw,52px)`, line-height 1. About H2: 40px.
- CV name H1: `clamp(32px,4.5vw,40px)`.
- CV body: 11.5px / line-height 1.45; entry titles 13.5px 600; tagline 14px; dates/locations 11.5px `#5f5b54`.
- Project page body: 15.5px / 1.6. Crumbify intro: 16.5px / 1.6.
- Mono meta: 12–13px `#5f5b54`.

## Design tokens
| Token | Value |
|---|---|
| paper | `#fbfaf6` |
| paper (title/CV back) alt tones | `#f6f3ec #f1ede3 #f8f6f0 #eeeadf` |
| ink | `#1c1b19` |
| muted ink | `#5f5b54` |
| faint ink | `#8a857c` |
| rule | `#d8d4cc` (section rules, pill borders) / `#e0dbd0` (table rows) |
| desk light | `#d3ccbf` |
| desk dark | `radial-gradient(ellipse at 50% 0%, #34302b 0%, #161513 70%)` |
| desk ink dark | `#e8e4dc` |
| link hover | `#8a5a00` |
| highlighter yellow (internal page link) | gradient `linear-gradient(100deg, rgba(255,221,64,0) 1%, rgba(255,221,64,.85) 3%, rgba(255,221,64,.55) 60%, rgba(255,221,64,.8) 97%, rgba(255,221,64,0) 99%)`; hover solid `rgba(255,196,40,.95)` |
| highlighter purple (external link) | same gradient with `rgba(186,160,255,…)` stops `.8/.5/.75`; hover `rgba(160,125,250,.9)` |
| sticky note | `#fff3a8` |
| tape | `rgba(240,232,200,.8)` |
| GitHub button | `#24292f`, hover `#3a4048` |
| App Store button | `#1c1b19`, hover `#3a3833` |
| tab colours | CV `#ebe6da`, Crumbify `#f3e3a1`, Racing `#cfe3c9`, Video `#f2cdbf`, About `#cdd9ef` |
| polaroid frame | `#fff`, `box-shadow:0 6px 16px rgba(0,0,0,.18)` |
| radii | pills 999px; tabs `0 8px 8px 0`; GitHub (video) button 10px; screenshots 18px |

Highlight span base: `padding:1px 5px; margin:0 -3px; border-radius:3px; cursor:pointer; transition:background .2s`, with a trailing ` →` (internal) or ` ↗` (external).

**Copy rule: no em dashes anywhere.** Date ranges use en dashes (`Sept. 2024 – July 2027`).

---

## Screens / sheets

### 0. Title page (intro)
- Same size as every sheet, z above everything, `cursor:pointer`, subtle rotate `.4deg`.
- Content (flex column): top-left mono 12px `#5f5b54` **`vol. 01`**. Then, with `margin-top:clamp(80px,14vw,150px)`, a column with `gap:20px`:
  - **`Ali Bars`** (serif 600, clamp 64–120px)
  - **`My name is Ali, and I build things.`** (20px, max-width 440px)
  - mono 12px `#5f5b54`, `margin-top:24px`: **`click to open →`**
- Only a **click** dismisses it (no timer, no key skip).

### 1. CV (top sheet by default)
Content, in order (flex column, gap 18px):
- **Header**: `Ali Bars` (H1). Tagline `iOS engineer & founder of Crumbify. I build cool things.` Contact row (11.5px muted, wrap, gap `4px 16px`): `London, UK` · `alibars999@gmail.com` (mailto) · `linkedin.com/in/alibars` · `github.com/AliBars19`. **No phone number.**
- **EDUCATION**
  - `City, University of London` / right `London, UK`
  - italic `BSc Computer Science (Predicted First, 1:1)` / right `Sept. 2024 – July 2027`
  - bullet: **Relevant Modules:** Data Structures & Algorithms, Databases, Operating Systems, Systems Architecture, Network Systems, Language Processors, Team Project
  - `Compton Sixth Form` / right `Sept. 2022 – June 2024`
  - italic `BTEC Applied Science (Distinction, Distinction), A Level Mathematics (A)`
- **EXPERIENCE**
  - [yellow highlight → Crumbify page] `Founder & Lead Engineer →` / `Mar. 2026 – Present`; italic `Crumbify Ltd` / `London, UK`
    - Sole founder and engineer of a social food-discovery iOS app, built in React Native, Expo and TypeScript on a Supabase (Postgres) backend.
    - Designed a local-first architecture (on-device SQLite synced to Postgres with row-level security) so the app stays fast offline and fetches minimally on cold start.
    - Took the product from concept to v1.0.0 App Store submission solo, covering TestFlight beta cycles, RevenueCat subscriptions, AdMob and EU DSA trader compliance, while running Crumbify Ltd as sole director.
  - [yellow highlight → Racing page] `Data Acquisition & Firmware Engineer →` / `Aug. 2025 – Present`; italic `City Racing (Formula Student)` / `London, UK`
    - Building a live telemetry pipeline in Python (cantools, mcap) that decodes CAN bus frames from the car and streams them over WebSocket into Foxglove for an F1-style live dashboard.
    - Wrote a C++ tool that projects logged GPS data points onto satellite maps of the FSUK circuit, pinpointing where simulated and measured laps diverge and sharply reducing debugging time.
    - Built and deployed the team site (csg.racing) in React and Next.js with responsive multi-level navigation, dark mode and embedded video, materially increasing visitor engagement.
    - ⚠️ **Open question:** Ali said he no longer built/owns the site, and the Racing page shows `Aug. 2025 – July 2026`. Confirm with Ali whether this CV bullet and "Present" should change.
  - (Fortnum & Mason was intentionally **removed**.)
- **PROJECTS**
  - [yellow highlight → Video page] `Video Automation Pipeline →` + italic muted ` | Python, ffmpeg, OpenAI Whisper, JSX, AWS EC2` / right `2025`
    - Built a batch pipeline processing 50+ audio jobs per run: ffmpeg extraction and trimming, dominant-colour analysis, and Whisper transcription producing word-level timestamps.
    - Scripted Adobe After Effects via JSX to assemble templated compositions, apply colour grading, sync timed lyrics and queue 12+ renders per run on AWS EC2, removing the manual editing step entirely.
    - This pipeline results in a TikTok page totaling 25K followers, 7.1M likes and 60M+ views in total.
  - [**purple** highlight, external link to GitHub, GitHub icon 14px before text] `Automated Publishing Platform ↗` + italic ` | Next.js, TypeScript, OAuth` / `2025`. **No dedicated page.**
    - Next.js service that schedules and publishes to TikTok and YouTube through OAuth-integrated APIs, parsing filenames into per-platform metadata and tracking publish state across both.
- **TECHNICAL SKILLS** (three lines, bold label):
  - **Languages:** Python, Java, TypeScript, JavaScript, C++, SQL, C#, Go
  - **Frameworks & Libraries:** React, React Native, Next.js, Node.js, Expo, Supabase (Postgres), OpenAI Whisper
  - **Developer Tools:** Git, AWS (EC2), Jira, VS Code, JetBrains IDEs, Visual Studio, Microsoft Dynamics 365
- Footer line (11.5px muted): `Off the page:` + [yellow highlight → About] `motorsport / F1, music, esports →`

Entry row pattern: flex, `justify-content:space-between`, `gap:12px`, `flex-wrap:wrap`; bullets `padding-left:18px`, `gap:2px`.

### Shared project-page header row
Flex, space-between, mono 12px `#5f5b54`. Left: **`← back to CV`** pill (`border:1px solid #d8d4cc`, radius 999px, `padding:6px 14px`, ink colour, `white-space:nowrap; flex:none`, hover bg `#f0ede4`). Right: date (none on About).

### 2. Crumbify
- Header right: `Mar. 2026 – Present`
- H2 `Crumbify`
- Intro (16.5px): `An iOS app for finding food through the people you follow. I designed and built it on my own, got it through App Store review, and run Crumbify Ltd as the sole director.`
- **CTA row** (flex, gap 12, wrap). Each button `flex:1 1 200px`, centred, `padding:16px 24px`, radius 999px, 16px 600:
  - `Get it on the App Store ↗` (bg `#1c1b19`, text `#fbfaf6`)
  - GitHub icon (20px, Lucide "github", stroke 2) + `View on GitHub` (bg `#24292f`, white)
- **Screenshots**: grid `repeat(3, minmax(0,130px))`, `gap:18px`, `padding:10px 0`. Each is 9:19.5, radius 18, with a strip of tape (`top:-8px; left:30%; width:40%; height:18px`). Rotations: `-2deg`, `1deg translateY(10px)`, `-1deg`.
- **UNDER THE HOOD** (11px uppercase label), then rows: grid `110px 1fr`, `gap:16px`, `padding:9px 0`, `border-top:1px solid #e0dbd0`, 14px/1.5. Left: mono 12px muted key. Right: sentence, then mono 12px muted tech line.
  | Key | Sentence | Tech |
  |---|---|---|
  | App | Built in React Native and Expo with TypeScript. App state lives in Zustand stores. | React Native · Expo · TypeScript · Zustand |
  | Data | Every read comes from an on-device SQLite database that syncs to Postgres in the background, so the app works offline and does very little fetching on cold start. | SQLite · Supabase Postgres |
  | Security | Supabase handles auth, and row-level security on the Postgres side decides what each user can read and write. | Supabase Auth · RLS |
  | Revenue | Subscriptions run through RevenueCat, with AdMob for ads. | RevenueCat · AdMob |
  | Shipping | TestFlight beta rounds, App Store review and EU DSA trader compliance, all done solo. | TestFlight · App Store Connect |

### 3. City Racing
- Header right: `Aug. 2025 – July 2026`
- H2 `City Racing`; mono 13px muted `Formula Student · Data Acquisition & Firmware Engineer`
- Car photo: full width, **2:1**, `rotate(-1deg)`, two tape strips at top (left 12% / right 12%, 22% wide, 20px tall, `top:-9px`).
- `**Live telemetry.** Python (cantools, mcap) decodes CAN bus frames from the car and streams them over WebSocket into Foxglove, which gives the team an F1-style live dashboard.`
- Two-column grid (1fr 1fr, gap 24, centred): left `**GPS lap tool (C++).** Projects logged GPS points onto satellite maps of the FSUK circuit, so you can see exactly where the simulated lap and the real one split.`; right: polaroid (`padding:10px 10px 28px`, `rotate(2deg)`) with a **1:1** GPS map image, zoomed ~1.8× and centred on the track (see Assets).
- `Here's the team website → csg.racing` (link to https://csg.racing)

### 4. Video bot
- Header right: `2025`
- H2 `Audio in, lyric video out.`
- Grid `minmax(0,200px) 1fr`, gap 32, centred:
  - Left: polaroid (`padding:8px 8px 26px`, `rotate(-2deg)`) with a **9:16** frame from a finished lyric video.
  - Right: stat list, each row `display:flex; align-items:baseline; gap:14px; padding:12px 0; border-bottom:1px solid #e0dbd0`. Number: serif 600 `clamp(34px,5vw,48px)`, `min-width:3.4ch`. Label: mono 13px muted. Rows: **60M+** views, **7.1M** likes, **25K** followers. Then (margin-top 14) mono 13px link `@apollovaaa on TikTok ↗` → https://www.tiktok.com/@apollovaaa
- P: `A batch pipeline in Python. ffmpeg pulls and trims the audio, Whisper transcribes it with word-level timestamps, and a JSX script drives After Effects to build the composition, grade the colours and sync the lyrics. It runs 50+ jobs at a time and renders on AWS EC2, so there's no manual editing left.`
- P: `Finished videos go to a separate Next.js service that schedules and posts them to TikTok and YouTube.`
- GitHub button: `#24292f`, white, radius 10, `padding:14px 24px`, 15.5px 600, icon 20px, `View the code on GitHub`.

### 5. About
- Header: only the back pill (no right label).
- Two polaroids side by side (grid 2 cols, gap 24): `padding:12px 12px 44px`, 1:1 photos. Left `rotate(-2.5deg)`, caption mono 12 muted `London, UK`. Right `rotate(2deg) translateY(18px)`, caption `Paris, France`. Captions absolutely positioned `bottom:12px; left:14px`.
- H2 `Off the page` (margin-top 24)
- P: `CS at City, University of London. When I'm not shipping, I'm watching F1, deep in music, or playing something competitive.`
- Chips (mono 12.5, `border:1px solid #d8d4cc`, radius 999, `padding:5px 12px`): `motorsport / f1`, `music`, `esports`
- `Say hi at alibars999@gmail.com` (email is a mailto link)

### Divider tabs
- Container: absolute at the stage's right edge (`top:0; right:0; width:0`), z-index **`m+1`** (under the top sheet, so they look tucked under the page).
- 5 buttons, top to bottom: `cv`, `crumbify`, `racing`, `video bot`, `about`. `top = 48 + i*120 px`.
- Each: `position:absolute; left:-12px; width:46px; height:108px; padding-left:12px; border:0; border-radius:0 8px 8px 0; box-shadow:2px 2px 5px rgba(0,0,0,.14)`; mono 11px, `letter-spacing:.08em`, uppercase, `writing-mode:vertical-rl`; background from the tab colours.
- Active (current top sheet): `font-weight:600`, `translateX(0)`. Inactive: 400, `translateX(-6px)`. Hover: `translateX(3px)`, `transition:transform .2s`.
- While a sheet is moving: the whole tab layer is `opacity:0; pointer-events:none` (`transition:opacity .2s`).
- Shown only after the intro is dismissed.

### Sticky note hint
Shown after intro when the CV is on top and the user hasn't navigated yet. `position:absolute; top:-22px; right:28px; width:210px; background:#fff3a8; padding:18px 18px 20px; box-shadow:0 8px 18px rgba(0,0,0,.2)`, mono 12.5/1.55. Enters with keyframe `noteIn` (from `opacity:0; translateY(12px) rotate(8deg)` to `opacity:1; translateY(0) rotate(4deg)`, .6s). Copy: `psst: click anything highlighted (or a tab) to pull that page from the pile.` Hidden forever after first navigation.

---

## Interactions & behaviour

### Intro sequence
1. `phase='off'`: the entire stage is at `translateX(-130vw)`.
2. After 120ms, `phase='push'`: stage transitions to `translateX(0)` over **1.3s `cubic-bezier(.2,.75,.25,1)`**. The title page sits on top at `rotate(.4deg)`.
3. Waits for a **click on the title page** (nothing else dismisses it).
4. `phase='pull'`: title page goes to `translate(-130vw,3%) rotate(-7deg)` over **.95s `cubic-bezier(.55,0,.8,.4)`** (ease-in, like being whisked away).
5. After 1000ms, `phase='done'`: title unmounted; tabs + sticky note appear.
- A setting (`intro:false`) skips straight to `done` (useful for dev / returning visitors; consider remembering "seen" in localStorage).

### Bringing a sheet to the top (`bring(k)`)
Guard: ignore if the intro isn't finished, a move is already running, or `k` is already on top.
1. `moving = {k, prev: top, stage:'out'}`. Sheet `k` becomes visible and animates from the top-sheet position to `translate(112%,-3%) rotate(5deg)` with **z = m+1** (it slides out from *under* the current top sheet, which is at z = m+2). The previous top keeps its content visible. Tabs fade out. If `scrollY > 80`, smooth-scroll to top.
2. At **440ms**: `stage:'in'`. Sheet `k` gets **z = m+3** and animates back to `translate(0,0) rotate(-.4deg)`, landing over the previous top.
3. At **960ms**: `top = k`, `moving = null`. Previous top is hidden/unmounted. Tabs fade back in.
- Sheet transition: `transform .45s cubic-bezier(.4,0,.2,1)`.
- The previous top **must stay rendered until the new sheet fully covers it**.
- Filler sheets and the thickness block **never move**.
- Triggers: CV highlights, tabs, `← back to CV` buttons, and the **Esc** key (to CV).

### Theme
`Lights off/on` toggles desk mode; it's a global state (`dark`). Default comes from the `desk` setting ('light'). Consider persisting to localStorage and respecting `prefers-color-scheme`.

### Hover states
- Highlights: solid, darker highlighter colour.
- Pills: bg `#f0ede4`.
- Buttons: see tokens.
- Links: `#8a5a00`.
- Keyboard focus: add a visible `outline:2px solid #1c1b19; outline-offset:2px` (the prototype doesn't define one; please add it).

### Responsive
- The stage is `min(760px, 100%)`. Padding uses `clamp`.
- At narrow widths the pile still works (sheets slide out off-screen right; the root has `overflow-x:hidden`).
- For < ~600px, recommended: tabs move to a horizontal row above the pile (they'd clip otherwise), CV rows already wrap, and the Video/Racing two-column grids collapse to one column.
- Pages must never clip content: if content exceeds A4 at a given width, let the stage grow (aspect-ratio with no explicit min-height does this).

### Accessibility
Highlights are `span`s with onClick in the prototype. Make them real `<button>`s (or `<a href="#crumbify">`) styled inline. Add `aria-current` on the active tab. Add `prefers-reduced-motion`: skip the intro slide and make sheet swaps an instant cross-fade.

### Routing / deep links (recommended)
Mirror the top sheet in the URL hash or path (`/`, `/#crumbify`, `/#racing`, `/#video`, `/#about`). A deep link should skip the title page and open that sheet directly. Update `document.title` per sheet.

## State
```ts
type SheetId = 'cv' | 'crumbify' | 'racing' | 'video' | 'about';
phase: 'off' | 'push' | 'pull' | 'done'
top: SheetId                         // default 'cv'
moving: null | { k: SheetId; prev: SheetId; stage: 'out' | 'in' }
dark: boolean
touched: boolean                     // hides the sticky note after first navigation
settings: { intro: boolean = true; pileSize: number = 16; desk: 'light' | 'dark' = 'light' }
```
Z-index per content sheet: moving/out → m+1; top or prev (during move) → m+2; moving/in → m+3; else hidden.

## Assets (`assets/`)
All images are already cropped/downscaled user uploads (WebP). Keep a real photo treatment with **no filters**. Replace with higher-res originals from Ali where noted.
| File | Where | Frame | Notes |
|---|---|---|---|
| `cv-crumb-1/2/3.webp` | Crumbify screenshots | 9:19.5, cover | App screenshots |
| `cv-racing-car.webp` | Racing hero | 2:1, cover | Car on white bg |
| `cv-racing-gps.webp` | Racing GPS polaroid | 1:1 | Stored crop: scale 1.8, offset x +18%, y +50% (i.e. zoomed in and shifted so the track is centred). **Low-res (161×348)**: get the original screenshot from Ali. |
| `cv-video-sample.webp` | Video polaroid | 9:16, cover | Frame from a finished lyric video |
| `cv-portrait.webp` | About left, "London, UK" | 1:1, cover | |
| `cv-activity.webp` | About right, "Paris, France" | 1:1, cover | |
| `Ali_Bars_Resume.pdf` | Source CV | | Content source. The "Download CV (PDF)" link should point to the **mobile-focused** CV version Ali provides (a phone number is on this PDF; **the site itself must not show a phone number**). |

Icons: Lucide `github` (inline SVG, stroke 2). Arrows are text glyphs `→ ↗ ←`.

## Placeholders still to fill (ask Ali)
- App Store URL (Crumbify)
- GitHub repo URLs: Crumbify, Video pipeline, Automated Publishing Platform
- LinkedIn `https://linkedin.com/in/alibars`, GitHub profile `https://github.com/AliBars19` (confirm)
- Download CV PDF (mobile-focused version)
- City Racing CV entry: "Present" vs "July 2026", and the csg.racing bullet (see open question)

## Files
- `reference/Interactive CV v3.dc.html`: the final prototype (markup + logic class at the bottom).
- `reference/support.js`, `reference/image-slot.js`: prototype runtime only. Don't port.
- `reference/.image-slots.state.json`: the images and their crops used by the prototype.
- `assets/`: extracted images + source CV PDF.
- `content.json`: all copy as structured data, ready to drop into the new codebase.
- `screenshots/`: reference captures of every state (title page, each sheet top and bottom, dark desk, and a mid-transition frame showing a sheet sliding out from under the top page). Note: the capture tool can't render the images inside the prototype's image slots, so photo areas may look empty in screenshots. Use `assets/` + `reference/` for the real images.

## Explored and rejected (context only; don't build)
- A warm, rounded, terracotta "Organic" design system landing page (felt templated).
- A terminal/shell boot intro that "printed" the CV (felt overdone).
- A book with a 3D page-turn (replaced by the pile).
