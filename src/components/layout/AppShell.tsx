// src/components/layout/AppShell.tsx
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { ConnectionBanner } from './ConnectionBanner'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      {/* Connection banner spans full width above everything */}
      <ConnectionBanner />

      {/* Main layout: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />

        {/* Main content area — children manage their own scroll */}
        <main className="flex-1 overflow-hidden min-w-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
