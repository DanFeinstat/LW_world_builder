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
