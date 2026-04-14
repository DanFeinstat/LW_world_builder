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

vi.mock('@/lib/devFlags', () => ({
  devFlag: vi.fn(() => true),
}))

import { pollCommit } from '@/lib/github'
import { useArticleStore } from '@/stores/useArticleStore'
import { devFlag } from '@/lib/devFlags'

// Flush the microtask queue without touching fake timers.
// queueMicrotask is not intercepted by vi.useFakeTimers(), so this drains
// pending Promise callbacks (e.g. the async poll() resolution) without
// advancing the fake clock.
function flushPromises() {
  return new Promise<void>(resolve => queueMicrotask(() => queueMicrotask(resolve)))
}

const mockConfig: GitHubConfig = { owner: 'test', repo: 'data', pat: 'tok' }

describe('usePolling', () => {
  let setConnectionStatus: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    setConnectionStatus = vi.fn()

    vi.mocked(useArticleStore.getState).mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue(undefined),
      articles: [],
      shas: {},
      loading: false,
      error: null,
      add: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    })

    vi.mocked(devFlag).mockImplementation((name: string) => name === 'polling')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('does not poll when config is null', async () => {
    renderHook(() => usePolling(null, setConnectionStatus))
    await flushPromises()
    expect(pollCommit).not.toHaveBeenCalled()
  })

  it('sets connectionStatus to disconnected when the poll fails', async () => {
    vi.mocked(pollCommit).mockRejectedValue(new Error('Network error'))
    renderHook(() => usePolling(mockConfig, setConnectionStatus))
    await flushPromises()
    expect(setConnectionStatus).toHaveBeenCalledWith('disconnected')
  })

  it('sets connectionStatus to connected after recovering from an error', async () => {
    vi.mocked(pollCommit)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('sha-1')

    renderHook(() => usePolling(mockConfig, setConnectionStatus))
    await flushPromises()                       // first poll fails → disconnected
    vi.advanceTimersByTime(30_000)
    await flushPromises()                       // second poll succeeds → connected

    expect(setConnectionStatus).toHaveBeenCalledWith('disconnected')
    expect(setConnectionStatus).toHaveBeenCalledWith('connected')
  })
})
