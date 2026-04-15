// src/components/articles/ArticlesPanel.test.tsx
import { screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ArticlesPanel } from './ArticlesPanel'
import { renderWithRouter } from '@/test/utils'
import type { Article } from './types'
import type { User, GitHubConfig } from '@/types'

vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

vi.mock('@/components/shared/Toast/useToast', () => ({
  useToast: vi.fn(() => vi.fn()),
}))

vi.mock('@/stores/useArticleStore', () => ({
  useArticleStore: vi.fn(),
}))

import { useAppContext } from '@/context/AppContext'
import { useArticleStore } from '@/stores/useArticleStore'

const dmUser: User = {
  id: 'usr_dm001',
  name: 'Dungeon Master',
  passphrase: 'secret',
  role: 'dm',
  color: '#7F77DD',
  createdAt: '2026-01-01T00:00:00Z',
}

const mockConfig: GitHubConfig = { owner: 'test', repo: 'data', pat: 'tok' }

const testArticle: Article = {
  id: 'art_001',
  title: 'Thorin the Dwarf',
  articleType: 'npc',
  body: 'A stout dwarf.',
  tags: [],
  links: [],
  visibility: 'shared',
  interactable: false,
  createdBy: 'usr_dm001',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function mockStore(overrides: { articles?: Article[]; loading?: boolean } = {}) {
  vi.mocked(useArticleStore).mockImplementation((selector: (s: any) => any) =>
    selector({
      articles: overrides.articles ?? [testArticle],
      loading: overrides.loading ?? false,
      error: null,
      fetchAll: vi.fn().mockResolvedValue(undefined),
      add: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      shas: {},
    }),
  )
}

beforeEach(() => {
  vi.mocked(useAppContext).mockReturnValue({
    currentUser: dmUser,
    githubConfig: mockConfig,
    campaignMeta: null,
    theme: 'light',
    setTheme: vi.fn(),
    setCurrentUser: vi.fn(),
    setGithubConfig: vi.fn(),
    connectionStatus: 'connected',
    setConnectionStatus: vi.fn(),
    setCampaignMeta: vi.fn(),
  })
  mockStore()
})

describe('ArticlesPanel', () => {
  it('renders the empty detail state when no article is selected', () => {
    renderWithRouter(<ArticlesPanel />, { initialPath: '/articles', path: '/articles' })
    expect(screen.getByText('Select an article to view it.')).toBeInTheDocument()
  })

  it('renders ArticleDetail when articleId URL param matches a loaded article', () => {
    renderWithRouter(<ArticlesPanel />, { initialPath: '/articles/art_001', path: '/articles/:articleId?' })
    expect(screen.getByRole('heading', { name: 'Thorin the Dwarf' })).toBeInTheDocument()
  })

  it('renders NotFound when articleId does not match any article', () => {
    renderWithRouter(<ArticlesPanel />, { initialPath: '/articles/art_999', path: '/articles/:articleId?' })
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.getByText('Article not found.')).toBeInTheDocument()
  })

  it('does not render NotFound while articles are still loading', () => {
    mockStore({ articles: [], loading: true })
    renderWithRouter(<ArticlesPanel />, { initialPath: '/articles/art_001', path: '/articles/:articleId?' })
    expect(screen.queryByRole('heading', { name: '404' })).not.toBeInTheDocument()
  })
})
