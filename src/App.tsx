import { useState } from 'react'
import { AppProvider, useAppContext } from '@/context/AppContext'
import { SetupScreen } from '@/components/setup/SetupScreen'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { AppShell } from '@/components/layout/AppShell'
import { ToastStack } from '@/components/shared/Toast/Toast'

type View = 'articles'

function AppRoutes() {
  const { githubConfig, currentUser } = useAppContext()
  const [currentView, setCurrentView] = useState<View>('articles')

  if (!githubConfig) return <SetupScreen />
  if (!currentUser) return <LoginScreen />

  return (
    <AppShell currentView={currentView} onNavigate={setCurrentView}>
      <div className="p-6 text-text-primary">
        <p className="text-sm text-text-muted">Article views coming in Step 9.</p>
      </div>
    </AppShell>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
      <ToastStack />
    </AppProvider>
  )
}
