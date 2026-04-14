const DEV_FLAGS_KEY = 'dev-flags'

export function readDevFlags(): Record<string, boolean> {
  if (!import.meta.env.DEV) return {}
  try {
    const stored = localStorage.getItem(DEV_FLAGS_KEY)
    return stored ? (JSON.parse(stored) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

export function setDevFlag(name: string, value: boolean): void {
  if (!import.meta.env.DEV) return
  const current = readDevFlags()
  localStorage.setItem(DEV_FLAGS_KEY, JSON.stringify({ ...current, [name]: value }))
}

export function devFlag(name: string): boolean {
  return readDevFlags()[name] === true
}
