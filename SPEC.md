# Campaign Manager — Product Spec & Roadmap

> **For Claude Code:** This document is the authoritative spec for building the Campaign Manager app. Each phase is self-contained and ends in a shippable state. Read the full document before starting any phase. Do not add features not listed here. Do not deviate from the data models defined below without flagging it first.

---

## Overview

A browser-based D&D campaign management tool for a small group (1–4 DMs, up to ~8 players). No dedicated backend server. Data is persisted as JSON files in a **GitHub repository**, read via the GitHub Contents API, and written via the same API using a Personal Access Token stored in app settings. No auth provider — identity is a lightweight username + passphrase system stored in the campaign data itself.

**Core URL:** Hosted on GitHub Pages. Single URL everyone opens. All navigation is in-app state — no URL routing framework needed.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React + TypeScript (Vite) | Functional components + hooks only. Strict mode on. |
| Styling | CSS Modules | One `.module.css` per component. No CSS-in-JS. No Tailwind. No UI library. |
| Dynamic classes | `clsx` | For conditional/composed className logic. Never string template literals for multi-class logic. |
| Animations | CSS transitions/keyframes by default; Framer Motion for orchestrated animations | See Animation Guidelines below. |
| Data layer | GitHub Contents API (REST) | Read: PAT required (unauthenticated rate limits too low for multi-user). Write: PAT in localStorage. |
| State — global config | React Context | Current user + campaign meta + theme preference only. Narrow scope. |
| State — shared data | Zustand | One store per domain. Selector-based subscriptions. |
| State — ephemeral UI | Local `useState` | Form values, modal open/closed, hover state. |
| Rich text | Plain `<textarea>` Phase 1–3; `@uiw/react-md-editor` from Phase 4 | |
| Build | Vite | |
| Host | GitHub Pages | App repo separate from data repo. |

---

## Recommended Claude Code Plugins

Install before starting development. These should be set up once globally, not per-project.

```bash
# Skills (auto-activate, ~100 tokens each — always on)
claude plugin add anthropic/frontend-design
claude plugin add anthropic/typescript-lsp

# MCP servers (load at session start — keep to 3–5 max)
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest
claude mcp add github -s user -- npx @anthropic-ai/github-mcp@latest

# Enable when doing UI verification work, disable otherwise
claude mcp add playwright -s user -- npx @playwright/mcp@latest
```

**What each does for this project:**
- `frontend-design` — pushes Claude toward intentional aesthetic choices instead of generic AI UI defaults. Auto-activates on frontend work.
- `typescript-lsp` — live TypeScript language server awareness. Catches type errors inline, improves refactors in strict mode.
- `context7` — pulls live docs for Zustand, Framer Motion, `@uiw/react-md-editor` into context. Prevents Claude from guessing at current APIs.
- `github` — lets Claude interact with the data repo directly (create file structure, inspect branches, manage PRs) without leaving the terminal.
- `playwright` — lets Claude spin up the dev server, screenshot its own UI output, and iterate visually. Enable when building/reviewing UI, disable otherwise to save tokens.

---

## Animation Guidelines

Use **CSS** (transitions + `@keyframes` in `.module.css`) as the default for:
- Hover and focus state changes
- Simple fades, slides, and scales
- Color and opacity transitions
- Button, badge, and input micro-interactions

Use **Framer Motion** selectively (Phase 4+) for:
- Elements entering/exiting the DOM — CSS cannot animate unmounting
- Staggered list animations (article cards loading in)
- Layout animations (sidebar collapse, panel resize)
- The timeline view
- Modals and drawers entering/exiting

Never use Framer Motion where a CSS transition is sufficient. Import only what is used (`motion.div`, `AnimatePresence`, etc.). Do not install Framer Motion before Phase 4.

---

## CSS Architecture

### Layer 1 — Design Tokens (`src/styles/tokens.css`)

Global CSS custom properties. Imported **once** in `main.tsx`. Never imported per-component. Every value that needs to be consistent across the app lives here.

