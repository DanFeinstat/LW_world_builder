import { getStoredTheme, setStoredTheme, applyTheme } from '@/lib/theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('setStoredTheme / getStoredTheme', () => {
    it('stores and retrieves the theme preference', () => {
      setStoredTheme('dark')
      expect(getStoredTheme()).toBe('dark')
    })

    it('returns "system" when localStorage is empty', () => {
      expect(getStoredTheme()).toBe('system')
    })
  })

  describe('applyTheme', () => {
    it('sets data-theme on document.documentElement', () => {
      applyTheme('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('updates data-theme when called again with a different value', () => {
      applyTheme('light')
      applyTheme('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })
})
