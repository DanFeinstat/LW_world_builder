# Campaign Manager — CLAUDE.md

This file is Claude Code's persistent memory for this project.
Read it at the start of every session before doing anything else.

## What this project is

A browser-based D&D campaign management tool. Data stored as JSON files
in a separate GitHub repo. Hosted on GitHub Pages. No backend server.
See SPEC.md for the full product spec and roadmap.

## Current phase

Phase 1 — Foundation (in progress)
[ ] Update this when a phase is complete.

## Repo layout

- App repo: github.com/DanFeinstat/LW_world_builder ← this codebase
- Data repo: configured at runtime via SetupScreen (stored in localStorage)
- Deployed at: https://danfeinstat.github.io/LW_world_builder/

## Architecture rules (non-negotiable)

- All GitHub API calls go through `src/lib/github.ts` only
- All data mutations go through Zustand stores only
- TypeScript strict mode: no `any`, no `// @ts-ignore`

## Type colocation rules (non-negotiable)

- `src/types/index.ts` — global types only: those consumed by two or more **unrelated** feature areas
  (currently: `User`, `Role`, `CampaignMeta`, `GitHubConfig`, `ThemePreference`, `ConnectionStatus`, `Visibility`)
- Feature-specific types — colocated `types.ts` next to the feature
  (e.g. `Article`, `ArticleType` live in `src/components/articles/types.ts`)
- Lib-specific types — defined in the lib file itself
  (e.g. `StoredFile<T>` is defined and exported from `src/lib/github.ts`)
- Simple single-component prop interfaces — exported from the component file directly
  (e.g. `export interface ModalProps { ... }` in `Modal.tsx`)
- Phase N+ types with no current consumers — define colocated when their feature is built; do NOT pre-populate `src/types/index.ts`
- Never define domain model types inline in a component — always import from the appropriate location above

## CSS rules (non-negotiable)

- Tailwind CSS v3 utility classes in JSX — no `.module.css` files
- Design tokens in `src/styles/tokens.css` (CSS custom properties) — single source of truth
- Tailwind config (`tailwind.config.ts`) maps utility names to those variables
- `clsx` for all conditional className logic
- No inline `style` except runtime-dynamic values (e.g. `style={{ color: user.color }}`)
- `@layer components` in `src/styles/main.css` only for patterns used across 5+ unrelated components
- Framer Motion only from Phase 4. Do not install earlier.
- Dark mode via `data-theme` attribute on `<html>` + CSS variable switching.
  Never use Tailwind `dark:` variant. Never hardcode color values.

## Theme system

- Theme preference stored in localStorage under `theme-preference`
- Options: light / dark / system
- Applied via `data-theme` attribute on `<html>` element
- `AppContext` exposes `theme` and `setTheme`
- CSS variable values flip automatically — Tailwind utility class names never change
- `src/lib/theme.ts`: `getStoredTheme`, `setStoredTheme`, `applyTheme`

## State rules

- React Context: currentUser + campaignMeta + theme + connectionStatus + githubConfig only. Nothing else.
- Zustand: one store per domain. Selector subscriptions only — never subscribe to whole store.
- useState: ephemeral UI state only (forms, modals, hover).
- New contexts must use the `createContext` factory in `src/context/createContext.ts`

## Timeline rules

- Display order defined by `data/timeline/order.json` (array of event IDs)
- `worldDate` is a freeform string — no parsing, no date-based sorting
- `sessionNumber` is an optional label, not a foreign key
- Inserting/removing/reordering events must update `order.json`

## ID generation

Always use `src/lib/ids.ts`. Prefix pattern:
- Articles: `art_`
- Users: `usr_`
- Sessions: `ses_`
- Journals: `jrn_`
- Timeline events: `evt_`

## Security model (explicit decisions)

- Passphrases are plaintext. This is intentional. Do not add hashing.
- DM-only enforcement is client-side only. This is intentional.
- PAT is stored in localStorage. This is intentional.
- `'github-config'` localStorage key is an implementation detail, not a secret.
- Do not add auth, encryption, or server-side enforcement.

## Connection resilience

- Track `connectionStatus` in AppContext: 'connected' | 'disconnected'
- On failure: show banner, block writes, keep cached data visible
- On reconnect: dismiss banner, re-enable writes
- Cross-session persistence deferred to Phase 5

## Component rules

- Max ~150 lines per component. Split if larger.
- No premature abstraction. Don't extract for single-use patterns.
- Every async operation must handle loading, success, and error states.
- Optimistic updates: update store → write GitHub → rollback on failure.
- Layouts: flex/grid, no fixed pixel widths on content areas. Sidebar collapsible from Phase 1.

## Toast system

- `useToast` is a Zustand store at `src/components/shared/Toast/useToast.ts`
- Call `useToast.getState().showToast(message, type)` from outside React (store catch blocks)
- Call `useToast(state => state.showToast)` inside React components
- `ToastStack` is mounted at the root in `App.tsx`

## Image handling (Phase 2+)

- Images stored as separate files in `data/images/{articleId}/{filename}`
- Client-side resize to max 1200px width before upload
- Referenced in markdown as `![alt](img:{filename})`
- Rendered via raw.githubusercontent.com URLs with `loading="lazy"`
- Upload/delete via `github.ts` functions

## Known gotchas

- GitHub write requires the current file sha. Always fetch before write.
- 409 Conflict means sha mismatch — re-fetch and retry once.
- Polling pauses when tab is not visible. Resume on visibilitychange.
- Do not fetch all data on load — lazy-fetch per section.
- App repo and data repo are separate. Don't confuse them.
- All reads use PAT auth (unauthenticated rate limits are too low).
- Timeline order.json is the source of truth for event ordering — not worldDate.
- Tailwind spacing scale is custom (1=4px, 2=8px, etc.) — does not match Tailwind defaults.
- Tailwind color names are custom (e.g. `bg-surface`, `text-text-primary`) — no default palette.

## Phase completion log

[ Phase 1 ] — in progress
[ Phase 2 ] — not started
[ Phase 3 ] — not started
[ Phase 4 ] — not started
[ Phase 5 ] — not started
[ Phase 6 ] — not started

## Session notes

### 2026-04-12 — Phase 1 in progress

Architectural decision: switched from CSS Modules to Tailwind CSS v3 during Phase 1
before significant component CSS had accumulated. Rationale: style colocation in JSX
is a genuine productivity benefit. Dark mode still handled via CSS custom properties
and `[data-theme]` attribute — Tailwind utilities map to those variables, so the
`dark:` variant is never used. The `tokens.css` file remains the single source of
truth for all design values; `tailwind.config.ts` references those variables.

PR workflow: each phase step is a separate feature branch + PR against main.
No automerging — every PR requires manual review and merge.

`createContext` factory (`src/context/createContext.ts`) added for all contexts:
sets `displayName` for React DevTools, throws with clear message if used outside provider.
