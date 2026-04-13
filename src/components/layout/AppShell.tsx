import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { ConnectionBanner } from './ConnectionBanner'

type View = 'articles'

interface AppShellProps {
  children: React.ReactNode
  currentView: View
  onNavigate: (view: View) => void
}

export function AppShell({ children, currentView, onNavigate }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      {/* Connection banner spans full width above everything */}
      <ConnectionBanner />

      {/* Main layout: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        <Sidebar
          currentView={currentView}
          onNavigate={onNavigate}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />

        {/* Main content area — scrollable, flexible width */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
