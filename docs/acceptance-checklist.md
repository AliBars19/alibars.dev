# alibars.dev acceptance checklist

This file lists the acceptance criteria for the built alibars.dev site ("The Pile" interactive CV). It is derived from `design_handoff_alibars_portfolio/README.md` (authoritative, high fidelity), `content.json` (copy), the prototype `reference/Interactive CV v3.dc.html` (inline styles and the `class Component` logic), and the owner decisions in `docs/implementation-notes.md`, which override the handoff wherever they conflict. The review phase uses it: each line is one atomic, independently checkable requirement with the exact value to check and a suggested way to verify it. Items marked `extra-` were added or corrected by the completeness pass. Where the README and the prototype disagree, the note says so and names which value wins.

Owner overrides in force (these beat README, prototype and content.json):
- City Racing ends **July 2026** on the CV and the Racing page; the csg.racing bullet is **removed from the CV** only.
- All missing URLs live in ONE content file (`src/content.ts`) with `TODO` markers; the buttons still render.
- Download CV link is `/Ali_Bars_CV.pdf` (phone number redacted copy in `public/`).
- Intro plays on every fresh load at `/`; deep links (`/#crumbify` etc.) skip it. No "seen intro" localStorage flag.
- Theme persists in localStorage; first visit follows `prefers-color-scheme`.
- Next.js App Router + TypeScript + CSS Modules, npm, static export (`output: 'export'`).
- En dashes stay in date ranges; no em dashes anywhere. The Crumbify-app frontend rules (no letter-spacing, no en dashes) do NOT apply to this site.

---

## 1. Global layout, header, typography, tokens

- [ ] gl-01: Root wrapper has `min-height:100vh`, `overflow-x:hidden`, `font-family:'IBM Plex Sans',system-ui,sans-serif`, `color:#1c1b19`, `transition:background .5s`. (verify: code grep on the root layout element)
- [ ] gl-02: Light desk (default when no stored/OS preference says dark) background is solid `#d3ccbf`; header ink `#1c1b19`. (verify: browser, computed styles in light mode)
- [ ] gl-03: Dark desk background is `radial-gradient(ellipse at 50% 0%, #34302b 0%, #161513 70%)`; header ink `#e8e4dc`. (verify: browser, computed styles in dark mode)
- [ ] gl-04: Desk background transitions over `.5s`; the header text colour transitions with `transition:color .5s`. (verify: code grep for both transitions)
  - note: in the prototype only the header gets the dark ink (`deskInk`); the root `color` stays `#1c1b19`. Sheets, tabs and the sticky note do not change colour.
- [ ] gl-05: Paper (`#fbfaf6`) and filler tones do not change between light and dark desk. (verify: toggle theme, compare sheet computed background)
- [ ] gl-06: Header: `display:flex; align-items:center; gap:16px; padding:20px 28px; font-size:13px; flex-wrap:wrap; position:relative; z-index:100`. (verify: code grep)
- [ ] gl-07: Header left item is the text `alibars.dev` in IBM Plex Mono with `margin-right:auto`. (verify: code grep + visual)
- [ ] gl-08: Header link text is exactly `Download CV (PDF)`, `color:inherit`, underline kept, `href="/Ali_Bars_CV.pdf"`, and it downloads the file (e.g. `download` attribute) rather than being intercepted by the sheet router. (verify: code grep; click in browser)
  - note: prototype href is `#`, content.json has `TODO`; owner decision `/Ali_Bars_CV.pdf` wins.
