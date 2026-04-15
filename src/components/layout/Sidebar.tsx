// src/components/layout/Sidebar.tsx
import { Link, useLocation } from 'react-router'
import clsx from 'clsx'
import { useAppContext } from '@/context/AppContext'
import type { ThemePreference } from '@/types'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

const NAV_ITEMS: { path: string; label: string; icon: string }[] = [
  { path: '/articles', label: 'Articles', icon: '📖' },
  { path: '/sessions', label: 'Sessions', icon: '🗓' },
  { path: '/journals', label: 'Journals', icon: '📔' },
  { path: '/timeline', label: 'Timeline', icon: '⏳' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { currentUser, campaignMeta, theme, setTheme, setCurrentUser } = useAppContext()
  const location = useLocation()

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-surface-raised border-r border-border',
        'transition-[width] duration-base overflow-hidden shrink-0',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      {/* Campaign header */}
      <div className={clsx(
        'flex items-center gap-2 px-3 py-4 border-b border-border min-h-[60px]',
        collapsed && 'justify-center',
      )}>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-semibold text-text-primary truncate">
              {campaignMeta?.campaignName ?? 'Campaign'}
            </p>
            {campaignMeta?.currentDate && (
              <p className="text-xs text-text-muted truncate">{campaignMeta.currentDate}</p>
            )}
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="shrink-0 text-text-muted hover:text-text-primary transition-colors duration-fast p-1 rounded-md hover:bg-surface-sunken"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ path, label, icon }) => (
          <Link
            key={path}
            to={path}
            aria-current={isActive(path) ? 'page' : undefined}
            className={clsx(
              'flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium w-full',
              'transition-colors duration-fast',
              isActive(path)
                ? 'bg-dm-subtle text-dm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-sunken',
              collapsed && 'justify-center',
            )}
          >
            <span className="text-base leading-none shrink-0">{icon}</span>
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer — theme + user */}
      <div className="border-t border-border px-2 py-3 flex flex-col gap-2">
        {!collapsed && (
          <div className="flex items-center gap-1 px-2">
            {THEME_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={clsx(
                  'flex-1 text-xs py-1 rounded-md transition-colors duration-fast',
                  theme === value
                    ? 'bg-dm text-white font-semibold'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-sunken',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {currentUser && (
          <div
            className={clsx(
              'flex items-center gap-2 px-2 py-1 rounded-md',
              collapsed && 'justify-center',
            )}
          >
            <span
              className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: currentUser.color }}
              title={currentUser.name}
            >
              {currentUser.name[0].toUpperCase()}
            </span>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{currentUser.name}</p>
                <p className="text-xs text-text-muted capitalize">{currentUser.role}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => setCurrentUser(null)}
                aria-label="Sign out"
                title="Sign out"
                className="text-text-muted hover:text-danger transition-colors duration-fast text-xs"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
