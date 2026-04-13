import { useState } from 'react'
import clsx from 'clsx'
import { listTree, readFile, writeFile } from '@/lib/github'
import { generateId } from '@/lib/ids'
import { useAppContext } from '@/context/AppContext'
import { useToast } from '@/components/shared/Toast/useToast'
import type { User, CampaignMeta } from '@/types'

export function LoginScreen() {
  const { githubConfig, setCampaignMeta, setCurrentUser } = useAppContext()
  const showToast = useToast(state => state.showToast)

  const [name, setName] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!githubConfig) return
    setStatus('loading')
    setErrorMsg('')

    const trimmedName = name.trim()
    const trimmedPass = passphrase.trim()

    try {
      // Fetch all existing users
      const tree = await listTree(githubConfig)
      const userPaths = tree
        .filter(item => item.path.startsWith('data/users/') && item.path.endsWith('.json'))
        .map(item => item.path)

      const users = await Promise.all(
        userPaths.map(path => readFile<User>(githubConfig, path).then(f => f.data)),
      )

      // Also fetch campaign meta to keep context in sync
      try {
        const metaFile = await readFile<CampaignMeta>(githubConfig, 'data/meta.json')
        setCampaignMeta(metaFile.data)
      } catch {
        // meta already set from SetupScreen — ignore
      }

      // Try to find existing user
      const existing = users.find(
        u => u.name.toLowerCase() === trimmedName.toLowerCase() && u.passphrase === trimmedPass,
      )

      if (existing) {
        setCurrentUser(existing)
        showToast(`Welcome back, ${existing.name}!`, 'success')
        return
      }

      // Wrong passphrase for a known name
      const nameExists = users.some(u => u.name.toLowerCase() === trimmedName.toLowerCase())
      if (nameExists) {
        setErrorMsg('Incorrect passphrase.')
        setStatus('error')
        return
      }

      // New user — create them
      const isFirstUser = users.length === 0
      const newUser: User = {
        id: generateId('usr'),
        name: trimmedName,
        passphrase: trimmedPass,
        role: isFirstUser ? 'dm' : 'player',
        color: randomColor(),
        createdAt: new Date().toISOString(),
      }

      await writeFile(
        githubConfig,
        `data/users/${newUser.id}.json`,
        newUser,
        null,
        `add user ${newUser.id}`,
      )

      setCurrentUser(newUser)
      showToast(
        isFirstUser
          ? `Welcome, ${newUser.name}! You're the first user — you've been made DM.`
          : `Welcome, ${newUser.name}!`,
        'success',
      )
    } catch {
      setErrorMsg('Something went wrong. Check your connection and try again.')
      setStatus('error')
    }
  }

  const isLoading = status === 'loading'

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-2xl font-semibold text-text-primary mb-2">
            Who are you?
          </h1>
          <p className="text-sm text-text-secondary">
            Enter your name and passphrase to continue.
            <br />
            New to this campaign? Just pick a name and passphrase.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-raised border border-border rounded-lg p-8 shadow-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-text-primary">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Aria"
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="passphrase" className="text-sm font-medium text-text-primary">
                Passphrase
              </label>
              <input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                placeholder="sunforge"
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-danger bg-danger-subtle border border-danger rounded-md px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !name || !passphrase}
              className={clsx(
                'w-full py-2 px-4 rounded-md text-sm font-semibold text-white transition-colors duration-fast',
                'bg-dm hover:bg-dm-hover disabled:opacity-45 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dm focus-visible:ring-offset-2',
              )}
            >
              {isLoading ? 'Entering…' : 'Enter Campaign'}
            </button>
          </form>
        </div>
      </div>
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

const COLORS = [
  '#7F77DD', '#1D9E75', '#D85A30', '#378ADD', '#BA7517',
  '#9B59B6', '#E74C3C', '#2ECC71', '#3498DB', '#F39C12',
]

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}
