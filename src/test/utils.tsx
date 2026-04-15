// src/test/utils.tsx
import { render, type RenderResult } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'

/**
 * Renders `ui` inside a memory router.
 * Use this for components that call useLocation, useParams, useNavigate, or render <Link>.
 *
 * Components that use useAppContext or useArticleStore should still vi.mock those
 * separately — this helper only provides router context.
 */
export function renderWithRouter(
  ui: React.ReactElement,
  { initialPath = '/' }: { initialPath?: string } = {},
): RenderResult {
  const router = createMemoryRouter(
    [{ path: '*', element: ui }],
    { initialEntries: [initialPath] },
  )
  return render(<RouterProvider router={router} />)
}
