import { generateId } from '@/lib/ids'

describe('generateId', () => {
  it('returns a string prefixed with the given prefix and an underscore', () => {
    const id = generateId('art')
    expect(id).toMatch(/^art_/)
  })

  it('returns a unique value on each call', () => {
    const a = generateId('art')
    const b = generateId('art')
    expect(a).not.toBe(b)
  })
})
