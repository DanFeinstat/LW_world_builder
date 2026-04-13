import { useState } from 'react'
import clsx from 'clsx'
import { useArticleStore } from '@/stores/useArticleStore'
import { useAppContext } from '@/context/AppContext'
import { useToast } from '@/components/shared/Toast/useToast'
import type { Article, ArticleType } from './types'
import type { Visibility } from '@/types'

const ARTICLE_TYPES: ArticleType[] = ['npc', 'location', 'faction', 'lore', 'quest']

interface ArticleEditorProps {
  article?: Article        // undefined = create mode
  allArticles: Article[]   // for cross-link multi-select
  onSaved: (article: Article) => void
  onCancel: () => void
}

export function ArticleEditor({ article, allArticles, onSaved, onCancel }: ArticleEditorProps) {
  const { githubConfig, currentUser, connectionStatus } = useAppContext()
  const showToast = useToast(state => state.showToast)
  const add = useArticleStore(state => state.add)
  const update = useArticleStore(state => state.update)
  const articles = useArticleStore(state => state.articles)

  const isEdit = !!article
  const isPlayerEdit = currentUser?.role === 'player'

  const [title, setTitle] = useState(article?.title ?? '')
  const [articleType, setArticleType] = useState<ArticleType>(article?.articleType ?? 'npc')
  const [visibility, setVisibility] = useState<Visibility>(article?.visibility ?? 'dm_only')
  const [interactable, setInteractable] = useState(article?.interactable ?? false)
  const [body, setBody] = useState(article?.body ?? '')
  const [tagsRaw, setTagsRaw] = useState(article?.tags.join(', ') ?? '')
  const [links, setLinks] = useState<string[]>(article?.links ?? [])
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!githubConfig || !currentUser) return
    if (connectionStatus === 'disconnected') {
      showToast('Cannot save while disconnected.', 'error')
      return
    }

    const tags = tagsRaw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    setSaving(true)
    try {
      if (isEdit && article) {
        // Players can only edit body when interactable
        const patch = isPlayerEdit
          ? { body }
          : { title, articleType, visibility, interactable: visibility === 'shared' ? interactable : false, body, tags, links }
        await update(githubConfig, article.id, patch)
        const updated = { ...article, ...patch }
        showToast('Article saved.', 'success')
        onSaved(updated)
      } else {
        const draft = {
          title,
          articleType,
          body,
          tags,
          visibility,
          interactable: visibility === 'shared' ? interactable : false,
          links,
          createdBy: currentUser.id,
        }
        await add(githubConfig, draft)
        const created = articles.find(a => a.title === title && a.createdBy === currentUser.id)
        showToast('Article created.', 'success')
        onSaved(created ?? { ...draft, id: '', createdAt: '', updatedAt: '' } as Article)
      }
    } catch {
      showToast(isEdit ? 'Failed to save article.' : 'Failed to create article.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function toggleLink(id: string) {
    setLinks(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id])
  }

  const linkCandidates = allArticles.filter(a => a.id !== article?.id)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 h-full overflow-y-auto px-6 py-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {isEdit ? (isPlayerEdit ? 'Edit Article' : 'Edit Article') : 'New Article'}
        </h2>
        <button type="button" onClick={onCancel} className="text-sm text-text-muted hover:text-text-primary transition-colors duration-fast">
          Cancel
        </button>
      </div>

      {/* Title — hidden for player body-only edits */}
      {!isPlayerEdit && (
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Thorin Ironback"
            required
            className={inputClass}
          />
        </Field>
      )}

      {/* Type + Visibility row — DM only */}
      {!isPlayerEdit && (
        <div className="flex gap-4">
          <Field label="Type" className="flex-1">
            <select
              value={articleType}
              onChange={e => setArticleType(e.target.value as ArticleType)}
              className={inputClass}
            >
              {ARTICLE_TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Visibility" className="flex-1">
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value as Visibility)}
              className={inputClass}
            >
              <option value="dm_only">DM Only</option>
              <option value="shared">Shared</option>
            </select>
          </Field>
        </div>
      )}

      {/* Interactable — DM only, only when shared */}
      {!isPlayerEdit && visibility === 'shared' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={interactable}
            onChange={e => setInteractable(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-dm"
          />
          <span className="text-sm text-text-primary">Players can edit body</span>
        </label>
      )}

      {/* Body */}
      <Field label="Body">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write article content here…"
          rows={8}
          className={clsx(inputClass, 'resize-y font-body leading-loose')}
        />
      </Field>

      {/* Tags — DM only */}
      {!isPlayerEdit && (
        <Field label="Tags" hint="Comma-separated — dwarf, merchant, friendly">
          <input
            type="text"
            value={tagsRaw}
            onChange={e => setTagsRaw(e.target.value)}
            placeholder="dwarf, merchant, friendly"
            className={inputClass}
          />
        </Field>
      )}

      {/* Cross-links — DM only */}
      {!isPlayerEdit && linkCandidates.length > 0 && (
        <Field label="Linked Articles">
          <div className="flex flex-wrap gap-2 p-2 border border-border rounded-md bg-surface min-h-[44px]">
            {linkCandidates.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleLink(a.id)}
                className={clsx(
                  'text-xs px-2 py-1 rounded-full border transition-colors duration-fast',
                  links.includes(a.id)
                    ? 'bg-dm-subtle border-dm text-dm font-semibold'
                    : 'border-border text-text-secondary hover:border-border-strong',
                )}
              >
                {a.title}
              </button>
            ))}
          </div>
        </Field>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || (!isPlayerEdit && !title)}
          className={clsx(
            'flex-1 py-2 rounded-md text-sm font-semibold text-white transition-colors duration-fast',
            'bg-dm hover:bg-dm-hover disabled:opacity-45 disabled:cursor-not-allowed',
          )}
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Article'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm font-medium border border-border text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors duration-fast"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputClass = clsx(
  'block w-full text-sm text-text-primary bg-surface border border-border rounded-md',
  'px-3 py-2 leading-base placeholder:text-text-muted',
  'focus:outline-none focus:border-dm focus:ring-2 focus:ring-dm/20',
  'transition-colors duration-fast',
)

function Field({
  label, hint, children, className,
}: {
  label: string; hint?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <label className="text-sm font-medium text-text-primary">{label}</label>
      {children}
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
