import { create } from 'zustand'
import type { Article, GitHubConfig } from '@/types'
import { readFile, writeFile, deleteFile, listTree, GitHubError } from '@/lib/github'
import { generateId } from '@/lib/ids'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArticleStore {
  articles: Article[]
  // sha per article path — required for GitHub writes
  shas: Record<string, string>
  loading: boolean
  error: string | null

  fetchAll: (config: GitHubConfig) => Promise<void>
  add: (config: GitHubConfig, draft: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  update: (config: GitHubConfig, id: string, patch: Partial<Article>) => Promise<void>
  remove: (config: GitHubConfig, id: string) => Promise<void>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function articlePath(id: string): string {
  return `data/articles/${id}.json`
}

function now(): string {
  return new Date().toISOString()
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useArticleStore = create<ArticleStore>((set, get) => ({
  articles: [],
  shas: {},
  loading: false,
  error: null,

  // -------------------------------------------------------------------------
  // fetchAll — discover article files from tree, lazy-fetch each one
  // -------------------------------------------------------------------------
  async fetchAll(config) {
    set({ loading: true, error: null })
    try {
      const tree = await listTree(config)
      const articlePaths = tree
        .filter(item => item.path.startsWith('data/articles/') && item.path.endsWith('.json'))
        .map(item => item.path)

      const results = await Promise.all(
        articlePaths.map(path => readFile<Article>(config, path)),
      )

      const articles: Article[] = []
      const shas: Record<string, string> = {}
      for (const { data, sha } of results) {
        articles.push(data)
        shas[data.id] = sha
      }

      set({ articles, shas, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load articles'
      set({ loading: false, error: message })
      throw err
    }
  },

  // -------------------------------------------------------------------------
  // add — optimistic insert, write to GitHub, rollback on failure
  // -------------------------------------------------------------------------
  async add(config, draft) {
    const id = generateId('art')
    const timestamp = now()
    const article: Article = {
      ...draft,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    // Optimistic update
    set(state => ({ articles: [...state.articles, article] }))

    try {
      const sha = await writeFile(config, articlePath(id), article, null, `add article ${id}`)
      set(state => ({ shas: { ...state.shas, [id]: sha } }))
    } catch (err) {
      // Rollback
      set(state => ({ articles: state.articles.filter(a => a.id !== id) }))
      throw err
    }
  },

  // -------------------------------------------------------------------------
  // update — optimistic patch, write to GitHub, rollback on failure
  // -------------------------------------------------------------------------
  async update(config, id, patch) {
    const prev = get().articles.find(a => a.id === id)
    if (!prev) return

    const updated: Article = { ...prev, ...patch, id, updatedAt: now() }

    // Optimistic update
    set(state => ({
      articles: state.articles.map(a => (a.id === id ? updated : a)),
    }))

    try {
      const sha = get().shas[id] ?? null
      const newSha = await writeFile(config, articlePath(id), updated, sha, `update article ${id}`)
      set(state => ({ shas: { ...state.shas, [id]: newSha } }))
    } catch (err) {
      // Rollback
      set(state => ({
        articles: state.articles.map(a => (a.id === id ? prev : a)),
      }))
      throw err
    }
  },

  // -------------------------------------------------------------------------
  // remove — optimistic delete, write to GitHub, rollback on failure
  // -------------------------------------------------------------------------
  async remove(config, id) {
    const prev = get().articles.find(a => a.id === id)
    const prevSha = get().shas[id]
    if (!prev || !prevSha) return

    // Optimistic update
    set(state => ({
      articles: state.articles.filter(a => a.id !== id),
      shas: Object.fromEntries(Object.entries(state.shas).filter(([k]) => k !== id)),
    }))

    try {
      await deleteFile(config, articlePath(id), prevSha, `delete article ${id}`)
    } catch (err) {
      // Rollback — only restore if it was a non-404 error
      if (!(err instanceof GitHubError && err.status === 404)) {
        set(state => ({
          articles: [...state.articles, prev],
          shas: { ...state.shas, [id]: prevSha },
        }))
      }
      throw err
    }
  },
}))
