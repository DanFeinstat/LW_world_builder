# Polling & DevToolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 30s GitHub commit-SHA polling with visibility-aware pause/resume, connection-status tracking, and a dev-only DevToolbar that lets you toggle GitHub polling and simulate offline mode.

**Architecture:** A `usePolling` hook encapsulates interval logic and is called from `AppProvider` — it polls `pollCommit` every 30s, compares SHA to last known value, re-fetches articles on change, and sets `connectionStatus` on error/recovery. A `devFlags` helper reads/writes a `dev-flags` localStorage key. The `DevToolbar` component (rendered only when `import.meta.env.DEV`) provides a fixed amber button that opens an upward dropdown listing toggleable flags; toggling `offline` immediately calls `setConnectionStatus`. Polling reads `devFlag('polling')` on every tick and no-ops when false, making it safe to leave polling OFF by default in dev.

**Tech Stack:** React 18, TypeScript strict, Tailwind CSS v3, Zustand, Vitest + RTL

---

## File Map

| File | Change |
|---|---|
| `src/lib/devFlags.ts` | **Create** — `devFlag()`, `setDevFlag()`, `readDevFlags()` helpers |
| `src/lib/devFlags.test.ts` | **Create** — 6 unit tests |
| `src/components/dev/DevToolbar.tsx` | **Create** — dev-only floating toolbar UI |
| `src/components/dev/DevToolbar.test.tsx` | **Create** — 7 contract tests |
| `src/hooks/usePolling.ts` | **Create** — interval + visibility + SHA-change logic |
| `src/hooks/usePolling.test.ts` | **Create** — 7 unit tests |
| `src/context/AppContext.tsx` | **Modify** — add `usePolling(githubConfig, setConnectionStatus)` call |
| `src/App.tsx` | **Modify** — mount `<DevToolbar />` inside `AppProvider` in dev only |

`ConnectionBanner` and `ArticleStore` are **not modified**. They already work correctly.

---

## Background: devFlags design

The `dev-flags` localStorage key stores a `Record<string, boolean>`. The three helpers:

- `readDevFlags()` — reads and JSON-parses the key; returns `{}` on miss or parse error
- `setDevFlag(name, value)` — merges one flag into the stored object; no-op in production
- `devFlag(name)` — returns `readDevFlags()[name] === true`; always `false` in production

In production (`import.meta.env.DEV === false`), Vite tree-shakes the localStorage reads entirely — `devFlag()` dead-code-eliminates to `return false`.

---

## Background: usePolling design

```
usePolling(config: GitHubConfig | null, setConnectionStatus: (s: ConnectionStatus) => void)
```

The hook:
1. Does nothing when `config` is null
2. Calls `poll()` once immediately on mount (initial SHA capture)
3. Runs `setInterval(tick, 30_000)`:
   - `tick()` skips when `document.visibilityState === 'hidden'`
   - `tick()` calls `poll()`
4. Listens for `visibilitychange` — calls `poll()` immediately when tab becomes visible
5. Cleans up interval + listener on unmount / config change

`poll()` internal logic:
- Reads `devFlag('polling')` — returns early (no-op) when false
- Calls `pollCommit(config, 'main')`
- On success:
  - If `wasDisconnected === true` → `setConnectionStatus('connected')` + toast "Reconnected."
  - If SHA changed from last known → `useArticleStore.getState().fetchAll(config)` + toast "Articles updated from remote."
  - Stores new SHA as `lastSha`
- On error:
  - Sets `wasDisconnected = true`
  - `setConnectionStatus('disconnected')`

`lastSha` and `wasDisconnected` are stored in `useRef` — they persist across re-renders without triggering re-renders.

---

## Background: DevToolbar design

```
Fixed position: bottom-4 right-4, z-toast (z-index 300)
Toggle button: rounded-full, amber (#f59e0b bg, black text), "DEV" label
Dropdown: absolute, bottom-full right-0 mb-2, w-56, opens UPWARD
  Header row: "Dev Flags" label
  Flag rows: flag label + "ON"/"OFF" indicator
```

