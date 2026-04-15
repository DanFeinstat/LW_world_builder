// src/App.tsx
import { createHashRouter, RouterProvider, Navigate, Outlet } from 'react-router'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { AppProvider, useAppContext } from '@/context/AppContext'
import { SetupScreen } from '@/components/setup/SetupScreen'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { AppShell } from '@/components/layout/AppShell'
import { ToastStack } from '@/components/shared/Toast/Toast'
import { ArticlesPanel } from '@/components/articles/ArticlesPanel'
import { NotFound } from '@/components/shared/NotFound/NotFound'
import { DevToolbar } from '@/components/dev/DevToolbar'

// ---------------------------------------------------------------------------
// Placeholder for sections not yet implemented
// ---------------------------------------------------------------------------

function ComingSoon({ section }: { section: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-text-muted">{section} — coming soon.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root layout — handles auth gates before rendering the shell
// ---------------------------------------------------------------------------

function AppLayout() {
  const { githubConfig, currentUser } = useAppContext()
  if (!githubConfig) return <SetupScreen />
  if (!currentUser) return <LoginScreen />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// Router — hash-based so GitHub Pages serves index.html for all paths
// ---------------------------------------------------------------------------

const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/articles" replace /> },
      { path: 'articles', element: <ArticlesPanel /> },
      { path: 'articles/:articleId', element: <ArticlesPanel /> },
      { path: 'sessions', element: <ComingSoon section="Sessions" /> },
      { path: 'sessions/:sessionId', element: <ComingSoon section="Sessions" /> },
      { path: 'journals', element: <ComingSoon section="Journals" /> },
      { path: 'journals/:sessionId', element: <ComingSoon section="Journals" /> },
      { path: 'timeline', element: <ComingSoon section="Timeline" /> },
      { path: 'timeline/:eventId', element: <ComingSoon section="Timeline" /> },
      { path: 'users', element: <ComingSoon section="Users" /> },
      { path: 'settings', element: <ComingSoon section="Settings" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <AppProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
        <ToastStack />
        {import.meta.env.DEV && <DevToolbar />}
      </TooltipProvider>
    </AppProvider>
  )
}
