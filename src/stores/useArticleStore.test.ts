import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useArticleStore } from '@/stores/useArticleStore'
import type { Article, GitHubConfig } from '@/types'

vi.mock('@/lib/github', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  deleteFile: vi.fn(),
  listTree: vi.fn(),
  pollCommit: vi.fn(),
  GitHubError: class GitHubError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.name = 'GitHubError'
      this.status = status
    }
  },
}))

import { writeFile, deleteFile, GitHubError } from '@/lib/github'

const mockConfig: GitHubConfig = { owner: 'test', repo: 'data', pat: 'tok' }

const mockArticle: Article = {
  id: 'art_test000001',
  title: 'Test NPC',
  articleType: 'npc',
  body: 'A mysterious figure.',
  tags: ['mysterious'],
  links: [],
  visibility: 'shared',
  interactable: false,
  createdBy: 'usr_dm001',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const draft = {
  title: mockArticle.title,
  articleType: mockArticle.articleType,
  body: mockArticle.body,
  tags: mockArticle.tags,
  links: mockArticle.links,
  visibility: mockArticle.visibility,
  interactable: mockArticle.interactable,
  createdBy: mockArticle.createdBy,
}

describe('useArticleStore', () => {
  beforeEach(() => {
    useArticleStore.setState({ articles: [], shas: {}, loading: false, error: null })
    vi.clearAllMocks()
  })

  describe('add', () => {
    it('inserts the article when the GitHub write succeeds', async () => {
      vi.mocked(writeFile).mockResolvedValueOnce('sha_new')

      await useArticleStore.getState().add(mockConfig, draft)

      expect(useArticleStore.getState().articles).toHaveLength(1)
      expect(useArticleStore.getState().articles[0].title).toBe('Test NPC')
    })

    it('rolls back the optimistic insert when the GitHub write fails', async () => {
      vi.mocked(writeFile).mockRejectedValueOnce(new Error('network error'))

      await expect(useArticleStore.getState().add(mockConfig, draft)).rejects.toThrow()

      expect(useArticleStore.getState().articles).toHaveLength(0)
    })
  })

  describe('update', () => {
    it('patches the article when the GitHub write succeeds', async () => {
      useArticleStore.setState({
        articles: [mockArticle],
        shas: { [mockArticle.id]: 'sha_original' },
      })
      vi.mocked(writeFile).mockResolvedValueOnce('sha_updated')

      await useArticleStore.getState().update(mockConfig, mockArticle.id, { title: 'Updated NPC' })

      expect(useArticleStore.getState().articles[0].title).toBe('Updated NPC')
    })

    it('reverts to the original article when the GitHub write fails', async () => {
      useArticleStore.setState({
        articles: [mockArticle],
        shas: { [mockArticle.id]: 'sha_original' },
      })
      vi.mocked(writeFile).mockRejectedValueOnce(new Error('network error'))

      await expect(
        useArticleStore.getState().update(mockConfig, mockArticle.id, { title: 'Updated NPC' })
      ).rejects.toThrow()

      expect(useArticleStore.getState().articles[0].title).toBe('Test NPC')
    })
  })

  describe('remove', () => {
    it('removes the article when the GitHub delete succeeds', async () => {
      useArticleStore.setState({
        articles: [mockArticle],
        shas: { [mockArticle.id]: 'sha_original' },
      })
      vi.mocked(deleteFile).mockResolvedValueOnce(undefined)

      await useArticleStore.getState().remove(mockConfig, mockArticle.id)

      expect(useArticleStore.getState().articles).toHaveLength(0)
    })

    it('restores the article when the GitHub delete fails with a non-404 error', async () => {
      useArticleStore.setState({
        articles: [mockArticle],
        shas: { [mockArticle.id]: 'sha_original' },
      })
      vi.mocked(deleteFile).mockRejectedValueOnce(new Error('network error'))

      await expect(
        useArticleStore.getState().remove(mockConfig, mockArticle.id)
      ).rejects.toThrow()

      expect(useArticleStore.getState().articles).toHaveLength(1)
      expect(useArticleStore.getState().articles[0].id).toBe(mockArticle.id)
    })

    it('does not restore the article when the delete fails with a 404', async () => {
      useArticleStore.setState({
        articles: [mockArticle],
        shas: { [mockArticle.id]: 'sha_original' },
      })
      vi.mocked(deleteFile).mockRejectedValueOnce(new GitHubError(404, 'Not Found'))

      await expect(
        useArticleStore.getState().remove(mockConfig, mockArticle.id)
      ).rejects.toThrow()

      expect(useArticleStore.getState().articles).toHaveLength(0)
    })
  })
})