Phase 1 flags (in render order):
| Flag name | Label | Default |
|---|---|---|
| `polling` | GitHub Polling | off |
| `offline` | Simulate Offline | off |

Side effect on toggle:
- `offline` → on: `setConnectionStatus('disconnected')`
- `offline` → off: `setConnectionStatus('connected')`
- `polling` → no immediate side effect (polling picks it up on next tick)

DevToolbar reads `useAppContext()` for `setConnectionStatus`. It is only mounted inside `AppProvider`.

---

## Background: AppContext integration

In `AppProvider`, after all state declarations:

```tsx
usePolling(githubConfig, setConnectionStatus)
```

`setConnectionStatus` is the direct state setter — stable reference, safe as a dep.

---

## Background: App.tsx integration

Inside the `AppProvider` children (in `App.tsx`), at the bottom of `AppRoutes` or as a sibling inside the `AppProvider`:

```tsx
{import.meta.env.DEV && <DevToolbar />}
```

Vite replaces `import.meta.env.DEV` with `false` in production builds, so the import and component are tree-shaken entirely.

---

## Task 1: devFlags helper

**Files:**
- Create: `src/lib/devFlags.ts`
- Create: `src/lib/devFlags.test.ts`

- [ ] **Step 1: Create the test file**

Create `src/lib/devFlags.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { devFlag, setDevFlag, readDevFlags } from './devFlags'

describe('devFlags', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('devFlag returns false when flag is not set', () => {
    expect(devFlag('polling')).toBe(false)
  })

  it('devFlag returns true after setDevFlag(name, true)', () => {
    setDevFlag('polling', true)
    expect(devFlag('polling')).toBe(true)
  })

  it('devFlag returns false after setDevFlag(name, false)', () => {
    setDevFlag('polling', true)
    setDevFlag('polling', false)
    expect(devFlag('polling')).toBe(false)
  })

  it('readDevFlags returns empty object when nothing is stored', () => {
    expect(readDevFlags()).toEqual({})
  })

  it('readDevFlags returns all stored flags', () => {
    setDevFlag('polling', true)
    setDevFlag('offline', true)
    expect(readDevFlags()).toEqual({ polling: true, offline: true })
  })

  it('readDevFlags returns empty object when localStorage contains invalid JSON', () => {
    localStorage.setItem('dev-flags', 'not-json{{{')
    expect(readDevFlags()).toEqual({})
  })
})
```

- [ ] **Step 2: Run tests and confirm they all fail**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/lib/devFlags.test.ts
```

Expected: 6 failures — "Cannot find module './devFlags'"

- [ ] **Step 3: Create the implementation**

Create `src/lib/devFlags.ts`:

```ts
const DEV_FLAGS_KEY = 'dev-flags'

