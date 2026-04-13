import { AppProvider, useAppContext } from '@/context/AppContext'
import { SetupScreen } from '@/components/setup/SetupScreen'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { ToastStack } from '@/components/shared/Toast/Toast'

function AppRoutes() {
  const { githubConfig, currentUser } = useAppContext()

  if (!githubConfig) return <SetupScreen />
  if (!currentUser) return <LoginScreen />

  return <div className="text-text-primary p-6">Campaign Manager — app shell coming soon.</div>
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
      <ToastStack />
    </AppProvider>
  )
}
