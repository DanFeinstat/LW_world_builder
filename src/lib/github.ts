import type { GitHubConfig, StoredFile } from '@/types'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function apiBase(config: GitHubConfig): string {
  return `https://api.github.com/repos/${config.owner}/${config.repo}`
}

function authHeaders(config: GitHubConfig): HeadersInit {
  return {
    Authorization: `Bearer ${config.pat}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function assertOk(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new GitHubError(res.status, body)
  }
}

export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'GitHubError'
  }
}

// ---------------------------------------------------------------------------
// readFile
// ---------------------------------------------------------------------------

/** Fetch a single file. Returns decoded data + sha for future writes. */
export async function readFile<T>(
  config: GitHubConfig,
  path: string,
): Promise<StoredFile<T>> {
  const res = await fetch(`${apiBase(config)}/contents/${path}`, {
    headers: authHeaders(config),
  })
  await assertOk(res)
  const json = await res.json()
  const data = JSON.parse(atob(json.content.replace(/\s/g, ''))) as T
  return { data, sha: json.sha as string }
}

// ---------------------------------------------------------------------------
// writeFile
// ---------------------------------------------------------------------------

/**
 * Write a file. On 409 Conflict (sha mismatch), re-fetches the current sha
 * and retries once. Throws on any other error or second failure.
 */
export async function writeFile<T>(
  config: GitHubConfig,
  path: string,
  data: T,
  sha: string | null,
  message?: string,
): Promise<string> {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))
  const body: Record<string, unknown> = {
    message: message ?? `update ${path}`,
    content,
    ...(sha ? { sha } : {}),
  }

  const doWrite = async (currentSha: string | null): Promise<string> => {
    const writeBody = { ...body, ...(currentSha ? { sha: currentSha } : {}) }
    const res = await fetch(`${apiBase(config)}/contents/${path}`, {
      method: 'PUT',
      headers: { ...authHeaders(config), 'Content-Type': 'application/json' },
      body: JSON.stringify(writeBody),
    })

    if (res.status === 409) {
      return null as unknown as string // signal retry
    }
    await assertOk(res)
    const json = await res.json()
    return json.content.sha as string
  }

  const result = await doWrite(sha)
  if (result !== null) return result

  // 409: re-fetch current sha and retry once
  let freshSha: string | null = null
  try {
    const existing = await readFile<T>(config, path)
    freshSha = existing.sha
  } catch {
    // file may not exist yet — proceed with null sha
  }

  const retry = await doWrite(freshSha)
  if (retry === null) {
    throw new GitHubError(409, `Conflict writing ${path} — please refresh and try again.`)
  }
  return retry
}

// ---------------------------------------------------------------------------
// deleteFile
// ---------------------------------------------------------------------------

export async function deleteFile(
  config: GitHubConfig,
  path: string,
  sha: string,
  message?: string,
): Promise<void> {
  const res = await fetch(`${apiBase(config)}/contents/${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders(config), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message ?? `delete ${path}`, sha }),
  })
  await assertOk(res)
}

// ---------------------------------------------------------------------------
// listTree
// ---------------------------------------------------------------------------

export interface TreeItem {
  path: string
  type: 'blob' | 'tree'
  sha: string
}

/**
 * Fetch the full git tree for the default branch (recursive).
 * Used on app load to discover which data files exist.
 */
export async function listTree(
  config: GitHubConfig,
  branch = 'main',
): Promise<TreeItem[]> {
  const res = await fetch(
    `${apiBase(config)}/git/trees/${branch}?recursive=1`,
    { headers: authHeaders(config) },
  )
  await assertOk(res)
  const json = await res.json()
  return (json.tree as TreeItem[]).filter(item => item.type === 'blob')
}

// ---------------------------------------------------------------------------
// pollCommit
// ---------------------------------------------------------------------------

/**
 * Returns the SHA of the latest commit on `branch`.
 * Call on an interval; compare to previous value to detect remote changes.
 */
export async function pollCommit(
  config: GitHubConfig,
  branch = 'main',
): Promise<string> {
  const res = await fetch(`${apiBase(config)}/commits/${branch}`, {
    headers: authHeaders(config),
  })
  await assertOk(res)
  const json = await res.json()
  return json.sha as string
}
