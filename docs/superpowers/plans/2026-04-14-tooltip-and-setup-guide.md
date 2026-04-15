# Tooltip Component + Setup Guide Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable `Tooltip` shared component (Radix-based, portal-rendered, hover+click-lock) and wire it into SetupScreen with a PAT field tooltip and a full "Need help setting up?" onboarding modal.

**Architecture:** `@radix-ui/react-tooltip` handles portal rendering, positioning, collision detection, keyboard dismissal, and ARIA. We layer click-lock state on top using Radix's controlled `open`/`onOpenChange` props. The setup guide modal reuses the existing `Modal` component. No new stores, routes, or contexts.

**Tech Stack:** React 18, TypeScript strict, `@radix-ui/react-tooltip`, `@radix-ui/react-dialog` (existing, via `Modal`), Tailwind CSS v3, Vitest + React Testing Library

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `@radix-ui/react-tooltip` dependency |
| `src/App.tsx` | Modify | Mount `<TooltipProvider>` once at app root |
| `src/components/shared/Tooltip/Tooltip.tsx` | Create | Reusable Tooltip component |
| `src/components/shared/Tooltip/Tooltip.test.tsx` | Create | Tests for Tooltip |
| `src/components/setup/SetupGuideModal.tsx` | Create | Setup guide modal content component |
| `src/components/setup/SetupGuideModal.test.tsx` | Create | Tests for SetupGuideModal |
| `src/components/setup/SetupScreen.tsx` | Modify | PAT field tooltip + "Need help?" link + Field tooltip prop |
| `src/components/setup/SetupScreen.test.tsx` | Create | Tests for SetupScreen additions |

---

## Task 1: Install `@radix-ui/react-tooltip`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install @radix-ui/react-tooltip
```

Expected output: package added with no peer dependency warnings (React 18 is satisfied).

- [ ] **Step 2: Verify TypeScript types are included**

```bash
npx tsc --noEmit
```

Expected: no errors. (`@radix-ui/react-tooltip` ships its own types — no `@types/` package needed.)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @radix-ui/react-tooltip"
```

---

## Task 2: Write failing tests for `Tooltip.tsx`

**Files:**
- Create: `src/components/shared/Tooltip/Tooltip.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
// src/components/shared/Tooltip/Tooltip.test.tsx
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { Tooltip } from './Tooltip'

function renderWithProvider(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the default info icon trigger with accessible label', () => {
    renderWithProvider(<Tooltip content="Hello" />)
    expect(screen.getByRole('button', { name: 'More information' })).toBeInTheDocument()
  })

  it('renders custom children as the trigger instead of the info icon', () => {
    renderWithProvider(
      <Tooltip content="Hello">
        <button type="button">Custom trigger</button>
      </Tooltip>
    )
    expect(screen.getByRole('button', { name: 'Custom trigger' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'More information' })).not.toBeInTheDocument()
  })

  it('renders the trigger but no tooltip when content is empty', () => {
    renderWithProvider(<Tooltip content={undefined} />)
    // Trigger still renders (no layout shift)
    expect(screen.getByRole('button', { name: 'More information' })).toBeInTheDocument()
    // Tooltip content is not in the DOM at all — inert
    // (We verify this by ensuring the Radix tooltip root is not rendered;
    // the trigger button has no aria-describedby)
    const btn = screen.getByRole('button', { name: 'More information' })
    expect(btn).not.toHaveAttribute('aria-describedby')
  })

  it('shows tooltip content on hover', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProvider(<Tooltip content="Tooltip text" />)
    const trigger = screen.getByRole('button', { name: 'More information' })
    await user.hover(trigger)
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(screen.getByText('Tooltip text')).toBeInTheDocument()
  })

  it('keeps tooltip open after click even when mouse leaves', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProvider(<Tooltip content="Locked content" />)
    const trigger = screen.getByRole('button', { name: 'More information' })
    // Click to lock
    await user.click(trigger)
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.getByText('Locked content')).toBeInTheDocument()
    // Unhover — should stay open because locked
    await user.unhover(trigger)
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.getByText('Locked content')).toBeInTheDocument()
  })

  it('closes tooltip when Escape is pressed while locked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProvider(<Tooltip content="Locked content" />)
    const trigger = screen.getByRole('button', { name: 'More information' })
    await user.click(trigger)
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.getByText('Locked content')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.queryByText('Locked content')).not.toBeInTheDocument()
  })

  it('closes tooltip when clicking outside while locked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProvider(
      <div>
        <Tooltip content="Locked content" />
        <button type="button">Outside</button>
      </div>
    )
    const trigger = screen.getByRole('button', { name: 'More information' })
    await user.click(trigger)
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.getByText('Locked content')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.queryByText('Locked content')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run src/components/shared/Tooltip/Tooltip.test.tsx
```

