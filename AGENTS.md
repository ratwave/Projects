# AGENTS.md

## Cursor Cloud specific instructions

Lemmings — Web Edition is a **100% client-side** TypeScript browser game (Vite + Vitest,
Canvas 2D). There is no backend, database, or external service — the only "service" is the
Vite dev server. Node 22 and npm are preinstalled; the update script runs `npm install`.

Standard commands live in `README.md` (§ Develop) and `package.json` scripts; use those as
the source of truth. Quick reference:

- Dev server: `npm run dev` → http://localhost:5173 (Vite is configured with `host: true`,
  `port: 5173`). This is a long-running process — start it in a background/tmux session.
- Tests: `npm test` (Vitest, node environment, no server needed) — 55 tests.
- Build: `npm run build` (runs `tsc --noEmit` then `vite build`).
- Lint: `npm run lint`.

Non-obvious notes:

- `npm run lint` currently reports pre-existing `prefer-const` errors in
  `src/render/textures.ts`. These are existing code issues, not an environment problem.
- The optional Playwright tools in `tools/` (`smoke.mjs`, `screenshot.mjs`, `playtest.mjs`,
  etc.) drive the running dev server via headless Chromium. They require the dev server to be
  up **and** a one-time `npx playwright install chromium` (plus OS headless-browser deps),
  which the update script intentionally does not install. Run them as
  `node tools/smoke.mjs http://localhost:5173/`.
- The app exposes `window.__app` at runtime as a hook for automated/browser testing.
- Game progression is saved to browser `localStorage`; there is no server-side state.
