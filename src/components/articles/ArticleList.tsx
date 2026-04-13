import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useArticleStore } from '@/stores/useArticleStore'
import { useAppContext } from '@/context/AppContext'
import { useToast } from '@/components/shared/Toast/useToast'
import { ArticleCard } from './ArticleCard'
import type { Article, ArticleType } from '@/types'

const TYPE_FILTERS: { label: string; value: ArticleType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'NPCs', value: 'npc' },
  { label: 'Locations', value: 'location' },
  { label: 'Factions', value: 'faction' },
  { label: 'Lore', value: 'lore' },
  { label: 'Quests', value: 'quest' },
]

interface ArticleListProps {
  selectedId: string | null
  onSelect: (article: Article) => void
  onNew: () => void
}

export function ArticleList({ selectedId, onSelect, onNew }: ArticleListProps) {
  const { githubConfig, currentUser, connectionStatus } = useAppContext()
  const showToast = useToast(state => state.showToast)

  const articles = useArticleStore(state => state.articles)
  const loading = useArticleStore(state => state.loading)
  const fetchAll = useArticleStore(state => state.fetchAll)

  const [typeFilter, setTypeFilter] = useState<ArticleType | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!githubConfig) return
    fetchAll(githubConfig).catch(() => {
      showToast('Failed to load articles.', 'error')
    })
  }, [githubConfig])

  const isDM = currentUser?.role === 'dm'

  const visible = articles.filter(a => {
    if (!isDM && a.visibility === 'dm_only') return false
    if (typeFilter !== 'all' && a.articleType !== typeFilter) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleNew() {
    if (connectionStatus === 'disconnected') {
      showToast('Cannot create articles while disconnected.', 'error')
      return
    }
    onNew()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <input
          type="search"
          placeholder="Search articles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={clsx(
            'flex-1 text-sm bg-surface border border-border rounded-md px-3 py-1.5',
            'placeholder:text-text-muted text-text-primary leading-base',
            'focus:outline-none focus:border-dm focus:ring-2 focus:ring-dm/20',
            'transition-colors duration-fast',
          )}
        />
        {isDM && (
          <button
            onClick={handleNew}
            className="shrink-0 text-sm font-semibold px-3 py-1.5 rounded-md bg-dm text-white hover:bg-dm-hover transition-colors duration-fast"
          >
            + New
          </button>
        )}
      </div>

      {/* Type filters */}
      <div className="flex gap-1 px-4 py-2 border-b border-border overflow-x-auto">
        {TYPE_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            className={clsx(
              'shrink-0 text-xs font-medium px-3 py-1 rounded-full transition-colors duration-fast',
              typeFilter === value
                ? 'bg-dm text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-sunken',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {loading && articles.length === 0 ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-raised px-4 py-3 flex flex-col gap-2 animate-pulse">
              <div className="h-4 w-3/4 rounded bg-surface-sunken" />
              <div className="h-3 w-1/4 rounded bg-surface-sunken" />
            </div>
          ))
        ) : visible.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-text-muted text-center">
              {search || typeFilter !== 'all'
                ? 'No articles match your filters.'
                : isDM
                  ? 'No articles yet. Create the first one.'
                  : 'No articles have been shared yet.'}
            </p>
          </div>
        ) : (
          visible.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              selected={article.id === selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
