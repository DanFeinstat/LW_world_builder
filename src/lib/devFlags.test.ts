import { describe, it, expect, beforeEach } from 'vitest'
import { devFlag, setDevFlag, readDevFlags } from './devFlags'

describe('devFlags', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('devFlag returns false when flag is not set', () => {
    expect(devFlag('polling')).toBe(false)
  })

  it('devFlag returns true after setDevFlag(name, true)', () => {
    setDevFlag('polling', true)
    expect(devFlag('polling')).toBe(true)
  })

  it('devFlag returns false after setDevFlag(name, false)', () => {
    setDevFlag('polling', true)
    setDevFlag('polling', false)
    expect(devFlag('polling')).toBe(false)
  })

  it('readDevFlags returns empty object when nothing is stored', () => {
    expect(readDevFlags()).toEqual({})
  })

  it('readDevFlags returns all stored flags', () => {
    setDevFlag('polling', true)
    setDevFlag('offline', true)
    expect(readDevFlags()).toEqual({ polling: true, offline: true })
  })

  it('readDevFlags returns empty object when localStorage contains invalid JSON', () => {
    localStorage.setItem('dev-flags', 'not-json{{{')
    expect(readDevFlags()).toEqual({})
  })
})
