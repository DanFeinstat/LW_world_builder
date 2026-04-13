import type { ArticleType } from '@/types'

const TYPE_LABELS: Record<ArticleType, string> = {
  npc: 'NPC',
  location: 'Location',
  faction: 'Faction',
  lore: 'Lore',
  quest: 'Quest',
}

const TYPE_COLORS: Record<ArticleType, string> = {
  npc: 'var(--color-npc)',
  location: 'var(--color-location)',
  faction: 'var(--color-faction)',
  lore: 'var(--color-lore)',
  quest: 'var(--color-quest)',
}

interface ArticleTypeBadgeProps {
  type: ArticleType
}

export function ArticleTypeBadge({ type }: ArticleTypeBadgeProps) {
  const color = TYPE_COLORS[type]
  return (
    <span
      className="inline-flex items-center px-2 py-px rounded-full text-xs font-semibold uppercase tracking-wide leading-none"
      style={{ color, backgroundColor: color + '22' }}
    >
      {TYPE_LABELS[type]}
    </span>
  )
}

export { TYPE_LABELS, TYPE_COLORS }
