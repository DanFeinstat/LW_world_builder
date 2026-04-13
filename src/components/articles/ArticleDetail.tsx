import { useState } from 'react'
import clsx from 'clsx'
import { useArticleStore } from '@/stores/useArticleStore'
import { useAppContext } from '@/context/AppContext'
import { useToast } from '@/components/shared/Toast/useToast'
import { ArticleTypeBadge } from './ArticleTypeBadge'
import type { Article } from './types'

interface ArticleDetailProps {
  article: Article
  allArticles: Article[]
  onBack: () => void
  onEdit: (article: Article) => void
  onNavigateTo: (article: Article) => void
}

export function ArticleDetail({ article, allArticles, onBack, onEdit, onNavigateTo }: ArticleDetailProps) {
  const { githubConfig, currentUser, connectionStatus } = useAppContext()
  const showToast = useToast(state => state.showToast)
  const remove = useArticleStore(state => state.remove)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isDM = currentUser?.role === 'dm'
  const canPlayerEdit =
    currentUser?.role === 'player' &&
    article.visibility === 'shared' &&
    article.interactable

  const linkedArticles = allArticles.filter(a => article.links.includes(a.id))

  function handleEdit() {
    if (connectionStatus === 'disconnected') {
      showToast('Cannot edit while disconnected.', 'error')
      return
    }
    onEdit(article)
  }

  async function handleDelete() {
    if (!githubConfig) return
    if (connectionStatus === 'disconnected') {
      showToast('Cannot delete while disconnected.', 'error')
      return
    }
    setDeleting(true)
    try {
      await remove(githubConfig, article.id)
      showToast('Article deleted.', 'success')
      onBack()
    } catch {
      showToast('Failed to delete article.', 'error')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start gap-3 px-6 py-4 border-b border-border">
        <button
          onClick={onBack}
          className="shrink-0 text-sm text-text-muted hover:text-text-primary transition-colors duration-fast mt-0.5"
          aria-label="Back to article list"
        >
          ← Back
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-semibold text-text-primary leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <ArticleTypeBadge type={article.articleType} />
            {article.visibility === 'dm_only' && (
              <span className="text-xs text-text-muted">🔒 DM only</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {(isDM || canPlayerEdit) && (
            <button
              onClick={handleEdit}
              className="text-sm px-3 py-1.5 rounded-md border border-border text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors duration-fast"
            >
              Edit
            </button>
          )}
          {isDM && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm px-3 py-1.5 rounded-md text-danger hover:bg-danger-subtle border border-transparent hover:border-danger transition-colors duration-fast"
            >
              Delete
            </button>
          )}
          {isDM && confirmDelete && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm px-3 py-1.5 rounded-md bg-danger text-white hover:opacity-90 disabled:opacity-50 transition-opacity duration-fast"
              >
                {deleting ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm px-3 py-1.5 rounded-md border border-border text-text-secondary hover:border-border-strong transition-colors duration-fast"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-5">
        {article.body ? (
          <div
            className={clsx('prose whitespace-pre-wrap', !article.body && 'text-text-muted italic')}
          >
            {article.body}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">No content yet.</p>
        )}
      </div>

      {/* Footer — tags + links */}
      {(article.tags.length > 0 || linkedArticles.length > 0) && (
        <div className="px-6 py-4 border-t border-border flex flex-col gap-4">
          {article.tags.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Tags</p>
              <div className="flex flex-wrap gap-1">
                {article.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-surface-sunken border border-border text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {linkedArticles.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Linked Articles</p>
              <div className="flex flex-wrap gap-2">
                {linkedArticles.map(linked => (
                  <button
                    key={linked.id}
                    onClick={() => onNavigateTo(linked)}
                    className="text-xs px-3 py-1 rounded-full bg-dm-subtle text-dm border border-dm/30 hover:border-dm transition-colors duration-fast font-medium"
                  >
                    {linked.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
