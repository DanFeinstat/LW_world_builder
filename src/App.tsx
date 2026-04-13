import { useState } from 'react'
import { AppProvider, useAppContext } from '@/context/AppContext'
import { SetupScreen } from '@/components/setup/SetupScreen'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { AppShell } from '@/components/layout/AppShell'
import { ToastStack } from '@/components/shared/Toast/Toast'
import { ArticleList } from '@/components/articles/ArticleList'
import { ArticleDetail } from '@/components/articles/ArticleDetail'
import { ArticleEditor } from '@/components/articles/ArticleEditor'
import { useArticleStore } from '@/stores/useArticleStore'
import type { Article } from '@/components/articles/types'
import { Modal } from '@/components/shared/Modal/Modal'

type View = 'articles'

function ArticlesPanel() {
  const articles = useArticleStore(state => state.articles)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | undefined>(undefined)

  const selectedArticle = articles.find(a => a.id === selectedId) ?? null

  function handleSelect(article: Article) {
    setSelectedId(article.id)
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
    setSelectedId(article.id)
    setIsEditorOpen(false)
    setEditingArticle(undefined)
  }

  function handleCancel() {
    setIsEditorOpen(false)
    setEditingArticle(undefined)
  }

  function handleNavigateTo(article: Article) {
    setSelectedId(article.id)
    setEditingArticle(undefined)
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Article list — fixed width left column */}
      <div className="w-72 shrink-0 border-r border-border overflow-hidden flex flex-col">
        <ArticleList
          selectedId={selectedId}
          onSelect={handleSelect}
          onNew={handleNew}
        />
      </div>

      {/* Right panel — detail or empty state; editor is now in a modal */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {selectedArticle ? (
          <ArticleDetail
            article={selectedArticle}
            allArticles={articles}
            onBack={() => setSelectedId(null)}
            onEdit={handleEdit}
            onNavigateTo={handleNavigateTo}
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

function AppRoutes() {
  const { githubConfig, currentUser } = useAppContext()
  const [currentView, setCurrentView] = useState<View>('articles')

  if (!githubConfig) return <SetupScreen />
  if (!currentUser) return <LoginScreen />

  return (
    <AppShell currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'articles' && <ArticlesPanel />}
    </AppShell>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
      <ToastStack />
    </AppProvider>
  )
}
