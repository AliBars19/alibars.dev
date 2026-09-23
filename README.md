# alibars.dev
Personal Website (about time lol)

"The Pile": an interactive CV built as a pile of paper on a desk. Next.js (App Router) +
TypeScript + CSS Modules, static export, no backend.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Static export to `out/` (`next build`, `output: 'export'`) |
| `npm start` | Serve the built `out/` on :3000 (`npx serve out`) |
| `npm run lint` | ESLint (Next flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit/component tests |
| `npm run test:coverage` | Vitest with v8 coverage (80% threshold on `src/lib` + `src/components`) |
| `npm run e2e` | Playwright, against a built + served `out/` (installs its own webServer) |
| `npm run screenshots` | Playwright's separate `screenshots` project: re-captures `docs/screenshots/*.png`. Not part of `npm run e2e`, so the gate leaves the working tree clean. |

## Where things live

- `src/content.ts` — the single source of truth for all copy and URLs. Grep it for `TODO(ali)`
  to find every placeholder link still needed: the Crumbify App Store URL, and the GitHub repo
  URLs for Crumbify, the video pipeline and the Automated Publishing Platform. Each renders as a
  working, styled button/link with an `#TODO-...` href until filled in.
- `src/lib/pile.ts` — pure pile logic (jitter, thickness, z-index table, hash routing), no React.
- `src/lib/usePile.ts` — the phase machine (intro + bring/navigate) as a hook.
- `src/components/` — Desk (header/theme), Pile (the stage), Tabs, TitlePage, StickyNote,
  Highlight, and `sheets/` for the five content sheets (CV, Crumbify, Racing, Video, About).
- `docs/implementation-notes.md` — owner decisions that override the design handoff, plus a
  deviations log of anything implemented differently from the literal spec and why.
- `design_handoff_alibars_portfolio/` — the design handoff this was built from (spec, content,
  reference prototype, screenshots). Not part of the shipped site.

## Notes

- Static export (`output: 'export'`): no server, no API routes. Images are plain `<img>` tags
  (no `next/image` optimisation needed at this size).
- `public/Ali_Bars_CV.pdf` is the redacted CV (no phone number) that ships with the site. The
  original resume PDF is intentionally gitignored and never committed.
