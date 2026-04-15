import { useState } from 'react'
import clsx from 'clsx'
import { listTree, writeFile, GitHubError } from '@/lib/github'
import { readFile } from '@/lib/github'
import { useAppContext } from '@/context/AppContext'
import type { GitHubConfig, CampaignMeta } from '@/types'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { SetupGuideModal } from './SetupGuideModal'

const DEFAULT_OWNER = import.meta.env.VITE_GITHUB_OWNER ?? ''
const DEFAULT_REPO = import.meta.env.VITE_GITHUB_REPO ?? ''

const PatTooltipContent = (
  <ol className="flex flex-col gap-2 list-decimal list-inside leading-base">
    <li>GitHub → Settings → Developer Settings → Personal access tokens → Fine-grained tokens</li>
    <li>Click "Generate new token"</li>
    <li>Repository access: select only the shared campaign repo</li>
    <li>Permissions → Contents: Read and Write</li>
    <li>Generate, copy, and paste it here</li>
  </ol>
)

export function SetupScreen() {
  const { setGithubConfig, setCampaignMeta } = useAppContext()

  const [owner, setOwner] = useState(DEFAULT_OWNER)
  const [repo, setRepo] = useState(DEFAULT_REPO)
  const [pat, setPat] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const config: GitHubConfig = { owner: owner.trim(), repo: repo.trim(), pat: pat.trim() }

    try {
      // Validate config by fetching the tree
      await listTree(config)

      // Bootstrap data/meta.json if it doesn't exist yet
      let meta: CampaignMeta
      try {
        const stored = await readFile<CampaignMeta>(config, 'data/meta.json')
        meta = stored.data
      } catch (err) {
        if (err instanceof GitHubError && err.status === 404) {
          meta = { campaignName: 'My Campaign', currentDate: 'Day 1' }
          await writeFile(config, 'data/meta.json', meta, null, 'initialize campaign data')
        } else {
          throw err
        }
      }

      setGithubConfig(config)
      setCampaignMeta(meta)
    } catch (err) {
      const msg =
        err instanceof GitHubError
          ? `GitHub error ${err.status}: check your owner, repo, and PAT.`
          : 'Could not reach GitHub. Check your network and try again.'
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  const isLoading = status === 'loading'

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-2xl font-semibold text-text-primary mb-2">
            Campaign Manager
          </h1>
          <p className="text-sm text-text-secondary">
            Connect your GitHub data repository to get started.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-raised border border-border rounded-lg p-8 shadow-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="GitHub Owner" htmlFor="owner">
              <input
                id="owner"
                type="text"
                value={owner}
                onChange={e => setOwner(e.target.value)}
                placeholder="your-username"
                required
                disabled={isLoading}
                className={inputClass}
              />
            </Field>

            <Field label="Repository Name" htmlFor="repo">
              <input
                id="repo"
                type="text"
                value={repo}
                onChange={e => setRepo(e.target.value)}
                placeholder="campaign-data"
                required
                disabled={isLoading}
                className={inputClass}
              />
            </Field>

            <Field
              label="Personal Access Token"
              htmlFor="pat"
              hint="Stored locally in your browser only."
              tooltip={PatTooltipContent}
            >
              <input
                id="pat"
                type="password"
                value={pat}
                onChange={e => setPat(e.target.value)}
                placeholder="ghp_••••••••••••••••"
                required
                disabled={isLoading}
                className={inputClass}
              />
            </Field>

            {status === 'error' && (
              <p className="text-sm text-danger bg-danger-subtle border border-danger rounded-md px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !owner || !repo || !pat}
              className={clsx(
                'w-full py-2 px-4 rounded-md text-sm font-semibold text-white transition-colors duration-fast',
                'bg-dm hover:bg-dm-hover disabled:opacity-45 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dm focus-visible:ring-offset-2',
              )}
            >
              {isLoading ? 'Connecting…' : 'Connect Repository'}
            </button>

            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-fast text-center"
            >
              Need help setting up?
            </button>
          </form>
        </div>
      </div>

      <SetupGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputClass = clsx(
  'block w-full text-sm text-text-primary bg-surface border border-border rounded-md',
  'px-3 py-2 leading-base placeholder:text-text-muted',
  'transition-colors duration-fast',
  'focus:outline-none focus:border-dm focus:ring-2 focus:ring-dm/20',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-sunken',
)

function Field({
  label,
  htmlFor,
  hint,
  tooltip,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  tooltip?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
          {label}
        </label>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      {children}
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
