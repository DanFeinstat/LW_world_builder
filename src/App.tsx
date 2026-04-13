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
import type { Article } from '@/types'

type View = 'articles'
type PanelMode = 'detail' | 'editor' | 'none'

function ArticlesPanel() {
  const articles = useArticleStore(state => state.articles)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<PanelMode>('none')
  const [editingArticle, setEditingArticle] = useState<Article | undefined>(undefined)

  const selectedArticle = articles.find(a => a.id === selectedId) ?? null

  function handleSelect(article: Article) {
    setSelectedId(article.id)
    setMode('detail')
    setEditingArticle(undefined)
  }

  function handleNew() {
    setEditingArticle(undefined)
    setMode('editor')
    setSelectedId(null)
  }

  function handleEdit(article: Article) {
    setEditingArticle(article)
    setMode('editor')
  }

  function handleBack() {
    setMode('none')
    setSelectedId(null)
    setEditingArticle(undefined)
  }

  function handleSaved(article: Article) {
    setSelectedId(article.id)
    setMode('detail')
    setEditingArticle(undefined)
  }

  function handleCancel() {
    if (editingArticle) {
      // Was editing existing — go back to detail
      setMode('detail')
      setEditingArticle(undefined)
    } else {
      // Was creating new — go back to empty state
      setMode('none')
      setSelectedId(null)
    }
  }

  function handleNavigateTo(article: Article) {
    setSelectedId(article.id)
    setMode('detail')
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

      {/* Right panel — detail or editor */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {mode === 'detail' && selectedArticle && (
          <ArticleDetail
            article={selectedArticle}
            allArticles={articles}
            onBack={handleBack}
            onEdit={handleEdit}
            onNavigateTo={handleNavigateTo}
          />
        )}
        {mode === 'editor' && (
          <ArticleEditor
            article={editingArticle}
            allArticles={articles}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        )}
        {mode === 'none' && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted">Select an article to view it.</p>
          </div>
        )}
      </div>
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
