# Test Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vitest + React Testing Library with colocated contract tests for pure logic, the article store's optimistic update/rollback behavior, and core component visibility/access rules.

**Architecture:** Vitest shares the existing `vite.config.ts` (alias, TypeScript, plugins) — zero extra transpiler config. `github.ts` is mocked at the module level in all tests that cross the network boundary. Component tests seed the Zustand store directly via `setState` and mock `useAppContext` with a factory function to control user role per test.

**Tech Stack:** Vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom

---

## Branch

Cut `feat/phase1-test-framework` from `main` after Step 9 PR is merged.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `test` / `test:ci` scripts; add devDependencies |
| `vite.config.ts` | Modify | Add `test` block (jsdom, globals, setupFiles) |
| `tsconfig.json` | Modify | Exclude `*.test.ts/tsx` from production `tsc` |
| `tsconfig.test.json` | Create | Vitest-specific type context (not used by `tsc`) |
| `src/test/setup.ts` | Create | `import '@testing-library/jest-dom'` only |
| `.github/workflows/deploy.yml` | Modify | Insert `npm run test:ci` before `npm run build` |
| `src/lib/ids.test.ts` | Create | `generateId` prefix and uniqueness contracts |
| `src/lib/theme.test.ts` | Create | `getStoredTheme` / `setStoredTheme` / `applyTheme` contracts |
| `src/stores/useArticleStore.test.ts` | Create | Optimistic add/update/remove + rollback contracts |
| `src/components/articles/ArticleList.test.tsx` | Create | Visibility gating, type filter, search contracts |
| `src/components/articles/ArticleDetail.test.tsx` | Create | DM vs player edit/delete button contracts |
| `src/components/articles/ArticleEditor.test.tsx` | Create | Player body-only vs DM all-fields contracts |

---

## Task 1: Install dependencies and configure Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`
- Create: `tsconfig.test.json`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Install devDependencies**

```bash
npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @types/node
```

Expected: packages installed, no errors.

- [ ] **Step 2: Add test scripts to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest",
"test:ci": "vitest run --coverage"
```

- [ ] **Step 3: Add `test` block to vite.config.ts**

Add `/// <reference types="vitest" />` at the top and the `test` block:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/LW_world_builder/',
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
  },
})
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Update `tsconfig.json` to exclude test files**

Add (or extend) the `"exclude"` array:

```json
"exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
```

- [ ] **Step 6: Create `tsconfig.test.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 7: Verify Vitest runs with zero test files**

```bash
npm run test:ci
```

Expected: exits with `Test Files  0 passed` (or similar). No errors.

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.ts tsconfig.json tsconfig.test.json src/test/setup.ts
git commit -m "chore(test): configure Vitest + RTL with jsdom"
```

---

## Task 2: Add test step to CI

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Insert `test:ci` step before the build step**

```yaml
      - run: npm ci
      - run: npm run test:ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: run test:ci before build in deploy workflow"
```

---

## Task 3: `src/lib/ids.test.ts`

**Files:**
- Create: `src/lib/ids.test.ts`

Note: `generateId` takes a prefix *without* the underscore — the function appends `_` internally. `generateId('art')` → `'art_<12hex>'`.

- [ ] **Step 1: Write the test**

```ts
import { generateId } from '@/lib/ids'

describe('generateId', () => {
  it('returns a string prefixed with the given prefix and an underscore', () => {
    const id = generateId('art')
    expect(id).toMatch(/^art_/)
  })

  it('returns a unique value on each call', () => {
    const a = generateId('art')
    const b = generateId('art')
    expect(a).not.toBe(b)
  })
})
```

- [ ] **Step 2: Run and verify**

```bash
npm run test:ci -- src/lib/ids.test.ts
```

Expected: `2 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ids.test.ts
git commit -m "test(lib): add generateId contract tests"
```

---

## Task 4: `src/lib/theme.test.ts`

**Files:**
- Create: `src/lib/theme.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { getStoredTheme, setStoredTheme, applyTheme } from '@/lib/theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('setStoredTheme / getStoredTheme', () => {
    it('stores and retrieves the theme preference', () => {
      setStoredTheme('dark')
      expect(getStoredTheme()).toBe('dark')
    })

    it('returns "system" when localStorage is empty', () => {
      expect(getStoredTheme()).toBe('system')
    })
  })

  describe('applyTheme', () => {
    it('sets data-theme on document.documentElement', () => {
      applyTheme('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('updates data-theme when called again with a different value', () => {
      applyTheme('light')
      applyTheme('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })
})
```