Expected: all tests fail with "Cannot find module './Tooltip'".

- [ ] **Step 3: Commit failing tests**

```bash
git add src/components/shared/Tooltip/Tooltip.test.tsx
git commit -m "test(tooltip): write failing tests for Tooltip component"
```

---

## Task 3: Implement `Tooltip.tsx`

**Files:**
- Create: `src/components/shared/Tooltip/Tooltip.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/shared/Tooltip/Tooltip.tsx
import { useState, useEffect, useRef } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import clsx from 'clsx'

export interface TooltipProps {
  content?: React.ReactNode
  children?: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

export function Tooltip({ content, children, side = 'top', align = 'center' }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLocked) return

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (wrapperRef.current?.contains(target)) return
      if (contentRef.current?.contains(target)) return
      setIsLocked(false)
      setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isLocked])

  const trigger = children ?? (
    <button
      type="button"
      aria-label="More information"
      className="inline-flex items-center text-text-muted hover:text-text-secondary transition-colors duration-fast"
    >
      <InfoIcon />
    </button>
  )

  if (!content) {
    return <span>{trigger}</span>
  }

  function handleOpenChange(open: boolean) {
    if (isLocked && !open) return
    setIsOpen(open)
    if (!open) setIsLocked(false)
  }

  function handleClick() {
    if (isLocked) {
      setIsLocked(false)
      setIsOpen(false)
    } else {
      setIsLocked(true)
      setIsOpen(true)
    }
  }

  return (
    <TooltipPrimitive.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      delayDuration={300}
    >
      <span ref={wrapperRef}>
        <TooltipPrimitive.Trigger asChild onClick={handleClick}>
          {trigger}
        </TooltipPrimitive.Trigger>
      </span>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={contentRef}
          side={side}
          align={align}
          sideOffset={8}
          className={clsx(
            'z-modal max-w-xs rounded-md border border-border',
            'bg-surface-raised px-3 py-2 shadow-md',
            'text-sm text-text-primary',
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-surface-raised" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
```

- [ ] **Step 2: Run tests and confirm they pass**

```bash
npm test -- --run src/components/shared/Tooltip/Tooltip.test.tsx
```

