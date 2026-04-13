export type ArticleType = 'npc' | 'location' | 'faction' | 'lore' | 'quest'

export interface Article {
  id: string
  title: string
  articleType: ArticleType
  body: string
  tags: string[]
  visibility: 'dm_only' | 'shared'
  interactable: boolean
  links: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}
