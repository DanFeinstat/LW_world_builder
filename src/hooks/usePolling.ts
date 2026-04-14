import { useEffect, useRef } from 'react'
import type { GitHubConfig, ConnectionStatus } from '@/types'
import { pollCommit } from '@/lib/github'
import { useArticleStore } from '@/stores/useArticleStore'
import { useToast } from '@/components/shared/Toast/useToast'
import { devFlag } from '@/lib/devFlags'

const POLL_INTERVAL_MS = 30_000

export function usePolling(
  config: GitHubConfig | null,
  setConnectionStatus: (status: ConnectionStatus) => void,
): void {
  const lastShaRef = useRef<string | null>(null)
  const wasDisconnectedRef = useRef(false)

  useEffect(() => {
    if (!config) return

    async function poll() {
      if (!config) return
      if (!devFlag('polling')) return
      if (devFlag('offline')) return

      try {
        const sha = await pollCommit(config, 'main')

        // Recovery
        if (wasDisconnectedRef.current) {
          wasDisconnectedRef.current = false
          setConnectionStatus('connected')
          useToast.getState().showToast('Reconnected.', 'success')
        }

        // Re-fetch articles if SHA changed since last poll
        if (lastShaRef.current !== null && sha !== lastShaRef.current) {
          await useArticleStore.getState().fetchAll(config)
          useToast.getState().showToast('Articles updated from remote.', 'info')
        }

        lastShaRef.current = sha
      } catch {
        wasDisconnectedRef.current = true
        setConnectionStatus('disconnected')
      }
    }

    // Poll immediately on mount (captures initial SHA)
    poll()

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        poll()
      }
    }, POLL_INTERVAL_MS)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        poll()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [config, setConnectionStatus])
}
