import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType) => void
  dismiss: (id: string) => void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useToast = create<ToastStore>((set) => ({
  toasts: [],

  showToast(message, type = 'info') {
    const id = crypto.randomUUID()
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }))

    // Auto-dismiss after 4s
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, 4000)
  },

  dismiss(id) {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
}))