Expected: all 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/Tooltip/Tooltip.tsx
git commit -m "feat(tooltip): add reusable Tooltip component"
```

---

## Task 4: Mount `TooltipProvider` in `App.tsx`

`@radix-ui/react-tooltip` requires a single `TooltipProvider` wrapping the component tree. Without it, Radix throws at runtime.

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add the import and wrap the tree**

In `src/App.tsx`, add the import at the top:

```tsx
import { TooltipProvider } from '@radix-ui/react-tooltip'
```

Then wrap the `AppProvider` contents. The existing `export default function App()` becomes:

```tsx
export default function App() {
  return (
    <AppProvider>
      <TooltipProvider>
        <AppRoutes />
        <ToastStack />
        {import.meta.env.DEV && <DevToolbar />}
      </TooltipProvider>
    </AppProvider>
  )
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(tooltip): mount TooltipProvider in App root"
```

---

## Task 5: Write failing tests for `SetupGuideModal.tsx`

**Files:**
- Create: `src/components/setup/SetupGuideModal.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
// src/components/setup/SetupGuideModal.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SetupGuideModal } from './SetupGuideModal'

describe('SetupGuideModal', () => {
  it('renders with the correct title when open', () => {
    render(<SetupGuideModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Setting Up Campaign Manager')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<SetupGuideModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByText('Setting Up Campaign Manager')).not.toBeInTheDocument()
  })

  it('renders all four step headings', () => {
    render(<SetupGuideModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText(/Create the data repo/i)).toBeInTheDocument()
    expect(screen.getByText(/Invite your group/i)).toBeInTheDocument()
    expect(screen.getByText(/Create your Personal Access Token/i)).toBeInTheDocument()
    expect(screen.getByText(/Connect/i)).toBeInTheDocument()
  })

  it('renders github.com/new link with target="_blank" and rel="noreferrer"', () => {
    render(<SetupGuideModal isOpen={true} onClose={vi.fn()} />)
    const link = screen.getByRole('link', { name: /github\.com\/new/i })
    expect(link).toHaveAttribute('href', 'https://github.com/new')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('renders fine-grained tokens link with target="_blank" and rel="noreferrer"', () => {
    render(<SetupGuideModal isOpen={true} onClose={vi.fn()} />)
    const link = screen.getByRole('link', { name: /personal-access-tokens\/new/i })
    expect(link).toHaveAttribute('href', 'https://github.com/settings/personal-access-tokens/new')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('renders classic PAT fallback link', () => {
    render(<SetupGuideModal isOpen={true} onClose={vi.fn()} />)
    const link = screen.getByRole('link', { name: /settings\/tokens\/new/i })
    expect(link).toHaveAttribute('href', 'https://github.com/settings/tokens/new')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(<SetupGuideModal isOpen={true} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run src/components/setup/SetupGuideModal.test.tsx
```

Expected: all tests fail with "Cannot find module './SetupGuideModal'".

- [ ] **Step 3: Commit failing tests**

```bash
git add src/components/setup/SetupGuideModal.test.tsx
git commit -m "test(setup): write failing tests for SetupGuideModal"
```

---

## Task 6: Implement `SetupGuideModal.tsx`

**Files:**
- Create: `src/components/setup/SetupGuideModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/setup/SetupGuideModal.tsx
import { Modal } from '@/components/shared/Modal/Modal'

interface SetupGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

interface StepProps {
  number: number
  title: string
  children: React.ReactNode
  note?: string
}

function Step({ number, title, children, note }: StepProps) {
  return (
    <div className="flex gap-4 p-4 border-b border-border last:border-b-0">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-dm-subtle text-dm text-sm font-semibold flex items-center justify-center">
        {number}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <div className="text-sm text-text-secondary leading-base">{children}</div>
        {note && (
          <p className="text-xs text-text-muted mt-1 italic">{note}</p>
        )}
      </div>
    </div>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-dm hover:underline break-all"
    >
      {children}
    </a>
  )
}

export function SetupGuideModal({ isOpen, onClose }: SetupGuideModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Setting Up Campaign Manager" size="md">
      <div className="flex flex-col">
        <Step number={1} title="Create the data repo">
          <p>
            Go to{' '}
            <ExternalLink href="https://github.com/new">github.com/new</ExternalLink>
            {' '}and create a new empty repository. This is where all campaign data lives.
          </p>
          <p className="mt-1">Share the repository owner name and repo name with your whole group.</p>
        </Step>

        <Step
          number={2}
          title="Invite your group"
          note="Skip this step if you are the repo owner."
        >
          <p>Go to your repo → Settings → Collaborators → Add people.</p>
          <p className="mt-1">Invite each DM and player by GitHub username. Each person must accept the invitation before creating their token.</p>
        </Step>

        <Step number={3} title="Create your Personal Access Token">
          <p>
            Go to{' '}
            <ExternalLink href="https://github.com/settings/personal-access-tokens/new">
              settings/personal-access-tokens/new
            </ExternalLink>
            {' '}and create a Fine-grained token.
          </p>
          <ul className="mt-2 flex flex-col gap-1 list-disc list-inside">
            <li>Repository access: select only the shared campaign repo</li>
            <li>Permissions → Contents: Read and Write</li>
          </ul>
          <p className="mt-2 text-xs text-text-muted italic">
            If your organization does not support fine-grained tokens, create a classic token at{' '}
            <ExternalLink href="https://github.com/settings/tokens/new">
              settings/tokens/new
            </ExternalLink>
            {' '}with the <code className="font-mono">repo</code> scope.
          </p>
        </Step>

        <Step number={4} title="Connect">
          <p>Enter the repo owner's GitHub username, the repo name, and your token into the form, then click Connect Repository.</p>
        </Step>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Run tests and confirm they pass**

```bash
npm test -- --run src/components/setup/SetupGuideModal.test.tsx
```

Expected: all 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/setup/SetupGuideModal.tsx
git commit -m "feat(setup): add SetupGuideModal with step-by-step onboarding"
```

---

## Task 7: Write failing tests for SetupScreen changes

**Files:**
- Create: `src/components/setup/SetupScreen.test.tsx`

- [ ] **Step 1: Create the test file**

SetupScreen calls GitHub API on form submit — tests below don't submit the form so no mocking is needed.

```tsx
// src/components/setup/SetupScreen.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { AppProvider } from '@/context/AppContext'
import { SetupScreen } from './SetupScreen'

function renderSetupScreen() {
  return render(
    <AppProvider>
      <TooltipProvider>
        <SetupScreen />
      </TooltipProvider>
    </AppProvider>
  )
}

describe('SetupScreen', () => {
  it('renders a tooltip trigger next to the Personal Access Token label', () => {
    renderSetupScreen()
    expect(screen.getByRole('button', { name: 'More information' })).toBeInTheDocument()
  })

  it('renders a "Need help setting up?" link', () => {
    renderSetupScreen()
    expect(
      screen.getByRole('button', { name: /need help setting up/i })
    ).toBeInTheDocument()
  })

  it('opens the setup guide modal when "Need help setting up?" is clicked', async () => {
    renderSetupScreen()
    await userEvent.click(screen.getByRole('button', { name: /need help setting up/i }))
    expect(screen.getByText('Setting Up Campaign Manager')).toBeInTheDocument()
  })

  it('closes the setup guide modal when the modal close button is clicked', async () => {
    renderSetupScreen()
    await userEvent.click(screen.getByRole('button', { name: /need help setting up/i }))
    expect(screen.getByText('Setting Up Campaign Manager')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByText('Setting Up Campaign Manager')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run src/components/setup/SetupScreen.test.tsx
```

Expected: tests fail — "More information" button not found, "Need help" button not found.

- [ ] **Step 3: Commit failing tests**

```bash
git add src/components/setup/SetupScreen.test.tsx
git commit -m "test(setup): write failing tests for SetupScreen tooltip and guide link"
```

---

## Task 8: Update `SetupScreen.tsx`

**Files:**
- Modify: `src/components/setup/SetupScreen.tsx`

- [ ] **Step 1: Replace the full file contents**

The `Field` component gains an optional `tooltip` prop. The PAT field gets the tooltip. A "Need help setting up?" button triggers the `SetupGuideModal`.

```tsx
// src/components/setup/SetupScreen.tsx
import { useState } from 'react'
import clsx from 'clsx'
import { listTree, writeFile, GitHubError } from '@/lib/github'
import { readFile } from '@/lib/github'
import { useAppContext } from '@/context/AppContext'
import type { GitHubConfig, CampaignMeta } from '@/types'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { SetupGuideModal } from './SetupGuideModal'

const DEFAULT_OWNER = import.meta.env.VITE_GITHUB_OWNER ?? ''
const DEFAULT_REPO = import.meta.env.VITE_GITHUB_REPO ?? ''

const PatTooltipContent = (
  <ol className="flex flex-col gap-1 list-decimal list-inside">
    <li>GitHub → Settings → Developer Settings → Personal access tokens → Fine-grained tokens</li>
    <li>Click "Generate new token"</li>
    <li>Repository access: select only the shared campaign repo</li>
    <li>Permissions → Contents: Read and Write</li>
    <li>Generate, copy, and paste it here</li>
  </ol>
)

export function SetupScreen() {
  const { setGithubConfig, setCampaignMeta } = useAppContext()

  const [owner, setOwner] = useState(DEFAULT_OWNER)
  const [repo, setRepo] = useState(DEFAULT_REPO)
  const [pat, setPat] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const config: GitHubConfig = { owner: owner.trim(), repo: repo.trim(), pat: pat.trim() }

    try {
      await listTree(config)

      let meta: CampaignMeta
      try {
        const stored = await readFile<CampaignMeta>(config, 'data/meta.json')
        meta = stored.data
      } catch (err) {
        if (err instanceof GitHubError && err.status === 404) {
          meta = { campaignName: 'My Campaign', currentDate: 'Day 1' }
          await writeFile(config, 'data/meta.json', meta, null, 'initialize campaign data')
        } else {
          throw err
        }
      }

      setGithubConfig(config)
      setCampaignMeta(meta)
    } catch (err) {
      const msg =
        err instanceof GitHubError
          ? `GitHub error ${err.status}: check your owner, repo, and PAT.`
          : 'Could not reach GitHub. Check your network and try again.'
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  const isLoading = status === 'loading'

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-2xl font-semibold text-text-primary mb-2">
            Campaign Manager
          </h1>
          <p className="text-sm text-text-secondary">
            Connect your GitHub data repository to get started.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-raised border border-border rounded-lg p-8 shadow-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="GitHub Owner" htmlFor="owner">
              <input
                id="owner"
                type="text"
                value={owner}
                onChange={e => setOwner(e.target.value)}
                placeholder="your-username"
                required
                disabled={isLoading}
                className={inputClass}
              />
            </Field>

            <Field label="Repository Name" htmlFor="repo">
              <input
                id="repo"
                type="text"
                value={repo}
                onChange={e => setRepo(e.target.value)}
                placeholder="campaign-data"
                required
                disabled={isLoading}
                className={inputClass}
              />
            </Field>

            <Field
              label="Personal Access Token"
              htmlFor="pat"
              hint="Stored locally in your browser only."
              tooltip={PatTooltipContent}
            >
              <input
                id="pat"
                type="password"
                value={pat}
                onChange={e => setPat(e.target.value)}
                placeholder="ghp_••••••••••••••••"
                required
                disabled={isLoading}
                className={inputClass}
              />
            </Field>

            {status === 'error' && (
              <p className="text-sm text-danger bg-danger-subtle border border-danger rounded-md px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !owner || !repo || !pat}
              className={clsx(
                'w-full py-2 px-4 rounded-md text-sm font-semibold text-white transition-colors duration-fast',
                'bg-dm hover:bg-dm-hover disabled:opacity-45 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dm focus-visible:ring-offset-2',
              )}
            >
              {isLoading ? 'Connecting…' : 'Connect Repository'}
            </button>

            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-fast text-center"
            >
              Need help setting up?
            </button>
          </form>
        </div>
      </div>

      <SetupGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputClass = clsx(
  'block w-full text-sm text-text-primary bg-surface border border-border rounded-md',
  'px-3 py-2 leading-base placeholder:text-text-muted',
  'transition-colors duration-fast',
  'focus:outline-none focus:border-dm focus:ring-2 focus:ring-dm/20',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-sunken',
)

function Field({
  label,
  htmlFor,
  hint,
  tooltip,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  tooltip?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
          {label}
        </label>
        <Tooltip content={tooltip} />
      </div>
      {children}
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Run the SetupScreen tests**

```bash
npm test -- --run src/components/setup/SetupScreen.test.tsx
```

Expected: all 4 tests pass.

- [ ] **Step 3: Run the full test suite to confirm no regressions**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/setup/SetupScreen.tsx
git commit -m "feat(setup): add PAT tooltip and setup guide modal to SetupScreen"
```

---

## Task 9: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `http://localhost:5173/LW_world_builder/` in a browser.

- [ ] **Step 2: Verify tooltip**

- Hover over the `ⓘ` icon next to "Personal Access Token" — tooltip should appear after ~300ms with the PAT steps
- Move mouse away — tooltip should close
- Click the `ⓘ` icon — tooltip should stay open
- Move mouse away — tooltip should remain open (locked)
- Press Escape — tooltip should close
- Click the `ⓘ` again, then click anywhere outside — tooltip should close

- [ ] **Step 3: Verify setup guide modal**

- Click "Need help setting up?" — modal should open with title "Setting Up Campaign Manager"
- All four steps should be visible
- External links should be present (github.com/new, personal-access-tokens/new, tokens/new)
- Click the ✕ close button — modal should close
- Press Escape — modal should close (Radix handles this)

- [ ] **Step 4: Verify dark mode**

Toggle dark mode (if DevToolbar is available) and confirm tooltip bubble and modal content respect theme variables.
