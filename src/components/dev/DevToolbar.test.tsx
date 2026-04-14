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
