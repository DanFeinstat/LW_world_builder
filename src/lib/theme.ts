import type { ThemePreference } from '@/types'

const STORAGE_KEY = 'theme-preference'

export function getStoredTheme(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

export function setStoredTheme(theme: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, theme)
}

export function applyTheme(theme: ThemePreference): void {
  document.documentElement.setAttribute('data-theme', theme)
}
