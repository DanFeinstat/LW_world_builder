import clsx from 'clsx'
import type { Article } from '@/types'
import { ArticleTypeBadge } from './ArticleTypeBadge'

interface ArticleCardProps {
  article: Article
  selected: boolean
  onSelect: (article: Article) => void
}

export function ArticleCard({ article, selected, onSelect }: ArticleCardProps) {
  return (
    <button
      onClick={() => onSelect(article)}
      className={clsx(
        'w-full text-left flex flex-col gap-2 px-4 py-3 rounded-lg border transition-colors duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dm focus-visible:ring-offset-1',
        selected
          ? 'bg-dm-subtle border-dm'
          : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised',
      )}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-text-primary leading-tight line-clamp-2">
          {article.title}
        </span>
        {article.visibility === 'dm_only' && (
          <span className="shrink-0 text-xs text-text-muted" title="DM only">🔒</span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <ArticleTypeBadge type={article.articleType} />
        {article.tags.length > 0 && (
          <span className="text-xs text-text-muted">
            {article.tags.length} {article.tags.length === 1 ? 'tag' : 'tags'}
          </span>
        )}
        {article.links.length > 0 && (
          <span className="text-xs text-text-muted">
            {article.links.length} {article.links.length === 1 ? 'link' : 'links'}
          </span>
        )}
      </div>
    </button>
  )
}
