import clsx from 'clsx'
import { useToast } from './useToast'

const typeStyles: Record<string, string> = {
  success: 'bg-success-subtle text-success border border-success',
  error: 'bg-danger-subtle text-danger border border-danger',
  info: 'bg-surface-raised text-text-primary border border-border',
}

export function ToastStack() {
  const toasts = useToast(state => state.toasts)
  const dismiss = useToast(state => state.dismiss)

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-6 right-6 flex flex-col gap-2 z-toast pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="alert"
          className={clsx(
            'flex items-center gap-4 px-4 py-3 rounded-md shadow-lg',
            'min-w-[280px] max-w-[420px] pointer-events-auto animate-slide-in',
            typeStyles[toast.type],
          )}
        >
          <span className="flex-1 text-sm font-medium leading-base">{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 text-md leading-none opacity-60 hover:opacity-100 transition-opacity duration-fast bg-transparent border-none p-0 cursor-pointer text-inherit"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
