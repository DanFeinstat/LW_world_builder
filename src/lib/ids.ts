type IdPrefix = 'art' | 'usr' | 'ses' | 'jrn' | 'evt'

export function generateId(prefix: IdPrefix): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
}
