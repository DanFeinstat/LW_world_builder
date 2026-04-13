import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ArticleDetail } from '@/components/articles/ArticleDetail'
import { useArticleStore } from '@/stores/useArticleStore'
import type { Article } from './types'
import type { User, GitHubConfig } from '@/types'

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