```css
/* src/styles/tokens.css */
:root {
  /* Brand */
  --color-dm: #7F77DD;
  --color-dm-subtle: #EEEDFE;
  --color-player: #1D9E75;
  --color-player-subtle: #E1F5EE;

  /* Article types */
  --color-npc: #7F77DD;
  --color-location: #1D9E75;
  --color-faction: #D85A30;
  --color-lore: #378ADD;
  --color-quest: #BA7517;

  /* Neutrals */
  --color-surface: #ffffff;
  --color-surface-raised: #f8f7f4;
  --color-surface-sunken: #f0ede8;
  --color-border: #e2ddd6;
  --color-border-strong: #c9c3b8;
  --color-text-primary: #1a1714;
  --color-text-secondary: #6b6560;
  --color-text-muted: #9c978f;

  /* Semantic */
  --color-danger: #c0392b;
  --color-danger-subtle: #fdf0ee;
  --color-success: #1a7a4a;
  --color-success-subtle: #edf7f2;
  --color-warning: #b45309;
  --color-warning-subtle: #fef9ee;

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Typography */
  --font-display: 'Cinzel', Georgia, serif;   /* headings, campaign title */
  --font-body: 'Lora', Georgia, serif;         /* article body, notes */
  --font-ui: 'Inter', system-ui, sans-serif;   /* labels, nav, UI chrome */
  --font-mono: 'JetBrains Mono', monospace;

  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-md: 17px;
  --text-lg: 20px;
  --text-xl: 24px;
  --text-2xl: 30px;

  --leading-tight: 1.3;
  --leading-base: 1.6;
  --leading-loose: 1.8;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.10);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);

  /* Transitions */
  --transition-fast: 120ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 350ms ease;

  /* Z-index layers */
  --z-base: 0;
  --z-raised: 10;
  --z-dropdown: 100;
  --z-modal: 200;
  --z-toast: 300;
}

/* Dark mode via data attribute (toggled by user preference) */
[data-theme="dark"] {
  --color-surface: #1c1917;
  --color-surface-raised: #242220;
  --color-surface-sunken: #161412;
  --color-border: #2e2b28;
  --color-border-strong: #3d3935;
  --color-text-primary: #f0ece6;
  --color-text-secondary: #a09890;
  --color-text-muted: #6b6560;

  --color-dm-subtle: #2a2844;
  --color-player-subtle: #1a3028;
  --color-danger-subtle: #3a1a16;
  --color-success-subtle: #1a2e22;
  --color-warning-subtle: #2e2010;

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.24);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.32);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.40);
}

/* System preference fallback when no explicit choice is stored */
@media (prefers-color-scheme: dark) {
  [data-theme="system"] {
    --color-surface: #1c1917;
    --color-surface-raised: #242220;
    --color-surface-sunken: #161412;
    --color-border: #2e2b28;
    --color-border-strong: #3d3935;
    --color-text-primary: #f0ece6;
    --color-text-secondary: #a09890;
    --color-text-muted: #6b6560;

    --color-dm-subtle: #2a2844;
    --color-player-subtle: #1a3028;
    --color-danger-subtle: #3a1a16;
    --color-success-subtle: #1a2e22;
    --color-warning-subtle: #2e2010;

    --shadow-sm: 0 1px 3px rgba(0,0,0,0.24);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.32);
    --shadow-lg: 0 8px 24px rgba(0,0,0,0.40);
  }
}
```

> **Font note:** `Cinzel` (display) and `Lora` (body) give the app a fantasy manuscript feel appropriate for a D&D tool. Load both from Google Fonts in `index.html`. `Inter` is the UI fallback for chrome elements where readability matters more than aesthetics.

> **Theme note:** Theme preference (light/dark/system) is stored in `localStorage` under `theme-preference`. On load, read the value and set `data-theme` on `<html>`. Default to `"system"` if no preference is stored. The toggle lives in the sidebar footer or settings. `AppContext` exposes `theme` and `setTheme` for components that need to react to the current theme.

### Layer 2 — Reset (`src/styles/reset.css`)

Minimal. Imported once in `main.tsx` before `tokens.css`.

```css
/* src/styles/reset.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; -webkit-font-smoothing: antialiased; }
body { font-family: var(--font-ui); color: var(--color-text-primary); background: var(--color-surface); }
img, svg { display: block; max-width: 100%; }
button { cursor: pointer; font: inherit; }
a { color: inherit; }
```

### Layer 3 — Global Utilities (`src/styles/globals.css`)

Imported once in `main.tsx`. **Kept small and disciplined.** Only patterns that are genuinely cross-cutting and cannot be tokenised or composed. Not a utility class dumping ground.

```css
/* src/styles/globals.css */

/* Accessibility */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

/* Focus ring — apply to interactive elements */
.focus-ring:focus-visible {
  outline: 2px solid var(--color-dm);
  outline-offset: 2px;
}

/* Prose content (article bodies, session notes) */
.prose {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-loose);
  color: var(--color-text-primary);
}
.prose h1, .prose h2, .prose h3 {
  font-family: var(--font-display);
  line-height: var(--leading-tight);
  margin-top: var(--space-6);
  margin-bottom: var(--space-3);
}
.prose p { margin-bottom: var(--space-4); }
.prose ul, .prose ol { padding-left: var(--space-6); margin-bottom: var(--space-4); }
.prose li { margin-bottom: var(--space-1); }
.prose strong { font-weight: 600; }
.prose em { font-style: italic; }
.prose a { color: var(--color-dm); text-decoration: underline; }
.prose code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  background: var(--color-surface-sunken);
  padding: 1px var(--space-1);
  border-radius: var(--radius-sm);
}
```

