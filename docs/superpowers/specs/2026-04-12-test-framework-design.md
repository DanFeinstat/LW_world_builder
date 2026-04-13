# Test Framework Design — Step 9.5

**Date:** 2026-04-12
**Branch:** `feat/phase1-test-framework`
**Scope:** Pure logic, Zustand store, and core component contracts. No integration tests against GitHub API.

---

## Decisions

- **Runner:** Vitest (Vite-native, zero config friction, shares `vite.config.ts` and `@/` alias)
- **Component testing:** React Testing Library
- **DOM environment:** jsdom
- **GitHub API boundary:** mocked at module level via `vi.mock('@/lib/github')` — not under test
- **CI:** `npm run test:ci` runs before `npm run build` in the existing `deploy.yml` workflow

---

## Dependencies

```
vitest @vitest/coverage-v8
@testing-library/react @testing-library/user-event @testing-library/jest-dom
@types/node
jsdom
```

All are `devDependencies`.

---

## Configuration

### `vite.config.ts` — add `test` block

```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['src/test/setup.ts'],
}
```

### `src/test/setup.ts`

```ts
import '@testing-library/jest-dom'
```

### `tsconfig.json` — exclude test files from production build

```json
"exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
```

### `tsconfig.test.json` — Vitest type context (not used by `tsc`)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

### `package.json` — new scripts

```json
"test":    "vitest",
"test:ci": "vitest run --coverage"
```

---

## File Structure

Test files are colocated with the code they test. `github.ts` has no test file — it is mocked wherever needed.

```
src/
  lib/
    ids.ts
    ids.test.ts
    theme.ts
    theme.test.ts
  stores/
    useArticleStore.ts
    useArticleStore.test.ts
  components/
    articles/
      ArticleList.test.tsx
      ArticleDetail.test.tsx
      ArticleEditor.test.tsx
  test/
    setup.ts
```

---

## CI Integration

`deploy.yml` — add one step before build:

```yaml
- run: npm ci
- run: npm run test:ci   # ← new: failing tests block build and deploy
- run: npm run build
```

---

## Test Contracts

### `ids.test.ts`
- `generateId('art_')` returns a string prefixed with `art_`
- Two consecutive calls return different values

### `theme.test.ts`
- `setStoredTheme('dark')` writes `'dark'` to `localStorage['theme-preference']`
- `getStoredTheme()` returns the stored value
- `getStoredTheme()` returns `'system'` when localStorage is empty
- `applyTheme('dark')` sets `data-theme="dark"` on `document.documentElement`

### `useArticleStore.test.ts`
Mock: `vi.mock('@/lib/github')` — all functions return resolved promises by default.

- `add`: optimistically inserts article into store; removes it when GitHub write rejects
- `update`: optimistically patches article; reverts to original when GitHub write rejects
- `remove`: optimistically removes article; restores it when GitHub delete rejects (non-404)

### `ArticleList.test.tsx`
- **AppContext:** `vi.mock('@/context/AppContext')` with a factory that returns fixed `currentUser` and `githubConfig` values — no real provider or localStorage needed.
- **Store:** seed via `useArticleStore.setState({ articles: [...] })` in `beforeEach` (uses the real selector logic; no module mock needed). Reset with `useArticleStore.setState({ articles: [] })` in `afterEach`.

Contracts:
- Player does not see `dm_only` articles
- DM sees all articles regardless of visibility
- Selecting a type filter hides non-matching articles
- Typing in the search input hides articles whose titles don't match

### `ArticleDetail.test.tsx`
- **AppContext:** same `vi.mock` approach as above, switching `currentUser.role` between `'dm'` and `'player'` per test group.
- Props passed directly — no store involvement.

Contracts:
- DM sees Edit and Delete buttons
- Player sees no Edit button when `interactable: false`
- Player sees Edit button when `article.visibility === 'shared'` and `interactable: true`

### `ArticleEditor.test.tsx`
- **AppContext:** same `vi.mock` approach, role switched per test group.
- Props passed directly.

Contracts:
- Player in body-only edit mode sees the body textarea and no other fields (title, type, visibility, tags, links hidden)
- DM in edit mode sees all fields

---

## Out of Scope

- Integration tests against the GitHub Contents API
- End-to-end browser tests (Playwright)
- Snapshot tests
- Coverage thresholds (not enforced in CI for now — coverage report generated but not gated)