export function readDevFlags(): Record<string, boolean> {
  if (!import.meta.env.DEV) return {}
  try {
    const stored = localStorage.getItem(DEV_FLAGS_KEY)
    return stored ? (JSON.parse(stored) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

export function setDevFlag(name: string, value: boolean): void {
  if (!import.meta.env.DEV) return
  const current = readDevFlags()
  localStorage.setItem(DEV_FLAGS_KEY, JSON.stringify({ ...current, [name]: value }))
}

export function devFlag(name: string): boolean {
  return readDevFlags()[name] === true
}
```

- [ ] **Step 4: Run tests and confirm they all pass**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/lib/devFlags.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Type-check**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npx tsc --project tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/devFlags.ts src/lib/devFlags.test.ts
git commit -m "feat(dev): add devFlags helper for localStorage-backed feature flags"
```

---

## Task 2: DevToolbar component

**Files:**
- Create: `src/components/dev/DevToolbar.tsx`
- Create: `src/components/dev/DevToolbar.test.tsx`

- [ ] **Step 1: Create the test file**

Create `src/components/dev/DevToolbar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DevToolbar } from './DevToolbar'

vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

import { useAppContext } from '@/context/AppContext'

const setConnectionStatus = vi.fn()

function mockContext() {
  vi.mocked(useAppContext).mockReturnValue({
    setConnectionStatus,
    currentUser: null,
    setCurrentUser: vi.fn(),
    campaignMeta: null,
    setCampaignMeta: vi.fn(),
    theme: 'system',
    setTheme: vi.fn(),
    connectionStatus: 'connected',
    githubConfig: null,
    setGithubConfig: vi.fn(),
  })
}

describe('DevToolbar', () => {
  beforeEach(() => {
    localStorage.clear()
    setConnectionStatus.mockClear()
    mockContext()
  })

  it('renders the DEV toggle button', () => {
    render(<DevToolbar />)
    expect(screen.getByTestId('dev-toolbar-toggle')).toBeInTheDocument()
  })

  it('panel is hidden initially', () => {
    render(<DevToolbar />)
    expect(screen.queryByTestId('dev-toolbar-panel')).not.toBeInTheDocument()
  })

  it('opens panel when DEV button is clicked', async () => {
    render(<DevToolbar />)
    await userEvent.click(screen.getByTestId('dev-toolbar-toggle'))
    expect(screen.getByTestId('dev-toolbar-panel')).toBeInTheDocument()
  })

  it('shows polling flag as OFF by default', async () => {
    render(<DevToolbar />)
    await userEvent.click(screen.getByTestId('dev-toolbar-toggle'))
    expect(screen.getByTestId('dev-flag-polling')).toHaveTextContent('OFF')
  })

  it('toggles polling flag to ON when clicked', async () => {
    render(<DevToolbar />)
    await userEvent.click(screen.getByTestId('dev-toolbar-toggle'))
    await userEvent.click(screen.getByTestId('dev-flag-polling'))
    expect(screen.getByTestId('dev-flag-polling')).toHaveTextContent('ON')
  })

  it('calls setConnectionStatus("disconnected") when offline flag is toggled on', async () => {
    render(<DevToolbar />)
    await userEvent.click(screen.getByTestId('dev-toolbar-toggle'))
    await userEvent.click(screen.getByTestId('dev-flag-offline'))
    expect(setConnectionStatus).toHaveBeenCalledWith('disconnected')
  })

  it('calls setConnectionStatus("connected") when offline flag is toggled off', async () => {
    localStorage.setItem('dev-flags', JSON.stringify({ offline: true }))
    render(<DevToolbar />)
    await userEvent.click(screen.getByTestId('dev-toolbar-toggle'))
    await userEvent.click(screen.getByTestId('dev-flag-offline'))
    expect(setConnectionStatus).toHaveBeenCalledWith('connected')
  })
})
```

- [ ] **Step 2: Run tests and confirm they all fail**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/components/dev/DevToolbar.test.tsx
```

Expected: 7 failures — "Cannot find module './DevToolbar'"

- [ ] **Step 3: Create the implementation**

Create `src/components/dev/DevToolbar.tsx`:

```tsx
import { useState } from 'react'
import { readDevFlags, setDevFlag } from '@/lib/devFlags'
import { useAppContext } from '@/context/AppContext'

interface DevFlag {
  name: string
  label: string
}

const FLAGS: DevFlag[] = [
  { name: 'polling', label: 'GitHub Polling' },
  { name: 'offline', label: 'Simulate Offline' },
]

export function DevToolbar() {
  const { setConnectionStatus } = useAppContext()
  const [open, setOpen] = useState(false)
  const [flags, setFlags] = useState<Record<string, boolean>>(() => readDevFlags())

  function toggleFlag(name: string) {
    const next = !flags[name]
    setDevFlag(name, next)
    setFlags(f => ({ ...f, [name]: next }))

    if (name === 'offline') {
      setConnectionStatus(next ? 'disconnected' : 'connected')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-toast">
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-56 bg-surface border border-border rounded-lg shadow-lg overflow-hidden"
          data-testid="dev-toolbar-panel"
        >
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              Dev Flags
            </span>
          </div>
          <ul>
            {FLAGS.map(flag => (
              <li key={flag.name}>
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-primary hover:bg-surface-raised transition-colors duration-fast"
                  onClick={() => toggleFlag(flag.name)}
                  data-testid={`dev-flag-${flag.name}`}
                >
                  <span>{flag.label}</span>
                  <span className={flags[flag.name] ? 'text-success font-semibold' : 'text-text-muted'}>
                    {flags[flag.name] ? 'ON' : 'OFF'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-1 rounded-full text-xs font-bold bg-[#f59e0b] text-black shadow-md hover:bg-[#d97706] transition-colors duration-fast"
        aria-label="Dev toolbar"
        data-testid="dev-toolbar-toggle"
      >
        DEV
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests and confirm they all pass**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/components/dev/DevToolbar.test.tsx
```

Expected: 7 tests pass.

- [ ] **Step 5: Type-check**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npx tsc --project tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/dev/DevToolbar.tsx src/components/dev/DevToolbar.test.tsx
git commit -m "feat(dev): add DevToolbar with polling and offline simulation flags"
```

---

## Task 3: usePolling hook

**Files:**
- Create: `src/hooks/usePolling.ts`
- Create: `src/hooks/usePolling.test.ts`

- [ ] **Step 1: Create the test file**

Create `src/hooks/usePolling.test.ts`:

```ts
import { renderHook } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { usePolling } from './usePolling'
import type { GitHubConfig } from '@/types'

vi.mock('@/lib/github', () => ({
  pollCommit: vi.fn(),
}))

vi.mock('@/stores/useArticleStore', () => ({
  useArticleStore: {
    getState: vi.fn(),
  },
}))

vi.mock('@/components/shared/Toast/useToast', () => ({
  useToast: {
    getState: () => ({ showToast: vi.fn() }),
  },
}))

// polling ON by default for most tests
vi.mock('@/lib/devFlags', () => ({
  devFlag: vi.fn(() => true),
}))

import { pollCommit } from '@/lib/github'
import { useArticleStore } from '@/stores/useArticleStore'
import { devFlag } from '@/lib/devFlags'

const mockConfig: GitHubConfig = { owner: 'test', repo: 'data', pat: 'tok' }

describe('usePolling', () => {
  let setConnectionStatus: ReturnType<typeof vi.fn>
  let mockFetchAll: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    setConnectionStatus = vi.fn()
    mockFetchAll = vi.fn().mockResolvedValue(undefined)

    vi.mocked(useArticleStore.getState).mockReturnValue({
      fetchAll: mockFetchAll,
      articles: [],
      shas: {},
      loading: false,
      error: null,
      add: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    })

    vi.mocked(devFlag).mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('does not poll when config is null', async () => {
    renderHook(() => usePolling(null, setConnectionStatus))
    await vi.runAllTimersAsync()
    expect(pollCommit).not.toHaveBeenCalled()
  })

  it('does not poll when devFlag("polling") returns false', async () => {
    vi.mocked(devFlag).mockReturnValue(false)
    renderHook(() => usePolling(mockConfig, setConnectionStatus))
    await vi.runAllTimersAsync()
    expect(pollCommit).not.toHaveBeenCalled()
  })

  it('calls pollCommit on mount when config and polling flag are set', async () => {
    vi.mocked(pollCommit).mockResolvedValue('sha-1')
    renderHook(() => usePolling(mockConfig, setConnectionStatus))
    await vi.runAllTimersAsync()
    expect(pollCommit).toHaveBeenCalledWith(mockConfig, 'main')
  })

  it('calls fetchAll when SHA changes between polls', async () => {
    vi.mocked(pollCommit)
      .mockResolvedValueOnce('sha-1')
      .mockResolvedValueOnce('sha-2')

    renderHook(() => usePolling(mockConfig, setConnectionStatus))
    await vi.runAllTimersAsync()            // mount poll: lastSha = sha-1
    vi.advanceTimersByTime(30_000)
    await vi.runAllTimersAsync()            // interval tick: sha-2 !== sha-1 → fetchAll

    expect(mockFetchAll).toHaveBeenCalledWith(mockConfig)
    expect(mockFetchAll).toHaveBeenCalledTimes(1)
  })

  it('does not call fetchAll when SHA is unchanged', async () => {
    vi.mocked(pollCommit).mockResolvedValue('sha-1')

    renderHook(() => usePolling(mockConfig, setConnectionStatus))
    await vi.runAllTimersAsync()
    vi.advanceTimersByTime(30_000)
    await vi.runAllTimersAsync()

    expect(mockFetchAll).not.toHaveBeenCalled()
  })

  it('sets connectionStatus to disconnected on poll error', async () => {
    vi.mocked(pollCommit).mockRejectedValue(new Error('Network error'))
    renderHook(() => usePolling(mockConfig, setConnectionStatus))
    await vi.runAllTimersAsync()
    expect(setConnectionStatus).toHaveBeenCalledWith('disconnected')
  })

  it('sets connectionStatus to connected after recovery from error', async () => {
    vi.mocked(pollCommit)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('sha-1')

    renderHook(() => usePolling(mockConfig, setConnectionStatus))
    await vi.runAllTimersAsync()            // first poll fails → disconnected
    vi.advanceTimersByTime(30_000)
    await vi.runAllTimersAsync()            // second poll succeeds → connected

    expect(setConnectionStatus).toHaveBeenCalledWith('disconnected')
    expect(setConnectionStatus).toHaveBeenCalledWith('connected')
  })
})
```

- [ ] **Step 2: Run tests and confirm they all fail**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/hooks/usePolling.test.ts
```

Expected: 7 failures — "Cannot find module './usePolling'"

- [ ] **Step 3: Create the implementation**

Create `src/hooks/usePolling.ts`:

```ts
import { useEffect, useRef } from 'react'
import type { GitHubConfig, ConnectionStatus } from '@/types'
import { pollCommit } from '@/lib/github'
import { useArticleStore } from '@/stores/useArticleStore'
import { useToast } from '@/components/shared/Toast/useToast'
import { devFlag } from '@/lib/devFlags'

const POLL_INTERVAL_MS = 30_000

export function usePolling(
  config: GitHubConfig | null,
  setConnectionStatus: (status: ConnectionStatus) => void,
): void {
  const lastShaRef = useRef<string | null>(null)
  const wasDisconnectedRef = useRef(false)

  useEffect(() => {
    if (!config) return

    async function poll() {
      if (!config) return
      if (!devFlag('polling')) return

      try {
        const sha = await pollCommit(config, 'main')

        // Recovery
        if (wasDisconnectedRef.current) {
          wasDisconnectedRef.current = false
          setConnectionStatus('connected')
          useToast.getState().showToast('Reconnected.', 'success')
        }

        // Re-fetch articles if SHA changed since last poll
        if (lastShaRef.current !== null && sha !== lastShaRef.current) {
          await useArticleStore.getState().fetchAll(config)
          useToast.getState().showToast('Articles updated from remote.', 'info')
        }

        lastShaRef.current = sha
      } catch {
        wasDisconnectedRef.current = true
        setConnectionStatus('disconnected')
      }
    }

    // Poll immediately on mount (captures initial SHA)
    poll()

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        poll()
      }
    }, POLL_INTERVAL_MS)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        poll()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [config, setConnectionStatus])
}
```

- [ ] **Step 4: Run tests and confirm they all pass**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/hooks/usePolling.test.ts
```

Expected: 7 tests pass.

- [ ] **Step 5: Type-check**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npx tsc --project tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePolling.ts src/hooks/usePolling.test.ts
git commit -m "feat(polling): add usePolling hook with visibility-aware 30s interval"
```

---

## Task 4: Wire polling into AppContext

**Files:**
- Modify: `src/context/AppContext.tsx`

Read `src/context/AppContext.tsx` before editing. The current file has these imports at the top:

```tsx
import React, { useEffect, useState } from 'react'
import type { User, CampaignMeta, ThemePreference, ConnectionStatus, GitHubConfig } from '@/types'
import { getStoredTheme, setStoredTheme, applyTheme } from '@/lib/theme'
import { createContext } from './createContext'
```

And `AppProvider` declares `githubConfig` and `setConnectionStatus` as state.

- [ ] **Step 1: Add the usePolling import**

In `src/context/AppContext.tsx`, add this import after the existing imports:

```tsx
import { usePolling } from '@/hooks/usePolling'
```

- [ ] **Step 2: Add the usePolling call inside AppProvider**

In `AppProvider`, after the `useEffect` for theme (around line 67), add:

```tsx
  usePolling(githubConfig, setConnectionStatus)
```

The full `AppProvider` function body should look like:

```tsx
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [campaignMeta, setCampaignMeta] = useState<CampaignMeta | null>(null)
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredTheme())
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected')
  const [githubConfig, setGithubConfigState] = useState<GitHubConfig | null>(
    () => loadGithubConfig(),
  )

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  usePolling(githubConfig, setConnectionStatus)

  function setTheme(newTheme: ThemePreference) {
    setStoredTheme(newTheme)
    applyTheme(newTheme)
    setThemeState(newTheme)
  }

  function setGithubConfig(config: GitHubConfig) {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config))
    setGithubConfigState(config)
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        campaignMeta,
        setCampaignMeta,
        theme,
        setTheme,
        connectionStatus,
        setConnectionStatus,
        githubConfig,
        setGithubConfig,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npx tsc --project tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run full test suite to check for regressions**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npm run test:ci 2>&1 | grep -E "Tests|FAIL|PASS|Error"
```

Expected: all previously passing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/context/AppContext.tsx
git commit -m "feat(polling): wire usePolling into AppProvider"
```

---

## Task 5: Mount DevToolbar in App.tsx

**Files:**
- Modify: `src/App.tsx`

Read the current `src/App.tsx`. The `AppProvider` wraps `AppRoutes` and `ToastStack`:

```tsx
export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
      <ToastStack />
    </AppProvider>
  )
}
```

- [ ] **Step 1: Add the DevToolbar import**

At the top of `src/App.tsx`, after the existing imports, add:

```tsx
import { DevToolbar } from '@/components/dev/DevToolbar'
```

- [ ] **Step 2: Mount DevToolbar inside AppProvider**

Update the `App` default export so `DevToolbar` is rendered inside `AppProvider` (it calls `useAppContext`, so it must be inside the provider) but only in dev:

```tsx
export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
      <ToastStack />
      {import.meta.env.DEV && <DevToolbar />}
    </AppProvider>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npx tsc --project tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run full test suite**

```bash
export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"
npm run test:ci 2>&1 | grep -E "Tests|FAIL|PASS|Error"
```

Expected: all tests pass. The `{import.meta.env.DEV && <DevToolbar />}` line evaluates to `true` in Vitest (DEV is true in test env), so `DevToolbar` renders in tests. This is expected and acceptable — the tests that matter are the DevToolbar-specific ones.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(dev): mount DevToolbar in dev builds"
```

---

## Notes for the implementer

**Polling is off by default in dev.** `devFlag('polling')` returns `false` until the user turns it on via the DevToolbar. This means the polling hook's `poll()` function is a no-op in every tick during development. The interval still runs (30s), but each tick returns immediately. This is by design — prevents burning GitHub API quota during development.

**The offline simulation is decoupled from polling.** When the user toggles "Simulate Offline" in the DevToolbar, it directly calls `setConnectionStatus('disconnected')`. This causes `ConnectionBanner` to appear immediately. It does not interact with the polling hook's internal `wasDisconnected` ref — the simulation bypasses polling entirely.

**`usePolling` is called from a React hook context** (inside `AppProvider`'s render), so it follows React's rules of hooks. The async `poll()` function inside the `useEffect` is not a hook — it's a plain async function, which is fine.

**`devFlag()` is called inside the async `poll()` function**, not at the top of `usePolling`. This means changing the flag takes effect on the next poll tick (up to 30s away) without requiring a re-render or re-mount of the hook. Toggling is not instant — this is acceptable for a dev tool.

**Node version:** This project requires Node 22+. Always prefix commands with `export PATH="/Users/danielfeinstat/.nvm/versions/node/v22.22.2/bin:$PATH"` if running in a shell that hasn't loaded nvm.

**Vitest and `import.meta.env.DEV`:** Vitest sets `import.meta.env.DEV = true` in the test environment. The `devFlag()` guard (`if (!import.meta.env.DEV) return {}`) is therefore inactive in tests. This is correct — you want `devFlag()` to read from `localStorage` in tests so you can set up fixture values in `beforeEach`.
