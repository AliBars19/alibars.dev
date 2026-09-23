# Review round 1 (workflow wf_d41f1cbf-3e6)

Confirmed 47, refuted 1.

## [critical] slice-01: Dark theme (stored or OS) is lost after hydration: the desk reverts to light while the toggle says 'Lights on'
- file: src/lib/useTheme.ts:25 (checklist gl-28 / extra-gl-32 / gl-10)
- expected: With localStorage 'alibars-desk'='dark' or OS prefers-color-scheme dark, the dark desk (radial-gradient #34302b/#161513, header ink #e8e4dc) stays after load and the label reads 'Lights on'.
- actual: The first paint is dark. Hydration then fails with React #418 (text mismatch: the server rendered 'Lights off', but useState(readInitialDark) gives 'Lights on' on the client). React client-renders the root and rewrites the <html> attributes, which removes data-desk and data-intro. The desk falls back to light #d3ccbf with ink #1c1b19, but the label still says 'Lights on', so the user has to click twice to get the dark desk back. The screen also flashes from dark to light.
- fix: src/lib/useTheme.ts: initialise with useState(false), then sync from document.documentElement.getAttribute('data-desk') in a useLayoutEffect (or use useSyncExternalStore with getServerSnapshot returning false), so the first client render matches the static HTML. In src/app/layout.tsx:57, add suppressHydrationWarning to <html>. Add an e2e test covering both stored-dark and OS-dark loads: check data-desk=dark, the gradient background and the 'Lights on' label, with no pageerror.

## [high] slice-02: Deep-link and reduced-motion loads throw a React hydration error (#418) and client-render the whole root
- file: src/lib/usePile.ts:39 (checklist intro-16 / extra-intro-19 / intro-18)
- expected: A deep link (/#racing, /#about, /#cv) or a reduced-motion load hydrates cleanly and starts in phase 'done'.
- actual: The useState initializer reads window.location.hash and matchMedia during hydration, so the client tree (phase 'done', tabs, no title page) differs from the static HTML (phase 'off', title page). React throws #418 (HTML mismatch), discards the server DOM and re-renders from the root. This also removes data-intro/data-desk from <html> (see slice-01), so the '.js-tabs {opacity:1 !important}' and '.js-title-page {display:none}' pre-hydration guards stop existing. It only works by accident.
- fix: src/lib/usePile.ts: initialise with { top:'cv', phase:'off', moving:null, touched:false }. In a useLayoutEffect on mount, if location.hash maps to a sheet or reduced motion is set, set top from sheetFromHash and phase 'done'. Otherwise schedule the 120ms push. The data-intro='skip' CSS keeps the title page hidden until that effect runs. Together with suppressHydrationWarning on <html> (slice-01), the attributes survive. Add an e2e assertion that no pageerror fires on '/#racing' or on reduced-motion loads.

## [high] behaviour-01: Dark theme from prefers-color-scheme or stored 'dark' never shows on load: React hydration strips data-desk from <html>, but the label still says 'Lights on'
- file: src/lib/useTheme.ts:25 (checklist gl-28 / bh-11)
- expected: With OS dark preference (no storage) or localStorage alibars-desk='dark', the page loads on the dark desk (radial-gradient #34302b to #161513, desk ink #e8e4dc) and the toggle label reads 'Lights on'. One click switches to light.
- actual: The page renders the light desk (#d3ccbf, header ink rgb(28,27,25), body background-image 'none') while the toggle reads 'Lights on'. The first click writes 'light' and nothing changes on screen, so the user has to click twice to get dark.
- fix: In src/lib/useTheme.ts, initialise with useState(false) so the server and client render match. In a mount useEffect (or useLayoutEffect), read document.documentElement's data-desk (or localStorage / the prefers-color-scheme media query) and call setDark. Add a useEffect on [dark] that runs document.documentElement.setAttribute('data-desk', dark ? 'dark' : 'light') so React state always re-applies the attribute. Also add suppressHydrationWarning on <html> in layout.tsx. Fix behaviour-06 too so no client re-render wipes <html> attributes.

## [high] code-01: Hydration mismatch strips data-desk from <html>: dark users (stored or OS dark) get the light desk while the toggle says 'Lights on'
- file: src/lib/useTheme.ts:25 (checklist gl-28 / extra-gl-32)
- expected: With localStorage 'alibars-desk'='dark' or prefers-color-scheme: dark, the desk stays dark after hydration (data-desk='dark', dark body background), and the first toggle click switches to light.
- actual: useTheme initialises from document.documentElement (line 10-12, 25), so the client's first render outputs 'Lights on' while the static HTML says 'Lights off'. React throws minified error #418 (text mismatch) and client-renders the whole root including <html>, which drops the data-desk/data-intro attributes the inline script set. The desk goes back to light (body bg rgb(211,204,191)) but the label still says 'Lights on'. The first click then sets 'light' / 'Lights off', so the toggle looks broken.
- fix: src/lib/useTheme.ts: initialise with useState(false) (the server-equal value) and sync from document.documentElement.getAttribute('data-desk') in a useLayoutEffect (or use useSyncExternalStore with getServerSnapshot returning false). Add suppressHydrationWarning to <html> in src/app/layout.tsx:57 so React keeps the script-set data-desk/data-intro attributes. Fixing code-02 is also required, or deep links will still trigger a root re-render.

## [high] code-02: Deep links and reduced-motion loads always cause a React hydration error (#418) and a full client re-render
- file: src/lib/usePile.ts:39 (checklist intro-16 / extra-intro-19)
- expected: Loading /#crumbify, /#cv, or any page with prefers-reduced-motion hydrates cleanly with no console error.
- actual: The useState initializer reads window.location.hash and matchMedia (lines 39-42, 27-30), so the first client render (phase 'done', top=hash sheet, no TitlePage) differs from the prerendered HTML (phase 'off', top 'cv', TitlePage present). React throws error #418 (HTML mismatch), discards the server HTML and re-renders the root on the client. That also removes the data-intro/data-desk attributes (see code-01).
- fix: src/lib/usePile.ts: make the lazy initializer return the server-equal state {top:'cv', phase:'off', moving:null, touched:false}. In a useLayoutEffect on mount, compute sheetFromHash(location.hash) and prefersReducedMotion(), then setState to {top, phase:'done'} when skipping. Otherwise schedule the 120ms push. The globals.css [data-intro=skip] rules already hide the intro before hydration, so there is no flash.

## [high] code-03: localStorage.setItem is not in a try/catch: the theme toggle crashes the whole app when storage is blocked or full
- file: src/lib/useTheme.ts:34 
- expected: Clicking 'Lights off' still switches the desk when storage throws (Safari private mode quota, blocked site data), and only the persistence is lost.
- actual: setItem throws inside the setState updater. React treats it as a render error and, with no error boundary, unmounts everything and shows 'Application error: a client-side exception has occurred'.
- fix: src/lib/useTheme.ts toggle: compute next = !dark (or read a ref), call setDark(next), then do document.documentElement.setAttribute('data-desk', ...) outside the updater, and wrap localStorage.setItem(STORAGE_KEY, ...) in try { } catch { }.

## [medium] slice-03: Divider tabs paint above the top sheet instead of tucked under its edge
- file: src/components/Pile.tsx:43 (checklist pile-18 / pile-21)
- expected: As in the prototype, the tabs container (z m+1=9) is a child of the transformed stage, so it sits under the top sheet (z m+2=10). Only the part of each tab past the page edge shows.
- actual: <Tabs> renders in .stageWrap, outside .js-stage. The stage has a transform (translateX(0)), so it forms its own stacking context at z auto. The nav's z-index 9 then beats the entire stage, and the tabs overlap the top sheet's right edge by about 12 to 21px.
- fix: src/components/Pile.tsx: move {showTabs ? <Tabs .../> : null} inside the .js-stage div, after the SHEET_RENDER_ORDER map and before TitlePage, keeping zIndex M+1. Adjust Tabs.module.css so the desktop container is 'position:absolute; top:0; right:0; width:0' relative to the stage. Re-check the <600px horizontal tab row. It may need to stay in flow, for example with a mobile-only static position through the media query. Check that the sticky note and the tabs don't overlap on mobile (see implementation-notes line 20).

## [medium] slice-04: In dark mode, the focus outline on every control inside the paper sheets turns near-white (#e8e4dc) on #fbfaf6 paper
- file: src/app/globals.css:113 (checklist gl-24)
- expected: Every interactive element shows 'outline:2px solid #1c1b19; outline-offset:2px' on :focus-visible.
- actual: '[data-desk=dark] :focus-visible { outline-color: var(--desk-ink-dark) }' applies to all descendants, including highlights, back pills, links and tabs on the paper. Their focus ring becomes rgb(232,228,220) on #fbfaf6, which is nearly invisible.
- fix: src/app/globals.css:113: change the selector to '[data-desk=\'dark\'] header :focus-visible' so only desk-level header controls get the light outline. Paper controls keep #1c1b19.

## [medium] slice-cv-01: Project stack text renders bold 13.5px ink instead of italic 11.5px muted
- file: src/components/sheets/CvSheet.tsx:82 (checklist cv-22)
- expected: The stack span (`| Python, ffmpeg, ...` / `| Next.js, TypeScript, OAuth`) sits outside the 600/13.5px title span. It inherits the 11.5px weight-400 body text and is italic #5f5b54. In the prototype the highlight's 600/13.5px wrapper is a sibling of the stack span, and both sit inside a plain outer span.
- actual: The stack span is nested inside `.entryTitle` (600, 13.5px), and `.entryOrg` only sets italic. Computed style on both stack spans: font-weight 600, font-size 13.5px, font-style italic, color rgb(28,27,25).
- fix: CvSheet.tsx:82-93: change the outer `<span className={styles.entryTitle}>` to a plain `<span>`, and wrap only the Highlight in `<span className={styles.entryTitle}>...</span>`. Keep `{' '}` and put the stack span after it as a sibling using a new class `.projectStack { font-style: italic; color: var(--muted); }` in CvSheet.module.css.

## [medium] slice-cv-02: Compton Sixth Form entry layout differs: dates sit on the degree row, not the school row
- file: src/components/sheets/CvSheet.tsx:29 (checklist cv-13)
- expected: Row 1: `Compton Sixth Form`, with `Sept. 2022 – June 2024` on the right. Then the italic degree line alone, with no right column (per the prototype and cv-13).
- actual: Row 1 is `Compton Sixth Form` with no right column. Row 2 is the italic degree with `Sept. 2022 – June 2024` on the right. The shared template always renders place on row 1 and dates on row 2.
- fix: CvSheet.tsx:29-36: when `entry.place` is set, keep the current two rows. Otherwise render row 1 as school + `<span className={styles.entryMeta}>{entry.dates}</span>`, then `<span className={styles.entryOrg}>{entry.degree}</span>` on its own, with no entryRow wrapper and no meta.

## [medium] slice-cv-03: Purple highlight text turns #8a5a00 on hover (global a:hover wins)
- file: src/components/Highlight.module.css:8 (checklist cv-16)
- expected: On hover the purple highlight background becomes rgba(160,125,250,.9) and the text colour stays inherit (#1c1b19). The prototype's style-hover sets `color:inherit`.
- actual: On hover the computed colour is rgb(138,90,0) (#8a5a00). The global `a:hover` (specificity 0,1,1) beats `.highlight{color:inherit}` (0,1,0), and `.purple:hover` sets no colour.
- fix: Highlight.module.css: add `color: inherit;` to the `.purple:hover, .purple:focus-visible` block. Or add a rule `a.highlight:hover { color: inherit; }` (specificity 0,2,1) so the global a:hover cannot win.

## [medium] slice-cv-04: Footer highlight text is muted #5f5b54 instead of #1c1b19
- file: src/components/Highlight.module.css:8 (checklist cv-25)
- expected: In the footer, the yellow `motorsport / F1, music, esports →` highlight has `color:#1c1b19` (prototype inline style and cv-25), while the surrounding `Off the page:` is #5f5b54.
- actual: The highlight uses `color: inherit`, so it takes the footer paragraph's muted colour: computed rgb(95,91,84).
- fix: CvSheet.module.css: add `.footer button { color: var(--ink); }`. Or pass a className to the footer Highlight that sets `color: var(--ink)`.

## [medium] slice-cv-05: CV bullet lists render hollow circle markers (nested ul inherits list-style circle)
- file: src/components/sheets/CvSheet.module.css:85 (checklist cv-11)
- expected: Bullets use the default disc marker, as in the prototype, where each `<ul>` is a top-level list inside a div.
- actual: The bullet and modules `<ul>`s sit inside the `.entryList` `<ul>`. The UA rule `ul ul {list-style-type: circle}` gives all 5 lists hollow circle markers.
- fix: CvSheet.module.css: add `list-style-type: disc;` to both `.bullets` (line 88) and `.modules` (line 96).

## [medium] slice-tabs-above-top-sheet: Divider tabs paint over the top sheet instead of tucking under it
- file: src/components/Pile.tsx:43 (checklist atn-12 / pile-18)
- expected: Tabs container z-index m+1 (9) in the same stacking context as the sheets. The top sheet (z m+2 = 10) then covers the tabs' left 12px (18px for inactive tabs at translateX(-6px)), so the tabs look tucked under the page edge, as in the prototype, where the tabs div is a child of the transformed stage grid.
- actual: <Tabs> is rendered in .stageWrap, outside .js-stage. .js-stage always has an inline transform (translateX(0)), so it forms its own stacking context at z auto. The tabs' z-index 9 is then compared against the whole pile and wins, so the tabs paint on top of the top sheet's right edge.
- fix: In src/components/Pile.tsx, render <Tabs .../> inside the .js-stage div (after the sheets, before TitlePage/StickyNote), so its z-index m+1 competes with the sheets in the same stacking context, as in the prototype. At widths of 600px and up, the .tabs rule (absolute, top:0, right:0, width:0) then anchors to the stage. Below 600px, keep the horizontal row above the pile: either render a second instance outside the stage that only shows under 600px, or use CSS to show and hide one of the two per breakpoint. Keep the :root[data-intro='skip'] .js-tabs rule working for both.

## [medium] slice-tab-hover-dead: Tab hover translateX(3px) never applies because the inline transform overrides it
- file: src/components/Tabs.tsx:31 (checklist atn-16)
- expected: Hovering a tab gives transform: translateX(3px) with a .2s transition (the prototype's style-hover).
- actual: The inline style sets transform: translateX(-6px) or translateX(0) on every button. Inline styles beat the .tab:hover rule in Tabs.module.css:28-30, so hover never changes the transform. The mobile `.tab:hover{transform:none}` (Tabs.module.css:51-53) is dead for the same reason.
- fix: In src/components/Tabs.tsx, remove transform from the inline style and add a class, e.g. className={`${styles.tab} ${active ? styles.active : ''}`}. In Tabs.module.css, set .tab { transform: translateX(-6px) } and .tab.active { transform: translateX(0) }, and keep .tab:hover { transform: translateX(3px) } after them with equal or higher specificity: use `.tab:hover, .tab.active:hover`. Keep transition: transform .2s.

## [medium] behaviour-02: First navigation away from the CV uses replaceState, so browser Back leaves the site instead of returning to the CV
- file: src/lib/usePile.ts:106 (checklist extra-bh-21 / bh-15)
- expected: From the CV (no hash), opening a sheet (e.g. crumbify) adds a history entry, so browser Back returns to the CV.
- actual: `const method = current ? pushState : replaceState`: when the current hash is '' (CV), the new '#crumbify' replaces the CV entry. Back from the first sheet opened goes to the previous site (about:blank in the test). Only sheet-to-sheet moves push.
- fix: src/lib/usePile.ts:101-109: track the first sync with a ref (isInitialSync). Use replaceState only on that first run, when normalising the URL on load, and pushState for every later change of state.top.

## [medium] behaviour-03: During the intro, keyboard focus goes to 8 CV controls hidden under the title page before it reaches the title page
- file: src/components/Pile.tsx:49 (checklist bh-12 / bh-18 / intro)
- expected: While the title page covers the pile, the next Tab stop after the header is the title page, and hidden or covered content is not focusable (inert).
- actual: The CV sheet is mounted and interactive under the title page, and it comes earlier in DOM order. Tab order: Download CV, Lights off, then the email, LinkedIn and GitHub links, 4 yellow highlights and the purple GitHub link (all invisible under the title page), and only at stop 11 the title page. Focus rings land on controls the user can't see.
- fix: In src/components/Pile.tsx, pass inert (and aria-hidden) to each SheetFrame while phase !== 'done', e.g. <SheetFrame ... inert={showIntro}>, and forward it to the <article> in SheetFrame.tsx. The title page then becomes the first focus stop after the header.

## [medium] behaviour-04: Divider tabs paint over the top sheet (and the sticky note) instead of being tucked under it
- file: src/components/Pile.tsx:43 (checklist tabs spec z-index m+1 (under top sheet))
- expected: The tabs layer has z-index m+1 inside the pile stacking context, below the top sheet (m+2), so the 12px (18px when inactive) of each tab under the right edge of the sheet is hidden, as in the README's 'Divider tabs' section.
- actual: <Tabs> renders as a sibling of .js-stage in stageWrap. The stage has an inline transform, so it forms its own stacking context at z auto/0, and the nav's z-index 9 is compared against the whole stage. The tabs paint above every sheet: their left 12-18px and box-shadows overlap the sheet's right edge.
- fix: src/components/Pile.tsx: render {showTabs ? <Tabs .../> : null} inside the .js-stage div, after the sheets, so zIndex M+1 competes with the sheets' M+2. For the <600px row, keep a second render outside the stage that shows only under the media query (or switch with CSS), because a position:static row inside the grid stage would break the layout.

## [medium] behaviour-05: Reduced motion: a sheet swap is two instant jumps (off to the right for 440ms, then onto the top), not an instant cross-fade
- file: src/components/Sheet.module.css:26 (checklist bh-13)
- expected: With prefers-reduced-motion: reduce, sheet swaps are an instant cross-fade: the new sheet fades in over the old one with no translate or rotate slide.
- actual: Only the transition property changes to `opacity .2s`, and nothing ever changes opacity. The state machine still applies translate(112%,-3%) rotate(5deg) for 440ms, so the new sheet teleports visibly off to the right of the pile, then teleports back on top, and it still takes 960ms to settle.
- fix: Under reduced motion, make sheetStyle (src/lib/pile.ts) keep the resting transform for moving.stage 'out' (no translate or rotate), and fade the incoming sheet in: opacity 0 in 'out' and 1 in 'in', with Sheet.module.css's reduced-motion `transition: opacity .2s`. Pass a reducedMotion flag from usePile into sheetStyle. Optionally shorten the 440/960ms timers under reduced motion.

## [medium] behaviour-06: Every deep link throws React hydration error #418 (server/client state mismatch)
- file: src/lib/usePile.ts:40 (checklist bh-14)
- expected: Deep links hydrate cleanly with no console or page errors.
- actual: The useState initializer reads window.location.hash and matchMedia during hydration, so the client's first render (phase 'done', top=crumbify, no title page) differs from the static HTML (phase 'off', top=cv, title page). React throws #418 and discards the server HTML for a full client render. That client render is also what resets the <html> attributes (see behaviour-01).
- fix: src/lib/usePile.ts: initialise useState with the SSR default {top:'cv', phase:'off', moving:null, touched:false}. In a useLayoutEffect on mount, read the hash and prefers-reduced-motion and setState to {top: sheetFromHash(hash) ?? 'cv', phase: skip ? 'done' : 'off'}, then start the 120ms push timer only when not skipping. The pre-hydration data-intro CSS already hides the intermediate frame. Also add suppressHydrationWarning on <html> in layout.tsx.

## [medium] code-04: The first navigation away from the CV uses replaceState, so Back leaves the site instead of returning to the CV
- file: src/lib/usePile.ts:106 
- expected: From / (CV), opening Crumbify pushes a /#crumbify history entry, so the browser Back button returns to the CV. The hashchange handler already supports this.
- actual: `const method = current ? pushState : replaceState` picks replaceState whenever the current hash is empty, which is the CV at /. The CV entry is overwritten, and Back from the first opened sheet leaves the site.
- fix: src/lib/usePile.ts URL-sync effect (lines 142-150): use pushState for every user-driven top change after mount. Use replaceState only on the effect's first run, tracked with a didInitRef, to normalise a load-time URL such as /#cv or /#foo to /.

## [medium] code-08: The theme persistence e2e test passes on broken code (it checks only the label, not the desk)
- file: e2e/pile.spec.ts:76 (checklist gl-28)
- expected: After a reload with 'dark' stored, the test asserts that the desk is actually dark (data-desk='dark' or the body background gradient) and that no page error occurred.
- actual: It asserts only the 'Lights on' text, which passes even though the desk is rendered light after hydration (code-01). No e2e or unit test hydrates the prerendered HTML, so the #418 regressions go undetected. Unit tests use createRoot, not hydrateRoot.
- fix: e2e/pile.spec.ts theme test: after reload add await expect(page.locator('html')).toHaveAttribute('data-desk','dark'). Add a shared beforeEach that records page.on('pageerror') and an afterEach that expects the list to be empty. Add a test that loads /#crumbify and asserts there are no page errors.

## [low] slice-05: Source Serif 4 is loaded as static weights without the opsz 8..60 optical-size axis
- file: src/app/layout.tsx:19 (checklist gl-16)
- expected: Source Serif 4 with the opsz axis 8..60 at weights 500/600 (prototype: family=Source+Serif+4:opsz,wght@8..60,500;8..60,600).
- actual: Source_Serif_4({ weight: ['500','600'], style: ['normal','italic'] }) has no axes:['opsz']. The generated @font-face rules are static per-weight files, so the 120px title and 52px headings render with text-size optical metrics instead of display ones. Italic faces are also downloaded, which the spec does not ask for.
- fix: src/app/layout.tsx:19: Source_Serif_4({ subsets:['latin'], axes:['opsz'], style:['normal','italic'] only if italics are used, otherwise ['normal'], variable:'--font-source-serif', display:'swap' }). Drop the weight array, because next/font requires a variable font for axes. The variable font covers 500 and 600.

## [low] slice-06: Title line is missing text-wrap:pretty
- file: src/components/TitlePage.module.css:48 (checklist intro-06)
- expected: 'My name is Ali, and I build things.' has font-size 20px, max-width 440px, line-height 1.45, margin 0, text-wrap:pretty.
- actual: .line has no text-wrap declaration. The computed textWrapStyle is 'auto'.
- fix: src/components/TitlePage.module.css .line: add 'text-wrap: pretty;'.

## [low] slice-07: Header 'Download CV (PDF)' link changes colour to #8a5a00 on hover (also in dark mode); the prototype keeps it inherited
- file: src/components/Desk.module.css:19 (checklist gl-08)
- expected: The header link keeps color:inherit in all states. In the prototype, the inline style color:inherit overrides the global a:hover{color:#8a5a00}.
- actual: .download{color:inherit} (specificity 0,1,0) loses to the global 'a:hover' (0,1,1), so hovering turns the header link brown. On the dark desk that is rgb(138,90,0) on #161513.
- fix: src/components/Desk.module.css: add '.download:hover { color: inherit; }'.

## [low] slice-08: During the intro, keyboard focus goes through every link on the hidden CV sheet under the title page before it reaches the title-page button
- file: src/components/Pile.tsx:53 (checklist intro-17)
- expected: The title page is keyboard operable (Tab + Enter dismisses it), and focus does not land on controls hidden beneath it.
- actual: While phase is 'off'/'push', the CV sheet is mounted and visible under the title page (z 10 vs 18), and it comes first in the DOM. Tab goes Download CV, toggle, then the CV's email and linkedin links and the rest, with focus rings hidden behind the title page. Pressing Enter on a covered CV highlight does nothing. The title button is reached only after all CV controls.
- fix: src/components/Pile.tsx: while showIntro is true, pass inert (or aria-hidden plus tabIndex handling) to each SheetFrame, for example via an 'inert' prop on the SheetFrame root, so the title-page button is the first focusable control after the header.

## [low] slice-09: Title-page button contains <h1> and <p> (invalid content model); html lang is 'en-GB' instead of the checklist's 'en'
- file: src/components/TitlePage.tsx:21 (checklist intro-17 / extra-gl-33)
- expected: The title control is a valid button (phrasing content only) or a role=button container. The checklist expects <html lang="en">.
- actual: <button> wraps <h1 class=name> and <p class=line>, which is not permitted inside <button> per the HTML spec, and the h1 is exposed only as part of the button's name. layout.tsx:57 sets lang="en-GB".
- fix: src/components/TitlePage.tsx: change the element to <section role="button" tabIndex={0} onClick={onDismiss} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onDismiss();}}}> and keep the h1 and p inside. Keep the gl-24 focus outline and the css reset (cursor:pointer). Alternatively keep <button> and change h1/p to <span> with the existing classes, then add a visually-hidden h1 elsewhere. For lang: either set lang="en" in src/app/layout.tsx:57, or record en-GB as a deliberate decision in docs/implementation-notes.md and update extra-gl-33.

## [low] slice-cv-06: Bold labels use <strong> (weight 700) instead of 600
- file: src/components/sheets/CvSheet.tsx:40 (checklist cv-24)
- expected: `Relevant Modules:` and the skills labels (`Languages:` etc.) use font-weight 600 (prototype `<span style="font-weight:600">`).
- actual: `<strong>` computes to font-weight 700 (bolder than 400). Plex Sans only loads 400/500/600, so the computed weight is off-spec even though the rendered face falls back to 600.
- fix: CvSheet.module.css: add `.modules strong, .skillLine strong { font-weight: 600; }`. Or replace the <strong> tags at CvSheet.tsx:40 and :111 with `<span className={styles.label}>`, where `.label { font-weight: 600; }`.

## [low] slice-cr-01: Crumbify intro is missing text-wrap:pretty
- file: src/components/sheets/CrumbifySheet.module.css:1 (checklist cr-06)
- expected: The intro paragraph has `text-wrap:pretty` (prototype and cr-06).
- actual: `.intro` sets only font-size, line-height and margin. Computed text-wrap-style is 'auto'.
- fix: CrumbifySheet.module.css .intro (line 1-5): add `text-wrap: pretty;`.

## [low] slice-cr-02: Under-the-hood sentence span is missing text-wrap:pretty
- file: src/components/sheets/CrumbifySheet.tsx:51 (checklist cr-19)
- expected: The row value sentence span has `text-wrap:pretty` (prototype `<span style="text-wrap:pretty">{{ r.v }}</span>`).
- actual: `<span>{spec.v}</span>` has no class. Computed text-wrap-style is auto. The Shipping row visibly leaves an orphan `solo.` at 1280px.
- fix: CrumbifySheet.tsx: change `<span>{spec.v}</span>` to `<span className={styles.rowText}>`. Add `.rowText { text-wrap: pretty; }` to CrumbifySheet.module.css.

## [low] slice-cr-03: Back pill has an extra background transition not in the spec
- file: src/components/BackPill.module.css:13 (checklist cr-02)
- expected: The back pill style list in cr-02 and the prototype has no transition, so the hover background #f0ede4 applies instantly.
- actual: `transition: background 0.2s` is added. Computed transition is 'background 0.2s'.
- fix: BackPill.module.css: delete line 13 `transition: background 0.2s;`.

## [low] slice-note-p-margin: Sticky note is a <p>, and its default 12.5px margin shifts it down from top:-22px
- file: src/components/StickyNote.tsx:5 (checklist atn-22)
- expected: The note's border box sits at top:-22px, right:28px of the stage, with no margin (the prototype uses a plain <div>).
- actual: The note renders as a <p> and inherits the UA margin 1em = 12.5px 0. StickyNote.module.css .note sets no margin, so the note's box starts at -9.5px, 12.5px lower than specified.
- fix: Add `margin: 0;` to .note in src/components/StickyNote.module.css, or change the element in StickyNote.tsx:5 to a <div>.

## [low] slice-text-wrap-pretty-missing: Body paragraphs on Racing, Video and About are missing text-wrap: pretty
- file: src/components/sheets/RacingSheet.module.css:36 (checklist rv-07 / rv-09 / rv-21 / atn-08)
- expected: Racing telemetry and GPS paragraphs, both Video body paragraphs, and the About body paragraph have text-wrap: pretty (prototype lines 54, 72, 73, 85, 87).
- actual: None of .paragraph (RacingSheet.module.css:36-40), .paragraph (VideoSheet.module.css:62-66) or .body (AboutSheet.module.css:48-52) sets text-wrap, so Chromium uses the default 'wrap'.
- fix: Add `text-wrap: pretty;` to .paragraph in src/components/sheets/RacingSheet.module.css, to .paragraph in src/components/sheets/VideoSheet.module.css, and to .body in src/components/sheets/AboutSheet.module.css.

## [low] slice-mobile-tab-offset: Mobile horizontal tab row keeps the inline translateX(-6px) on inactive pills
- file: src/components/Tabs.tsx:31 (checklist gl-26)
- expected: In the below-600px horizontal tab row (Tabs.module.css:32-54), the pills sit evenly in a flex row with an 8px gap. The media query clearly intends no transform offsets there (it sets hover transform:none).
- actual: The inline transform still applies below 600px. Every inactive pill shifts 6px left while the active one does not, so the gaps are uneven: 14px before the active pill and 2px after it.
- fix: Apply the class-based transform fix from slice-tab-hover-dead, then set `transform: none` on .tab and on .tab.active inside the @media (max-width: 599px) block of src/components/Tabs.module.css (the existing hover rule there already resets to none).

## [low] behaviour-07: Mobile tab row keeps the inactive translateX(-6px), giving uneven gaps and a left overhang; row doesn't wrap and clips at 320px
- file: src/components/Tabs.tsx:31 (checklist rs (tabs row below 600px))
- expected: Below 600px the tabs form an evenly spaced horizontal row (gap 8px) inside the 20px page gutter, with nothing clipped at small phone widths.
- actual: The inline style translateX(-6px) for inactive tabs still applies in the horizontal row. At 390px the pills sit at 14-53, 67-151 (active), 153-222, and so on, giving gaps of 14px and 2px instead of 8px, and the first pill pokes 6px into the 20px gutter. The row has no flex-wrap. At 320px the pills span -5px to 336px, so 'cv' is cut off on the left and 'about' is clipped past the viewport. 'VIDEO BOT' also wraps to two lines at 390px, making that pill taller than the rest.
- fix: src/components/Tabs.module.css @media (max-width:599px): add `transform: none !important;` to .tab (or move the inactive offset into a desktop-only class instead of the inline style), add `white-space: nowrap;` to .tab, and add `flex-wrap: wrap;` (or `overflow-x: auto`) to .tabs.

## [low] behaviour-08: Keyboard focus is lost to <body> after activating a CV highlight or a back pill
- file: src/lib/usePile.ts:77 (checklist bh-12)
- expected: After a keyboard-triggered bring(), focus goes somewhere sensible in the new top sheet (e.g. its heading or back pill), so keyboard users continue from the page they opened.
- actual: The focused control is unmounted along with the previous sheet at 960ms. document.activeElement becomes BODY, and the next Tab restarts at the top of the document.
- fix: In src/components/Pile.tsx (or SheetFrame), after top changes from a bring() (touched true), focus the new top sheet's container or heading: give the sheet <article> tabIndex={-1} and call .focus({preventScroll:true}) in an effect on [top] when document.activeElement is body or was inside the previous sheet.

## [low] behaviour-09: /#cv and unknown hashes push an extra history entry on load, and an unknown hash flashes the title page
- file: src/lib/usePile.ts:106 (checklist bh-15)
- expected: Normalising /#cv or /#bogus to / on first load replaces the entry, so Back does not return to an identical CV state. An unknown hash is treated the same way by the pre-hydration script and React.
- actual: On load the current hash is non-empty, so pushState is used: history.length goes from 2 to 3 for /#cv and /#bogus, and Back is a dead step back to the same CV. For /#bogus, the pre-hydration script (layout.tsx) sets data-intro='play' because the hash is not a sheet id, while usePile skips the intro for any non-empty hash (Boolean(deepLink)). The title page and off-screen pile show until hydration, then jump to the done state.
- fix: src/lib/usePile.ts:106: use replaceState on the initial sync (see behaviour-02). src/app/layout.tsx:51: make the pre-hydration rule match the owner decision 'any hash skips', i.e. `var skip = hash !== '' || reduced;` (or tighten usePile to the whitelist and log that in implementation-notes).

## [low] behaviour-10: Title page is a <button> containing <h1> and <p>, which is invalid content, and the heading is hidden from assistive tech
- file: src/components/TitlePage.tsx:13 (checklist a11y (title page))
- expected: A valid, keyboard-operable control with a concise accessible name. The page's 'Ali Bars' heading is exposed as a heading.
- actual: A <button> wraps <h1>, <p> and spans. The button content model allows phrasing content only, and button children are presentational, so the h1 is not exposed as a heading. The accessible name is the concatenated 'vol. 01Ali BarsMy name is Ali, and I build things.click to open →'.
- fix: In src/components/TitlePage.tsx, change the <h1> to <span className={styles.name}> and the <p> to <span className={styles.line}> (with display:block in CSS if needed), and add aria-label="Open CV" on the button. If a page h1 is wanted, add a visually hidden <h1>Ali Bars</h1> outside the button. Or switch the root to a <div role="button" tabIndex={0}> with Enter/Space key handlers and aria-label, keeping the h1.

## [low] code-05: Loading /#cv or an unknown hash pushes an extra history entry on load
- file: src/lib/usePile.ts:106 
- expected: Normalising /#cv (or /#foo) to / on first load should replace the entry, not add one.
- actual: current='#cv' is non-empty, so pushState('/') runs on mount. Back then lands on /#cv, which is a no-op because the CV is already on top, so the user has to press Back twice.
- fix: Same change as code-04: on the first run of the URL-sync effect, use replaceState when normalising the load-time hash.

## [low] code-06: The inline script and usePile disagree on what counts as a deep link (an unknown hash)
- file: src/lib/usePile.ts:40 
- expected: The pre-paint script (layout.tsx line 48) and React agree. For /#foo, both play the intro or both skip it.
- actual: The layout script sets data-intro='play' for an unknown hash like #foo (whitelist check), but usePile uses Boolean(window.location.hash) and skips to phase 'done'. The static HTML first paints the title page and the off-screen pile, then React jumps straight to the CV (a flash), plus the #418 error.
- fix: src/lib/usePile.ts:81-82: const skipIntro = sheetFromHash(window.location.hash) !== null || prefersReducedMotion(); (fold into the code-02 layout-effect fix).

## [low] code-09: The mobile e2e test's 'tabs above the pile' assertion is always true
- file: e2e/pile.spec.ts:54 
- expected: The assertion proves that the tab row sits above the pile at 390px (for example, nav bottom <= stage top).
- actual: It checks navBox.y <= main.y + main.height. The nav is rendered inside <main> (Pile.tsx), so this holds for any layout, including the tabs overlapping the sheet or sitting on its side.
- fix: e2e/pile.spec.ts: take stageBox from page.locator('.js-stage') and assert navBox.y + navBox.height <= stageBox.y + 2.

## [low] code-10: The unmount cleanup test asserts nothing about cleanup
- file: src/lib/usePile.test.tsx:210 
- expected: The test proves pending timers are cleared on unmount (for example, vi.getTimerCount() === 0 after unmount).
- actual: It checks only that unmount() does not throw, which still passes if the clearTimers cleanup effect (usePile.ts line 128) is deleted. The hashchange/back-button path (onHashChange) and the pushState/replaceState URL sync also have no unit test.
- fix: In the unmount test, add expect(vi.getTimerCount()).toBe(0) after unmount(). Add tests that (a) dispatch a hashchange with location.hash='#racing' and advance 960ms, expecting top 'racing', and (b) spy on history.pushState/replaceState and assert the method chosen for a bring from the CV and for a load-time /#cv.

## [low] code-11: Running the e2e suite overwrites tracked files in docs/screenshots
- file: e2e/screenshots.spec.ts:97 
- expected: `npm run e2e` (the test gate) leaves the working tree clean.
- actual: Every run writes docs/screenshots/0*.png, which are git-tracked. The gate dirties the repo (git status already shows 'M docs/screenshots/07-dark-desk.png'), and the 'tests' only take screenshots without comparing them to anything.
- fix: playwright.config.ts: add testIgnore: ['**/screenshots.spec.ts'] to the default chromium project, and add a separate 'screenshots' project (testMatch: /screenshots\.spec\.ts/) run by a new npm script "screenshots". Alternatively, switch to expect(page).toHaveScreenshot() baselines.

## [low] code-12: The house rule of functions under 50 lines is violated by CvSheet (about 115 lines) and usePile (about 93 lines)
- file: src/components/sheets/CvSheet.tsx:11 
- expected: Functions under 50 lines (coding-style.md checklist).
- actual: CvSheet runs from line 11 to 125 as one function rendering the header, education, experience, projects, skills and footer. usePile (src/lib/usePile.ts lines 38-131) is about 93 lines.
- fix: Split src/components/sheets/CvSheet.tsx into CvHeader, EducationSection, ExperienceSection, ProjectsSection, SkillsSection and CvFooter subcomponents. Extract the URL-sync effect and the key/hashchange listener effect from usePile into useHashSync(state, bring) and usePileKeys(bring) hooks.

## [low] code-13: Dead crop data and a hardcoded object-position in the component
- file: src/components/sheets/RacingSheet.tsx:44 
- expected: Content values live in content.ts, and unused fields are removed.
- actual: content.ts line 225 defines imageCrop {scale:1.8, x:18, y:50}, but x and y are never read. The actual crop '58% 22%' is a magic string hardcoded in RacingSheet.tsx line 44.
- fix: src/content.ts:225: change to imageCrop: { scale: 1.8, objectPosition: '58% 22%' }. In RacingSheet.tsx:7, destructure { scale, objectPosition }, and at line 44 use style={{ objectPosition, transform: `scale(${scale})` }}.

## [low] code-14: Unsafe casts hide a type hole in ProjectEntry (both opens and href are optional)
- file: src/components/sheets/CvSheet.tsx:58 
- expected: The type system makes a project with neither opens nor href impossible (a discriminated union).
- actual: `project.opens as SheetId` (line 54) and `project.href as string` (line 58) silence the compiler. A content entry missing both would render <a href={undefined} target=_blank> with no type error.
- fix: src/content.ts: define ProjectEntry = ProjectBase & ({ opens: SheetId; href?: never } | { href: string; opens?: never; icon?: 'github' }). In CvSheet.tsx, branch on 'opens' in project and remove both `as` casts.

## [low] code-15: Magic layout numbers in the Tabs inline style instead of tokens or constants
- file: src/components/Tabs.tsx:28 
- expected: Named constants or CSS tokens for the tab offset and pitch (house rule: no hardcoded values).
- actual: `top: 48 + i * 120` is inline, with no named constant. Filler tones in pile.ts line 31 duplicate the --paper-alt-1..4 tokens in globals.css lines 3-6 instead of referencing them.
- fix: src/components/Tabs.tsx: add const TAB_TOP_OFFSET = 48; const TAB_PITCH = 120; and use top: TAB_TOP_OFFSET + i * TAB_PITCH. src/lib/pile.ts:37: FILLER_TONES = ['var(--paper-alt-1)','var(--paper-alt-2)','var(--paper-alt-3)','var(--paper-alt-4)'] (tokens already defined in globals.css).

## Refuted
- code-07: The pattern exists: at() is called inside a setState updater at usePile.ts:104-108, and stateRef.current is assigned during render at line 91. But no behavioural defect reproduces. The scheduled callback is guarded (prev.phase === 'off'), so a duplicate timer from a double-invoked updater is a harmless no-op, and a stale stateRef is not observable because pull/bring run from event handlers after commit. This is a code-hygiene remark with no failure scenario. The code-02 fix (moving intro scheduling into a layout effect) removes it anyway.
