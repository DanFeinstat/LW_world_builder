// src/components/articles/ArticlesPanel.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useArticleStore } from '@/stores/useArticleStore'
import { ArticleList } from './ArticleList'
import { ArticleDetail } from './ArticleDetail'
import { ArticleEditor } from './ArticleEditor'
import { NotFound } from '@/components/shared/NotFound/NotFound'
import { Modal } from '@/components/shared/Modal/Modal'
import type { Article } from './types'

export function ArticlesPanel() {
  const { articleId } = useParams<{ articleId?: string }>()
  const navigate = useNavigate()

  const articles = useArticleStore(state => state.articles)
  const loading = useArticleStore(state => state.loading)

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | undefined>(undefined)

  const selectedArticle = articleId ? (articles.find(a => a.id === articleId) ?? null) : null
  // Only show 404 once articles have loaded — avoids a flash during initial fetch
  const articleNotFound = !!articleId && !loading && selectedArticle === null

  function handleSelect(article: Article) {
    navigate(`/articles/${article.id}`)
    setEditingArticle(undefined)
  }

  function handleNew() {
    setEditingArticle(undefined)
    setIsEditorOpen(true)
  }

  function handleEdit(article: Article) {
    setEditingArticle(article)
    setIsEditorOpen(true)
  }

  function handleSaved(article: Article) {
    navigate(`/articles/${article.id}`)
    setIsEditorOpen(false)
    setEditingArticle(undefined)
  }

  function handleCancel() {
    setIsEditorOpen(false)
    setEditingArticle(undefined)
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Article list — fixed width left column */}
      <div className="w-72 shrink-0 border-r border-border overflow-hidden flex flex-col">
        <ArticleList
          selectedId={articleId ?? null}
          onSelect={handleSelect}
          onNew={handleNew}
        />
      </div>

      {/* Right panel — detail, 404, or empty state */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {articleNotFound ? (
          <NotFound message="Article not found." />
        ) : selectedArticle ? (
          <ArticleDetail
            article={selectedArticle}
            allArticles={articles}
            onBack={() => navigate('/articles')}
            onEdit={handleEdit}
            onNavigateTo={handleSelect}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted">Select an article to view it.</p>
          </div>
        )}
      </div>

      {/* Editor modal — renders into document.body via Radix Portal */}
      <Modal
        isOpen={isEditorOpen}
        onClose={handleCancel}
        title={editingArticle ? `Edit ${editingArticle.title}` : 'New Article'}
        size="lg"
      >
        <ArticleEditor
          article={editingArticle}
          allArticles={articles}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      </Modal>
    </div>
  )
}
