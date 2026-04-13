import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ArticleList } from '@/components/articles/ArticleList'
import { useArticleStore } from '@/stores/useArticleStore'
import type { Article } from '@/components/articles/types'
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
