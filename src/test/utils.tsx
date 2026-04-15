// src/test/utils.tsx
import { render, type RenderResult } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { ReactElement } from 'react'

/**
 * Renders `ui` inside a memory router.
 * Use this for components that call useLocation, useParams, useNavigate, or render <Link>.
 *
 * Components that use useAppContext or useArticleStore should still vi.mock those
 * separately — this helper only provides router context.
 *
 * Pass `path` to define a named-param route pattern (e.g. '/articles/:articleId?').
 * Defaults to '*' (catch-all) when omitted.
 */
export function renderWithRouter(
  ui: ReactElement,
  { initialPath = '/', path = '*' }: { initialPath?: string; path?: string } = {},
): RenderResult {
  const router = createMemoryRouter(
    [{ path, element: ui }],
    { initialEntries: [initialPath] },
  )
  return render(<RouterProvider router={router} />)
}
