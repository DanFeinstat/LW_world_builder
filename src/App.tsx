import { AppProvider } from '@/context/AppContext'
import { ToastStack } from '@/components/shared/Toast/Toast'

export default function App() {
  return (
    <AppProvider>
      <div>Campaign Manager — loading…</div>
      <ToastStack />
    </AppProvider>
  )
}