- [ ] gl-09: Theme toggle is a `<button>`: `font:inherit; color:inherit; background:none; border:1px solid currentColor; border-radius:999px; padding:6px 14px; cursor:pointer; opacity:.8; white-space:nowrap`. (verify: code grep)
- [ ] gl-10: Theme toggle label is exactly `Lights off` while the light desk is active and `Lights on` while the dark desk is active (prototype: `dark ? 'Lights on' : 'Lights off'`). (verify: unit test both states)
- [ ] gl-11: `<main>`: `display:flex; justify-content:center; padding:28px 64px 140px 20px`. (verify: code grep)
- [ ] gl-12: Stage: `position:relative; width:min(760px,100%); display:grid; aspect-ratio:1/1.414`. (verify: code grep)
- [ ] gl-13: Every stacked element (thickness block, fillers, 5 content sheets, title page) uses `grid-area:1/1`. (verify: code grep)
- [ ] gl-14: Stage never clips content: no fixed `height`, `max-height` or `overflow:hidden` on the stage or sheets; a sheet taller than A4 grows the grid row. (verify: browser at 360px, 600px, 760px width, every sheet's last line is visible)
  - note (corrected): the prototype computes `maxH`/`stageH` but never binds it in markup; a measured-height mechanism is NOT required. Aspect-ratio with no explicit min-height is the intended mechanism.
- [ ] gl-15: Each of the 5 sheets fits within A4 at 760px stage width (no growth needed at desktop width). (verify: browser screenshots at 760px stage width)
- [ ] gl-16: Fonts loaded: IBM Plex Mono 400/500, IBM Plex Sans 400/500/600, Source Serif 4 with opsz axis 8..60 at 500/600. (verify: code grep of next/font or stylesheet link)
- [ ] gl-17: Title-page H1 `letter-spacing:-.02em`; CV H1 `letter-spacing:-.01em`. (verify: code grep)
  - note: project H2s and the About H2 have no letter-spacing in the prototype although README says headings use -.01em to -.02em. Prototype (none) is the pixel reference; either is acceptable if consistent.
- [ ] gl-18: Serif stacks are `'Source Serif 4',Georgia,serif`; mono stacks are `'IBM Plex Mono',monospace`. (verify: code grep)
- [ ] gl-19: Mono is used for header brand, back pills, project header dates, tab labels, sticky note, polaroid captions, stat labels, TikTok link, chips, Crumbify spec keys and tech lines. (verify: code grep)
- [ ] gl-20: Scale: title name `clamp(64px,13vw,120px)`/.92; project H2 `clamp(38px,6vw,52px)`/1; About H2 `40px`/1.1; CV H1 `clamp(32px,4.5vw,40px)`/1; CV body 11.5px/1.45; project body 15.5px/1.6; Crumbify intro 16.5px/1.6. (verify: code grep)
- [ ] gl-21: Design tokens present as named values: paper `#fbfaf6`, ink `#1c1b19`, muted `#5f5b54`, faint `#8a857c`, rule `#d8d4cc`, row rule `#e0dbd0`, desk light `#d3ccbf`, desk ink dark `#e8e4dc`, link hover `#8a5a00`, sticky note `#fff3a8`, tape `rgba(240,232,200,.8)`, pill hover `#f0ede4`. (verify: code grep in tokens/CSS variables)
- [ ] gl-22: Sheet base: `background:#fbfaf6; box-shadow:0 2px 4px rgba(0,0,0,.08),0 14px 30px rgba(0,0,0,.16); position:relative; display:flex; flex-direction:column; transition:transform .45s cubic-bezier(.4,0,.2,1)`; padding `clamp(28px,5vw,56px)`, CV padding `clamp(24px,4.5vw,48px)`. (verify: code grep)
- [ ] gl-23: Each sheet's inner content wrapper has `flex:none` (stops wrapped rows collapsing). (verify: code grep)
- [ ] gl-24: Keyboard focus: every interactive element shows `outline:2px solid #1c1b19; outline-offset:2px` on `:focus-visible` (not in the prototype; must be added). (verify: Tab through page, inspect computed outline)
- [ ] gl-25: Responsive: stage stays `min(760px,100%)` and the page never scrolls horizontally, including while a sheet slides to `translate(112%,...)`. (verify: e2e at 375px, trigger bring(), assert `scrollWidth <= innerWidth`)
- [ ] gl-26: Below ~600px, divider tabs move to a horizontal row above the pile instead of clipping off the right edge. (verify: browser at 375px)
- [ ] gl-27: No em dash (U+2014) anywhere in rendered copy or content source; date ranges use en dash (U+2013) with spaces (`Sept. 2024 – July 2027`). (verify: grep `src/` and built `out/` for U+2014 returns 0)
- [ ] gl-28: Theme persists in localStorage; with no stored value, initial theme follows `prefers-color-scheme: dark`; a stored value overrides the OS preference. (verify: e2e with cleared storage + emulated colour scheme, toggle, reload)
- [ ] gl-29: No horizontal scroll at the document level: `html`/`body` have no overflow beyond the viewport at any width. (verify: devtools computed overflow; e2e scrollWidth check)
- [ ] extra-gl-30: Global base CSS: `html,body{margin:0}`, `*{box-sizing:border-box}`. (verify: code grep global CSS)
- [ ] extra-gl-31: Global link style: `a{color:#1c1b19;text-underline-offset:3px}` and `a:hover{color:#8a5a00}`. (verify: code grep; hover a plain link such as csg.racing)
- [ ] extra-gl-32: No flash of the wrong theme on load: with a stored or OS dark preference, the first painted frame already shows the dark desk (e.g. inline pre-hydration script setting a data attribute/class). (verify: throttled reload with dark stored, screenshot first paint)
  - note: static export renders HTML at build time, so a React-state-only theme will flash light first.
- [ ] extra-gl-33: Document has `<html lang="en">`, a viewport meta `width=device-width, initial-scale=1`, and a default `<title>`. (verify: inspect built `out/index.html`)
- [ ] extra-gl-34: Header `Download CV (PDF)` and all other header items stay above the pile (header z-index 100 beats the sticky note at 90). (verify: visual, note never covers header)

## 2. The pile (thickness, fillers, stacking)

- [ ] pile-01: Thickness block background `repeating-linear-gradient(to bottom,#efebe1 0 2px,#d6cfc0 2px 3px)`. (verify: code grep)
- [ ] pile-02: Thickness block `transform:translate(5px, Tpx)` with `T = round(min(pileSize,60)*0.9)+4`. (verify: code grep + unit test)
  - note: the clamp here is 60, not the filler clamp of 8. Reusing `m` gives T=11 instead of 18.
- [ ] pile-03: With default pileSize 16, T = 18. (verify: unit test)
- [ ] pile-04: Thickness block `box-shadow:0 18px 40px rgba(0,0,0,.28)`. (verify: code grep)
- [ ] pile-05: Filler count `m = min(pileSize, 8)`; default pileSize 16 gives exactly 8 fillers. (verify: unit test; DOM count)
- [ ] pile-06: Fillers are blank (no child nodes). (verify: DOM inspection)
- [ ] pile-07: Filler backgrounds cycle `#f6f3ec, #f1ede3, #f8f6f0, #eeeadf` by `i % 4`. (verify: unit test)
- [ ] pile-08: Filler border `1px solid rgba(0,0,0,.07)`. (verify: code grep)
- [ ] pile-09: Filler z-index is `i+1` (1..m). (verify: unit test)
- [ ] pile-10: Jitter hash verbatim: `i=0; for ch of id: i=(i*31+ch.charCodeAt(0))%997`. (verify: unit test against prototype outputs for `f0`..`f7`)
- [ ] pile-11: Jitter `r=(((i*37)%13)-6)*0.55` deg, `x=(((i*53)%9)-4)*3.5` px, `y=(((i*29)%7)-3)*2.5` px. (verify: unit test)
- [ ] pile-12: Filler i uses id `'f'+i`; transform string `translate(${x}px,${y}px) rotate(${r}deg)` in that order. (verify: code grep + unit test)
- [ ] pile-13: Jitter is deterministic (no `Math.random`), identical across renders and reloads, and independent of `top`, `moving` and `dark`. (verify: code review; snapshot before/after navigation)
- [ ] pile-14: Thickness block and fillers have no transition and never move during navigation or theme toggles. (verify: e2e snapshot of their transforms before/during/after bring())
- [ ] pile-15: Content sheets not on top and not mid-transition are `visibility:hidden` with NO children mounted. (verify: DOM inspection, e.g. About while CV is top has an empty sheet element)
- [ ] pile-16: The visible pile looks identical regardless of which sheet is on top. (verify: screenshot diff of pile edges with cv vs about on top)
- [ ] pile-17: Content sheet z-index: moving/out `m+1`; top (not moving) or prev (during move) `m+2`; moving/in `m+3`; otherwise hidden (z 0). (verify: unit test of the sheet-state function, all 4 branches)
- [ ] pile-18: Divider tabs container z-index `m+1` (9 by default), so tabs sit under the top sheet. (verify: code grep; visual: tabs tucked under page edge)
- [ ] pile-19: Title page z-index `m+10` (18 by default). (verify: code grep)
- [ ] pile-20: Sticky note z-index is the literal `90`, not m-based. (verify: code grep)
- [ ] pile-21: Back-to-front DOM/stack order: thickness, fillers, content sheets, tabs, title page, sticky note. (verify: DOM order + z-index review)
- [ ] pile-22: Resting top-sheet transform is exactly `translate(0,0) rotate(-.4deg)`. (verify: code grep)
- [ ] extra-pile-23: Content sheet DOM order (for equal z-index ties) matches the prototype: About, Video, Racing, Crumbify, CV. (verify: DOM inspection)
  - note: low risk because z-index differs for every visible sheet, but it keeps parity with the prototype.

## 3. Intro (title page)

- [ ] intro-01: Title page is a sheet in the stage cell (`grid-area:1/1; position:relative`), `cursor:pointer`, background `#fbfaf6`, padding `clamp(28px,5vw,56px)`, flex column, base sheet box-shadow. (verify: code grep)
- [ ] intro-02: The whole title page is the click target (not a nested button), and it lives inside the stage so it rides the push-in animation with the pile. (verify: code review)
- [ ] intro-03: Kicker `vol. 01`: IBM Plex Mono 12px `#5f5b54` in a flex row at top left. (verify: code grep)
- [ ] intro-04: Name/line/cta column: flex column, `gap:20px`, `margin-top:clamp(80px,14vw,150px)`. (verify: code grep)
- [ ] intro-05: H1 `Ali Bars`: serif 600, `clamp(64px,13vw,120px)`, `letter-spacing:-.02em`, `line-height:.92`, `margin:0`. (verify: code grep)
- [ ] intro-06: Line `My name is Ali, and I build things.`: 20px, `max-width:440px`, `line-height:1.45`, `text-wrap:pretty`, `margin:0`. (verify: copy grep + style)
- [ ] intro-07: CTA `click to open →` (real → glyph): mono 12px `#5f5b54`, `margin-top:24px`. (verify: copy grep)
- [ ] intro-08: Title resting transform `rotate(.4deg)`; title transition `transform .95s cubic-bezier(.55,0,.8,.4)`. (verify: code grep)
- [ ] intro-09: Phase type is exactly `'off' | 'push' | 'pull' | 'done'`. (verify: code grep)
- [ ] intro-10: On a fresh load at `/`, phase starts `'off'` with the stage at `translateX(-130vw)`. (verify: unit test initial state)
- [ ] intro-11: After exactly 120ms, phase becomes `'push'`; stage goes to `translateX(0)` with `transition:transform 1.3s cubic-bezier(.2,.75,.25,1)`. (verify: fake-timer unit test + code grep)
- [ ] intro-12: Clicking the title page only acts when phase is `'push'`; it clears pending timers and sets `'pull'`; title animates to `translate(-130vw,3%) rotate(-7deg)`. (verify: unit test pull() in off/pull/done is a no-op)
- [ ] intro-13: 1000ms after pull, phase becomes `'done'` and the title page is unmounted. (verify: fake-timer test; DOM check)
- [ ] intro-14: Only a click (or keyboard activation of the same control, see intro-17) dismisses the title: no timer auto-dismiss, no Esc/other key skip. (verify: code review; wait 10s on title, still present)
- [ ] intro-15: Tabs and sticky note appear only when phase is `'done'`. (verify: DOM during intro has no tabs/note)
- [ ] intro-16: OWNER: intro plays on every fresh load at `/` (no "seen" flag in localStorage); deep links `/#crumbify`, `/#racing`, `/#video`, `/#about` start in phase `'done'` with `top` set to that sheet and never show the title page. (verify: e2e load `/#racing`, title never appears; reload `/` twice, intro plays both times)
  - note: README's "consider remembering seen in localStorage" is overridden.
- [ ] intro-17: Title page is keyboard operable (real `<button>` or `role="button"` + `tabIndex=0` + Enter/Space), with the gl-24 focus outline. (verify: Tab + Enter dismisses)
- [ ] intro-18: `prefers-reduced-motion: reduce` skips the intro slide (no 1.3s push, no .95s pull transform). (verify: e2e `emulateMedia({reducedMotion:'reduce'})`)
  - note: whether reduced motion skips the title page entirely or shows it static with an instant dismiss is not specified; either is acceptable if no slide animation plays.
- [ ] extra-intro-19: On a deep-link load, the title page does not flash for a frame before hydration (static HTML must not paint the title page on top when a sheet hash is present, e.g. hide via pre-hydration script or render the intro client-only). (verify: throttled load of `/#about`, screenshot first paint)
- [ ] extra-intro-20: On a fresh `/` load, the pile is not visible at its final position before the push starts (no flash of the settled pile before `translateX(-130vw)` applies). (verify: throttled load, first-paint screenshot)
- [ ] extra-intro-21: `/#cv` behaviour is decided and consistent (either treated as `/` with intro, or as a deep link without intro) and logged in implementation-notes. (verify: e2e load `/#cv`)
  - note: owner decision names only non-CV sheets; README lists `/` for the CV. Unspecified, so flag rather than fail.
- [ ] extra-intro-22: Pending intro timers and the keydown listener are cleaned up on unmount. (verify: code review of effect cleanup)

## 4. CV sheet

- [ ] cv-01: CV sheet `<article>`: padding `clamp(24px,4.5vw,48px)`, `font-size:11.5px; line-height:1.45`. (verify: code grep)
- [ ] cv-02: Inner wrapper: `flex:none; display:flex; flex-direction:column; gap:18px`. (verify: code grep)
- [ ] cv-03: H1 `Ali Bars`: serif 600, `clamp(32px,4.5vw,40px)`, `letter-spacing:-.01em`, `line-height:1`, `margin:0`. (verify: code grep)
- [ ] cv-04: Tagline exactly `iOS engineer & founder of Crumbify. I build cool things.` at 14px. (verify: copy grep)
- [ ] cv-05: Contact row: `display:flex; flex-wrap:wrap; gap:4px 16px; font-size:11.5px; color:#5f5b54`; items in order `London, UK` (plain text), `alibars999@gmail.com` (`mailto:`), `linkedin.com/in/alibars` (`https://linkedin.com/in/alibars`), `github.com/AliBars19` (`https://github.com/AliBars19`). (verify: DOM + hrefs)
  - note: README prose shows ` · ` between items; the prototype has no separator glyphs, only the gap. Prototype wins.
- [ ] cv-06: Contact links are `color:#5f5b54` at rest. (verify: computed style)
- [ ] cv-07: No phone number anywhere on the site. (verify: grep `src/` and `out/` for digit runs like `07\d{3}` / `+44`)
- [ ] cv-08: Section labels (`h2`): `margin:0; font-size:11px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; border-bottom:1px solid #d8d4cc; padding-bottom:6px`; source text is title case (`Education`, `Experience`, `Projects`, `Technical Skills`). (verify: code grep; rendered uppercase)
- [ ] cv-09: Entry row: `display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap`. (verify: code grep)
- [ ] cv-10: Entry titles 600 13.5px; right column `color:#5f5b54; font-size:11.5px`; degree/org lines `font-style:italic`. (verify: code grep)
- [ ] cv-11: Lists: `margin:0; padding-left:18px`; experience/project lists add `display:flex; flex-direction:column; gap:2px`; the education modules list has no flex/gap. (verify: code grep)
- [ ] cv-12: Education 1: `City, University of London` / `London, UK`; italic `BSc Computer Science (Predicted First, 1:1)` / `Sept. 2024 – July 2027`; one bullet, bold `Relevant Modules:` then `Data Structures & Algorithms, Databases, Operating Systems, Systems Architecture, Network Systems, Language Processors, Team Project`. (verify: copy grep)
- [ ] cv-13: Education 2: `Compton Sixth Form` / `Sept. 2022 – June 2024`; italic `BTEC Applied Science (Distinction, Distinction), A Level Mathematics (A)` with no right column. (verify: copy grep)
- [ ] cv-14: Highlight base: `padding:1px 5px; margin:0 -3px; border-radius:3px; cursor:pointer; transition:background .2s`; trailing ` →` (internal) or ` ↗` (external) is inside the highlight. (verify: code grep)
- [ ] cv-15: Yellow highlight `linear-gradient(100deg,rgba(255,221,64,0) 1%,rgba(255,221,64,.85) 3%,rgba(255,221,64,.55) 60%,rgba(255,221,64,.8) 97%,rgba(255,221,64,0) 99%)`; hover `rgba(255,196,40,.95)`. (verify: code grep; hover)
- [ ] cv-16: Purple highlight `linear-gradient(100deg,rgba(186,160,255,0) 1%,rgba(186,160,255,.8) 3%,rgba(186,160,255,.5) 60%,rgba(186,160,255,.75) 97%,rgba(186,160,255,0) 99%)`; hover `rgba(160,125,250,.9)` with text colour staying inherit (not the `#8a5a00` link hover). (verify: code grep; hover)
- [ ] cv-17: Purple highlight is an `<a>`: `display:inline-flex; align-items:center; gap:6px; color:inherit; text-decoration:none`, with a 14x14 Lucide github SVG before `Automated Publishing Platform ↗`. (verify: code grep)
  - note: prototype stroke-width is 2.2 on this 14px icon; README says Lucide stroke 2 generally. Prototype 2.2 is the pixel reference; 2 is acceptable.
- [ ] cv-18: Experience 1: yellow `Founder & Lead Engineer →` opens Crumbify / `Mar. 2026 – Present`; italic `Crumbify Ltd` / `London, UK`; exactly 3 bullets matching content.json. (verify: copy grep; click test)
- [ ] cv-19: OWNER: Experience 2 dates read `Aug. 2025 – July 2026` (not `Present`). (verify: rendered text)
  - note: overrides prototype line 152, README line 121 and content.json.
- [ ] cv-20: OWNER: Experience 2 has exactly 2 bullets (telemetry pipeline; C++ GPS tool); the `Built and deployed the team site (csg.racing)...` bullet is absent from the CV. (verify: DOM bullet count 2; grep CV content for `csg.racing` returns 0)
- [ ] cv-21: Experience 2 title yellow `Data Acquisition & Firmware Engineer →` opens Racing; italic `City Racing (Formula Student)` / `London, UK`. (verify: copy + click)
- [ ] cv-22: Projects 1: title cell is a span containing the 600/13.5px yellow `Video Automation Pipeline →` (opens Video), a literal space, then italic `#5f5b54` `| Python, ffmpeg, OpenAI Whisper, JSX, AWS EC2`; right `2025`; 3 bullets. (verify: DOM + copy)
- [ ] cv-23: Projects 2: purple external `Automated Publishing Platform ↗` + italic muted `| Next.js, TypeScript, OAuth`; right `2025`; exactly 1 bullet; no sheet, no tab, never calls bring(). (verify: DOM; click causes no sheet transition)
- [ ] cv-24: Technical Skills: exactly 3 `<p style="margin:0">` lines, bold label with colon: `Languages: Python, Java, TypeScript, JavaScript, C++, SQL, C#, Go`; `Frameworks & Libraries: React, React Native, Next.js, Node.js, Expo, Supabase (Postgres), OpenAI Whisper`; `Developer Tools: Git, AWS (EC2), Jira, VS Code, JetBrains IDEs, Visual Studio, Microsoft Dynamics 365`. (verify: copy grep)
- [ ] cv-25: Footer `<p>` 11.5px `#5f5b54`: `Off the page: ` then yellow `motorsport / F1, music, esports →` (uppercase F1) with `color:#1c1b19`, opening About. (verify: DOM + click)
- [ ] cv-26: Every highlight that opens a sheet is a real `<button>` or `<a href="#id">`, not a `<span onClick>`, keeping the highlight look inline. (verify: DOM element types)
- [ ] cv-27: CV date strings use en dashes. (verify: grep for U+2013 in CV dates)
- [ ] extra-cv-28: CV internal spacing: header block `flex column gap:8px`; Education/Experience/Projects sections `flex column gap:9px`; Technical Skills section `gap:10px`; each entry block `flex column gap:3px`; skills lines container `gap:2px`. (verify: code grep)
- [ ] extra-cv-29: Fortnum & Mason does not appear anywhere (intentionally removed). (verify: grep `Fortnum` in `src/` and `out/` returns 0)
- [ ] extra-cv-30: Automated Publishing Platform href comes from the central content file (TODO marker until supplied) and still renders as a styled link. (verify: grep `src/content.ts`)

## 5. Shared project header, Crumbify sheet

- [ ] cr-01: Project header row: `display:flex; justify-content:space-between; align-items:center; font-family:'IBM Plex Mono'; font-size:12px; color:#5f5b54`. (verify: code grep)
- [ ] cr-02: Back pill text exactly `← back to CV`; `<button>`; `font:inherit; color:#1c1b19; background:none; border:1px solid #d8d4cc; border-radius:999px; padding:6px 14px; cursor:pointer; white-space:nowrap; flex:none`; hover background `#f0ede4`. (verify: code grep; hover)
- [ ] cr-03: Crumbify header date `Mar. 2026 – Present`. (verify: copy grep)
- [ ] cr-04: Crumbify inner wrapper `flex:none; display:flex; flex-direction:column; gap:22px`; section padding `clamp(28px,5vw,56px)`. (verify: code grep)
- [ ] cr-05: H2 `Crumbify`: serif 600, `clamp(38px,6vw,52px)`, `margin:8px 0 0`, `line-height:1`. (verify: code grep)
- [ ] cr-06: Intro exactly `An iOS app for finding food through the people you follow. I designed and built it on my own, got it through App Store review, and run Crumbify Ltd as the sole director.` at 16.5px/1.6, `text-wrap:pretty`, `margin:0`. (verify: copy grep)
- [ ] cr-07: CTA row `display:flex; gap:12px; flex-wrap:wrap`; App Store first, GitHub second. (verify: DOM order)
- [ ] cr-08: Each CTA `<a>`: `flex:1 1 200px; display:flex; align-items:center; justify-content:center; gap:10px; padding:16px 24px; border-radius:999px; font-size:16px; font-weight:600; text-decoration:none`. (verify: code grep)
- [ ] cr-09: App Store CTA `Get it on the App Store ↗`, bg `#1c1b19`, text `#fbfaf6`; hover bg `#3a3833`, text stays `#fbfaf6`. (verify: code grep; hover)
- [ ] cr-10: GitHub CTA: 20x20 Lucide github SVG (stroke-width 2, currentColor, fill none) + `View on GitHub`, bg `#24292f`, text `#fff`; hover bg `#3a4048`, text stays `#fff`. (verify: code grep; hover)
- [ ] cr-11: CTA hover must not turn text `#8a5a00` (the global `a:hover` rule must be overridden on buttons). (verify: hover each CTA, computed colour)
- [ ] cr-12: CTA hrefs (App Store, Crumbify repo) come from `src/content.ts` with `TODO` markers; both buttons render. (verify: grep content file)
- [ ] cr-13: Screenshot grid: `display:grid; grid-template-columns:repeat(3,minmax(0,130px)); gap:18px; padding:10px 0`. (verify: code grep)
- [ ] cr-14: Screenshots in order `cv-crumb-1/2/3.webp`; each `width:100%; aspect-ratio:9/19.5; object-fit:cover; border-radius:18px`; no CSS filters. (verify: code grep)
- [ ] cr-15: Screenshot wrappers `position:relative` with transforms `rotate(-2deg)`, `rotate(1deg) translateY(10px)`, `rotate(-1deg)` in order. (verify: code grep)
- [ ] cr-16: Each screenshot has a tape strip `position:absolute; top:-8px; left:30%; width:40%; height:18px; background:rgba(240,232,200,.8)`. (verify: code grep)
- [ ] cr-17: Under-the-hood wrapper `display:flex; flex-direction:column; margin-top:8px`; label `h3` `Under the hood`, `margin:0 0 6px; font-size:11px; font-weight:600; letter-spacing:.14em; text-transform:uppercase` (no border). (verify: code grep)
- [ ] cr-18: 5 rows in order App, Data, Security, Revenue, Shipping; each `display:grid; grid-template-columns:110px minmax(0,1fr); gap:16px; padding:9px 0; border-top:1px solid #e0dbd0; font-size:14px; line-height:1.5`. (verify: DOM + code grep)
- [ ] cr-19: Row key: mono 12px `#5f5b54`, `padding-top:2px`. Row value: flex column `gap:2px`, sentence (`text-wrap:pretty`) then mono 12px `#5f5b54` tech line. (verify: code grep)
- [ ] cr-20: Row copy exactly as content.json `crumbify.specs` (App/Data/Security/Revenue/Shipping sentences and tech lines with ` · ` separators). (verify: copy diff against content.json)
- [ ] cr-21: Crumbify tab colour `#f3e3a1`, label `crumbify`. (verify: code grep)

## 6. City Racing and Video bot sheets

- [ ] rv-01: Racing sheet uses the shared sheet base and inner wrapper `flex:none; display:flex; flex-direction:column; gap:22px`. (verify: code grep)
- [ ] rv-02: Racing header: back pill + `Aug. 2025 – July 2026`. (verify: copy grep)
- [ ] rv-03: H2 `City Racing`: serif 600, `clamp(38px,6vw,52px)`, `margin:8px 0 0`, `line-height:1`. (verify: code grep)
- [ ] rv-04: Subtitle `Formula Student · Data Acquisition & Firmware Engineer`: `margin:0; font-size:13px`, mono, `#5f5b54`. (verify: copy grep)
- [ ] rv-05: Car photo wrapper `position:relative; transform:rotate(-1deg)`; image `cv-racing-car.webp` full width, `aspect-ratio:2/1`, cover, no filter. (verify: code grep)
- [ ] rv-06: Two tape strips: `position:absolute; top:-9px; width:22%; height:20px; background:rgba(240,232,200,.8)`, one at `left:12%`, one at `right:12%`. (verify: code grep)
- [ ] rv-07: Telemetry paragraph 15.5px/1.6, `text-wrap:pretty`: bold `Live telemetry.` then `Python (cantools, mcap) decodes CAN bus frames from the car and streams them over WebSocket into Foxglove, which gives the team an F1-style live dashboard.` (verify: copy grep)
- [ ] rv-08: GPS grid `display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:24px; align-items:center`. (verify: code grep)
- [ ] rv-09: GPS paragraph: bold `GPS lap tool (C++).` then `Projects logged GPS points onto satellite maps of the FSUK circuit, so you can see exactly where the simulated lap and the real one split.` (verify: copy grep)
- [ ] rv-10: GPS polaroid `transform:rotate(2deg); background:#fff; padding:10px 10px 28px; box-shadow:0 6px 16px rgba(0,0,0,.18)`; image 1:1. (verify: code grep)
- [ ] rv-11: GPS image crop reproduces scale 1.8, offset x +18%, y +50% so the track is centred (e.g. `object-position`/`transform:scale(1.8)` inside an `overflow:hidden` frame). (verify: visual compare with `screenshots/07-racing-bottom.png` / prototype)
- [ ] rv-12: Closing line 15.5px `Here's the team website → ` + plain link `csg.racing` to `https://csg.racing` (no highlighter styling). (verify: DOM + href)
- [ ] rv-13: Racing tab label `racing`, colour `#cfe3c9`, top 288px. (verify: code grep)
- [ ] rv-14: Video sheet shared base; inner wrapper gap 22px; header back pill + `2025`. (verify: code grep)
- [ ] rv-15: Video H2 `Audio in, lyric video out.` with project H2 style. (verify: copy grep)
- [ ] rv-16: Video grid `display:grid; grid-template-columns:minmax(0,200px) minmax(0,1fr); gap:32px; align-items:center`. (verify: code grep)
- [ ] rv-17: Video polaroid `transform:rotate(-2deg); background:#fff; padding:8px 8px 26px; box-shadow:0 6px 16px rgba(0,0,0,.18)`; image `cv-video-sample.webp` 9:16, cover. (verify: code grep)
- [ ] rv-18: Stats column flex column; 3 rows in order `60M+ views`, `7.1M likes`, `25K followers`; each row `display:flex; align-items:baseline; gap:14px; padding:12px 0; border-bottom:1px solid #e0dbd0`. (verify: DOM + code grep)
- [ ] rv-19: Stat number serif 600 `clamp(34px,5vw,48px)`, `line-height:1`, `min-width:3.4ch`; label mono 13px `#5f5b54`. (verify: code grep)
- [ ] rv-20: TikTok link `@apollovaaa on TikTok ↗` to `https://www.tiktok.com/@apollovaaa`, `margin-top:14px`, mono 13px. (verify: DOM + href)
- [ ] rv-21: Two body paragraphs 15.5px/1.6 `text-wrap:pretty`, copy exactly as content.json `video.body[0]` and `video.body[1]`. (verify: copy diff)
- [ ] rv-22: Video GitHub CTA `<a>`: `align-self:flex-start; display:flex; align-items:center; gap:10px; background:#24292f; color:#fff; text-decoration:none; padding:14px 24px; border-radius:10px; font-size:15.5px; font-weight:600`; hover bg `#3a4048`, text `#fff`. (verify: code grep; hover)
- [ ] rv-23: Video CTA icon 20x20 Lucide github stroke 2 before `View the code on GitHub`; href from content file (TODO marker), button renders. (verify: code grep)
- [ ] rv-24: Video tab label `video bot` (sheet id `video`), colour `#f2cdbf`, top 408px. (verify: code grep)
- [ ] rv-25: Below ~600px, the Racing GPS grid and the Video polaroid/stats grid collapse to one column. (verify: browser at 375px)
- [ ] rv-26: No CSS filters on car, GPS or video images. (verify: grep `filter:` near image styles)
- [ ] rv-27: Deep links `/#racing` and `/#video` open those sheets directly without the intro. (verify: e2e)

## 7. About, divider tabs, sticky note

- [ ] atn-01: About inner wrapper `flex:none; display:flex; flex-direction:column; gap:22px`. (verify: code grep)
- [ ] atn-02: About header is only the back pill in a flex row (no right-hand span). Back pill: mono 12px set on the button, same pill styles as cr-02. (verify: DOM)
- [ ] atn-03: Polaroid grid `display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px; margin-top:12px; padding:0 4px`. (verify: code grep)
- [ ] atn-04: Left polaroid `transform:rotate(-2.5deg); background:#fff; padding:12px 12px 44px; box-shadow:0 6px 16px rgba(0,0,0,.18); position:relative`; image `cv-portrait.webp` 1:1 cover. (verify: code grep)
- [ ] atn-05: Right polaroid `transform:rotate(2deg) translateY(18px)`, same frame; image `cv-activity.webp` 1:1 cover. (verify: code grep)
- [ ] atn-06: Captions `position:absolute; bottom:12px; left:14px`, mono 12px `#5f5b54`: `London, UK` (left), `Paris, France` (right). (verify: code grep)
- [ ] atn-07: H2 `Off the page`: serif 600, fixed `font-size:40px`, `margin:24px 0 0`, `line-height:1.1` (not the project H2 clamp). (verify: code grep)
- [ ] atn-08: Body exactly `CS at City, University of London. When I'm not shipping, I'm watching F1, deep in music, or playing something competitive.` 16px/1.6, `text-wrap:pretty`, `margin:0`. (verify: copy grep)
- [ ] atn-09: Chips row `display:flex; gap:8px; flex-wrap:wrap`, mono 12.5px; chips `border:1px solid #d8d4cc; border-radius:999px; padding:5px 12px`; text in order `motorsport / f1` (lowercase f1), `music`, `esports`. (verify: copy grep)
- [ ] atn-10: Contact `Say hi at ` + link `alibars999@gmail.com` with `href="mailto:alibars999@gmail.com"`, 15.5px, `margin:0`. (verify: DOM)
- [ ] atn-11: About tab colour `#cdd9ef`, label `about`, top 528px. (verify: code grep)
- [ ] atn-12: Tabs container `position:absolute; top:0; right:0; width:0; z-index:m+1; transition:opacity .2s`. (verify: code grep)
- [ ] atn-13: 5 tabs top to bottom `cv`, `crumbify`, `racing`, `video bot`, `about`; `top = 48 + i*120` px (48, 168, 288, 408, 528). (verify: code grep)
- [ ] atn-14: Tab button: `position:absolute; left:-12px; width:46px; height:108px; border:0; border-radius:0 8px 8px 0; padding-left:12px; box-shadow:2px 2px 5px rgba(0,0,0,.14); cursor:pointer`; mono 11px, `letter-spacing:.08em`, `text-transform:uppercase`, `writing-mode:vertical-rl`, `color:#1c1b19`. (verify: code grep)
- [ ] atn-15: Tab colours: cv `#ebe6da`, crumbify `#f3e3a1`, racing `#cfe3c9`, video `#f2cdbf`, about `#cdd9ef`. (verify: code grep)
- [ ] atn-16: Active tab 600 + `translateX(0)`; inactive 400 + `translateX(-6px)`; hover `translateX(3px)`; `transition:transform .2s`. (verify: computed styles; hover)
- [ ] atn-17: While `moving` is non-null, tab layer `opacity:0; pointer-events:none`; otherwise `opacity:1; pointer-events:auto`. (verify: e2e during transition)
- [ ] atn-18: Tabs are not rendered until phase `'done'`. (verify: DOM during intro)
- [ ] atn-19: Active tab has `aria-current` (README requirement; prototype lacks it); inactive tabs do not. (verify: DOM after each navigation)
- [ ] atn-20: Each tab is a `<button>` with accessible name equal to its label (`cv`, `crumbify`, `racing`, `video bot`, `about`). (verify: accessibility tree)
- [ ] atn-21: Tab click calls bring(id), including the cv tab calling bring('cv'). (verify: e2e click each tab)
- [ ] atn-22: Sticky note: `position:absolute; top:-22px; right:28px; z-index:90; width:210px; background:#fff3a8; padding:18px 18px 20px; box-shadow:0 8px 18px rgba(0,0,0,.2)`; mono 12.5px/1.55. (verify: code grep)
- [ ] atn-23: `@keyframes noteIn{from{opacity:0;transform:translateY(12px) rotate(8deg)}to{opacity:1;transform:translateY(0) rotate(4deg)}}` applied as `animation:noteIn .6s both`. (verify: code grep)
- [ ] atn-24: Note copy exactly `psst: click anything highlighted (or a tab) to pull that page from the pile.` (verify: copy grep)
- [ ] atn-25: `showNote = phase==='done' && !touched && top==='cv'`; once any navigation happens it never returns in that page session, even after returning to CV. (verify: e2e navigate away and back)
- [ ] atn-26: `touched` is in-memory only and resets on reload. (verify: code review)
- [ ] atn-27: Sticky note is non-interactive (no close button, no click handler). (verify: code review)

## 8. Behaviour: navigation, theme, a11y, routing

- [ ] bh-01: bring(k) is a no-op when phase is not `'done'`, when `moving` is non-null, or when `k === top`. (verify: unit test each guard)
- [ ] bh-02: Valid bring(k) sets `moving={k, prev:top, stage:'out'}` and `touched=true` in one update. (verify: unit test)
- [ ] bh-03: Out stage: sheet k is visible, `transform:translate(112%,-3%) rotate(5deg)`, `z-index:m+1` (under the current top at m+2). (verify: computed styles mid-transition; compare `screenshots/14-dark-mid-transition.png`)
- [ ] bh-04: If `window.scrollY > 80` when bring() fires, `window.scrollTo({top:0, behavior:'smooth'})`; otherwise no scroll. (verify: unit test with mocked scrollY)
- [ ] bh-05: At 440ms, stage `'in'`: sheet k gets `z-index:m+3` and `transform:translate(0,0) rotate(-.4deg)`. (verify: fake-timer test)
- [ ] bh-06: At 960ms, `top=k` and `moving=null` in one update; prev is then hidden with children unmounted. (verify: fake-timer test)
- [ ] bh-07: The previous top stays visible with content mounted until 960ms. (verify: e2e DOM query at ~700ms)
- [ ] bh-08: Triggers: CV yellow highlights (to crumbify, racing, video, about), tabs (any sheet), every `← back to CV` pill (to cv), and the Esc key (to cv). (verify: e2e each trigger)
  - note (corrected): the extracted item listed an "about link" as a back-to-CV trigger; the About footer highlight opens About, it does not go to CV.
- [ ] bh-09: Esc only calls bring('cv') when phase is `'done'`. (verify: unit test keydown during push and during done)
- [ ] bh-10: The purple Automated Publishing Platform link never calls bring(). (verify: e2e)
- [ ] bh-11: Theme toggle flips `dark` and writes the new value to localStorage. (verify: e2e toggle then read storage)
- [ ] bh-12: Highlights, tabs, back pills, title page and theme toggle are keyboard reachable real controls with the gl-24 focus outline. (verify: keyboard walk-through)
- [ ] bh-13: `prefers-reduced-motion: reduce`: sheet swaps become an instant cross-fade instead of the translate/rotate slide; intro slide skipped. (verify: e2e with emulated reduced motion, no transform transition on sheets)
- [ ] bh-14: Deep links `/#crumbify`, `/#racing`, `/#video`, `/#about` open that sheet directly with phase `'done'` and no intro. (verify: e2e per hash)
  - note (corrected): no localStorage "seen intro" flag exists; that README suggestion is overridden by the owner.
- [ ] bh-15: URL hash mirrors `top` after each navigation (`#crumbify`, `#racing`, `#video`, `#about`; CV clears the hash or uses a consistent value) without a page reload. (verify: e2e `location.hash` after each bring)
- [ ] bh-16: `document.title` updates per sheet with a distinct title for each of the 5 sheets. (verify: e2e)
- [ ] bh-17: Content never clips at any width; the stage grows if a sheet exceeds A4. (verify: browser at 320px width, scroll to end of CV)
- [ ] bh-18: Hidden sheets contain no focusable elements (unmounted children satisfy this). (verify: Tab never lands inside a hidden sheet)
- [ ] bh-19: Download CV link is a plain file link, not intercepted by the hash router. (verify: click downloads `/Ali_Bars_CV.pdf`)
- [ ] bh-20: Hover rules apply in both themes: pills `#f0ede4`, plain links `#8a5a00`. (verify: hover in light and dark)
- [ ] extra-bh-21: Browser back/forward or a manual hash edit after load (`hashchange`) brings the matching sheet (respecting bring() guards), or the choice not to support it is logged in implementation-notes. (verify: e2e navigate tabs then press browser Back)
- [ ] extra-bh-22: bring() timers are cleared on unmount; rapid repeated clicks during a move do not queue extra moves. (verify: e2e triple-click a tab, exactly one transition)

## 9. Build, assets, content source

- [ ] extra-bd-01: `next.config.ts` sets `output: 'export'`; `npm run build` succeeds and produces `out/index.html` with no server-only features (no API routes, no middleware, no dynamic server rendering). (verify: run `npm run build`)
- [ ] extra-bd-02: Images work in the static export: either `next/image` with `images.unoptimized: true` or plain `<img>`; all 9 images load in `out/` served statically. (verify: serve `out/`, network tab shows 200 for every `.webp`)
- [ ] extra-bd-03: `public/Ali_Bars_CV.pdf` exists and is the redacted copy; the original `Ali_Bars_Resume.pdf` (with phone number) is not in `public/`, not in `out/`, and not committed. (verify: `ls public out`; `git ls-files | grep -i resume`)
- [ ] extra-bd-04: All copy and all URLs live in one content module (`src/content.ts`); every unknown URL (App Store, Crumbify repo, video pipeline repo, publishing platform repo) is marked `TODO` there and nowhere else. (verify: grep `TODO` across `src/`)
- [ ] extra-bd-05: Placeholder `TODO` hrefs do not produce a broken navigation that breaks the page (e.g. a relative `TODO` href would 404 inside the static site); the element still renders with its full styling. (verify: click each TODO CTA)
  - note: exact placeholder behaviour is unspecified; flag for owner rather than fail.
- [ ] extra-bd-06: The 9 images are the provided WebP assets (`cv-crumb-1/2/3`, `cv-racing-car`, `cv-racing-gps`, `cv-video-sample`, `cv-portrait`, `cv-activity`) with meaningful `alt` text. (verify: DOM `img[alt]`)
- [ ] extra-bd-07: Arrows are text glyphs (`→ ↗ ←`), not icons; the only icon is the Lucide github SVG. (verify: code grep)
- [ ] extra-bd-08: Copy in `src/content.ts` matches content.json verbatim except the two owner overrides (Racing CV dates, csg.racing CV bullet) and the resolved download href. (verify: scripted diff of strings)