> **Rule:** If you find yourself adding a new utility class to `globals.css`, stop and ask if it should be a token instead, a composed base style, or just a local class in the component's own module. `globals.css` should stay under ~80 lines total.

### Layer 4 — Shared Base Styles (`src/styles/shared/`)

Reusable base patterns composed into component modules using CSS Modules `composes`. Use for structural patterns that repeat across many unrelated components.

```
src/styles/shared/
  card.module.css       ← surface card shell
  button.module.css     ← button resets and base variants
  input.module.css      ← text input, textarea, select base
  badge.module.css      ← pill/chip base
```

Example — card base:
```css
/* src/styles/shared/card.module.css */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  transition: border-color var(--transition-fast);
}
.cardInteractive {
  composes: card;
  cursor: pointer;
}
.cardInteractive:hover {
  border-color: var(--color-border-strong);
}
```

Example — consuming it in a component:
```css
/* ArticleCard.module.css */
.articleCard {
  composes: cardInteractive from '@/styles/shared/card.module.css';
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}
.dmOnly {
  border-left: 3px solid var(--color-dm);
}
```

> **`composes` rules:**
> - Only works with plain class selectors — not pseudo-classes, not nested rules
> - Use for structural/layout base patterns only, not for visual styling
> - If a pattern appears in only 2 components, just repeat it — don't abstract prematurely
> - Maximum one level of composition — do not compose a composed class

### Layer 5 — Component Modules

One `.module.css` per component, colocated in the same directory. All component-specific styles live here. Import with `import styles from './Component.module.css'`.

