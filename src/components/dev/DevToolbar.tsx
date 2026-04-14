import { useState } from 'react'
import { readDevFlags, setDevFlag } from '@/lib/devFlags'
import { useAppContext } from '@/context/AppContext'

interface DevFlag {
  name: string
  label: string
}

const FLAGS: DevFlag[] = [
  { name: 'polling', label: 'GitHub Polling' },
  { name: 'offline', label: 'Simulate Offline' },
]

export function DevToolbar() {
  const { setConnectionStatus } = useAppContext()
  const [open, setOpen] = useState(false)
  const [flags, setFlags] = useState<Record<string, boolean>>(() => readDevFlags())

  function toggleFlag(name: string) {
    const next = !flags[name]
    setDevFlag(name, next)
    setFlags(f => ({ ...f, [name]: next }))

    if (name === 'offline') {
      setConnectionStatus(next ? 'disconnected' : 'connected')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-toast">
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-56 bg-surface border border-border rounded-lg shadow-lg overflow-hidden"
          data-testid="dev-toolbar-panel"
        >
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              Dev Flags
            </span>
          </div>
          <ul>
            {FLAGS.map(flag => (
              <li key={flag.name}>
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-primary hover:bg-surface-raised transition-colors duration-fast"
                  onClick={() => toggleFlag(flag.name)}
                  data-testid={`dev-flag-${flag.name}`}
                >
                  <span>{flag.label}</span>
                  <span className={flags[flag.name] ? 'text-success font-semibold' : 'text-text-muted'}>
                    {flags[flag.name] ? 'ON' : 'OFF'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-1 rounded-full text-xs font-bold bg-[#f59e0b] text-black shadow-md hover:bg-[#d97706] transition-colors duration-fast"
        aria-label="Dev toolbar"
        data-testid="dev-toolbar-toggle"
      >
        DEV
      </button>
    </div>
  )
}
