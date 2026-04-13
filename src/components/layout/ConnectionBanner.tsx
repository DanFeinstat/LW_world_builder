import { listTree } from '@/lib/github'
import { useAppContext } from '@/context/AppContext'
import { useToast } from '@/components/shared/Toast/useToast'

export function ConnectionBanner() {
  const { connectionStatus, setConnectionStatus, githubConfig } = useAppContext()
  const showToast = useToast(state => state.showToast)

  if (connectionStatus === 'connected') return null

  async function handleRetry() {
    if (!githubConfig) return
    try {
      await listTree(githubConfig)
      setConnectionStatus('connected')
      showToast('Reconnected.', 'success')
    } catch {
      showToast('Still unable to connect. Try again in a moment.', 'error')
    }
  }

  return (
    <div className="bg-warning-subtle border-b border-warning px-4 py-2 flex items-center justify-between gap-4 text-sm text-warning">
      <span>
        Connection lost — showing cached data (read-only).
      </span>
      <button
        onClick={handleRetry}
        className="shrink-0 font-semibold underline hover:no-underline transition-all duration-fast"
      >
        Retry
      </button>
    </div>
  )
}
