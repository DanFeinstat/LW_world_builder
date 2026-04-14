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