**Rules:**
- Use `clsx` for all multi-condition className logic
- No inline `style` props except for values that are runtime-dynamic and cannot be expressed as a class (e.g. `style={{ color: user.color }}` for a user's chosen color)
- Reference tokens via `var(--token-name)` — never hardcode colors, spacing, or radii
- Responsive layout via CSS Grid and Flexbox. Avoid fixed pixel widths on main content areas. Keep layouts flexible enough for future mobile adaptation.
- Animations: CSS `transition` and `@keyframes` here by default; Framer Motion via JS in the component from Phase 4+

---

## Roles

| Role | Permissions |
|---|---|
| **DM** | Create/edit/delete any article. Set visibility and interactability per article. Manage users (promote/demote). Manage sessions. Manage timeline. Configure GitHub settings. |
| **Player** | Read articles marked `visibility: "shared"`. Write to their own journal. Promote journal entries to draft articles (DM must approve). Cannot see DM-only content. |

- Multiple DMs are allowed simultaneously.
- Any DM can promote a player to DM or demote a DM to player.
- There is no "owner" or super-admin — all DMs are equal.
- A campaign must always have at least one DM (enforce this on demote).

---

## Data Layer — GitHub Storage

### Repository Structure

```
data/
  meta.json
  users/
    usr_abc123.json
  articles/
    art_abc123.json
  images/
    art_abc123/
      filename.png       ← Phase 2+
  sessions/
    ses_abc123.json
  journals/
    jrn_abc123.json
  timeline/
    order.json           ← array of event IDs defining display order
    evt_abc123.json
  presence/
    usr_abc123.json      ← Phase 5
```

### Reading Data

All reads use the GitHub Contents API with PAT authentication for adequate rate limits (5,000 req/hour vs 60 unauthenticated).

```
GET https://api.github.com/repos/{owner}/{repo}/contents/data/{path}
Authorization: Bearer {PAT}
```

Returns base64-encoded content. Decode with `atob()`. Store the returned `sha` alongside the data — required for writes.

On app load, fetch the full tree in one call:
```
GET https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1
```
Then lazy-fetch individual files as sections are navigated to. Never fetch everything on load.

### Writing Data

```
PUT https://api.github.com/repos/{owner}/{repo}/contents/data/{path}
Authorization: Bearer {PAT}

{
  "message": "update {path}",
  "content": "{base64 JSON}",
  "sha": "{current sha}"
}
```

On `409 Conflict`: re-fetch for fresh sha, retry once. If retry fails: error toast, do not discard data silently. Show the user that their edit was overwritten and by whom if possible.

Deletes use `DELETE` on the same endpoint with the current `sha`.

### Polling

Poll `GET .../commits/main` every 30s. Compare commit SHA. On change: re-fetch affected files, update stores, show toast. Only poll when `document.visibilityState === 'visible'`.

### Connection Status

Track connection health via a `connectionStatus` flag in `AppContext`: `'connected' | 'disconnected'`.

On fetch/poll failure (network error, 403, 429):
- Set status to `'disconnected'`
- Show a persistent banner: *"Connection lost — showing cached data (read-only). [Retry]"*
- Block all write operations with a toast explaining the situation
- Keep existing store data visible as read-only

On successful fetch after disconnect:
- Set status back to `'connected'`
- Dismiss the banner
- Re-enable write operations

Cross-session cache persistence (localStorage/IndexedDB hydration) is deferred to Phase 5. Phase 1 only caches in-memory for the current session.

### GitHub Config (localStorage)

```ts
interface GitHubConfig {
  owner: string
  repo: string
  pat: string
}
```

Show `SetupScreen` on first load if no config. Config is per-browser. Players with no PAT get read-only access and a warning on write attempt.

---

## Data Models

### User
```json
{
  "id": "usr_abc123",
  "name": "Aria",
  "passphrase": "sunforge",
  "role": "dm",
  "color": "#7F77DD",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Campaign Meta (`data/meta.json`)
```json
{
  "campaignName": "The Shattered Realm",
  "currentDate": "Year 412, 14th of Ashmonth"
}
```

`currentDate` is a freeform string representing the in-world "present day." DMs update it manually via Settings. Displayed in the sidebar or app header. No structured calendar or date validation — users define their own time system.

### Article
```json
{
  "id": "art_abc123",
  "title": "Thorin Ironback",
  "articleType": "npc",
  "body": "Markdown string",
  "tags": ["dwarf", "merchant", "friendly"],
  "visibility": "dm_only",
  "interactable": false,
  "links": ["art_xyz789"],
  "createdBy": "usr_abc123",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```
- `articleType`: `"npc" | "location" | "faction" | "lore" | "quest"`
- `visibility`: `"dm_only" | "shared"`
- `interactable`: players can edit body when `true` and `visibility === "shared"`

### Session
```json
{
  "id": "ses_abc123",
  "number": 1,
  "title": "The Burning Crossing",
  "dmNotes": "markdown",
  "sharedRecap": "markdown",
  "worldDate": "Year 412, 1st of Ashmonth",
  "realDate": "2025-03-01",
  "linkedArticles": ["art_abc123"],
  "createdAt": "2025-01-01T00:00:00Z"
}
```

`worldDate` is a freeform string. Display-only — no parsing or sorting by this field.

### Journal Entry
```json
{
  "id": "jrn_abc123",
  "authorId": "usr_abc123",
  "sessionId": "ses_abc123",
  "body": "markdown",
  "promotedTo": null,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### Timeline Event
```json
{
  "id": "evt_abc123",
  "title": "The Fall of Ironspire",
  "description": "markdown",
  "worldDate": "Year 410, 14th of Stormreach",
  "sessionNumber": null,
  "visibility": "dm_only",
  "linkedArticles": ["art_abc123"],
  "createdAt": "2025-01-01T00:00:00Z"
}
```

- `worldDate`: freeform string. Display-only label — not used for sorting.
- `sessionNumber`: optional `number | null`. When set, the event is displayed with a session badge (e.g. "Session 4"). This is a label, not a foreign key — it does not link to a session record.
- **Ordering**: Timeline events are displayed in the order defined by `data/timeline/order.json`, an array of event IDs (e.g. `["evt_abc", "evt_def", "evt_ghi"]`). Inserting, removing, or reordering events updates this array. Events not listed in the order array are appended to the end.

### Timeline Order (`data/timeline/order.json`)
```json
["evt_abc123", "evt_def456", "evt_ghi789"]
```

This file is the single source of truth for timeline display order. All timeline mutations that affect ordering must update this file. On `409 Conflict`, re-fetch and retry once (same pattern as other writes).

---

## TypeScript Types (`src/types/index.ts`)

All domain types defined here. No inline model types anywhere else.

```ts
export type Role = 'dm' | 'player'
export type ArticleType = 'npc' | 'location' | 'faction' | 'lore' | 'quest'
export type Visibility = 'dm_only' | 'shared'
export type ThemePreference = 'light' | 'dark' | 'system'
export type ConnectionStatus = 'connected' | 'disconnected'

export interface User {
  id: string
  name: string
  passphrase: string
  role: Role
  color: string
  createdAt: string
}

export interface CampaignMeta {
  campaignName: string
  currentDate: string
}

export interface Article {
  id: string
  title: string
  articleType: ArticleType
  body: string
  tags: string[]
  visibility: Visibility
  interactable: boolean
  links: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  number: number
  title: string
  dmNotes: string
  sharedRecap: string
  worldDate: string
  realDate: string
  linkedArticles: string[]
  createdAt: string
}

export interface JournalEntry {
  id: string
  authorId: string
  sessionId: string
  body: string
  promotedTo: string | null
  createdAt: string
  updatedAt: string
}

export interface TimelineEvent {
  id: string
  title: string
  description: string
  worldDate: string
  sessionNumber: number | null
  visibility: Visibility
  linkedArticles: string[]
  createdAt: string
}

export interface GitHubConfig {
  owner: string
  repo: string
  pat: string
}

export interface StoredFile<T> {
  data: T
  sha: string
}
```

---

## Zustand Store Structure

One store per domain in `src/stores/`. All follow this pattern:

```ts
interface ArticleStore {
  articles: Article[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (article: Article) => Promise<void>
  update: (id: string, patch: Partial<Article>) => Promise<void>
  remove: (id: string) => Promise<void>
}
```

Pattern: optimistic local update first → write to GitHub → rollback + toast on failure.

Components subscribe via selectors — never subscribe to the entire store:
```ts
// Good — only re-renders when articles change
const articles = useArticleStore(state => state.articles)

// Bad — re-renders on any store change
const store = useArticleStore()
```

### Timeline Store

The timeline store manages both event data and display order:

```ts
interface TimelineStore {
  events: TimelineEvent[]
  order: string[]            // event IDs in display order
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (event: TimelineEvent, insertAfter?: string) => Promise<void>
  update: (id: string, patch: Partial<TimelineEvent>) => Promise<void>
  remove: (id: string) => Promise<void>
  reorder: (eventId: string, newIndex: number) => Promise<void>
}
```

`add` writes both the event JSON file and updates `order.json`. If `insertAfter` is provided, the new event is spliced after that ID; otherwise it is appended. `remove` deletes the event file and removes the ID from `order.json`. `reorder` updates `order.json` only.

---

## App Structure

```
src/
  main.tsx
  App.tsx
  types/
    index.ts
  styles/
    tokens.css
    reset.css
    globals.css
    shared/
      card.module.css
      button.module.css
      input.module.css
      badge.module.css
  context/
    AppContext.tsx          ← currentUser, campaignMeta, theme, connectionStatus
  stores/
    useArticleStore.ts
    useSessionStore.ts
    useJournalStore.ts
    useTimelineStore.ts
    useUserStore.ts
  lib/
    github.ts              ← readFile, writeFile, deleteFile, listTree, pollCommit, uploadImage (Phase 2)
    ids.ts
    theme.ts               ← getStoredTheme, setStoredTheme, applyTheme
  components/
    setup/
      SetupScreen.tsx + .module.css
    auth/
      LoginScreen.tsx + .module.css
    layout/
      AppShell.tsx + .module.css
      Sidebar.tsx + .module.css
      ConnectionBanner.tsx + .module.css
    articles/
      ArticleList.tsx + .module.css
      ArticleCard.tsx + .module.css
      ArticleDetail.tsx + .module.css
      ArticleEditor.tsx + .module.css
      ImageUpload.tsx + .module.css       (Phase 2+)
    sessions/
      SessionList.tsx + .module.css
      SessionDetail.tsx + .module.css
      SessionEditor.tsx + .module.css
    journal/
      JournalView.tsx + .module.css
      JournalEditor.tsx + .module.css
      PromoteModal.tsx + .module.css
    timeline/
      TimelineView.tsx + .module.css
      TimelineEditor.tsx + .module.css
    users/
      UserList.tsx + .module.css
    settings/
      CampaignSettings.tsx + .module.css
      ThemeToggle.tsx + .module.css
    shared/
      Modal/Modal.tsx + .module.css
      Toast/Toast.tsx + .module.css + useToast.ts
      Badge/Badge.tsx + .module.css
      RoleTag/RoleTag.tsx + .module.css
      SessionBadge/SessionBadge.tsx + .module.css
      MarkdownPreview/MarkdownPreview.tsx + .module.css  (Phase 4+)
```

---

## Navigation

Single `view` string in `AppContext`. No router library.

| Section | Who Sees It | `view` value |
|---|---|---|
| Articles | Everyone (filtered by visibility) | `articles` |
| Sessions | Everyone (DM sees dm notes; players see shared recap only) | `sessions` |
| Journal | Players (own); DMs can read all | `journal` |
| Timeline | Everyone (filtered by visibility) | `timeline` |
| Users | DM only | `users` |
| Settings | DM only | `settings` |

---

## Phased Roadmap

### Phase 1 — Foundation
**Goal:** Working app with GitHub storage, setup flow, auth, article CRUD, dark mode, and connection resilience.

#### Deliverables
- [ ] Vite + React + TypeScript scaffold, strict mode, `@/` path alias
- [ ] `src/types/index.ts` — all types upfront
- [ ] `tokens.css`, `reset.css`, `globals.css` — imported in `main.tsx`
- [ ] Dark mode: `data-theme` attribute on `<html>`, theme toggle (light/dark/system), preference in localStorage
- [ ] `src/styles/shared/` — `card`, `button`, `input`, `badge` base modules
- [ ] `src/lib/github.ts` — `readFile`, `writeFile`, `deleteFile`, `listTree`, `pollCommit` (all reads authenticated via PAT)
- [ ] `src/lib/ids.ts` — prefixed `crypto.randomUUID()`
- [ ] `src/lib/theme.ts` — `getStoredTheme`, `setStoredTheme`, `applyTheme`
- [ ] `SetupScreen` — owner/repo/PAT input, validation test call, stored in localStorage
- [ ] `LoginScreen` — username + passphrase; auto-create if new; first user is DM
- [ ] `AppContext` — `currentUser` + `campaignMeta` + `theme` + `connectionStatus`
- [ ] `ConnectionBanner` — persistent banner on disconnect, retry button, blocks writes
- [ ] `useArticleStore` — full CRUD
- [ ] `AppShell` + `Sidebar` (collapsible from Phase 1 for future mobile readiness)
- [ ] Article list: filter by type, search by title
- [ ] Article CRUD with all model fields
- [ ] `visibility` toggle — players cannot see `dm_only`
- [ ] `interactable` toggle — players edit body when `true` + `shared`
- [ ] Cross-linking: multi-select → clickable chips
- [ ] Toast system (`useToast`)
- [ ] 30s polling, visibility-aware

#### Layout guidance
- Use flex/grid layouts that can reflow. Avoid fixed pixel widths on the main content area.
- Sidebar should be collapsible from day one.
- No mobile-specific work yet, but don't paint into a corner.

#### Out of scope for Phase 1
- Markdown editor (plain `<textarea>`)
- Sessions, journals, timeline, users section
- Tag filter UI (model includes tags, no filter yet)
- Image upload

#### Acceptance criteria
- [ ] Setup validates config before proceeding
- [ ] First user auto-assigned DM
- [ ] `dm_only` article invisible to players
- [ ] `shared` + `interactable` article editable by players
- [ ] Save writes to GitHub; polling tab picks up change within 35s
- [ ] 409 triggers re-fetch + retry
- [ ] Cross-link chips navigate to linked article
- [ ] Dark mode toggle works (light/dark/system) and persists across reloads
- [ ] On network failure, app shows cached data with disconnect banner; writes are blocked
- [ ] On reconnect, banner dismisses and writes re-enable

---

### Phase 2 — Sessions, Journals & Images
**Goal:** Session tracking, player journal with promote-to-article flow, and image support in articles.

#### Deliverables
- [ ] `useSessionStore` + `useJournalStore`
- [ ] Session list + detail + editor
- [ ] `worldDate` on sessions as freeform text input
- [ ] Players see sessions but only `sharedRecap` + `linkedArticles`
- [ ] Journal view: session list, one entry per player per session
- [ ] Journal editor: `<textarea>`, debounced auto-save on blur (1s)
- [ ] Promote flow: `PromoteModal` → pre-filled article form → `dm_only` draft
- [ ] DMs read all journals (read-only)
- [ ] `promotedTo` renders as link in journal view
- [ ] **Image upload**: `ImageUpload` component, client-side resize (max 1200px width via canvas), upload to `data/images/{articleId}/{filename}` via GitHub Contents API
- [ ] `uploadImage` / `deleteImage` functions in `github.ts`
- [ ] Article body renders image references as `<img>` tags pointing to `raw.githubusercontent.com` URLs with `loading="lazy"`
- [ ] Image references use syntax `![alt](img:{filename})` resolved at render time

#### Acceptance criteria
- [ ] Journal saves to `data/journals/jrn_{id}.json`
- [ ] Promoted entry creates `dm_only` article
- [ ] DM can publish by changing visibility to `shared`
- [ ] Images upload to correct path and render in article view
- [ ] Images are resized client-side before upload
- [ ] Lazy loading prevents images from blocking initial article render

---

### Phase 3 — Timeline
**Goal:** Manually-ordered chronological timeline with freeform dates.

#### Deliverables
- [ ] `useTimelineStore` with order management
- [ ] `data/timeline/order.json` — created on first timeline event
- [ ] Timeline view: events rendered in order from `order.json`, filtered by visibility
- [ ] Timeline event editor: title, description (`<textarea>`), freeform `worldDate` text input, optional `sessionNumber` input, visibility toggle, linked articles
- [ ] Insert event at any position (UI: "add after [event]" or "add to beginning/end")
- [ ] Reorder events (up/down buttons; drag-to-reorder deferred to Phase 4 with Framer Motion)
- [ ] `SessionBadge` component: renders "Session N" pill on timeline events with a `sessionNumber`
- [ ] DM can update campaign `currentDate` (freeform string) in Settings
- [ ] Sessions show `worldDate` as display text

#### Out of scope
- Graphical/zoomable timeline visualization
- Parallel timelines
- Sorting by date (order is always manual via `order.json`)
- Drag-to-reorder (requires Framer Motion, Phase 4)

#### Acceptance criteria
- [ ] Timeline displays events in `order.json` order
- [ ] New events can be inserted at any position
- [ ] Up/down reorder buttons update `order.json`
- [ ] Events with `sessionNumber` show session badge
- [ ] `dm_only` events invisible to players
- [ ] `currentDate` editable in Settings, displayed in app chrome

---

### Phase 4 — Polish & Rich Text
**Goal:** Markdown editing, tag filtering, related content, animations, drag-to-reorder timeline.

#### Deliverables
- [ ] Replace `<textarea>` with `@uiw/react-md-editor` throughout
- [ ] Markdown preview toggle on article detail
- [ ] Tag input: type-and-enter, removable chips, stored as `string[]`
- [ ] Filter articles by tag (additive / OR logic)
- [ ] Article detail "Related" sidebar: linked articles as cards
- [ ] Session detail: linked articles as inline summary cards
- [ ] Install Framer Motion; staggered list entrance, modal enter/exit, sidebar collapse
- [ ] Timeline drag-to-reorder (Framer Motion `Reorder` or equivalent)

#### Acceptance criteria
- [ ] Markdown renders correctly (headings, bold, italic, lists, links)
- [ ] Tag filter is additive
- [ ] Modal exit animation completes before DOM removal
- [ ] Timeline drag-to-reorder updates `order.json` correctly

---

### Phase 5 — Sync & Presence
**Goal:** Smarter polling, lightweight online indicators, cross-session cache.

#### Deliverables
- [ ] Per-file sha cache; only re-fetch changed files on poll
- [ ] Presence heartbeat: `data/presence/{userId}.json` every 60s; show users active within 3 min
- [ ] Toast on remote change: *"[Name] updated [Article title]"*
- [ ] 409 retry: re-fetch → last-write-wins → retry once (with toast showing whose edit was overwritten)
- [ ] Cross-session cache: persist store snapshots to localStorage or IndexedDB; hydrate on load for offline resilience

#### Migration note
To move off GitHub, replace `src/lib/github.ts` with `src/lib/api.ts` implementing the same `readFile` / `writeFile` / `deleteFile` interface. Stores and components do not change.

---

### Phase 6 — User Management & Settings
**Goal:** Full user management and data portability.

#### Deliverables
- [ ] Users section (DM only): role, color, last seen
- [ ] Promote / demote (blocked if last DM)
- [ ] Remove user (blocked if last DM removing self)
- [ ] Change own name, passphrase, color
- [ ] Export all data as `campaign-backup.json`
- [ ] Import from backup (confirmation modal required)

---

## GitHub Pages Deployment

App repo and data repo are **separate repositories**.

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
    paths: ['src/**', 'public/**', 'index.html', 'vite.config.ts', 'package.json']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

```env
# .env (committed — not secrets)
VITE_GITHUB_OWNER=your-username
VITE_GITHUB_REPO=your-campaign-data-repo
```

---

## CLAUDE.md Template

> **Instruction for Claude Code:** At the start of Phase 1, generate `CLAUDE.md` in the project root using exactly this template, substituting the campaign/repo values from `.env`. This file persists across all sessions and phases — never delete or truncate it. Append new learnings to the "Session notes" section at the end of each phase.

```markdown
# Campaign Manager — CLAUDE.md

This file is Claude Code's persistent memory for this project.
Read it at the start of every session before doing anything else.

## What this project is

A browser-based D&D campaign management tool. Data stored as JSON files
in a separate GitHub repo. Hosted on GitHub Pages. No backend server.
See SPEC.md for the full product spec and roadmap.

## Current phase

Phase 1 — Foundation
[ ] Update this when a phase is complete.

## Repo layout

- App repo: github.com/{owner}/{app-repo}  ← this codebase
- Data repo: github.com/{owner}/{data-repo} ← JSON storage
- Deployed at: https://{owner}.github.io/{app-repo}

## Architecture rules (non-negotiable)

- All GitHub API calls go through `src/lib/github.ts` only
- All data mutations go through Zustand stores only
- All domain types come from `src/types/index.ts` only
- Never call GitHub API directly from a component or store
- Never define domain model types inline — always import from types/
- TypeScript strict mode: no `any`, no `// @ts-ignore`

## CSS rules (non-negotiable)

- CSS Modules only — one `.module.css` per component, colocated
- Design tokens via `var(--token)` from `src/styles/tokens.css`
- `clsx` for all conditional className logic
- No inline `style` except runtime-dynamic values (e.g. user.color)
- Shared base styles in `src/styles/shared/*.module.css` via `composes`
- `globals.css` stays under ~80 lines — not a utility class system
- Framer Motion only from Phase 4. Do not install earlier.
- Dark mode via `data-theme` attribute on `<html>`. Never use hardcoded colors.

## Theme system

- Theme preference stored in localStorage under `theme-preference`
- Options: light / dark / system
- Applied via `data-theme` attribute on `<html>` element
- `AppContext` exposes `theme` and `setTheme`
- All color tokens resolve via CSS custom properties — no JS color switching

## State rules

- React Context: currentUser + campaignMeta + theme + connectionStatus only. Nothing else.
- Zustand: one store per domain. Selector subscriptions only.
- useState: ephemeral UI state only (forms, modals, hover).

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

## Image handling (Phase 2+)

- Images stored as separate files in `data/images/{articleId}/{filename}`
- Client-side resize to max 1200px width before upload
- Referenced in markdown as `![alt](img:{filename})`
- Rendered via raw.githubusercontent.com URLs with `loading="lazy"`
- Upload/delete via `github.ts` functions

## Installed plugins

- `anthropic/frontend-design` — auto-activates on UI work
- `anthropic/typescript-lsp` — TypeScript language server
- `context7` MCP — live docs for Zustand, Framer Motion, react-md-editor
- `github` MCP — data repo management
- `playwright` MCP — UI verification (enable when needed, disable otherwise)

## Known gotchas

- GitHub write requires the current file sha. Always fetch before write.
- 409 Conflict means sha mismatch — re-fetch and retry once.
- Polling pauses when tab is not visible. Resume on visibilitychange.
- `composes` in CSS Modules only works on plain class selectors.
- Do not fetch all data on load — lazy-fetch per section.
- App repo and data repo are separate. Don't confuse them.
- All reads use PAT auth (unauthenticated rate limits are too low).
- Timeline order.json is the source of truth for event ordering — not worldDate.

## Phase completion log

[ Phase 1 ] — not started
[ Phase 2 ] — not started
[ Phase 3 ] — not started
[ Phase 4 ] — not started
[ Phase 5 ] — not started
[ Phase 6 ] — not started

## Session notes

(Append learnings, decisions, and deviations here at the end of each
phase. Date each entry. Never delete old entries.)
```

---

## Claude Code Standing Instructions

- **Read `CLAUDE.md` and this spec in full before writing any code.** State your plan for the current phase before starting.
- **Generate `CLAUDE.md` at the start of Phase 1** using the template above.
- **Update `CLAUDE.md`** at the end of each phase: mark phase complete, append session notes with any deviations or decisions made.
- **One phase at a time.** Do not build features from future phases.
- **TypeScript strict mode.** No `any`. No `// @ts-ignore`.
- **All domain types from `src/types/index.ts`.** No inline model type definitions.
- **All GitHub API calls through `src/lib/github.ts`.** Never directly from a store or component.
- **All data mutations through Zustand stores.** Never write to GitHub from a component.
- **IDs** via `src/lib/ids.ts` with type prefix.
- **Optimistic updates:** update store → write async → rollback + toast on failure.
- **Every async operation** must visibly handle loading, success, and error states.
- **CSS Modules + clsx only.** No inline styles except runtime-dynamic values.
- **Dark mode from Phase 1.** Use `data-theme` attribute. Never hardcode colors.
- **Framer Motion only from Phase 4.** Do not install earlier.
- **Components under ~150 lines.** Split if larger.
- **No premature abstraction.**
- **DM-only enforcement is client-side.** Explicit product decision.
- **Passphrases are plaintext.** Explicit product decision. Do not add hashing.
- **Timeline order is manual** via `order.json`. Do not sort by `worldDate`.
- **Layouts must be flexible.** No fixed pixel widths on content areas. Sidebar collapsible from Phase 1.