- [ ] **Step 2: Run and verify**

```bash
npm run test:ci -- src/lib/theme.test.ts
```

Expected: `4 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/theme.test.ts
git commit -m "test(lib): add theme get/set/apply contract tests"
```

---

## Task 5: `src/stores/useArticleStore.test.ts`

**Files:**
- Create: `src/stores/useArticleStore.test.ts`

Notes:
- `writeFile` returns `Promise<string>` (the new sha directly).
- `deleteFile` returns `Promise<void>`.
- `GitHubError` must be exported from the mock factory so the store's `instanceof` check uses the same class.
- `GitHubConfig` uses `pat`, not `token`.

- [ ] **Step 1: Write the test**

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useArticleStore } from '@/stores/useArticleStore'
import type { Article, GitHubConfig } from '@/types'

vi.mock('@/lib/github', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  deleteFile: vi.fn(),
  listTree: vi.fn(),
  pollCommit: vi.fn(),
  GitHubError: class GitHubError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.name = 'GitHubError'
      this.status = status
    }
  },
}))

import { writeFile, deleteFile, GitHubError } from '@/lib/github'

const mockConfig: GitHubConfig = { owner: 'test', repo: 'data', pat: 'tok' }

const mockArticle: Article = {
  id: 'art_test000001',
  title: 'Test NPC',
  articleType: 'npc',
  body: 'A mysterious figure.',
  tags: ['mysterious'],
  links: [],
  visibility: 'shared',
  interactable: false,
  createdBy: 'usr_dm001',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const draft = {
  title: mockArticle.title,
  articleType: mockArticle.articleType,
  body: mockArticle.body,
  tags: mockArticle.tags,
  links: mockArticle.links,
  visibility: mockArticle.visibility,
  interactable: mockArticle.interactable,
  createdBy: mockArticle.createdBy,
}

describe('useArticleStore', () => {
  beforeEach(() => {
    useArticleStore.setState({ articles: [], shas: {}, loading: false, error: null })
    vi.clearAllMocks()
  })

  describe('add', () => {
    it('inserts the article when the GitHub write succeeds', async () => {
      vi.mocked(writeFile).mockResolvedValueOnce('sha_new')

      await useArticleStore.getState().add(mockConfig, draft)

      expect(useArticleStore.getState().articles).toHaveLength(1)
      expect(useArticleStore.getState().articles[0].title).toBe('Test NPC')
    })

    it('rolls back the optimistic insert when the GitHub write fails', async () => {
      vi.mocked(writeFile).mockRejectedValueOnce(new Error('network error'))

      await expect(useArticleStore.getState().add(mockConfig, draft)).rejects.toThrow()

      expect(useArticleStore.getState().articles).toHaveLength(0)
    })
  })

  describe('update', () => {
    it('patches the article when the GitHub write succeeds', async () => {
      useArticleStore.setState({
        articles: [mockArticle],
        shas: { [mockArticle.id]: 'sha_original' },
      })
      vi.mocked(writeFile).mockResolvedValueOnce('sha_updated')

      await useArticleStore.getState().update(mockConfig, mockArticle.id, { title: 'Updated NPC' })

      expect(useArticleStore.getState().articles[0].title).toBe('Updated NPC')
    })

    it('reverts to the original article when the GitHub write fails', async () => {
      useArticleStore.setState({
        articles: [mockArticle],
        shas: { [mockArticle.id]: 'sha_original' },
      })
      vi.mocked(writeFile).mockRejectedValueOnce(new Error('network error'))

      await expect(
        useArticleStore.getState().update(mockConfig, mockArticle.id, { title: 'Updated NPC' })
      ).rejects.toThrow()

      expect(useArticleStore.getState().articles[0].title).toBe('Test NPC')
    })
  })

  describe('remove', () => {
    it('removes the article when the GitHub delete succeeds', async () => {
      useArticleStore.setState({
        articles: [mockArticle],
        shas: { [mockArticle.id]: 'sha_original' },
      })
      vi.mocked(deleteFile).mockResolvedValueOnce(undefined)

      await useArticleStore.getState().remove(mockConfig, mockArticle.id)

      expect(useArticleStore.getState().articles).toHaveLength(0)
    })

    it('restores the article when the GitHub delete fails with a non-404 error', async () => {
      useArticleStore.setState({
        articles: [mockArticle],
        shas: { [mockArticle.id]: 'sha_original' },
      })
      vi.mocked(deleteFile).mockRejectedValueOnce(new Error('network error'))

      await expect(
        useArticleStore.getState().remove(mockConfig, mockArticle.id)
      ).rejects.toThrow()

      expect(useArticleStore.getState().articles).toHaveLength(1)
      expect(useArticleStore.getState().articles[0].id).toBe(mockArticle.id)
    })

    it('does not restore the article when the delete fails with a 404', async () => {
      useArticleStore.setState({
        articles: [mockArticle],
        shas: { [mockArticle.id]: 'sha_original' },
      })
      vi.mocked(deleteFile).mockRejectedValueOnce(new GitHubError(404, 'Not Found'))

      await expect(
        useArticleStore.getState().remove(mockConfig, mockArticle.id)
      ).rejects.toThrow()

      expect(useArticleStore.getState().articles).toHaveLength(0)
    })
  })
})
```

- [ ] **Step 2: Run and verify**

```bash
npm run test:ci -- src/stores/useArticleStore.test.ts
```

Expected: `7 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/stores/useArticleStore.test.ts
git commit -m "test(store): add optimistic add/update/remove and rollback contracts"
```

---

## Task 6: `src/components/articles/ArticleList.test.tsx`

**Files:**
- Create: `src/components/articles/ArticleList.test.tsx`

Notes:
- `ArticleList` calls `fetchAll(githubConfig)` on mount. Override `fetchAll` on the store with `vi.fn()` so it doesn't overwrite the pre-seeded articles.
- `useAppContext` is mocked via `vi.mock` — switch the `currentUser` role per describe block.

- [ ] **Step 1: Write the test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ArticleList } from '@/components/articles/ArticleList'
import { useArticleStore } from '@/stores/useArticleStore'
import type { Article, User, GitHubConfig } from '@/types'

vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

vi.mock('@/components/shared/Toast/useToast', () => ({
  useToast: vi.fn(() => vi.fn()),
}))

import { useAppContext } from '@/context/AppContext'

const dmUser: User = {
  id: 'usr_dm001',
  name: 'Dungeon Master',
  passphrase: 'secret',
  role: 'dm',
  color: '#ff0000',
  createdAt: '2026-01-01T00:00:00Z',
}

const playerUser: User = { ...dmUser, id: 'usr_player001', name: 'Player One', role: 'player' }

const mockConfig: GitHubConfig = { owner: 'test', repo: 'data', pat: 'tok' }

const testArticles: Article[] = [
  {
    id: 'art_001',
    title: 'Thorin the Dwarf',
    articleType: 'npc',
    body: '',
    tags: [],
    links: [],
    visibility: 'shared',
    interactable: false,
    createdBy: 'usr_dm001',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'art_002',
    title: 'The Dark Keep',
    articleType: 'location',
    body: '',
    tags: [],
    links: [],
    visibility: 'dm_only',
    interactable: false,
    createdBy: 'usr_dm001',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'art_003',
    title: 'Iron Brotherhood',
    articleType: 'faction',
    body: '',
    tags: [],
    links: [],
    visibility: 'shared',
    interactable: false,
    createdBy: 'usr_dm001',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

function seedStore() {
  useArticleStore.setState({
    articles: testArticles,
    shas: {},
    loading: false,
    error: null,
    fetchAll: vi.fn().mockResolvedValue(undefined),
  })
}

function mockContextAs(user: User) {
  vi.mocked(useAppContext).mockReturnValue({
    currentUser: user,
    githubConfig: mockConfig,
    connectionStatus: 'connected',
    campaignMeta: null,
    theme: 'system',
    setCurrentUser: vi.fn(),
    setCampaignMeta: vi.fn(),
    setTheme: vi.fn(),
    setConnectionStatus: vi.fn(),
    setGithubConfig: vi.fn(),
  })
}

describe('ArticleList', () => {
  beforeEach(() => {
    seedStore()
  })

  describe('visibility gating', () => {
    it('shows all articles to the DM, including dm_only', () => {
      mockContextAs(dmUser)
      render(<ArticleList selectedId={null} onSelect={vi.fn()} onNew={vi.fn()} />)

      expect(screen.getByText('Thorin the Dwarf')).toBeInTheDocument()
      expect(screen.getByText('The Dark Keep')).toBeInTheDocument()
      expect(screen.getByText('Iron Brotherhood')).toBeInTheDocument()
    })

    it('hides dm_only articles from players', () => {
      mockContextAs(playerUser)
      render(<ArticleList selectedId={null} onSelect={vi.fn()} onNew={vi.fn()} />)

      expect(screen.getByText('Thorin the Dwarf')).toBeInTheDocument()
      expect(screen.queryByText('The Dark Keep')).not.toBeInTheDocument()
      expect(screen.getByText('Iron Brotherhood')).toBeInTheDocument()
    })
  })

  describe('type filter', () => {
    it('hides articles that do not match the selected type', async () => {
      mockContextAs(dmUser)
      render(<ArticleList selectedId={null} onSelect={vi.fn()} onNew={vi.fn()} />)

      await userEvent.click(screen.getByRole('button', { name: 'NPCs' }))

      expect(screen.getByText('Thorin the Dwarf')).toBeInTheDocument()
      expect(screen.queryByText('The Dark Keep')).not.toBeInTheDocument()
      expect(screen.queryByText('Iron Brotherhood')).not.toBeInTheDocument()
    })
  })

  describe('search', () => {
    it('hides articles whose titles do not match the search query', async () => {
      mockContextAs(dmUser)
      render(<ArticleList selectedId={null} onSelect={vi.fn()} onNew={vi.fn()} />)

      await userEvent.type(screen.getByPlaceholderText('Search articles…'), 'Thorin')

      expect(screen.getByText('Thorin the Dwarf')).toBeInTheDocument()
      expect(screen.queryByText('The Dark Keep')).not.toBeInTheDocument()
      expect(screen.queryByText('Iron Brotherhood')).not.toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run and verify**

```bash
npm run test:ci -- src/components/articles/ArticleList.test.tsx
```

Expected: `4 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/components/articles/ArticleList.test.tsx
git commit -m "test(articles): add ArticleList visibility gating, type filter, and search contracts"
```

---

## Task 7: `src/components/articles/ArticleDetail.test.tsx`

**Files:**
- Create: `src/components/articles/ArticleDetail.test.tsx`

Notes:
- `ArticleDetail` reads `remove` from the store. Override it in `beforeEach`.
- Props are passed directly — no store seeding needed for articles.

- [ ] **Step 1: Write the test**

```tsx
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ArticleDetail } from '@/components/articles/ArticleDetail'
import { useArticleStore } from '@/stores/useArticleStore'
import type { Article, User, GitHubConfig } from '@/types'

vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

vi.mock('@/components/shared/Toast/useToast', () => ({
  useToast: vi.fn(() => vi.fn()),
}))

import { useAppContext } from '@/context/AppContext'

const dmUser: User = {
  id: 'usr_dm001',
  name: 'Dungeon Master',
  passphrase: 'secret',
  role: 'dm',
  color: '#ff0000',
  createdAt: '2026-01-01T00:00:00Z',
}

const playerUser: User = { ...dmUser, id: 'usr_player001', name: 'Player One', role: 'player' }

const mockConfig: GitHubConfig = { owner: 'test', repo: 'data', pat: 'tok' }

const sharedInteractable: Article = {
  id: 'art_001',
  title: 'Thorin the Dwarf',
  articleType: 'npc',
  body: 'A stout dwarf merchant.',
  tags: ['dwarf'],
  links: [],
  visibility: 'shared',
  interactable: true,
  createdBy: 'usr_dm001',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const sharedNonInteractable: Article = { ...sharedInteractable, id: 'art_002', interactable: false }

function mockContextAs(user: User) {
  vi.mocked(useAppContext).mockReturnValue({
    currentUser: user,
    githubConfig: mockConfig,
    connectionStatus: 'connected',
    campaignMeta: null,
    theme: 'system',
    setCurrentUser: vi.fn(),
    setCampaignMeta: vi.fn(),
    setTheme: vi.fn(),
    setConnectionStatus: vi.fn(),
    setGithubConfig: vi.fn(),
  })
}

describe('ArticleDetail', () => {
  beforeEach(() => {
    useArticleStore.setState({ remove: vi.fn().mockResolvedValue(undefined) })
  })

  describe('DM controls', () => {
    it('shows Edit and Delete buttons', () => {
      mockContextAs(dmUser)
      render(
        <ArticleDetail
          article={sharedInteractable}
          allArticles={[sharedInteractable]}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onNavigateTo={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    })
  })

  describe('player controls', () => {
    it('shows no Edit button when the article is not interactable', () => {
      mockContextAs(playerUser)
      render(
        <ArticleDetail
          article={sharedNonInteractable}
          allArticles={[sharedNonInteractable]}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onNavigateTo={vi.fn()}
        />
      )

      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    })

    it('shows Edit but not Delete when the article is shared and interactable', () => {
      mockContextAs(playerUser)
      render(
        <ArticleDetail
          article={sharedInteractable}
          allArticles={[sharedInteractable]}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onNavigateTo={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run and verify**

```bash
npm run test:ci -- src/components/articles/ArticleDetail.test.tsx
```

Expected: `3 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/components/articles/ArticleDetail.test.tsx
git commit -m "test(articles): add ArticleDetail DM vs player control contracts"
```

---

## Task 8: `src/components/articles/ArticleEditor.test.tsx`

**Files:**
- Create: `src/components/articles/ArticleEditor.test.tsx`

Notes:
- Check for field *labels* (`getByText`) rather than combobox ARIA roles — the `Field` component does not use `htmlFor`, so selects have no computed accessible name from the label.
- Override `add` and `update` on the store to prevent real network calls if a submit is accidentally triggered.

- [ ] **Step 1: Write the test**

```tsx
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ArticleEditor } from '@/components/articles/ArticleEditor'
import { useArticleStore } from '@/stores/useArticleStore'
import type { Article, User, GitHubConfig } from '@/types'

vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

vi.mock('@/components/shared/Toast/useToast', () => ({
  useToast: vi.fn(() => vi.fn()),
}))

import { useAppContext } from '@/context/AppContext'

const dmUser: User = {
  id: 'usr_dm001',
  name: 'Dungeon Master',
  passphrase: 'secret',
  role: 'dm',
  color: '#ff0000',
  createdAt: '2026-01-01T00:00:00Z',
}

const playerUser: User = { ...dmUser, id: 'usr_player001', name: 'Player One', role: 'player' }

const mockConfig: GitHubConfig = { owner: 'test', repo: 'data', pat: 'tok' }

const existingArticle: Article = {
  id: 'art_001',
  title: 'Thorin the Dwarf',
  articleType: 'npc',
  body: 'A stout dwarf merchant.',
  tags: ['dwarf'],
  links: [],
  visibility: 'shared',
  interactable: true,
  createdBy: 'usr_dm001',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function mockContextAs(user: User) {
  vi.mocked(useAppContext).mockReturnValue({
    currentUser: user,
    githubConfig: mockConfig,
    connectionStatus: 'connected',
    campaignMeta: null,
    theme: 'system',
    setCurrentUser: vi.fn(),
    setCampaignMeta: vi.fn(),
    setTheme: vi.fn(),
    setConnectionStatus: vi.fn(),
    setGithubConfig: vi.fn(),
  })
}

describe('ArticleEditor', () => {
  beforeEach(() => {
    useArticleStore.setState({
      articles: [existingArticle],
      shas: {},
      loading: false,
      error: null,
      add: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    })
  })

  describe('player body-only edit mode', () => {
    it('shows only the body textarea — title, type, visibility, tags, and links are hidden', () => {
      mockContextAs(playerUser)
      render(
        <ArticleEditor
          article={existingArticle}
          allArticles={[existingArticle]}
          onSaved={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      expect(screen.getByPlaceholderText('Write article content here…')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Thorin Ironback')).not.toBeInTheDocument()
      expect(screen.queryByText('Type')).not.toBeInTheDocument()
      expect(screen.queryByText('Visibility')).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText('dwarf, merchant, friendly')).not.toBeInTheDocument()
    })
  })

  describe('DM edit mode', () => {
    it('shows all fields — title, type, visibility, body, and tags', () => {
      mockContextAs(dmUser)
      render(
        <ArticleEditor
          article={existingArticle}
          allArticles={[existingArticle]}
          onSaved={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      expect(screen.getByPlaceholderText('Write article content here…')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Thorin Ironback')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Visibility')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('dwarf, merchant, friendly')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run and verify**

```bash
npm run test:ci -- src/components/articles/ArticleEditor.test.tsx
```

Expected: `2 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/components/articles/ArticleEditor.test.tsx
git commit -m "test(articles): add ArticleEditor player body-only vs DM all-fields contracts"
```

---

## Task 9: Full suite verification and PR

- [ ] **Step 1: Run the complete test suite**

```bash
npm run test:ci
```

Expected: `16 passed` across 6 test files, no failures.

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin feat/phase1-test-framework
```

Open PR against `main` with title: `feat(test): Step 9.5 — Vitest + RTL test framework and initial contracts`
