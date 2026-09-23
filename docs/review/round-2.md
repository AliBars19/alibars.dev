# Review round 2 (workflow wf_af29f636-280)

Confirmed 28, refuted 0.

## [medium] slice-gpi-01: Tabs stay fully visible during sheet moves on deep-link and reduced-motion loads: the pre-hydration rule `.js-tabs{opacity:1 !important}` overrides the fade
- file: src/app/globals.css:62 (checklist atn-17 / pile-18 / intro-16 / intro-18)
- expected: While a sheet is moving, the tab layer has opacity 0 and pointer-events none (transition opacity .2s), so the tabs never paint over the sheet sliding out.
- actual: On any load with data-intro='skip' (a deep link such as /#crumbify, /#cv, or a prefers-reduced-motion load), `:root[data-intro='skip'] .js-tabs { opacity: 1 !important; }` stays in force for the whole session. During every bring(), the inline opacity is '0' but the computed opacity is '1'. The tabs (z 9) come after the moving-out sheet (also z 9) in the DOM, so they paint on top of it.
- fix: Delete the `:root[data-intro='skip'] .js-tabs { opacity: 1 !important; }` block at src/app/globals.css:62-64, and drop the reference to it in the Tabs.tsx:21-22 doc comment. Add an e2e test: load /#crumbify, click a tab, and at about 200ms assert getComputedStyle(nav[data-variant=desktop]).opacity === '0'.

## [medium] slice-gpi-02: Deep links keep document.title 'Ali Bars': Next's metadata resets it about 40ms after Pile sets the sheet title
- file: src/components/Pile.tsx:33 (checklist bh-16 / intro-16)
- expected: Loading /#racing gives the title 'City Racing · Ali Bars', /#about gives 'About · Ali Bars', and so on.
- actual: On a deep-link load, the title is 'Ali Bars' from then on. Pile's effect sets it correctly, then the <title> node is rewritten back to the static metadata title (layout.tsx:28). It only corrects itself after a later bring().
- fix: In src/components/Pile.tsx, stop the imperative write from being clobbered. Either render `{phase === 'done' ? <title>{sheetTitles[top]}</title> : null}` inside Pile's JSX (React 19 hoists it and owns it), or re-apply the title after hydration, e.g. `requestAnimationFrame(() => { document.title = sheetTitles[top]; })` inside the existing effect. Add an e2e test: goto /#racing, wait, expect(page).toHaveTitle('City Racing · Ali Bars').

## [medium] slice-cvcr-01: REGRESSION: in dark mode, CV contact links get a near-white focus outline (#e8e4dc) on #fbfaf6 paper, because CvHeader is a <header>
- file: src/app/globals.css:116 (checklist gl-24 / cv-05 (round-1 slice-04 fix))
- expected: Controls on paper sheets keep the dark 2px #1c1b19 focus outline in dark mode. That is the whole point of the slice-04 fix and the comment at globals.css:112-115.
- actual: The slice-04 fix scoped the light outline with `[data-desk='dark'] header :focus-visible`. The CV sheet's header block is also a `<header>` (src/components/sheets/CvHeader.tsx:6), so it matches too. In dark mode the email, LinkedIn and GitHub contact links get outline-color rgb(232,228,220) on the rgb(251,250,246) paper, which makes the focus ring close to invisible.
- fix: In src/app/globals.css:116, scope the rule to the desk header only. Either change the CV header root in src/components/sheets/CvHeader.tsx:6 from <header> to <div> (keep className and adjust the closing tag), or replace the global rule with `:global([data-desk='dark']) .header :focus-visible { outline-color: var(--desk-ink-dark); }` in the Desk header's CSS module and delete globals.css:116-118. Add an e2e assertion that the focus outline on a CV contact link is rgb(28, 27, 25) in dark mode.

## [medium] slice-r2-01: On deep-link and reduced-motion loads the divider tabs never fade out during a sheet move (the data-intro='skip' rule forces opacity:1)
- file: src/app/globals.css:62 (checklist atn-17)
- expected: While moving is non-null the tab layer is opacity:0 with pointer-events:none, and it fades back in after 960ms (README 'Divider tabs': the whole tab layer is opacity:0 while a sheet is moving; transition opacity .2s).
- actual: The pre-hydration script (src/app/layout.tsx:52) sets data-intro='skip' on <html> for any deep link (/#racing, /#about, /#cv...) or reduced-motion load, and nothing ever removes it. The rule ':root[data-intro="skip"] .js-tabs { opacity: 1 !important; }' then beats the inline opacity:0 from Tabs.tsx:41 for the whole session. The tabs stay fully visible (but can't be clicked, because pointer-events:none still applies) over the pile while the new sheet slides out and back in. On a fresh '/' load (data-intro='play') the same move fades correctly. This rule came in with the round-1 hydration fixes.
- fix: Delete the `:root[data-intro='skip'] .js-tabs { opacity: 1 !important; }` block at src/app/globals.css:62-64, and remove the reference to it in the comment at src/components/Tabs.tsx:22. Add an e2e test: load /#racing, click the 'about' tab, and assert that the computed opacity of nav[data-variant=desktop] reaches 0 during the move.

## [medium] behaviour-NOT-FIXED-01: NOT-FIXED (slice-04): in dark mode the focus outline on the CV's contact links is still near-white #e8e4dc on #fbfaf6 paper
- file: src/app/globals.css:116 (checklist gl-24)
- expected: Controls on the paper sheets keep the dark #1c1b19 focus outline in dark mode. Only the desk header should get #e8e4dc.
- actual: The selector `[data-desk='dark'] header :focus-visible` also matches the CV sheet's own <header> (src/components/sheets/CvHeader.tsx:6). So the email, LinkedIn and GitHub links on the CV get outline-color rgb(232,228,220), which is almost invisible on the paper.
- fix: In src/app/globals.css:116, scope the rule to the desk header only. Either move it to src/components/Desk.module.css as `:global([data-desk='dark']) .header :focus-visible { outline-color: var(--desk-ink-dark); }`, or add a `js-desk-header` class to the <header> in Desk.tsx:10 and change the globals selector to `[data-desk='dark'] .js-desk-header :focus-visible`. Add an e2e test asserting that the CV mailto link's focus outline is rgb(28, 27, 25) in dark mode.

## [medium] behaviour-02: Deep links end with document.title 'Ali Bars' instead of the sheet title (reset after the Pile effect sets it)
- file: src/components/Pile.tsx:33 (checklist bh-16)
- expected: Loading /#about gives the title 'About · Ali Bars', /#crumbify 'Crumbify · Ali Bars', /#racing 'City Racing · Ali Bars', /#video 'Video bot · Ali Bars'.
- actual: The effect sets the sheet title, and about 13ms later the Next metadata <title>Ali Bars</title> puts it back. Every deep link settles on 'Ali Bars' until the user navigates again. This regression came with the fix that moved deep-link resolution into a mount-time useLayoutEffect.
- fix: In src/components/Pile.tsx, replace the imperative document.title effect with a React-managed title: render `{phase === 'done' ? <title>{sheetTitles[top]}</title> : null}` inside Pile (React 19 hoists it). Alternatively re-apply document.title in a requestAnimationFrame/setTimeout(0) after the effect. Add an e2e test: page.goto('/#about') and then expect(page).toHaveTitle('About · Ali Bars').

## [medium] behaviour-03: On deep-link and reduced-motion loads the tabs never fade out during a move ([data-intro='skip'] .js-tabs opacity:1 !important stays forever)
- file: src/app/globals.css:62 (checklist bh-03 / README 'While a sheet is moving: the whole tab layer is opacity:0')
- expected: While a sheet moves, the tab layer is opacity 0 with pointer-events none (transition opacity .2s), then fades back in at 960ms.
- actual: data-intro='skip' is never removed from <html>. The pre-hydration override `opacity: 1 !important` therefore beats the inline opacity:0 for the whole session, and the tabs stay fully visible during every move on any deep-link or reduced-motion load. It is still correct on a fresh / load, where data-intro='play'.
- fix: Delete the `:root[data-intro='skip'] .js-tabs { opacity: 1 !important; }` rule from src/app/globals.css:62-64. Tabs only render when phase==='done', so there is nothing to protect before hydration. Or, alternatively, call document.documentElement.removeAttribute('data-intro') at the end of the mount useLayoutEffect in src/lib/usePile.ts.

## [medium] code-r2-01: REGRESSION: tabs no longer fade out during a move on deep-link or reduced-motion loads (data-intro='skip' !important rule now persists)
- file: src/app/globals.css:58 (checklist README 'Divider tabs' line 193 (tab layer opacity:0 while moving))
- expected: While a sheet is moving, the tab layer is opacity:0 and pointer-events:none, fading in over .2s.
- actual: On any load where the pre-hydration script sets data-intro='skip' (/#cv, /#racing etc., or prefers-reduced-motion), the rule `:root[data-intro='skip'] .js-tabs { opacity: 1 !important }` beats the inline opacity:0 for the whole session. The tabs stay fully visible (but not clickable) during every sheet swap. In round 1 this only worked because the hydration error re-rendered <html> and dropped data-intro. The suppressHydrationWarning fix now keeps the attribute, so the rule never switches off. The rule is also useless before hydration, because the static HTML has phase 'off' and renders no tabs.
- fix: src/app/globals.css: delete lines 62-64 (the `:root[data-intro='skip'] .js-tabs` rule), and update the comment in Tabs.tsx:22 that mentions it. Add an e2e test: goto /#cv, click the desktop 'racing' tab, wait 150ms, and expect the computed opacity of nav[data-variant=desktop] to be below 0.5.

## [medium] code-r2-02: Browser Back pressed during an in-flight move is dropped, then a pushState restores the old hash and wipes forward history
- file: src/lib/usePile.ts:88 
- expected: Back pressed while a sheet is moving still takes effect (queued, or applied after the move settles), and the URL and pile stay in sync.
- actual: onHashChange calls bring(), and canBring rejects it while moving !== null. When the move settles, useHashSync sees top changed and the URL hash differs, so it pushState()s the moving sheet's hash back. Back appears to do nothing, forward history is truncated, and a double Back lands on the wrong sheet.
- fix: src/lib/usePile.ts: add a pendingRef. In onHashChange, if stateRef.current.moving !== null, store sheetFromHash(location.hash) ?? 'cv' in pendingRef instead of calling bring. In the 960ms settle callback, or in a useEffect on state.moving === null, if pendingRef is set and differs from top, clear it and call bring(pending). useHashSync must not push while a pending external hash exists. Add a unit test: bring('crumbify'), set the hash to '' and dispatch hashchange at 200ms, run all timers, and expect top 'cv' with the URL left without a hash.

## [low] slice-gpi-03: A deep link paints the CV sheet first, then swaps to the requested sheet at hydration
- file: src/app/layout.tsx:51 (checklist extra-intro-19 / intro-16)
- expected: A deep link such as /#about opens that sheet directly, with no frame of a different sheet before it (same spirit as the no-title-flash guard).
- actual: The static HTML always renders top='cv'. The pre-hydration script hides only the title page and un-offsets the stage, so until the JS chunks load and the layout effect runs, the first paint shows the CV on top. The About sheet then replaces it.
- fix: In the src/app/layout.tsx pre-hydration script, also call d.setAttribute('data-top', hash) when the hash is a sheet id. In globals.css add `:root[data-intro='skip'][data-top]:not([data-top='cv']) #sheet-cv { visibility: hidden; }`, and remove data-top (or make the rule moot) once React has hydrated, e.g. removeAttribute in usePile's mount layout effect. Alternatively, log it as an accepted limitation in docs/implementation-notes.md.

## [low] slice-gpi-04: On a dark first paint the toggle reads 'Lights off' on the dark desk until hydration
- file: src/components/Desk.tsx:16 (checklist extra-gl-32 / gl-10)
- expected: The first painted frame with a stored or OS dark preference shows the dark desk and the label 'Lights on'.
- actual: The static HTML always contains 'Lights off' (useTheme initialises to false). The desk is dark from first paint, but the label is wrong until the JS loads and the layout effect runs.
- fix: In src/components/Desk.tsx, render both labels, e.g. `<span className={styles.labelLight}>Lights off</span><span className={styles.labelDark}>Lights on</span>`. In Desk.module.css (or globals.css) add `:root[data-desk='dark'] .labelLight{display:none}` and `:root:not([data-desk='dark']) .labelDark{display:none}`. Keep the accessible name correct: the hidden span is display:none, so it is excluded.

## [low] slice-gpi-05: When localStorage access throws, the whole pre-hydration script aborts: the OS dark preference is ignored and deep links flash the title page
- file: src/app/layout.tsx:46 (checklist gl-28 / extra-gl-32 / extra-intro-19)
- expected: With storage blocked, there is no stored value, so the desk follows prefers-color-scheme: dark, and a deep link still skips the title page from the first paint.
- actual: `localStorage.getItem` throws a SecurityError when site data is blocked. It sits inside the single try block, so neither data-desk nor data-intro is set. useTheme only reads data-desk, so an OS-dark user gets the light desk for the whole session. Before hydration, /#about paints the title page and the pile at translateX(-130vw).
- fix: In the src/app/layout.tsx preHydrationScript, change it to `var stored=null; try{stored=localStorage.getItem('alibars-desk');}catch(e){}`, then run the matchMedia dark and data-intro logic outside that inner try, keeping the outer try only as a final guard. Optionally, in useTheme.ts:31-35, fall back to window.matchMedia('(prefers-color-scheme: dark)').matches when data-desk is absent, and set the attribute.

## [low] slice-gpi-06: The title-page fix nests <h1> and <p> inside a <span> (invalid content model)
- file: src/components/TitlePage.tsx:38 (checklist intro-04 / intro-17)
- expected: The title-page markup is valid HTML. The name/line/cta column is a block container (a div in the prototype) holding the h1 and p.
- actual: `<span className={styles.body}>` wraps `<h1>` and `<p>`. A span only allows phrasing content, so the round-1 slice-09 fix swapped one content-model violation for another.
- fix: In src/components/TitlePage.tsx, change line 38 `<span className={styles.body}>` and its closing tag at line 42 to `<div className={styles.body}>...</div>`. Also change the kicker at line 37 to a <div> to match the prototype. Check that TitlePage.module.css .body/.kicker do not rely on inline display defaults: .body is display:flex column per intro-04.

## [low] slice-gpi-07: Dismissing the title page with the keyboard drops focus to <body>, and the next Tab skips the whole CV
- file: src/components/Pile.tsx:78 (checklist intro-17 / bh-12)
- expected: After Enter or Space on the focused title page, focus lands somewhere sensible on the CV (e.g. the CV sheet container, as Pile.tsx:41-47 already does after bring()), so keyboard users continue from the revealed page.
- actual: The title page unmounts at phase 'done' while focused. activeElement becomes BODY, and Chrome's focus starting point moves past the CV sheet, so the next Tab lands on the 'cv' divider tab and every CV control is skipped.
- fix: In src/components/Pile.tsx, add an effect keyed on phase. Track the previous phase in a ref, and when it goes from 'pull' to 'done' and document.activeElement === document.body, call document.getElementById(`sheet-${top}`)?.focus({ preventScroll: true }). The sheet article already has tabIndex=-1 from the behaviour-08 fix. Add an e2e test: Tab to the title page, press Enter, wait 1.3s, press Tab, and expect focus inside #sheet-cv.

## [low] slice-cvcr-02: Internal CV highlights are atomic inline-block <button>s: they wrap as a centred block and add 2px to each highlight row
- file: src/components/Highlight.module.css:11 (checklist cv-26 / cv-14 / cv-21 / cv-25)
- expected: Prototype: the highlight is an inline <span> with padding 1px 5px. The padding does not grow the line box, the text wraps inline and stays left-aligned, and the gradient breaks across lines. cv-26 allows a <button> only if it keeps 'the highlight look inline'.
- actual: `.highlight{display:inline}` has no effect on a <button>, which computes to display:inline-block with the UA default text-align:center. (1) At 320px, 'Data Acquisition & Firmware Engineer →' becomes a 2-line, 238px-wide yellow block with the second line 'Engineer →' centred. The footer 'motorsport / F1, music, esports →' drops to its own line as a single unit instead of wrapping after 'Off the page:'. (2) At every width, each highlight's entry row is 2px taller than with the prototype's inline span (for example 26.20px vs 24.20px at 1280, and 23.67px vs 21.67px at 390).
- fix: In src/components/Highlight.tsx, render internal highlights as `<a href={`#${id}`} onClick={e => { e.preventDefault(); props.onOpen(); }} className=...>` (this needs a target id passed in, or keep onOpen and use href='#'+sheet id). An <a> keeps display:inline so it wraps inline and the gradient breaks per line. Add `box-decoration-break: clone; -webkit-box-decoration-break: clone;` to .highlight in Highlight.module.css if per-line padding is wanted. At minimum, if a <button> is kept, add `text-align: inherit;` to .highlight in Highlight.module.css so wrapped text is not centred.

## [low] slice-r2-02: Racing 'Live telemetry.' and 'GPS lap tool (C++).' leads use <strong> (computed weight 700) instead of 600
- file: src/components/sheets/RacingSheet.tsx:22 (checklist rv-07 / rv-09)
- expected: The bold leads are <span style="font-weight:600"> in the prototype (Interactive CV v3.dc.html, racing section), so the computed font-weight is 600. Round 1 fixed the same issue on the CV (slice-cv-06, now 600-weight spans).
- actual: RacingSheet.tsx:22 and :27 render <strong>, and no CSS rule sets its weight (RacingSheet.module.css has no strong/lead rule), so the UA default font-weight:bold (700) applies. IBM Plex Sans is only loaded at 400/500/600 (layout.tsx:7), so the browser falls back to the 600 face or synthesises bold instead of honouring the spec value.
- fix: In src/components/sheets/RacingSheet.module.css add `.paragraph strong { font-weight: 600; }`, or replace both <strong> elements (RacingSheet.tsx:22, :27) with `<span className={styles.lead}>` and add `.lead { font-weight: 600; }`.

## [low] slice-r2-03: The mobile (<600px) tab row has no opacity transition, so it blinks off and on instantly during every move
- file: src/components/Tabs.module.css:47 (checklist atn-12 / atn-17)
- expected: The tab layer fades with transition:opacity .2s when a move starts and ends (README 'Divider tabs'), and that applies to whichever tab layer is visible, including the recommended horizontal row below 600px.
- actual: 'transition: opacity 0.2s' is only declared on .tabsDesktop (Tabs.module.css:6). .tabsMobile (lines 47-54) has none, so the mobile nav's inline opacity toggles 1 to 0 to 1 with no fade.
- fix: Add `transition: opacity 0.2s;` to the .tabsMobile rule inside `@media (max-width: 599px)` in src/components/Tabs.module.css (around line 47), or move it to a rule shared by both nav variants.

## [low] behaviour-04: Dismissing the title page with the keyboard (Enter/Space) drops focus to <body>
- file: src/components/Pile.tsx:78 (checklist bh-12)
- expected: After Enter or Space on the focused title page, focus lands somewhere sensible in the revealed CV (the CV sheet or its first control), as the bring() focus fix now does for highlights and back pills.
- actual: The title page unmounts at 1000ms, so document.activeElement becomes BODY. The next Tab starts at the desktop divider tabs (cv, crumbify, ...), which skips the header and the CV content. The focus-restore effect (Pile.tsx:40-47) only handles top changes with touched=true, not the intro ending.
- fix: In src/components/Pile.tsx, add an effect on [phase]: when phase becomes 'done' after the intro ran (track the previous phase in a ref, prev === 'pull') and document.activeElement === document.body, call document.getElementById('sheet-cv')?.focus({ preventScroll: true }).

## [low] behaviour-05: Reduced motion: the 'instant' cross-fade only starts 440ms after the click (the incoming sheet is invisible for the whole out stage)
- file: src/lib/pile.ts:88 (checklist bh-13)
- expected: With prefers-reduced-motion, a sheet swap is an instant cross-fade: the new sheet starts fading in right away.
- actual: The 440/960ms timers still run unchanged. In 'out' the incoming sheet is opacity 0 under the current top (z m+1), so nothing visible happens for 440ms. It then fades in 0 -> 1 over 200ms at z m+3, and the swap settles at 960ms. The user sees a ~0.45s dead delay after each click.
- fix: In src/lib/usePile.ts bring(): when reducedMotion is true, set moving stage 'in' immediately (skip 'out') and settle at 200ms (matching the 0.2s opacity transition in Sheet.module.css:26), i.e. `at(reduced ? 0 : 440, ...)` and `at(reduced ? 200 : 960, ...)`. Or use the 'in' stage directly in the initial setState when reduced.

## [low] behaviour-06: The implementation-notes deviation log says any hash skips the intro, but the code only skips on known sheet ids (/#bogus plays the intro)
- file: src/lib/usePile.ts:36 (checklist intro-16 / owner decisions (docs/implementation-notes.md:17))
- expected: The code and the written owner decision agree. implementation-notes.md:17 says: 'Any hash present on first load, including #cv, skips straight to phase:'done''.
- actual: resolveIntro() and the pre-hydration script both check a whitelist. /#bogus loads with data-intro='play', shows the title page, and runs the full intro. The notes were not updated to record the whitelist choice (round-1 behaviour-09 asked for one or the other to be logged).
- fix: Edit docs/implementation-notes.md:17 to read: 'Only a hash naming a real sheet (#cv, #crumbify, #racing, #video, #about) skips the intro straight to phase done; an unknown hash (e.g. #bogus) plays the intro and is normalised to / with replaceState.'

## [low] code-r2-03: With storage blocked, the pre-hydration script aborts before setting data-desk/data-intro, so OS dark preference is ignored and deep links flash the title page
- file: src/app/layout.tsx:47 (checklist gl-28)
- expected: With no usable localStorage (blocked site data or cookies throws SecurityError on access), the first visit still follows prefers-color-scheme: dark, and a deep link still skips the intro before first paint.
- actual: One try block wraps everything. localStorage.getItem throws on the first line, so neither data-desk nor data-intro is ever set. useTheme only reads data-desk, so the desk stays light with the label 'Lights off' for an OS-dark user. /#racing paints the static title page and off-screen pile until hydration.
- fix: src/app/layout.tsx preHydrationScript: replace line 46 with `var stored=null;try{stored=localStorage.getItem('alibars-desk')}catch(e){}` so that the matchMedia/data-desk/data-intro logic always runs. Keep the outer try only as a final guard.

## [low] code-r2-04: Unknown-hash behaviour contradicts the recorded owner decision ('any hash skips the intro'), and the change was not logged
- file: src/lib/usePile.ts:37 (checklist docs/implementation-notes.md line 17)
- expected: Per implementation-notes.md:17, 'Any hash present on first load, including #cv, skips straight to phase done'. Round 1 (behaviour-09) said to either follow that or tighten to a whitelist AND log the change in implementation-notes.
- actual: resolveIntro() and the layout.tsx inline script now use the sheet-id whitelist, so /#bogus plays the intro (e2e 'an unknown hash plays the intro normally' asserts this). implementation-notes.md still records the opposite decision, and no deviation entry was added.
- fix: docs/implementation-notes.md: amend line 17 (or add a dated deviations entry) to say: 'Only a hash naming a real sheet (cv, crumbify, racing, video, about) skips the intro. An unknown hash such as #bogus plays the intro and is normalised to / with replaceState (review round 1, behaviour-09).'

## [low] code-r2-05: NOT-FIXED (code-12): usePile is still 55 lines, over the 50-line function limit
- file: src/lib/usePile.ts:113 
- expected: Functions under 50 lines (coding-style.md).
- actual: `export function usePile()` runs from line 113 to line 168 (55 lines), after extracting useHashSync, usePileKeys and useTimers.
- fix: src/lib/usePile.ts: move the mount useLayoutEffect (lines 124-133) into `function useIntro(at, setState, setReducedMotion)` and call it from usePile. That brings usePile to about 46 lines.

## [low] code-r2-06: Title page nests <h1> and <p> inside a <span> (invalid content model)
- file: src/components/TitlePage.tsx:39 
- expected: Valid HTML: the round-1 fix (slice-09/behaviour-10) aimed to make the title control content-model valid.
- actual: `<span className={styles.body}><h1 .../><p .../>...</span>`. A span allows phrasing content only, so h1 and p inside it are invalid, which is the same class of problem the fix removed from <button>. (Chromium still exposes the heading: its ARIA snapshot shows heading 'Ali Bars' [level=1] under the button.)
- fix: src/components/TitlePage.tsx:38 and :42: change `<span className={styles.body}>`...`</span>` to `<div className={styles.body}>`...`</div>`.

## [low] code-r2-07: The e2e test for code-05 (load-time /#cv replaces rather than pushes) would pass on the old broken pushState code
- file: e2e/pile.spec.ts:154 
- expected: The test proves no extra history entry was added, e.g. history.length is unchanged after normalisation, or goBack() does not land on /#cv.
- actual: It only asserts that the URL ends in '/'. pushState('/') produced the same URL, so the test does not guard the regression its title names. (The usePile unit test spying on replaceState/pushState does cover it at unit level.)
- fix: e2e/pile.spec.ts:154: after goto('/#cv') and the heading check, add `expect(await page.evaluate(() => history.length)).toBe(2)` (about:blank plus the page, with the entry replaced), or call page.goBack() and assert the URL is not /#cv.

## [low] code-r2-08: The desktop tab hover e2e test does not check the 3px value and passes for any transform change
- file: e2e/pile.spec.ts:82 (checklist atn-16)
- expected: Hovered tab computed transform is matrix(1, 0, 0, 1, 3, 0) (translateX(3px)).
- actual: It asserts only `after !== before`. The inactive tab starts at translateX(-6px), so a hover rule of translateX(0) (or the active-style offset) would also pass.
- fix: e2e/pile.spec.ts:88: replace the not.toBe check with `await expect.poll(() => tab.evaluate(el => getComputedStyle(el).transform)).toBe('matrix(1, 0, 0, 1, 3, 0)')`.

## [low] code-r2-09: Duplicate favicon <link> tags: a manual icon link plus the one Next generates from app/icon.svg
- file: src/app/layout.tsx:63 
- expected: One icon link. app/icon.svg already makes Next emit <link rel=icon href=/icon.svg?hash sizes=any>.
- actual: out/index.html has both `<link rel="icon" href="/icon.svg" type="image/svg+xml"/>` and `<link rel="icon" href="/icon.svg?6748ae18f79fd5a8" type="image/svg+xml" sizes="any"/>`. The manual one is dead code and has no cache-busting hash.
- fix: src/app/layout.tsx:63: delete the manual `<link rel="icon" .../>` line.

## [low] code-r2-10: useTimers never prunes fired timer ids, and its comment wrongly calls it 'Debounced'
- file: src/lib/usePile.ts:45 
- expected: Timer ids are removed once they fire (or the array is reset per move), and the doc comment matches the behaviour.
- actual: at() pushes every id into timers.current, which only shrinks on pull() or unmount. Every bring() adds 2 stale ids for the life of the page. Nothing debounces anything, despite the 'Debounced setTimeout scheduling' comment.
- fix: src/lib/usePile.ts:48-50: `const id = setTimeout(() => { timers.current = timers.current.filter(t => t !== id); fn(); }, ms); timers.current = [...timers.current, id];`. Change the line-44 comment to 'setTimeout scheduling whose pending timers are cleared on pull() and on unmount.'

## Refuted

