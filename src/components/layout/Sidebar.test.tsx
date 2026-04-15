// src/components/layout/Sidebar.test.tsx
import { screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Sidebar } from './Sidebar'
import { renderWithRouter } from '@/test/utils'
import type { User, CampaignMeta } from '@/types'

vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

import { useAppContext } from '@/context/AppContext'

const dmUser: User = {
  id: 'usr_dm001',
  name: 'Dungeon Master',
  passphrase: 'secret',
  role: 'dm',
  color: '#7F77DD',
  createdAt: '2026-01-01T00:00:00Z',
}

const meta: CampaignMeta = { campaignName: 'Test Campaign', currentDate: 'Day 1' }

beforeEach(() => {
  vi.mocked(useAppContext).mockReturnValue({
    currentUser: dmUser,
    campaignMeta: meta,
    theme: 'light',
    setTheme: vi.fn(),
    setCurrentUser: vi.fn(),
    githubConfig: null,
    setGithubConfig: vi.fn(),
    connectionStatus: 'connected',
    setConnectionStatus: vi.fn(),
    setCampaignMeta: vi.fn(),
  })
})

describe('Sidebar', () => {
  it('renders all six nav sections as links', () => {
    renderWithRouter(
      <Sidebar collapsed={false} onToggleCollapse={vi.fn()} />,
      { initialPath: '/articles' },
    )
    expect(screen.getByRole('link', { name: /articles/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sessions/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /journals/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /timeline/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('marks the active section with aria-current="page"', () => {
    renderWithRouter(
      <Sidebar collapsed={false} onToggleCollapse={vi.fn()} />,
      { initialPath: '/articles' },
    )
    expect(screen.getByRole('link', { name: /articles/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /sessions/i })).not.toHaveAttribute('aria-current')
  })

  it('marks a nested path as active for its section', () => {
    renderWithRouter(
      <Sidebar collapsed={false} onToggleCollapse={vi.fn()} />,
      { initialPath: '/articles/art_001' },
    )
    expect(screen.getByRole('link', { name: /articles/i })).toHaveAttribute('aria-current', 'page')
  })
})
