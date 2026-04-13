// ---------------------------------------------------------------------------
// Global domain types
//
// Rule: a type lives here only if it is consumed by two or more UNRELATED
// feature areas (e.g. User is used in auth, articles, sidebar, and context).
//
// Feature-specific types belong colocated with their feature:
//   src/components/articles/types.ts  — Article, ArticleType
//
// Simple component prop interfaces belong in their component file:
//   export interface ModalProps { ... }  in Modal.tsx
//
// Phase 3+ types (Session, JournalEntry, TimelineEvent) will be defined
// colocated with their feature directories when those features are built.
// Do NOT pre-emptively add future types here.
// ---------------------------------------------------------------------------

export type Role = 'dm' | 'player'
export type ThemePreference = 'light' | 'dark' | 'system'
export type ConnectionStatus = 'connected' | 'disconnected'

/** dm_only = DM sees it; shared = all players can see it */
export type Visibility = 'dm_only' | 'shared'

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

export interface GitHubConfig {
  owner: string
  repo: string
  pat: string
}
