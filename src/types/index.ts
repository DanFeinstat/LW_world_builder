export type Role = 'dm' | 'player'
export type ArticleType = 'npc' | 'location' | 'faction' | 'lore' | 'quest'
export type Visibility = 'dm_only' | 'shared'
export type ThemePreference = 'light' | 'dark' | 'system'
export type ConnectionStatus = 'connected' | 'disconnected'

export interface User {
  id: string
  name: string
  passphrase: string
  role: Role
  color: string
  createdAt: string
}

export interface CampaignMeta {
  campaignName: string
  currentDate: string
}

export interface Article {
  id: string
  title: string
  articleType: ArticleType
  body: string
  tags: string[]
  visibility: Visibility
  interactable: boolean
  links: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  number: number
  title: string
  dmNotes: string
  sharedRecap: string
  worldDate: string
  realDate: string
  linkedArticles: string[]
  createdAt: string
}

export interface JournalEntry {
  id: string
  authorId: string
  sessionId: string
  body: string
  promotedTo: string | null
  createdAt: string
  updatedAt: string
}

export interface TimelineEvent {
  id: string
  title: string
  description: string
  worldDate: string
  sessionNumber: number | null
  visibility: Visibility
  linkedArticles: string[]
  createdAt: string
}

export interface GitHubConfig {
  owner: string
  repo: string
  pat: string
}

export interface StoredFile<T> {
  data: T
  sha: string
}
