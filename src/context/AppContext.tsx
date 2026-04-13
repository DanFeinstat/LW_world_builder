import React, { useEffect, useState } from 'react'
import type { User, CampaignMeta, ThemePreference, ConnectionStatus, GitHubConfig } from '@/types'
import { getStoredTheme, setStoredTheme, applyTheme } from '@/lib/theme'
import { createContext } from './createContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppContextValue {
  // Auth
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Campaign
  campaignMeta: CampaignMeta | null
  setCampaignMeta: (meta: CampaignMeta) => void

  // Theme
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void

  // Connection
  connectionStatus: ConnectionStatus
  setConnectionStatus: (status: ConnectionStatus) => void

  // GitHub config (persisted to localStorage)
  githubConfig: GitHubConfig | null
  setGithubConfig: (config: GitHubConfig) => void
}

// ---------------------------------------------------------------------------
// Context + hook
// ---------------------------------------------------------------------------

const [AppContext, useAppContext] = createContext<AppContextValue>('AppContext')
export { useAppContext }

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const GITHUB_CONFIG_KEY = 'github-config'

function loadGithubConfig(): GitHubConfig | null {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GitHubConfig
  } catch {
    return null
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [campaignMeta, setCampaignMeta] = useState<CampaignMeta | null>(null)
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredTheme())
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected')
  const [githubConfig, setGithubConfigState] = useState<GitHubConfig | null>(
    () => loadGithubConfig(),
  )

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function setTheme(newTheme: ThemePreference) {
    setStoredTheme(newTheme)
    applyTheme(newTheme)
    setThemeState(newTheme)
  }

  function setGithubConfig(config: GitHubConfig) {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config))
    setGithubConfigState(config)
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        campaignMeta,
        setCampaignMeta,
        theme,
        setTheme,
        connectionStatus,
        setConnectionStatus,
        githubConfig,
        setGithubConfig,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
