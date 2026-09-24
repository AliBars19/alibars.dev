# Review round 8 (workflow wf_66788414-94c)

Confirmed 2, refuted 0.

## [low] code-r8-01: NOT-FIXED (code-r7-04): the mobile-tab hit-test loop still calls elementFromPoint without toggling the note's pointer-events, so it cannot detect the note painting over a tab
- file: e2e/pile.spec.ts:644 (checklist slice-rvat5-01)
- expected: code-r7-04's fix asked for both loops, the tab hit-test loop and the visual-coverage loop, to temporarily set the note to pointer-events:auto before calling elementFromPoint. Then the test fails if the mobile tab row loses its `position:relative; z-index:1` (Tabs.module.css) and the note paints over the tabs.
- actual: Only the new note-text test at lines 661-698 uses the hitsSelectorPastNote toggle. The slice-rvat5-01 tab loop at lines 644-647 still calls a plain `document.elementFromPoint(centre)`. The note has pointer-events:none, so the browser always skips it and the loop returns the tab. The note-text test does not catch this regression either: when the note is on top, the toggled hit test lands on the note and not on the nav, so that test passes too. As a result, no e2e test fails when the tab row's z-index is removed.
- fix: In e2e/pile.spec.ts:644-647, get `const noteHandle = await page.locator(STICKY_NOTE_TEXT).first().elementHandle();` once, before the loop. Replace the page.evaluate(elementFromPoint) with `const hitsTab = await hitsSelectorPastNote(page, noteHandle, centre, 'nav[data-variant="mobile"] button');`. Before sampling, wait for the note's entry animation to finish (see code-r8-02). Keep the final click-through assertion as it is.

## [low] code-r8-02: The new note-text coverage e2e test (the slice-r7-01 guard) samples the note partway through its 0.6s noteIn entry animation, so it misses the exact round-7 regression in 2 of 3 runs
- file: e2e/pile.spec.ts:676 (checklist slice-r7-01 / atn-22)
- expected: The regression guard measures the note at its settled position. With the round-7 bug restored (`top:-48px` at 540-599px), it should fail every run. Commit 6e28b96 claims the test 'fails (RED) against the pre-slice-r7-01-fix CSS at all 4 widths'.
- actual: The test calls noteFirstLineRect() right after the nav's aria-hidden clears. The note mounts at that same moment (phase 'done') and is still running `animation: noteIn 0.6s both`, which goes from translateY(12px) to 0 (StickyNote.module.css:1-10,25). The first text line is therefore measured 3-6px lower than where it settles, and the test samples only the line's vertical centre. A regression that covers the settled text can pass, and whether it does depends on timing.
- fix: In e2e/pile.spec.ts, after `await expect(nav.getByRole('button')).toHaveCount(MOBILE_TAB_COUNT);` (around line 670) and before noteFirstLineRect, add `await page.locator(STICKY_NOTE_TEXT).first().evaluate((el) => Promise.all((el.closest('[class*="note"]') ?? el).getAnimations({ subtree: true }).map((a) => a.finished)));`. Alternatively, call getAnimations({subtree:true}) on the element that has the .note class. Add the same wait to the slice-rvat5-01 tab loop once code-r8-01 switches it to hitsSelectorPastNote.

## Refuted

