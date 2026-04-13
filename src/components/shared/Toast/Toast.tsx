import clsx from 'clsx'
import { useToast } from './useToast'
import styles from './Toast.module.css'

export function ToastStack() {
  const toasts = useToast(state => state.toasts)
  const dismiss = useToast(state => state.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className={styles.stack} role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={clsx(styles.toast, styles[toast.type])}
          role="alert"
        >
          <span className={styles.message}>{toast.message}</span>
          <button
            className={styles.dismiss}
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
